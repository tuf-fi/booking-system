import { useRef, useState } from 'react'
import { ArrowLeft, CalendarSearch, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking } from '../../types'
import { BookingActions } from '../../components/admin/BookingActions'
import { PageHeader } from '../../components/PageHeader'
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const GROUP = 'inline-flex items-center rounded-full bg-ink/[0.06] p-1'
const JUMP = 'h-8 cursor-pointer appearance-none rounded-full bg-transparent font-semibold text-ink transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary'
const REASONS = ['Maintenance', 'Repairs', 'Walk-in guest', 'Personal use', 'Other']

export function AdminCalendar() {
  const db = useDb()
  const toast = useToast()
  const now = today()
  const [roomId, setRoomId] = useState('all')
  const [dayOpen, setDayOpen] = useState<string | null>(null)
  const [cameFrom, setCameFrom] = useState<string | null>(null)
  const goBack = () => {
    setOpenRef(null)
    setDayOpen(cameFrom)
    setCameFrom(null)
  }
  const [blockTarget, setBlockTarget] = useState<{ night: string; blocked: boolean } | null>(null)
  const [reasonChoice, setReasonChoice] = useState(REASONS[0])
  const [reasonNote, setReasonNote] = useState('')
  const [month, setMonth] = useState(monthStart(now))
  const [openRef, setOpenRef] = useState<string | null>(null)
  const jumpRef = useRef<HTMLInputElement>(null)
  const allRooms = roomId === 'all'
  const currentYear = Number(now.slice(0, 4))
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)
  const activeRooms = db.rooms.filter(r => r.isActive)
  const room = db.rooms.find(r => r.id === roomId) ?? db.rooms[0]
  const dayBookings = dayOpen ? activeRooms.flatMap(r => { const b = bookingOnNight(db, r.id, dayOpen); return b ? [b] : [] }) : []
  const open: Booking | undefined = db.bookings.find(b => b.reference === openRef)

  const click = (night: string, booking: Booking | undefined, blocked: boolean) => {
    if (booking) return setOpenRef(booking.reference)
    setReasonChoice(REASONS[0])
    setReasonNote('')
    setBlockTarget({ night, blocked })
  }

  const confirmBlock = () => {
    if (!blockTarget) return
    const { night, blocked } = blockTarget
    const reason = reasonChoice === 'Other' ? reasonNote : [reasonChoice, reasonNote.trim()].filter(Boolean).join(': ')
    setBlockedNight(room.id, night, !blocked, reason)
    toast(blocked ? `${formatDay(night)} is open for booking again.` : `${formatDay(night)} blocked. Guests can't book it.`)
    setBlockTarget(null)
  }

  const reasonMissing = reasonChoice === 'Other' && !reasonNote.trim()

  return (
    <div>
      <PageHeader
        title="Availability"
        description={allRooms ? 'Every room at a glance. Click a day to see who is staying. Pick a room to block or open its dates.' : 'Click an open date to block it, for repairs or a walk-in guest. Click a blocked date to open it again.'}
        actions={
          <div className="relative">
            <label htmlFor="cal-room" className="sr-only">Room</label>
            <select id="cal-room" className="h-9 min-w-48 cursor-pointer appearance-none rounded-full border border-white/70 bg-white/70 py-0 pl-4 pr-9 text-sm font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-primary" value={room.id} onChange={e => setRoomId(e.target.value)}>
              <option value="all">All rooms</option>
              {db.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        }
      />

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] font-bold leading-4 text-ink" aria-label="Legend">
        <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />Confirmed</li>
        <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-accent" />Waiting for approval or payment</li>
        <li className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-danger" />Blocked by owner</li>
      </ul>

      <div className="glass glass-data mt-3 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className={GROUP}>
            <h2 className="sr-only" aria-live="polite">{formatMonth(month)}</h2>
            <label className="relative">
              <span className="sr-only">Month</span>
              <select value={month.slice(5, 7)} onChange={event => setMonth(`${month.slice(0, 4)}-${event.target.value}-01`)} className={`${JUMP} pl-4 pr-8 text-sm`}>
                {MONTHS.map((name, index) => <option key={name} value={String(index + 1).padStart(2, '0')}>{name}</option>)}
              </select>
              <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </label>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-ink/15" />
            <label className="relative">
              <span className="sr-only">Year</span>
              <select value={month.slice(0, 4)} onChange={event => setMonth(`${event.target.value}-${month.slice(5, 7)}-01`)} className={`${JUMP} pl-3.5 pr-8 text-sm tabular-nums`}>
                {years.map(year => <option key={year} value={String(year)}>{year}</option>)}
              </select>
              <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </label>
          </div>
          <div className={GROUP}>
            <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className={`${JUMP} grid size-8 place-items-center`}><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => setMonth(monthStart(now))} className={`${JUMP} px-3 text-sm`}>Today</button>
            <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className={`${JUMP} grid size-8 place-items-center`}><ChevronRight size={16} /></button>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-ink/15" />
            <button type="button" aria-label="Go to a date" data-tip="Go to date" onClick={() => jumpRef.current?.showPicker()} className={`tip ${JUMP} grid size-8 place-items-center`}><CalendarSearch size={15} /></button>
            <input ref={jumpRef} type="date" tabIndex={-1} aria-hidden className="sr-only" value="" onChange={event => event.target.value && setMonth(monthStart(event.target.value))} />
          </div>
        </div>
        <div role="grid" className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {weekdayLabels.map(label => <div key={label} className="pb-1 text-center text-xs font-semibold text-muted">{label}</div>)}
          {monthCells(month).map((night, index) => {
            if (!night) return <div key={`b-${index}`} />
            const past = night < now
            const booking = allRooms ? undefined : bookingOnNight(db, room.id, night)
            const blocked = allRooms ? false : isBlocked(db, room.id, night)
            const nightBookings = allRooms ? activeRooms.flatMap(r => { const b = bookingOnNight(db, r.id, night); return b ? [b] : [] }) : []
            const full = allRooms && nightBookings.length > 0 && nightBookings.length >= activeRooms.length
            const tone = allRooms
              ? full
                ? 'bg-primary text-white'
                : nightBookings.length
                  ? nightBookings.some(b => b.status !== 'pending_approval' && b.status !== 'pending_payment') ? 'bg-primary-tint text-primary-deep' : 'bg-accent-tint text-accent-deep'
                  : past ? 'text-muted/40' : 'bg-ink/[0.035] text-ink'
              : booking
                ? booking.status === 'pending_approval' || booking.status === 'pending_payment' ? 'bg-accent-tint text-accent-deep' : 'bg-primary-tint text-primary-deep'
                : blocked
                  ? 'bg-danger-tint text-danger'
                  : past
                    ? 'text-muted/40'
                    : 'bg-ink/[0.035] hover:bg-primary-tint'
            const caption = allRooms
              ? nightBookings.length ? `${nightBookings.length} of ${activeRooms.length} rooms` : past ? '' : 'All open'
              : booking ? `${firstName(booking.guestName)}${booking.checkIn === night ? ' in' : ''}` : blocked ? (db.blockedReasons?.[`${room.id}:${night}`] ?? 'Blocked') : past ? '' : compactPeso(nightRate(room, night))
            return (
              <button
                key={night}
                type="button"
                disabled={allRooms ? nightBookings.length === 0 : past && !booking}
                onClick={() => (allRooms ? setDayOpen(night) : click(night, booking, blocked))}
                aria-label={`${formatDay(night)}: ${allRooms ? `${nightBookings.length} of ${activeRooms.length} rooms booked` : booking ? `booked by ${booking.guestName}` : blocked ? 'blocked' : 'open'}`}
                className={`relative flex min-h-14 flex-col justify-between rounded-control px-2 py-1.5 text-left transition-colors sm:min-h-[4.25rem] sm:px-2.5 ${tone}`}
              >
                <span className={`-ml-1 grid size-6 place-items-center rounded-full text-sm font-bold leading-none ${night === now ? 'bg-primary text-white' : ''}`}>{parseKey(night).getUTCDate()}</span>
                <span className="truncate text-xs font-medium">{caption}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={blockTarget !== null} onClose={() => setBlockTarget(null)} title={blockTarget?.blocked ? 'Open this date' : 'Block this date'} size="sm">
        {blockTarget && (
          <div>
            <p className="text-sm text-muted">{room.name}, <b className="text-ink">{formatDay(blockTarget.night)}</b></p>
            {blockTarget.blocked ? (
              <>
                <p className="mt-4 rounded-card border border-ink/10 bg-white/40 px-4 py-3 text-sm"><span className="text-muted">Reason: </span><b>{db.blockedReasons?.[`${room.id}:${blockTarget.night}`] ?? 'Not recorded'}</b></p>
                <p className="mt-3 text-sm text-muted">Opening it lets guests book this night again.</p>
              </>
            ) : (
              <>
                <fieldset className="mt-4">
                  <legend className="label">Reason</legend>
                  <div className="flex flex-wrap gap-2">
                    {REASONS.map(reason => (
                      <label key={reason} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${reasonChoice === reason ? 'border-primary-deep bg-primary-tint text-primary-deep' : 'border-ink/15 text-muted hover:bg-sand'}`}>
                        <input type="radio" name="block-reason" className="sr-only" checked={reasonChoice === reason} onChange={() => setReasonChoice(reason)} />
                        {reason}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-4">
                  <label className="label" htmlFor="block-note">{reasonChoice === 'Other' ? 'Describe the reason' : 'Note (optional)'}</label>
                  <input id="block-note" className="field field-compact" value={reasonNote} maxLength={80} onChange={event => setReasonNote(event.target.value)} placeholder={reasonChoice === 'Other' ? 'For example, family visit' : 'For example, aircon service'} />
                </div>
              </>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn btn-soft h-10 min-h-0 px-5 text-sm" onClick={() => setBlockTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-primary h-10 min-h-0 px-5 text-sm" disabled={!blockTarget.blocked && reasonMissing} onClick={confirmBlock}>{blockTarget.blocked ? 'Open date' : 'Block date'}</button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={dayOpen !== null} onClose={() => setDayOpen(null)} title={dayOpen ? formatDay(dayOpen) : 'Bookings'} size="sm">
        <p className="-mt-1 mb-3 text-sm text-muted">{plural(dayBookings.length, 'room')} booked of {activeRooms.length}</p>
        <ul className="divide-y divide-ink/10 overflow-hidden rounded-card bg-ink/[0.045]">
          {dayBookings.map(b => (
            <li key={b.reference}>
              <button type="button" onClick={() => { setCameFrom(dayOpen); setDayOpen(null); setOpenRef(b.reference) }} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/50 focus-visible:bg-white/50 focus-visible:outline-none">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{b.guestName}</span>
                  <span className="block truncate text-xs text-muted">{db.rooms.find(r => r.id === b.roomId)?.name} · {b.reference}</span>
                </span>
                <StatusChip status={b.status} />
              </button>
            </li>
          ))}
        </ul>
      </Dialog>

      <Dialog open={Boolean(open)} onClose={() => { setOpenRef(null); setCameFrom(null) }} headerAction={cameFrom ? <button type="button" onClick={goBack} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"><ArrowLeft size={14} aria-hidden />Back</button> : undefined} title={open ? `${open.guestName}` : 'Booking'} size="sm">
        {open && (
          <div>
            <div className="flex items-center gap-2.5">
              <StatusChip status={open.status} />
              <span className="text-xs tabular-nums text-muted">{open.reference}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-card bg-ink/[0.045] p-4">
              <div>
                <dt className="text-xs text-muted">Room</dt>
                <dd className="mt-0.5 text-sm font-semibold">{db.rooms.find(r => r.id === open.roomId)?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Mobile</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums">{open.guestMobile || 'None'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted">{plural(open.guests, 'guest')}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{[open.guestName, ...(open.otherGuests ?? [])].join(', ')}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted">Stay</dt>
                <dd className="mt-0.5 text-sm font-semibold">{formatShort(open.checkIn)} to {formatShort(open.checkOut)} <span className="font-normal text-muted">· {plural(open.nights, 'night')}</span></dd>
              </div>
            </dl>
            <div className="mt-4 px-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">Paid</span>
                <span className="font-semibold tabular-nums">{peso(open.amountPaid)} <span className="font-normal text-muted">of {peso(open.total)}</span></span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${Math.round((open.amountPaid / Math.max(1, open.total)) * 100)} percent paid`}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, (open.amountPaid / Math.max(1, open.total)) * 100)}%` }} />
              </div>
            </div>
            <div className="mt-5"><BookingActions booking={open} labeled /></div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
