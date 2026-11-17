import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { BookingRow } from '../../components/admin/BookingRow'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { statusLabel } from '../../components/StatusChip'
import { downloadCsv, FILTERS, matchesFilter, sortBookings, type BookingFilter } from '../../lib/reports'
import { useDb } from '../../store/db'

const isFilter = (value: string | null): value is BookingFilter => FILTERS.some(f => f.id === value)

export function Bookings() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const filter: BookingFilter = isFilter(params.get('filter')) ? (params.get('filter') as BookingFilter) : 'all'

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, db.bookings.filter(b => matchesFilter(b, f.id)).length])), [db.bookings])

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    const matched = db.bookings.filter(b => matchesFilter(b, filter) && (!text || `${b.reference} ${b.guestName} ${b.guestMobile}`.toLowerCase().includes(text)))
    return sortBookings(matched)
  }, [db.bookings, filter, query])

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
        actions={<button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter bookings" className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === f.id ? 'border-ink bg-secondary text-white' : 'border-line bg-surface hover:bg-sand'}`}
            >
              {f.label} <span className={filter === f.id ? 'text-white/70' : 'text-muted'}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search bookings</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field pl-10" placeholder="Search name, mobile or reference" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>

      <div className="card mt-5 overflow-hidden">
        {list.length ? (
          <ul className="divide-y divide-line">{list.map(b => <BookingRow key={b.reference} booking={b} />)}</ul>
        ) : (
          <EmptyState title="No bookings here yet" className="p-12" />
        )}
      </div>
    </div>
  )
}
