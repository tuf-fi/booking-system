import type { Booking } from '../../types'
import { formatShort } from '../../lib/dates'
import { plural } from '../../lib/format'
import { peso } from '../../lib/money'
import { useDb } from '../../store/db'
import { StatusChip } from '../StatusChip'
import { BookingActions } from './BookingActions'

const METHOD_LABEL = { gcash_manual: 'GCash', paymongo: 'Card', cash: 'Cash' }
const SOURCE_LABEL = { direct: '', airbnb: 'Airbnb', booking: 'Booking.com', walk_in: 'Walk-in' }

export function BookingRow({ booking }: { booking: Booking }) {
  const db = useDb()
  const room = db.rooms.find(r => r.id === booking.roomId)
  const balance = booking.total - booking.amountPaid
  const inactive = booking.status === 'cancelled' || booking.status === 'expired'

  return (
    <li className="grid gap-4 p-5 lg:grid-cols-[9rem_1.2fr_1fr_1fr_auto] lg:items-center">
      <div>
        <p className="font-bold">{booking.reference}</p>
        <p className="mt-0.5 text-xs text-muted">{SOURCE_LABEL[booking.source] || METHOD_LABEL[booking.method]}</p>
        {!booking.seen && <span className="chip mt-1 bg-sun-tint text-sun-ink">New</span>}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{booking.guestName}</p>
        <p className="truncate text-sm text-muted">{booking.guestMobile || 'No mobile'}, {plural(booking.guests, 'guest')}</p>
      </div>
      <div>
        <p className="font-semibold">{room?.name}</p>
        <p className="text-sm tabular-nums text-muted">{formatShort(booking.checkIn)} to {formatShort(booking.checkOut)}, {plural(booking.nights, 'night')}</p>
      </div>
      <div>
        <p className="font-semibold tabular-nums">{peso(booking.total)}</p>
        <p className="text-sm text-muted">{inactive ? `${peso(booking.amountPaid)} paid` : balance > 0 ? `${peso(booking.amountPaid)} paid, ${peso(balance)} left` : 'Fully paid'}</p>
        <div className="mt-1.5"><StatusChip status={booking.status} /></div>
      </div>
      <div className="lg:max-w-xs lg:justify-self-end"><BookingActions booking={booking} /></div>
    </li>
  )
}
