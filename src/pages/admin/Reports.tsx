import { Download } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { compactPeso, peso } from '../../lib/money'
import { formatMonth, monthStart, today } from '../../lib/dates'
import { downloadCsv, occupancyForMonth, revenueSeries } from '../../lib/reports'
import { useDb } from '../../store/db'

export function Reports() {
  const db = useDb()
  const series = revenueSeries(db, 6)
  const current = monthStart(today())
  const occupancy = occupancyForMonth(db, current)
  const max = Math.max(...series.map(s => s.value), 1)
  const total = series.reduce((sum, s) => sum + s.value, 0)

  const exportCsv = () => {
    downloadCsv('lantaw-report.csv', [
      ['Money received by month', 'Amount (PHP)'],
      ...series.map(s => [formatMonth(s.key), s.value / 100]),
      [],
      [`Occupancy, ${formatMonth(current)}`, 'Percent'],
      ...db.rooms.map(room => [room.name, occupancy.roomPercent(room.id)])
    ])
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Money received and how full the rooms are."
        actions={<button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="rev-h">
          <h2 id="rev-h" className="text-2xl font-bold">Money received, last 6 months</h2>
          <p className="mt-1 text-sm text-muted">{peso(total)} in total, grouped by check-in month.</p>
          <ul className="mt-6 flex h-60 items-end gap-3 sm:gap-4" aria-label="Money received per month">
            {series.map((point, index) => (
              <li key={point.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2 text-xs">
                <b className="tabular-nums">{point.value ? compactPeso(point.value) : '0'}</b>
                <span className={`w-full max-w-16 rounded-control ${index === series.length - 1 ? 'bg-accent' : 'bg-primary'}`} style={{ height: `${Math.max(2, (point.value / max) * 150)}px` }} role="img" aria-label={`${formatMonth(point.key)}: ${peso(point.value)}`} />
                <span className="text-muted">{point.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6" aria-labelledby="occ-h">
          <h2 id="occ-h" className="text-2xl font-bold">Occupancy, {formatMonth(current)}</h2>
          <p className="mt-1 text-sm text-muted">{occupancy.percent}% of all room nights. Confirmed nights only.</p>
          <ul className="mt-6 space-y-4">
            {db.rooms.map(room => {
              const percent = occupancy.roomPercent(room.id)
              return (
                <li key={room.id} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 text-sm">
                  <span className="truncate font-semibold">{room.name}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-primary-tint"><i className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></span>
                  <b className="text-right tabular-nums">{percent}%</b>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
