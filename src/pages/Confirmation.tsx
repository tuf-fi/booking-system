import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, Copy, MessageSquareText, XCircle } from 'lucide-react'
import { BookingReceipt } from '../components/BookingReceipt'
import { CardCheckoutDialog } from '../components/CardCheckoutDialog'
import { useToast } from '../components/Toast'
import { formatCountdown } from '../lib/format'
import { peso } from '../lib/money'
import { sweepExpired } from '../store/api'
import { useDb } from '../store/db'

export function Confirmation() {
  const { reference = '' } = useParams()
  const db = useDb()
  const toast = useToast()
  const navigate = useNavigate()
  const [paying, setPaying] = useState(false)
  const [now, setNow] = useState(Date.now())
  const booking = db.bookings.find(b => b.reference === reference)
  const room = booking && db.rooms.find(r => r.id === booking.roomId)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
      sweepExpired()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!booking || !room) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl font-extrabold">We could not find that booking</h1>
        <p className="mt-3 text-muted">Check the reference number, or look it up with your mobile number.</p>
        <Link to="/manage" className="btn btn-dark mt-8 rounded-none">Manage my booking</Link>
      </div>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booking.reference)
      toast('Reference copied.')
    } catch {
      toast(`Your reference is ${booking.reference}.`)
    }
  }

  const view = (() => {
    switch (booking.status) {
      case 'confirmed':
      case 'checked_in':
        return { Icon: CheckCircle2, tone: 'text-leaf', title: 'Booking confirmed', text: `We received your down payment of ${peso(booking.amountPaid)}. A confirmation text is on its way to your phone.` }
      case 'pending_approval':
        return { Icon: Clock, tone: 'text-sun-ink', title: 'Booking request sent', text: 'Your dates are on hold. The owner will check your GCash payment and text you once it is approved, usually within a few hours.' }
      case 'pending_payment':
        return { Icon: Clock, tone: 'text-sky-ink', title: 'Finish your payment', text: 'Your dates are held while you pay. Complete the card payment to confirm your booking.' }
      case 'expired':
        return { Icon: XCircle, tone: 'text-muted', title: 'This checkout expired', text: 'The 30-minute payment window ran out and the dates were released. You can book again anytime.' }
      case 'cancelled':
        return { Icon: XCircle, tone: 'text-danger', title: 'Booking cancelled', text: 'These dates are open for other guests again. Text us if you have questions.' }
      default:
        return { Icon: CheckCircle2, tone: 'text-muted', title: 'Stay completed', text: 'Thank you for staying with us. We hope to see you again.' }
    }
  })()

  const remaining = booking.expiresAt ? booking.expiresAt - now : 0

  return (
    <div className="container-page max-w-2xl pb-16 pt-12 sm:pt-16">
      <div className="text-center">
        <span className={`mx-auto grid size-12 place-items-center ${view.tone}`}><view.Icon size={22} /></span>
        <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight sm:text-4xl">{view.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-[0.9375rem] leading-[1.7] text-muted">{view.text}</p>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border border-ink/15 bg-surface px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Booking reference</p>
          <p className="mt-0.5 font-display text-2xl font-extrabold tracking-wide sm:text-3xl">{booking.reference}</p>
        </div>
        <button type="button" onClick={copy} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[0.8125rem] font-bold text-ink transition-colors hover:text-leaf"><Copy size={15} aria-hidden />Copy</button>
      </div>

      {booking.status === 'pending_payment' && (
        <div className="mt-3 flex flex-col items-center gap-3 border border-line bg-surface p-5 text-center">
          <p className="text-[0.875rem] text-muted">{remaining > 0 ? `Held for ${formatCountdown(remaining)}` : 'Checkout expired'}</p>
          <button type="button" className="btn btn-primary rounded-none" onClick={() => setPaying(true)} disabled={remaining <= 0}>Pay {peso(booking.downPayment)} by card</button>
        </div>
      )}

      <div className="mt-3"><BookingReceipt booking={booking} room={room} settings={db.settings} /></div>

      <div className="mt-6 flex items-start gap-3 text-[0.8125rem] leading-[1.65] text-muted">
        <MessageSquareText size={16} className="mt-0.5 shrink-0 text-leaf" aria-hidden />
        <p>Keep your reference and mobile number. You will need both to view or cancel your booking. We send the exact address with your confirmation. Please bring a valid ID for each adult guest.</p>
      </div>

      <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
        <div className="flex gap-5 text-[0.8125rem] font-bold">
          <Link to="/" className="transition-colors hover:text-leaf">Back to the inn</Link>
        </div>
        <Link to="/manage" className="btn btn-dark w-full rounded-none px-6 sm:w-auto">Manage my booking</Link>
      </div>

      <CardCheckoutDialog booking={paying ? booking : null} onClose={() => setPaying(false)} onPaid={paid => { setPaying(false); navigate(`/booking/${paid.reference}`, { replace: true }) }} />
    </div>
  )
}
