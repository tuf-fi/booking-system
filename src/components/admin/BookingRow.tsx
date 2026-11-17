import type { Booking } from '../../types'
import { formatShort } from '../../lib/dates'
import { plural } from '../../lib/format'
import { peso } from '../../lib/money'
import { useDb } from '../../store/db'
import { StatusChip } from '../StatusChip'
import { BookingActions } from './BookingActions'

const METHOD_LABEL = { gcash_manual: 'GCash', paymongo: 'Card', cash: 'Cash' }
const SOURCE_LABEL = { direct: '', airbnb: 'Airbnb', booking: 'Booking.com', walk_in: 'Walk-in' }

const ROW_GRID = 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.9fr)_9.5rem_9rem]'

export function BookingTableHead() {
  return (
    <div aria-hidden className={`hidden items-center gap-x-5 border-b border-ink/10 px-5 py-2.5 text-xs font-semibold text-muted lg:grid ${ROW_GRID}`}>
      <span>Guest</span>
      <span>Stay</span>
      <span>Payment</span>
      <span>Status</span>
      <span className="text-right">Actions</span>
    </div>
  )
}

export function BookingRow({ booking, index = 0 }: { booking: Booking; index?: number }) {
  const db = useDb()
  const room = db.rooms.find(r => r.id === booking.roomId)
  const balance = booking.total - booking.amountPaid
  const inactive = booking.status === 'cancelled' || booking.status === 'expired'

  return (
    <li style={{ '--i': index } as React.CSSProperties} className={`row-in grid gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5 lg:items-center ${ROW_GRID}`}>
      <div className="min-w-0">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-bold">{booking.guestName}</span>
          {!booking.seen && <span className="chip shrink-0 bg-accent-tint text-accent-deep">New</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">{booking.reference} · {SOURCE_LABEL[booking.source] || METHOD_LABEL[booking.method]}</p>
        <p className="truncate text-xs text-muted">{booking.guestMobile || 'No mobile'} · {plural(booking.guests, 'guest')}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{room?.name}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted">{formatShort(booking.checkIn)} to {formatShort(booking.checkOut)}</p>
        <p className="text-xs text-muted">{plural(booking.nights, 'night')}</p>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm"><b className="font-bold tabular-nums">{peso(booking.total)}</b></p>
        <p className="mt-0.5 text-xs text-muted">{inactive ? `${peso(booking.amountPaid)} paid` : balance > 0 ? `${peso(booking.amountPaid)} paid, ${peso(balance)} left` : 'Fully paid'}</p>
      </div>
      <div><StatusChip status={booking.status} /></div>
      <div className="lg:justify-self-end"><BookingActions booking={booking} /></div>
    </li>
  )
}
