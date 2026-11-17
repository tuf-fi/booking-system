import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Room } from '../types'
import { addDays, addMonths, formatDay, formatMonth, monthCells, monthStart, nightsBetween, parseKey, today, weekdayLabels, isWeekendNight, type DateKey } from '../lib/dates'
import { isNightTaken, isRangeFree } from '../lib/availability'
import { compactPeso, peso } from '../lib/money'
import { nightRate } from '../lib/pricing'
import { plural } from '../lib/format'
import { useDb } from '../store/db'

interface Props {
  room: Room
  checkIn: DateKey | null
  checkOut: DateKey | null
  onChange: (checkIn: DateKey | null, checkOut: DateKey | null) => void
  onRejected: (message: string) => void
}

const dateInput =
  'mt-1.5 block w-full border border-line bg-surface px-3 py-2.5 text-base font-bold text-ink transition-[border-color,box-shadow] hover:border-ink/30 focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_var(--color-primary-tint)]'

export function AvailabilityCalendar({ room, checkIn, checkOut, onChange, onRejected }: Props) {
  const db = useDb()
  const now = today()
  const [month, setMonth] = useState<DateKey>(monthStart(checkIn ?? now))
  const [hover, setHover] = useState<DateKey | null>(null)

  const taken = useMemo(() => (night: DateKey) => isNightTaken(db, room.id, night), [db, room.id])
  const awaitingCheckOut = checkIn !== null && checkOut === null

  useEffect(() => {
    if (checkIn) setMonth(monthStart(checkIn))
  }, [checkIn])

  const canPick = (night: DateKey) => {
    if (night < now) return false
    if (!awaitingCheckOut) return !taken(night)
    if (night <= checkIn!) return !taken(night)
    return isRangeFree(db, room.id, checkIn!, night)
  }

  const pick = (night: DateKey) => {
    if (night < now) return
    if (!awaitingCheckOut) {
      if (taken(night)) return onRejected('That night is already booked. Pick another date.')
      return onChange(night, null)
    }
    if (night <= checkIn!) {
      if (taken(night)) return onRejected('That night is already booked. Pick another date.')
      return onChange(night, null)
    }
    if (!isRangeFree(db, room.id, checkIn!, night)) {
      onRejected('Some nights in that range are booked. Pick a different check-out.')
      return
    }
    onChange(checkIn, night)
  }

  const typeCheckIn = (value: string) => {
    if (!value) return onChange(null, null)
    if (value < now) return onRejected('Check-in can’t be in the past.')
    if (taken(value)) return onRejected('That night is already booked. Pick another date.')
    if (checkOut && checkOut > value && isRangeFree(db, room.id, value, checkOut)) return onChange(value, checkOut)
    onChange(value, null)
  }

  const typeCheckOut = (value: string) => {
    if (!value) return onChange(checkIn, null)
    if (!checkIn) return onRejected('Pick your check-in date first.')
    if (value <= checkIn) return onRejected('Check-out must be after check-in.')
    if (!isRangeFree(db, room.id, checkIn, value)) return onRejected('Some nights in that range are booked. Pick a different check-out.')
    onChange(checkIn, value)
  }

  const preview = awaitingCheckOut && hover && hover > checkIn! && isRangeFree(db, room.id, checkIn!, hover) ? hover : null
  const rangeEnd = checkOut ?? preview
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="date-in" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Check-in</label>
          <input id="date-in" type="date" className={dateInput} min={now} value={checkIn ?? ''} onChange={event => typeCheckIn(event.target.value)} />
        </div>
        <div>
          <label htmlFor="date-out" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Check-out</label>
          <input id="date-out" type="date" className={dateInput} min={checkIn ? addDays(checkIn, 1) : addDays(now, 1)} value={checkOut ?? ''} onChange={event => typeCheckOut(event.target.value)} />
        </div>
      </div>
      <p className="mt-2 min-h-5 text-sm text-muted" aria-live="polite">
        {nights > 0 ? <><b className="text-ink">{plural(nights, 'night')}</b>, {formatDay(checkIn!)} to {formatDay(checkOut!)}</> : 'Type your dates, or pick them on the calendar below.'}
      </p>

      <div className="mt-5 border-t border-line pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">{formatMonth(month)}</h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              disabled={month <= monthStart(now)}
              aria-label="Previous month"
              className="grid size-9 place-items-center rounded-full border border-line bg-surface transition-colors hover:bg-sand disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
              className="grid size-9 place-items-center rounded-full border border-line bg-surface transition-colors hover:bg-sand"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div role="grid" aria-label={formatMonth(month)} className="grid grid-cols-7">
          {weekdayLabels.map(label => (
            <div key={label} className="pb-2 text-center text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
          ))}
          {monthCells(month).map((night, index) => {
            if (!night) return <div key={`blank-${index}`} />
            const past = night < now
            const isTaken = !past && taken(night)
            const isStart = night === checkIn
            const isEnd = night === checkOut
            const inRange = checkIn !== null && rangeEnd !== null && night > checkIn && night < rangeEnd
            const selectable = canPick(night)
            const price = nightRate(room, night)
            const marked = isStart || isEnd
            const tone = marked
              ? 'rounded-control bg-secondary text-white'
              : inRange
                ? 'bg-primary-tint text-ink'
                : isTaken
                  ? 'text-muted/60'
                  : past
                    ? 'text-muted/40'
                    : 'rounded-control text-ink hover:bg-sand'
            return (
              <button
                key={night}
                type="button"
                disabled={!selectable && !marked}
                aria-pressed={marked}
                aria-label={`${formatDay(night)}${past ? ', past' : isTaken ? ', booked' : `, ${peso(price)} per night`}${isStart ? ', check-in' : ''}${isEnd ? ', check-out' : ''}`}
                onClick={() => pick(night)}
                onMouseEnter={() => setHover(night)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(night)}
                className={`relative flex h-12 flex-col items-center justify-center gap-0.5 text-sm font-bold transition-colors disabled:cursor-not-allowed sm:h-14 ${tone} ${isTaken && !marked ? 'bg-[repeating-linear-gradient(-45deg,transparent_0_5px,var(--color-sand)_5px_10px)]' : ''}`}
              >
                <span className={isTaken && !marked ? 'line-through' : ''}>{parseKey(night).getUTCDate()}</span>
                {!past && (
                  <span className={`text-xs font-medium leading-none ${marked ? 'text-white/80' : isWeekendNight(night) && !isTaken ? 'font-bold text-ink' : 'text-muted'}`}>
                    {isTaken && !marked ? '' : compactPeso(price)}
                  </span>
                )}
                {night === now && !marked && <span className="absolute bottom-1 size-1 bg-primary" aria-hidden />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2"><i className="size-3.5 bg-secondary" />Your stay</span>
        <span className="flex items-center gap-2"><i className="size-3.5 bg-[repeating-linear-gradient(-45deg,var(--color-sand)_0_3px,#d9d3c6_3px_6px)]" />Booked</span>
        <span>Price per night, bold on Friday and Saturday</span>
      </div>
    </div>
  )
}
