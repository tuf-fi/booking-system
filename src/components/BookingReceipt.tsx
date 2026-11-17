import type { Booking, Room, Settings } from '../types'
import { formatDay } from '../lib/dates'
import { maskMobile, plural } from '../lib/format'
import { Photo } from './Photo'
import { PriceLines } from './PriceLines'

export function BookingReceipt({ booking, room, settings }: { booking: Booking; room: Room; settings: Settings }) {
  const balance = Math.max(0, booking.total - booking.amountPaid)
  const others = booking.otherGuests?.filter(Boolean) ?? []
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      <div className="flex items-center gap-4 p-5">
        <Photo name={room.photo} sizes="120px" className="size-20 shrink-0 rounded-control object-cover" />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{room.name}</h3>
          <p className="mt-1 text-sm text-muted">{plural(booking.nights, 'night')}, {plural(booking.guests, 'guest')}</p>
          <p className="mt-0.5 text-sm text-muted">{booking.guestName}{booking.guestMobile ? `, ${maskMobile(booking.guestMobile)}` : ''}{others.length > 0 ? `, with ${others.join(', ')}` : ''}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-5 p-5">
        <div>
          <dt className="text-sm text-muted">Check-in</dt>
          <dd className="mt-1 text-base font-bold leading-tight">{formatDay(booking.checkIn)}</dd>
          <dd className="mt-0.5 text-sm text-muted">from {settings.checkInTime}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Check-out</dt>
          <dd className="mt-1 text-base font-bold leading-tight">{formatDay(booking.checkOut)}</dd>
          <dd className="mt-0.5 text-sm text-muted">until {settings.checkOutTime}</dd>
        </div>
      </dl>
      <div className="p-5">
        <PriceLines
          lines={[
            { label: 'Room', amount: booking.subtotal },
            { label: 'Cleaning fee', amount: booking.cleaningFee },
            { label: 'Total', amount: booking.total, tone: 'total' },
            { label: 'Paid so far', amount: booking.amountPaid, tone: 'due' },
            { label: 'Balance to pay on arrival', amount: booking.status === 'cancelled' ? 0 : balance, tone: 'muted' }
          ]}
        />
      </div>
    </div>
  )
}
