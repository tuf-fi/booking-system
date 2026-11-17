import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import type { Booking } from '../types'
import { formatDay } from '../lib/dates'
import { formatCountdown, plural } from '../lib/format'
import { peso } from '../lib/money'
import { BookingError, completeCardPayment } from '../store/api'
import { useDb } from '../store/db'
import { Dialog } from './Dialog'
import { Photo } from './Photo'

interface Props {
  booking: Booking | null
  onClose: () => void
  onPaid: (booking: Booking) => void
}

const CELL = 'block w-full bg-transparent px-3.5 py-3 text-sm text-ink outline-none placeholder:text-muted'

export function CardCheckoutDialog({ booking, onClose, onPaid }: Props) {
  const db = useDb()
  const room = booking ? db.rooms.find(candidate => candidate.id === booking.roomId) : undefined
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
    <Dialog open={booking !== null} onClose={onClose} title="Pay by card" size="xs">
      {booking && (
        <div>
          <div className="flex items-center gap-3.5">
            {room && <Photo name={room.photo} sizes="64px" className="size-16 shrink-0 rounded-control object-cover" />}
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight">{room?.name ?? 'Your stay'}</p>
              <p className="mt-1 text-sm text-muted">{formatDay(booking.checkIn)} to {formatDay(booking.checkOut)}</p>
              <p className="text-sm text-muted">{plural(booking.nights, 'night')}, booking {booking.reference}</p>
            </div>
          </div>
          <p className="mb-2 mt-5 text-sm font-bold">Card details</p>

          <div className="overflow-hidden rounded-control border border-line bg-surface transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-primary-tint)]">
            <label className="sr-only" htmlFor="card-number">Card number</label>
            <input id="card-number" className={CELL} defaultValue="4343 4343 4343 4345" placeholder="Card number" inputMode="numeric" autoComplete="off" />
            <div className="grid grid-cols-2 border-t border-line">
              <label className="sr-only" htmlFor="card-exp">Expiry</label>
              <input id="card-exp" className={CELL} defaultValue="12 / 30" placeholder="MM / YY" autoComplete="off" />
              <label className="sr-only" htmlFor="card-cvc">CVC</label>
              <input id="card-cvc" className={`${CELL} border-l border-line`} defaultValue="123" placeholder="CVC" autoComplete="off" />
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          <button type="button" onClick={pay} disabled={busy || remaining <= 0} className="btn btn-primary btn-block mt-4">
            <Lock size={15} />{busy ? 'Processing payment…' : `Pay ${peso(booking.downPayment)} now`}
          </button>
          <p className="mt-2.5 text-center text-sm text-muted">The balance of {peso(booking.total - booking.downPayment)} is paid when you arrive.</p>
          <p className="mt-3 flex justify-between gap-3 text-xs text-muted">
            <span className="font-bold text-ink">{remaining > 0 ? `Dates held for ${formatCountdown(remaining)}` : 'This checkout has expired'}</span>
            <span>Demo, no real charge</span>
          </p>
        </div>
      )}
    </Dialog>
  )
}
