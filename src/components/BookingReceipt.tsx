import type { Booking, Room, Settings } from '../types'
import { formatDay } from '../lib/dates'
import { maskMobile, plural } from '../lib/format'
import { Photo } from './Photo'
import { PriceLines } from './PriceLines'

export function BookingReceipt({ booking, room, settings }: { booking: Booking; room: Room; settings: Settings }) {
  const balance = Math.max(0, booking.total - booking.amountPaid)
  return (
    <div className="overflow-hidden border border-line bg-surface">
      <div className="flex gap-4 border-b border-line p-4">
        <Photo name={room.photo} sizes="120px" className="size-20 shrink-0 object-cover" />
        <div className="min-w-0 self-center">
          <h3 className="text-lg font-bold">{room.name}</h3>
          <p className="mt-1 text-[0.8125rem] text-muted">{plural(booking.nights, 'night')}, {plural(booking.guests, 'guest')}</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{booking.guestName}{booking.guestMobile ? `, ${maskMobile(booking.guestMobile)}` : ''}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b border-line">
        <div className="p-4"><small className="block text-xs font-bold uppercase tracking-[0.12em] text-muted">Check-in</small><b className="text-[0.9375rem]">{formatDay(booking.checkIn)}</b><small className="block text-[0.8125rem] text-muted">from {settings.checkInTime}</small></div>
        <div className="border-l border-line p-4"><small className="block text-xs font-bold uppercase tracking-[0.12em] text-muted">Check-out</small><b className="text-[0.9375rem]">{formatDay(booking.checkOut)}</b><small className="block text-[0.8125rem] text-muted">until {settings.checkOutTime}</small></div>
      </div>
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
