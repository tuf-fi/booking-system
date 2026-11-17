import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { BookingReceipt } from '../components/BookingReceipt'
import { Dialog } from '../components/Dialog'
import { StatusChip } from '../components/StatusChip'
import { useToast } from '../components/Toast'
import { addDays, formatLong } from '../lib/dates'
import { peso } from '../lib/money'
import { BookingError, findBooking, guestCancel, isWithinFreeCancellation } from '../store/api'
import { useDb } from '../store/db'
import { SITE } from '../lib/site'

const CANCELLABLE = ['pending_approval', 'pending_payment', 'confirmed']

export function Manage() {
  const db = useDb()
  const toast = useToast()
  const [reference, setReference] = useState('')
  const [mobile, setMobile] = useState('')
  const [foundRef, setFoundRef] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const booking = foundRef ? db.bookings.find(b => b.reference === foundRef) : undefined
  const room = booking && db.rooms.find(r => r.id === booking.roomId)

  const lookup = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setNotFound(false)
    const result = await findBooking(reference, mobile)
    setBusy(false)
    setFoundRef(result?.reference ?? null)
    setNotFound(!result)
  }

  const cancel = async () => {
    if (!booking) return
    setBusy(true)
    try {
      await guestCancel(booking.reference)
      toast('Your booking was cancelled.')
    } catch (failure) {
      toast(failure instanceof BookingError ? failure.message : 'Could not cancel. Please text us.', 'error')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  const refundable = booking ? isWithinFreeCancellation(booking, db.settings) : false

  return (
    <div className="container-page max-w-3xl pb-10 pt-12">
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Find your booking</h1>
      <p className="mt-2 max-w-xl text-sm leading-[1.65] text-muted">Enter the reference from your confirmation text and the mobile number you booked with.</p>

      <form onSubmit={lookup} className="mt-8 grid gap-4 rounded-card border border-line bg-surface p-5 shadow-soft sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6">
        <div>
          <label htmlFor="m-ref" className="label">Reference number</label>
          <input id="m-ref" className="field field-compact uppercase" placeholder="LTW-XXXXX" value={reference} onChange={e => setReference(e.target.value)} required autoComplete="off" />
        </div>
        <div>
          <label htmlFor="m-mobile" className="label">Mobile number</label>
          <input id="m-mobile" className="field field-compact" inputMode="tel" placeholder="0917 123 4567" value={mobile} onChange={e => setMobile(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary h-[2.6rem] min-h-0 px-6 text-sm" disabled={busy}><Search size={16} aria-hidden />{busy && !booking ? 'Looking…' : 'Find booking'}</button>
      </form>

      {notFound && (
        <p role="alert" className="mt-4 bg-danger-tint px-4 py-3 text-sm text-danger">
          We could not find a booking with those details. Check both and try again, or text us at {SITE.phone}.
        </p>
      )}

      {booking && room && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Reference</p>
              <p className="font-display text-2xl font-extrabold">{booking.reference}</p>
            </div>
            <StatusChip status={booking.status} />
          </div>
          <BookingReceipt booking={booking} room={room} settings={db.settings} />
          {CANCELLABLE.includes(booking.status) && (
            <div className="mt-6 rounded-card border border-line bg-surface p-5">
              <h2 className="text-xl font-bold">Need to cancel?</h2>
              <p className="mt-1 text-sm text-muted">
                {refundable
                  ? `You can cancel for free until ${formatLong(addDays(booking.checkIn, -db.settings.cancellationDays))}. We refund your down payment in full.`
                  : `It is less than ${db.settings.cancellationDays} days before check-in, so the down payment of ${peso(booking.amountPaid || booking.downPayment)} is not refunded.`}
              </p>
              <button type="button" onClick={() => setConfirming(true)} className="btn btn-danger mt-4">Cancel this booking</button>
            </div>
          )}
          {booking.status === 'cancelled' && booking.cancelReason && (
            <p className="mt-6 rounded-control bg-sand/70 p-4 text-sm text-muted">{booking.cancelReason}.</p>
          )}
        </div>
      )}

      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Cancel this booking?">
        <p className="text-muted">
          {refundable ? 'Your down payment will be refunded in full.' : 'Your down payment will not be refunded.'} Your dates open up for other guests right away.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Keep booking</button>
          <button type="button" className="btn btn-danger" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel booking'}</button>
        </div>
      </Dialog>
    </div>
  )
}
