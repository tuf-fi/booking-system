import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { ALL_DATES, DateFilter, stayOverlaps, type DateFilterValue } from '../../components/admin/DateFilter'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { StatGrid } from '../../components/StatGrid'
import { StatusChip } from '../../components/StatusChip'
import { addDays, formatShort } from '../../lib/dates'
import { peso } from '../../lib/money'
import { downloadCsv } from '../../lib/reports'
import { useDb } from '../../store/db'
import type { PaymentMethod } from '../../types'

const PAGE_SIZE = 10
const GRID = 'lg:grid-cols-[6rem_minmax(0,1.2fr)_minmax(0,1fr)_6rem_8rem_9rem]'
const METHODS: { id: PaymentMethod | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'gcash_manual', label: 'GCash' },
  { id: 'paymongo', label: 'Card' },
  { id: 'cash', label: 'Cash' }
]
const METHOD_LABEL = { gcash_manual: 'GCash', paymongo: 'Card', cash: 'Cash' }

const dayOf = (timestamp: number) => new Date(timestamp + 8 * 3600 * 1000).toISOString().slice(0, 10)

export function Payments() {
  const db = useDb()
  const [method, setMethod] = useState<PaymentMethod | 'all'>('all')
  const [dates, setDates] = useState<DateFilterValue>(ALL_DATES)
  const [page, setPage] = useState(1)

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()])
    db.bookings.forEach(booking => set.add(Number(dayOf(booking.createdAt).slice(0, 4))))
    return [...set].sort((a, b) => a - b)
  }, [db.bookings])

  const payments = useMemo(
    () =>
      db.bookings
        .filter(booking => booking.amountPaid > 0)
        .map(booking => ({ booking, day: dayOf(booking.createdAt) }))
        .sort((a, b) => b.booking.createdAt - a.booking.createdAt),
    [db.bookings]
  )

  const list = useMemo(
    () => payments.filter(({ booking, day }) => (method === 'all' || booking.method === method) && stayOverlaps(day, addDays(day, 1), dates)),
    [payments, method, dates]
  )

  const total = list.reduce((sum, { booking }) => sum + booking.amountPaid, 0)
  const byMethod = (id: PaymentMethod) => list.filter(({ booking }) => booking.method === id).reduce((sum, { booking }) => sum + booking.amountPaid, 0)
  const balance = list.reduce((sum, { booking }) => (booking.status === 'cancelled' || booking.status === 'expired' ? sum : sum + Math.max(0, booking.total - booking.amountPaid)), 0)

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const exportCsv = () =>
    downloadCsv('lantaw-payments.csv', [
      ['Date', 'Reference', 'Guest', 'Method', 'Paid (PHP)', 'Booking total (PHP)', 'Status'],
      ...list.map(({ booking, day }) => [day, booking.reference, booking.guestName, METHOD_LABEL[booking.method], booking.amountPaid / 100, booking.total / 100, booking.status])
    ])

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every payment received, with the balance still to collect."
        actions={<button type="button" className="btn btn-soft btn-sm h-9 min-h-0 px-4" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <div className="mt-5">
        <StatGrid
          stats={[
            { label: 'Received', value: peso(total), note: `${list.length} ${list.length === 1 ? 'payment' : 'payments'}` },
            { label: 'GCash', value: peso(byMethod('gcash_manual')) },
            { label: 'Card', value: peso(byMethod('paymongo')) },
            { label: 'Still to collect', value: peso(balance), note: 'Balance on arrival' }
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div role="tablist" aria-label="Filter by payment method" className="flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-white/70 bg-white/35 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md">
          {METHODS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={method === item.id}
              onClick={() => { setMethod(item.id); setPage(1) }}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${method === item.id ? 'bg-primary-tint text-primary-deep shadow-[inset_0_0_0_1px_rgb(31_77_56/0.25)]' : 'text-muted hover:text-ink'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <DateFilter filter={dates} years={years} onChange={value => { setDates(value); setPage(1) }} />
      </div>

      <div className="glass glass-data mt-4 overflow-hidden">
        <div aria-hidden className={`hidden items-center gap-x-5 border-b border-ink/10 px-5 py-2.5 text-xs font-semibold text-muted lg:grid ${GRID}`}>
          <span>Date</span>
          <span>Guest</span>
          <span>Booking</span>
          <span>Method</span>
          <span className="text-right">Paid</span>
          <span>Status</span>
        </div>
        {visible.length ? (
          <ul key={`${method}-${dates.mode}-${dates.value}-${current}`} className="divide-y divide-ink/10">
            {visible.map(({ booking, day }, index) => (
              <li key={booking.reference} style={{ '--i': index } as React.CSSProperties} className={`row-in grid gap-x-5 gap-y-1 px-4 py-3.5 sm:px-5 lg:items-center ${GRID}`}>
                <span className="text-sm tabular-nums text-muted">{formatShort(day)}</span>
                <span className="min-w-0 truncate text-sm font-semibold">{booking.guestName}</span>
                <span className="min-w-0 truncate text-xs tabular-nums text-muted">{booking.reference} · {db.rooms.find(room => room.id === booking.roomId)?.name ?? 'Removed room'}</span>
                <span className="text-sm">{METHOD_LABEL[booking.method]}</span>
                <span className="text-sm font-bold tabular-nums lg:text-right">{peso(booking.amountPaid)}</span>
                <span><StatusChip status={booking.status} /></span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No payments match" description="Try another method or date, or clear the date filter." className="p-12" />
        )}
      </div>
      <Pagination page={current} pageSize={PAGE_SIZE} total={list.length} onChange={value => { setPage(value); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
