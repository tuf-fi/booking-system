import { useState } from 'react'
import { Check, ImageIcon, LogIn, LogOut, X } from 'lucide-react'
import type { Booking } from '../../types'
import { formatShort } from '../../lib/dates'
import { peso } from '../../lib/money'
import { approveBooking, cancelBooking, checkInGuest, checkOutGuest, declineBooking, markFullyPaid } from '../../store/api'
import { useDb } from '../../store/db'
import { Dialog } from '../Dialog'
import { useToast } from '../Toast'
import { PaymentProof } from './PaymentProof'

type Pending = 'proof' | 'decline' | 'cancel' | null

export function BookingActions({ booking }: { booking: Booking }) {
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
      <div className="flex flex-wrap gap-2">
        {booking.method === 'gcash_manual' && status !== 'cancelled' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending('proof')}><ImageIcon size={14} />View payment</button>
        )}
        {status === 'pending_approval' && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={approve}><Check size={14} />Approve</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setPending('decline')}><X size={14} />Decline</button>
          </>
        )}
        {status === 'confirmed' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { checkInGuest(booking.reference); toast(`${booking.guestName} checked in.`) }}><LogIn size={14} />Check in</button>
        )}
        {status === 'checked_in' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { checkOutGuest(booking.reference); toast(`${booking.guestName} checked out. The stay is complete.`) }}><LogOut size={14} />Check out</button>
        )}
        {(status === 'confirmed' || status === 'checked_in') && hasBalance && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { markFullyPaid(booking.reference); toast(`${booking.reference} marked as fully paid.`) }}>Mark fully paid</button>
        )}
        {status === 'confirmed' && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setPending('cancel')}>Cancel</button>
        )}
      </div>

      <Dialog open={pending === 'proof'} onClose={() => setPending(null)} title={`Payment for ${booking.reference}`}>
        <p className="mb-4 text-sm text-muted">{booking.guestName} should have sent {peso(booking.downPayment)} by GCash. Check it in your GCash app before approving.</p>
        <PaymentProof booking={booking} settings={db.settings} />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>Close</button>
          {status === 'pending_approval' && <button type="button" className="btn btn-primary" onClick={approve}>Approve booking</button>}
        </div>
      </Dialog>

      <Dialog open={pending === 'decline' || pending === 'cancel'} onClose={() => setPending(null)} title={`${verb} ${booking.reference}?`}>
        <p className="text-muted">
          {booking.guestName}'s dates ({formatShort(booking.checkIn)} to {formatShort(booking.checkOut)}) open up again for other guests. The guest gets a text.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>Keep booking</button>
          <button type="button" className="btn btn-danger" onClick={() => release(pending === 'decline' ? 'decline' : 'cancel')}>{verb} booking</button>
        </div>
      </Dialog>
    </>
  )
}
