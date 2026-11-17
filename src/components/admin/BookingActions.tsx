import { useState } from 'react'
import { BadgeCheck, Ban, Check, ImageIcon, LogIn, LogOut, X } from 'lucide-react'
import type { Booking } from '../../types'
import { formatShort } from '../../lib/dates'
import { peso } from '../../lib/money'
import { approveBooking, cancelBooking, checkInGuest, checkOutGuest, declineBooking, markFullyPaid } from '../../store/api'
import { useDb } from '../../store/db'
import { Dialog } from '../Dialog'
import { useToast } from '../Toast'
import { PaymentProof } from './PaymentProof'

type Pending = 'proof' | 'decline' | 'cancel' | null

export function BookingActions({ booking, labeled = false }: { booking: Booking; labeled?: boolean }) {
  const db = useDb()
  const toast = useToast()
  const [pending, setPending] = useState<Pending>(null)
  const { status } = booking
  const hasBalance = booking.amountPaid < booking.total

  const approve = () => {
    approveBooking(booking.reference)
    setPending(null)
    toast(`${booking.reference} approved. The guest gets a confirmation text.`)
  }

  const release = (kind: 'decline' | 'cancel') => {
    if (kind === 'decline') declineBooking(booking.reference)
    else cancelBooking(booking.reference)
    setPending(null)
    toast(`${booking.reference} ${kind === 'decline' ? 'declined' : 'cancelled'}. The dates are open again.`)
  }

  const verb = pending === 'decline' ? 'Decline' : 'Cancel'

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${labeled ? '' : 'lg:justify-end'}`}>
        {booking.method === 'gcash_manual' && status !== 'cancelled' && (
          <button type="button" className={`tip btn btn-ghost btn-sm ${labeled ? 'flex-1 basis-28 px-3' : 'w-9 p-0'}`} aria-label="View payment" data-tip="View payment" onClick={() => setPending('proof')}><ImageIcon size={15} />{labeled && 'View payment'}</button>
        )}
        {status === 'pending_approval' && (
          <>
            <button type="button" className={`tip btn btn-primary btn-sm ${labeled ? 'flex-1 basis-28 px-3' : 'w-9 p-0'}`} aria-label="Approve booking" data-tip="Approve" onClick={approve}><Check size={16} />{labeled && 'Approve'}</button>
            <button type="button" className={`tip btn btn-danger btn-sm ${labeled ? 'basis-full px-4' : 'w-9 p-0'}`} aria-label="Decline booking" data-tip="Decline" onClick={() => setPending('decline')}><X size={15} />{labeled && 'Decline'}</button>
          </>
        )}
        {status === 'confirmed' && (
          <button type="button" className={`tip btn btn-ghost btn-sm ${labeled ? 'flex-1 basis-28 px-3' : 'w-9 p-0'}`} aria-label="Check in" data-tip="Check in" onClick={() => { checkInGuest(booking.reference); toast(`${booking.guestName} checked in.`) }}><LogIn size={15} />{labeled && 'Check in'}</button>
        )}
        {status === 'checked_in' && (
          <button type="button" className={`tip btn btn-ghost btn-sm ${labeled ? 'flex-1 basis-28 px-3' : 'w-9 p-0'}`} aria-label="Check out" data-tip="Check out" onClick={() => { checkOutGuest(booking.reference); toast(`${booking.guestName} checked out. The stay is complete.`) }}><LogOut size={15} />{labeled && 'Check out'}</button>
        )}
        {(status === 'confirmed' || status === 'checked_in') && hasBalance && (
          <button type="button" className={`tip btn btn-ghost btn-sm ${labeled ? 'flex-1 basis-28 px-3' : 'w-9 p-0'}`} aria-label="Mark fully paid" data-tip="Mark fully paid" onClick={() => { markFullyPaid(booking.reference); toast(`${booking.reference} marked as fully paid.`) }}><BadgeCheck size={15} />{labeled && 'Mark fully paid'}</button>
        )}
        {status === 'confirmed' && (
          <button type="button" className={`tip btn btn-danger btn-sm ${labeled ? 'basis-full px-4' : 'w-9 p-0'}`} aria-label="Cancel booking" data-tip="Cancel booking" onClick={() => setPending('cancel')}><Ban size={15} />{labeled && 'Cancel booking'}</button>
        )}
      </div>

      <Dialog open={pending === 'proof'} onClose={() => setPending(null)} title={`Payment for ${booking.reference}`}>
        <p className="mb-4 text-sm leading-relaxed text-muted">Check that <b className="text-ink">{peso(booking.downPayment)}</b> from {booking.guestName} arrived in your GCash app before approving.</p>
        <PaymentProof booking={booking} settings={db.settings} />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-soft h-10 min-h-0 px-5 text-sm" onClick={() => setPending(null)}>Close</button>
          {status === 'pending_approval' && <button type="button" className="btn btn-primary h-10 min-h-0 px-5 text-sm" onClick={approve}>Approve booking</button>}
        </div>
      </Dialog>

      <Dialog open={pending === 'decline' || pending === 'cancel'} onClose={() => setPending(null)} title={`${verb} ${booking.reference}?`}>
        <p className="text-muted">
          {booking.guestName}'s dates ({formatShort(booking.checkIn)} to {formatShort(booking.checkOut)}) open up again for other guests. The guest gets a text.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-soft h-10 min-h-0 px-5 text-sm" onClick={() => setPending(null)}>Keep booking</button>
          <button type="button" className="btn btn-danger h-10 min-h-0 px-5 text-sm" onClick={() => release(pending === 'decline' ? 'decline' : 'cancel')}>{verb} booking</button>
        </div>
      </Dialog>
    </>
  )
}
