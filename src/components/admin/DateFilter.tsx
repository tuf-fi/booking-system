import { ChevronDown } from 'lucide-react'
import { addMonths, today, type DateKey } from '../../lib/dates'

export type DateMode = 'all' | 'day' | 'month' | 'year'
export type DateFilterValue = { mode: DateMode; value: string }

export const ALL_DATES: DateFilterValue = { mode: 'all', value: '' }

export const stayOverlaps = (checkIn: DateKey, checkOut: DateKey, filter: DateFilterValue) => {
  if (filter.mode === 'all' || !filter.value) return true
  if (filter.mode === 'day') return checkIn <= filter.value && filter.value < checkOut
  const start = filter.mode === 'month' ? `${filter.value}-01` : `${filter.value}-01-01`
  const end = filter.mode === 'month' ? addMonths(start, 1) : `${Number(filter.value) + 1}-01-01`
  return checkIn < end && checkOut > start
}

const FROST = 'border border-white/70 bg-white/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md'
const MODES: { id: DateMode; label: string }[] = [
  { id: 'all', label: 'All dates' },
  { id: 'day', label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' }
]

export function DateFilter({ filter, onChange, years }: { filter: DateFilterValue; onChange: (value: DateFilterValue) => void; years: number[] }) {
  const now = today()
  const setMode = (mode: DateMode) => {
    if (mode === 'day') onChange({ mode, value: now })
    else if (mode === 'month') onChange({ mode, value: now.slice(0, 7) })
    else if (mode === 'year') onChange({ mode, value: now.slice(0, 4) })
    else onChange(ALL_DATES)
  }
  const field = 'h-9 rounded-full bg-transparent text-sm font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-primary'

  return (
    <div className={`flex items-center rounded-full p-1 ${FROST}`} role="group" aria-label="Filter by date">
      <label className="relative">
        <span className="sr-only">Date range</span>
        <select value={filter.mode} onChange={event => setMode(event.target.value as DateMode)} className={`${field} cursor-pointer appearance-none pl-3.5 pr-8 hover:bg-white/50`}>
          {MODES.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
        </select>
        <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </label>
      {filter.mode === 'day' && (
        <input type="date" aria-label="Day" value={filter.value} onChange={event => event.target.value && onChange({ mode: 'day', value: event.target.value })} className={`${field} ml-0.5 px-3 tabular-nums`} />
      )}
      {filter.mode === 'month' && (
        <input type="month" aria-label="Month" value={filter.value} onChange={event => event.target.value && onChange({ mode: 'month', value: event.target.value })} className={`${field} ml-0.5 px-3 tabular-nums`} />
      )}
      {filter.mode === 'year' && (
        <label className="relative ml-0.5">
          <span className="sr-only">Year</span>
          <select value={filter.value} onChange={event => onChange({ mode: 'year', value: event.target.value })} className={`${field} cursor-pointer appearance-none pl-3 pr-8 tabular-nums hover:bg-white/50`}>
            {years.map(year => <option key={year} value={String(year)}>{year}</option>)}
          </select>
          <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </label>
      )}
    </div>
  )
}
