import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking } from '../../types'
import { BookingActions } from '../../components/admin/BookingActions'
import { Dialog } from '../../components/Dialog'
import { StatusChip } from '../../components/StatusChip'
import { useToast } from '../../components/Toast'
import { addMonths, formatDay, formatMonth, monthCells, monthStart, parseKey, today, weekdayLabels, formatShort } from '../../lib/dates'
import { bookingOnNight, isBlocked } from '../../lib/availability'
import { firstName, plural } from '../../lib/format'
import { compactPeso, peso } from '../../lib/money'
import { nightRate } from '../../lib/pricing'
import { setBlockedNight } from '../../store/api'
import { useDb } from '../../store/db'

export function AdminCalendar() {
  const db = useDb()
  const toast = useToast()
  const now = today()
  const [roomId, setRoomId] = useState(db.rooms[0].id)
  const [month, setMonth] = useState(monthStart(now))
  const [openRef, setOpenRef] = useState<string | null>(null)
  const room = db.rooms.find(r => r.id === roomId) ?? db.rooms[0]
  const open: Booking | undefined = db.bookings.find(b => b.reference === openRef)

  const click = (night: string, booking: Booking | undefined, blocked: boolean) => {
    if (booking) return setOpenRef(booking.reference)
    setBlockedNight(room.id, night, !blocked)
    toast(blocked ? `${formatDay(night)} is open for booking again.` : `${formatDay(night)} blocked. Guests can't book it.`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">Availability</h1>
          <p className="mt-1 max-w-xl text-muted">Click an open date to block it, for repairs or a walk-in guest. Click a blocked date to open it again.</p>
        </div>
        <div>
          <label htmlFor="cal-room" className="label">Room</label>
          <select id="cal-room" className="field min-w-52" value={room.id} onChange={e => setRoomId(e.target.value)}>
            {db.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card mt-6 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{formatMonth(month)}</h2>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="grid size-10 place-items-center rounded-full border border-line hover:bg-sand"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="grid size-10 place-items-center rounded-full border border-line hover:bg-sand"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div role="grid" className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekdayLabels.map(label => <div key={label} className="pb-1 text-center text-xs font-semibold text-muted">{label}</div>)}
          {monthCells(month).map((night, index) => {
            if (!night) return <div key={`b-${index}`} />
            const booking = bookingOnNight(db, room.id, night)
            const blocked = isBlocked(db, room.id, night)
            const past = night < now
            const tone = booking
              ? booking.status === 'pending_approval' || booking.status === 'pending_payment' ? 'bg-sun-tint text-sun-ink' : 'bg-leaf-tint text-leaf-deep'
              : blocked
                ? 'bg-danger-tint text-danger'
                : past
                  ? 'text-muted/40'
                  : 'border border-line bg-surface hover:bg-sand'
            const caption = booking ? `${firstName(booking.guestName)}${booking.checkIn === night ? ' in' : ''}` : blocked ? 'Blocked' : past ? '' : compactPeso(nightRate(room, night))
            return (
              <button
                key={night}
                type="button"
                disabled={past && !booking}
                onClick={() => click(night, booking, blocked)}
                aria-label={`${formatDay(night)}: ${booking ? `booked by ${booking.guestName}` : blocked ? 'blocked' : 'open'}`}
                className={`relative flex min-h-16 flex-col justify-between rounded-xl p-2 text-left transition-colors sm:min-h-20 sm:p-2.5 ${tone}`}
              >
                <span className="font-display text-base font-bold leading-none sm:text-lg">{parseKey(night).getUTCDate()}</span>
                <span className="truncate text-[0.65rem] font-semibold sm:text-xs">{caption}</span>
                {night === now && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-leaf" aria-hidden />}
              </button>
            )
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-2"><i className="size-4 rounded-md bg-leaf-tint" />Confirmed booking</span>
          <span className="flex items-center gap-2"><i className="size-4 rounded-md bg-sun-tint" />Waiting for approval or payment</span>
          <span className="flex items-center gap-2"><i className="size-4 rounded-md bg-danger-tint" />Blocked by owner</span>
        </div>
      </div>

      <Dialog open={Boolean(open)} onClose={() => setOpenRef(null)} title={open ? `${open.guestName}` : 'Booking'} size="md">
        {open && (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={open.status} />
              <span className="text-sm text-muted">{open.reference}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted">Room</dt><dd className="font-semibold">{db.rooms.find(r => r.id === open.roomId)?.name}</dd></div>
              <div><dt className="text-muted">Stay</dt><dd className="font-semibold">{formatShort(open.checkIn)} to {formatShort(open.checkOut)}, {plural(open.nights, 'night')}</dd></div>
              <div><dt className="text-muted">Mobile</dt><dd className="font-semibold">{open.guestMobile || 'None'}</dd></div>
              <div><dt className="text-muted">Paid</dt><dd className="font-semibold">{peso(open.amountPaid)} of {peso(open.total)}</dd></div>
            </dl>
            <div className="mt-6"><BookingActions booking={open} /></div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
