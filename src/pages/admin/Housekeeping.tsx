import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarSearch, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { addDays, formatDay, today } from '../../lib/dates'
import { plural } from '../../lib/format'
import { setHousekeepingDone } from '../../store/api'
import { useDb } from '../../store/db'

type Kind = 'out' | 'in' | 'stay'

interface Task {
  kind: Kind
  key: string
  booking: Booking
  roomName: string
  turnover: boolean
}

const BAR = 'inline-flex items-center rounded-full border border-white/70 bg-white/35 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md'
const BTN = 'grid h-8 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-primary'

const SECTIONS: { kind: Kind; title: string; empty: string }[] = [
  { kind: 'out', title: 'Check-outs to clean', empty: 'No check-outs this day.' },
  { kind: 'in', title: 'Arrivals to prepare', empty: 'No arrivals this day.' },
  { kind: 'stay', title: 'Staying over', empty: 'No guests staying over.' }
]

export function Housekeeping() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const pickerRef = useRef<HTMLInputElement>(null)
  const now = today()
  const param = params.get('day')
  const day = param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : now

  const go = (value: string) => setParams(value === now ? {} : { day: value })

  const live = (booking: Booking) => booking.status === 'confirmed' || booking.status === 'checked_in'
  const roomName = (id: string) => db.rooms.find(room => room.id === id)?.name ?? 'Removed room'
  const outs = db.bookings.filter(booking => booking.checkOut === day && (live(booking) || booking.status === 'completed'))
  const ins = db.bookings.filter(booking => booking.checkIn === day && live(booking))
  const stays = db.bookings.filter(booking => booking.checkIn < day && booking.checkOut > day && live(booking))
  const turnoverRooms = new Set(outs.filter(out => ins.some(arrival => arrival.roomId === out.roomId)).map(out => out.roomId))

  const task = (kind: Kind, booking: Booking): Task => ({ kind, key: `${day}:${booking.roomId}:${kind}`, booking, roomName: roomName(booking.roomId), turnover: kind !== 'stay' && turnoverRooms.has(booking.roomId) })
  const groups: Record<Kind, Task[]> = { out: outs.map(booking => task('out', booking)), in: ins.map(booking => task('in', booking)), stay: stays.map(booking => task('stay', booking)) }
  const required = [...groups.out, ...groups.in]
  const done = required.filter(item => db.housekeeping?.[item.key]).length
  const percent = required.length ? Math.round((done / required.length) * 100) : 0

  return (
    <div>
      <PageHeader title="Housekeeping" description="Rooms to clean and prepare, based on check-outs and arrivals." />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className={BAR}>
          <button type="button" aria-label="Previous day" onClick={() => go(addDays(day, -1))} className={`${BTN} size-8`}><ChevronLeft size={16} /></button>
          <span className="min-w-36 px-3 text-center text-sm font-semibold" aria-live="polite">{day === now ? `Today, ${formatDay(day).replace(/^\w+, /, '')}` : formatDay(day)}</span>
          <button type="button" aria-label="Next day" onClick={() => go(addDays(day, 1))} className={`${BTN} size-8`}><ChevronRight size={16} /></button>
          <span aria-hidden className="mx-0.5 h-4 w-px bg-ink/15" />
          <button type="button" onClick={() => go(now)} className={`${BTN} px-3 text-sm font-semibold`}>Today</button>
          <button type="button" aria-label="Pick a day" data-tip="Pick a day" onClick={() => pickerRef.current?.showPicker()} className={`tip ${BTN} size-8`}><CalendarSearch size={15} /></button>
          <input ref={pickerRef} type="date" tabIndex={-1} aria-hidden className="sr-only" value="" onChange={event => event.target.value && go(event.target.value)} />
        </div>
        {required.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold tabular-nums">{done} of {required.length} done</span>
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${percent} percent done`}>
              <span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {required.length === 0 && stays.length === 0 ? (
          <div className="glass glass-data"><EmptyState title="Nothing to do this day" description="No check-outs, arrivals or guests staying over." className="p-12" /></div>
        ) : (
          SECTIONS.map(section => (
            <section key={section.kind} aria-labelledby={`hk-${section.kind}`} className="glass glass-data overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-ink/10 px-5 py-3">
                <h2 id={`hk-${section.kind}`} className="text-sm font-bold">{section.title}</h2>
                <span className="text-xs tabular-nums text-muted">{groups[section.kind].length}</span>
              </div>
              {groups[section.kind].length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted">{section.empty}</p>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {groups[section.kind].map(item => {
                    const checked = Boolean(db.housekeeping?.[item.key])
                    const trackable = item.kind !== 'stay'
                    return (
                      <li key={item.key} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                        {trackable ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`${item.roomName} ${item.kind === 'out' ? 'cleaned' : 'ready'}`}
                            onClick={() => setHousekeepingDone(item.key, !checked)}
                            className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${checked ? 'border-primary bg-primary text-white' : 'border-ink/25 bg-white/40 text-transparent hover:border-primary'}`}
                          >
                            <Check size={14} aria-hidden />
                          </button>
                        ) : <span aria-hidden className="size-7 shrink-0" />}
                        <span className={`min-w-0 flex-1 ${checked ? 'opacity-55' : ''}`}>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`text-sm font-bold ${checked ? 'line-through' : ''}`}>{item.roomName}</span>
                            {item.turnover && <span className="chip bg-accent-tint text-accent-deep">Same-day turnover</span>}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {item.booking.guestName} · {plural(item.booking.guests, 'guest')} · {item.kind === 'out' ? `check-out ${db.settings.checkOutTime}` : item.kind === 'in' ? `arrives from ${db.settings.checkInTime}` : `until ${formatDay(item.booking.checkOut)}`}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  )
}
