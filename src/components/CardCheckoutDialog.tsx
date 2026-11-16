import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import type { Booking } from '../types'
import { formatCountdown } from '../lib/format'
import { peso } from '../lib/money'
import { BookingError, completeCardPayment } from '../store/api'
import { Dialog } from './Dialog'

interface Props {
  booking: Booking | null
  onClose: () => void
  onPaid: (booking: Booking) => void
}

export function CardCheckoutDialog({ booking, onClose, onPaid }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setError('')
    setBusy(false)
  }, [booking?.reference])

  const pay = async () => {
    if (!booking) return
    setBusy(true)
    setError('')
    try {
      onPaid(await completeCardPayment(booking.reference))
    } catch (failure) {
      setError(failure instanceof BookingError ? failure.message : 'Payment failed. Please try again.')
      setBusy(false)
    }
  }

  const remaining = booking?.expiresAt ? booking.expiresAt - now : 0

  return (
    <Dialog open={booking !== null} onClose={onClose} title="Pay by card" size="sm">
      {booking && (
        <div>
          <p className="rounded-2xl bg-sky-tint px-4 py-3 text-sm text-sky-ink">
            Demo checkout. In the live system this is the secure PayMongo page for cards, GCash, Maya and QR Ph. No real charge is made.
          </p>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-sm text-muted">Down payment for {booking.reference}</span>
            <b className="font-display text-3xl">{peso(booking.downPayment)}</b>
          </div>
          <div className="mt-5 space-y-3">
            <div>
              <label className="label" htmlFor="card-number">Card number</label>
              <input id="card-number" className="field" defaultValue="4343 4343 4343 4345" inputMode="numeric" autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="card-exp">Expiry</label>
                <input id="card-exp" className="field" defaultValue="12 / 30" autoComplete="off" />
              </div>
              <div>
                <label className="label" htmlFor="card-cvc">CVC</label>
                <input id="card-cvc" className="field" defaultValue="123" autoComplete="off" />
              </div>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          <button type="button" onClick={pay} disabled={busy || remaining <= 0} className="btn btn-primary btn-block mt-6">
            <Lock size={16} />{busy ? 'Processing payment…' : `Pay ${peso(booking.downPayment)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            {remaining > 0 ? `Your dates are held for ${formatCountdown(remaining)}.` : 'This checkout has expired.'}
          </p>
        </div>
      )}
    </Dialog>
  )
}
