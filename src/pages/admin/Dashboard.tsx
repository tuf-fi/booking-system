import { Link } from 'react-router-dom'
import { ArrowRight, BellRing } from 'lucide-react'
import { BookingRow, BookingTableHead } from '../../components/admin/BookingRow'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { StatGrid } from '../../components/StatGrid'
import { plural } from '../../lib/format'
import { peso } from '../../lib/money'
import { monthStart, today } from '../../lib/dates'
import { arrivalsWithin, occupancyForMonth, stayingNow, waitingForApproval, monthlyRevenue, sortBookings } from '../../lib/reports'
import { useDb } from '../../store/db'

export function Dashboard() {
  const db = useDb()
  const month = monthStart(today())
  const received = monthlyRevenue(db, month)
  const occupancy = occupancyForMonth(db, month)
  const waiting = waitingForApproval(db)
  const arrivals = arrivalsWithin(db, 7)
  const staying = stayingNow(db)
  const attention = sortBookings([...waiting, ...arrivals.filter(b => !waiting.includes(b)), ...staying]).slice(0, 6)

  const stats = [
    { label: 'Received this month', value: peso(received), note: 'Down payments and full payments' },
    { label: 'Occupancy this month', value: `${occupancy.percent}%`, note: 'Of all room nights' },
    { label: 'Arriving in 7 days', value: String(arrivals.length), note: `${plural(staying.length, 'room')} occupied now` },
    { label: 'Waiting for approval', value: String(waiting.length), note: 'GCash payments to check' }
  ]

  return (
    <div>
      <PageHeader title="Good day" description="Here is what needs you today." />

      {waiting.length > 0 && (
        <div className="glass glass-data mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 pl-3 pr-2.5">
          <p className="flex items-center gap-3 text-sm font-semibold">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-ink"><BellRing size={15} /></span>
            {waiting.length === 1 ? '1 booking is' : `${waiting.length} bookings are`} waiting for you to check the GCash payment.
          </p>
          <Link to="/admin/bookings?filter=waiting" className="btn btn-secondary btn-sm">Review now<ArrowRight size={14} /></Link>
        </div>
      )}

      <div className="mt-4"><StatGrid stats={stats} /></div>

      <div className="mt-7 flex items-end justify-between gap-3">
        <h2 className="text-base font-bold">Needs your attention</h2>
        <Link to="/admin/bookings" className="text-sm font-semibold text-primary hover:underline">All bookings</Link>
      </div>
      <div className="glass glass-data mt-4 overflow-hidden">
        {attention.length ? (
          <>
          <BookingTableHead />
          <ul className="divide-y divide-ink/10">{attention.map(b => <BookingRow key={b.reference} booking={b} />)}</ul>
          </>
        ) : (
          <EmptyState title="Nothing needs you right now" />
        )}
      </div>
    </div>
  )
}
