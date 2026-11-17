import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { ALL_DATES, DateFilter, stayOverlaps, type DateFilterValue } from '../../components/admin/DateFilter'
import { Pagination } from '../../components/Pagination'
import { BookingRow, BookingTableHead } from '../../components/admin/BookingRow'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { statusLabel } from '../../components/StatusChip'
import { downloadCsv, FILTERS, matchesFilter, sortBookings, type BookingFilter } from '../../lib/reports'
import { today } from '../../lib/dates'
import { useDb } from '../../store/db'

const PAGE_SIZE = 10

const TONES: Record<BookingFilter, { thumb: string; text: string }> = {
  all: { thumb: 'bg-[#ece6f7] shadow-[inset_0_0_0_1px_rgb(74_47_134/0.28)]', text: 'text-[#4a2f86]' },
  waiting: { thumb: 'bg-accent-tint shadow-[inset_0_0_0_1px_rgb(122_82_0/0.28)]', text: 'text-accent-deep' },
  upcoming: { thumb: 'bg-primary-tint shadow-[inset_0_0_0_1px_rgb(31_77_56/0.25)]', text: 'text-primary-deep' },
  staying: { thumb: 'bg-tertiary-tint shadow-[inset_0_0_0_1px_rgb(31_75_98/0.25)]', text: 'text-tertiary-deep' },
  completed: { thumb: 'bg-sand shadow-[inset_0_0_0_1px_rgb(90_102_95/0.3)]', text: 'text-muted' },
  cancelled: { thumb: 'bg-danger-tint shadow-[inset_0_0_0_1px_rgb(168_64_46/0.3)]', text: 'text-danger' }
}

const isFilter = (value: string | null): value is BookingFilter => FILTERS.some(f => f.id === value)

export function Bookings() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [dates, setDates] = useState<DateFilterValue>(ALL_DATES)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  const filter: BookingFilter = isFilter(params.get('filter')) ? (params.get('filter') as BookingFilter) : 'all'

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, db.bookings.filter(b => matchesFilter(b, f.id)).length])), [db.bookings])

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    const matched = db.bookings.filter(b => matchesFilter(b, filter) && stayOverlaps(b.checkIn, b.checkOut, dates) && (!text || `${b.reference} ${b.guestName} ${b.guestMobile}`.toLowerCase().includes(text)))
    return sortBookings(matched)
  }, [db.bookings, filter, query, dates])

  useLayoutEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return
    const place = (reveal: boolean) => {
      const active = tabs.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!active) return
      setThumb({ left: active.offsetLeft, width: active.offsetWidth })
      if (reveal) tabs.scrollTo({ left: Math.max(0, active.offsetLeft - 16), behavior: 'smooth' })
    }
    place(true)
    const observer = new ResizeObserver(() => place(false))
    observer.observe(tabs)
    void document.fonts?.ready.then(() => place(false))
    return () => observer.disconnect()
  }, [filter, counts])

  const years = useMemo(() => {
    const set = new Set<number>([Number(today().slice(0, 4))])
    db.bookings.forEach(b => { set.add(Number(b.checkIn.slice(0, 4))); set.add(Number(b.checkOut.slice(0, 4))) })
    return [...set].sort((a, b) => a - b)
  }, [db.bookings])

  const filtered = filter !== 'all' || query.trim() !== '' || dates.mode !== 'all'
  const clearFilters = () => {
    setQuery('')
    setDates(ALL_DATES)
    setPage(1)
    setParams({})
  }

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const exportCsv = () => {
    const rooms = Object.fromEntries(db.rooms.map(r => [r.id, r.name]))
    downloadCsv('lantaw-bookings.csv', [
      ['Reference', 'Guest', 'Mobile', 'Room', 'Check-in', 'Check-out', 'Nights', 'Total (PHP)', 'Paid (PHP)', 'Status', 'Source'],
      ...list.map(b => [b.reference, b.guestName, b.guestMobile, rooms[b.roomId], b.checkIn, b.checkOut, b.nights, b.total / 100, b.amountPaid / 100, statusLabel(b.status), b.source])
    ])
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Approve payments, check guests in and out, and keep track of balances."
        actions={<button type="button" className="btn btn-soft btn-sm h-9 min-h-0 px-4" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div ref={tabsRef} role="tablist" aria-label="Filter bookings" className="relative flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-white/70 bg-white/35 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md">
          {thumb && <span aria-hidden className={`absolute inset-y-1 rounded-full transition-[left,width,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${TONES[filter].thumb}`} style={{ left: thumb.left, width: thumb.width }} />}
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => { setPage(1); setParams(f.id === 'all' ? {} : { filter: f.id }) }}
              className={`relative shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${filter === f.id ? `${TONES[f.id].text} ${thumb ? '' : TONES[f.id].thumb}` : 'text-muted hover:text-ink'}`}
            >
              {f.label} <span className={filter === f.id ? 'opacity-80' : 'text-muted/80'}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <DateFilter filter={dates} years={years} onChange={value => { setDates(value); setPage(1) }} />
        <label className="relative block w-full sm:w-56">
          <span className="sr-only">Search bookings</span>
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" />
          <input className="field field-compact h-9 min-h-0 rounded-full border-white/70 bg-white/35 pl-10 pr-4 text-sm font-medium shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md transition-[background-color,border-color,box-shadow] placeholder:font-normal placeholder:text-muted hover:bg-white/50 focus:border-primary focus:bg-white/55 focus:shadow-[0_0_0_3px_var(--color-primary-tint)]" placeholder="Search bookings" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} />
        </label>
        </div>
      </div>

      <div className="glass glass-data mt-5 overflow-hidden">
        <BookingTableHead />
        {list.length ? (
          <ul key={`${filter}-${current}-${query}-${dates.mode}-${dates.value}`} className="divide-y divide-ink/10">{visible.map((b, i) => <BookingRow key={b.reference} booking={b} index={i} />)}</ul>
        ) : (
          <EmptyState
            title={filtered ? 'No bookings match these filters' : 'No bookings here yet'}
            description={filtered ? 'Try another filter or search, or clear them to see everything.' : undefined}
            action={filtered ? <button type="button" className="btn btn-soft btn-sm h-9 min-h-0 px-4" onClick={clearFilters}>Clear filters</button> : undefined}
            className="p-12"
          />
        )}
      </div>
      <Pagination page={current} pageSize={PAGE_SIZE} total={list.length} onChange={value => { setPage(value); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
