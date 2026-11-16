import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BookingRow } from '../../components/admin/BookingRow'
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
      <h1 className="text-4xl font-extrabold">Good day</h1>
      <p className="mt-1 text-muted">Here is what needs you today.</p>

      {waiting.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sun-tint px-5 py-4 font-semibold text-sun-ink">
          <span>{waiting.length === 1 ? '1 booking is' : `${waiting.length} bookings are`} waiting for you to check the GCash payment.</span>
          <Link to="/admin/bookings?filter=waiting" className="btn btn-dark btn-sm">Review now<ArrowRight size={14} /></Link>
        </div>
      )}

      <dl className="card mt-6 grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{stat.value}</dd>
            <dd className="mt-0.5 text-sm text-muted">{stat.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Needs your attention</h2>
        <Link to="/admin/bookings" className="text-sm font-semibold text-leaf hover:underline">All bookings</Link>
      </div>
      <div className="card mt-4 overflow-hidden">
        {attention.length ? (
          <ul className="divide-y divide-line">{attention.map(b => <BookingRow key={b.reference} booking={b} />)}</ul>
        ) : (
          <p className="p-10 text-center text-muted">Nothing needs you right now.</p>
        )}
      </div>
    </div>
  )
}
