import type { Booking, Room, Settings } from '../types'
import { maskMobile, plural } from '../lib/format'
import { Photo } from './Photo'
import { PriceLines } from './PriceLines'
import { StayDates } from './StayDates'

export function BookingReceipt({ booking, room, settings }: { booking: Booking; room: Room; settings: Settings }) {
  const balance = Math.max(0, booking.total - booking.amountPaid)
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex gap-4 border-b border-line p-4">
        <Photo name={room.photo} sizes="120px" className="size-20 shrink-0 object-cover" />
        <div className="min-w-0 self-center">
          <h3 className="text-lg font-bold">{room.name}</h3>
          <p className="mt-1 text-sm text-muted">{plural(booking.nights, 'night')}, {plural(booking.guests, 'guest')}</p>
          <p className="mt-0.5 text-sm text-muted">{booking.guestName}{booking.guestMobile ? `, ${maskMobile(booking.guestMobile)}` : ''}</p>
        </div>
      </div>
      <StayDates checkIn={booking.checkIn} checkOut={booking.checkOut} checkInTime={settings.checkInTime} checkOutTime={settings.checkOutTime} className="border-0 border-b" />
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
