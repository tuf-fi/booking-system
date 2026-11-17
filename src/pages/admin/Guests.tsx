import { useMemo, useState } from 'react'
import { ChevronRight, Download, Search } from 'lucide-react'
import type { Booking } from '../../types'
import { Dialog } from '../../components/Dialog'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { StatusChip } from '../../components/StatusChip'
import { formatShort } from '../../lib/dates'
import { plural } from '../../lib/format'
import { peso } from '../../lib/money'
import { downloadCsv } from '../../lib/reports'
import { useDb } from '../../store/db'

const PAGE_SIZE = 10
const GRID = 'lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_5rem_6rem_7rem_1.5rem]'

interface Guest {
  key: string
  name: string
  mobile: string
  email: string
  stays: number
  nights: number
  spent: number
  lastStay: string
  bookings: Booking[]
}

const keyFor = (booking: Booking) => (booking.guestMobile || booking.guestEmail || booking.guestName).replace(/\s+/g, '').toLowerCase()

export function Guests() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const guests = useMemo(() => {
    const map = new Map<string, Guest>()
    for (const booking of [...db.bookings].sort((a, b) => b.createdAt - a.createdAt)) {
      const key = keyFor(booking)
      const real = booking.status !== 'cancelled' && booking.status !== 'expired'
      const current = map.get(key) ?? { key, name: booking.guestName, mobile: booking.guestMobile, email: booking.guestEmail, stays: 0, nights: 0, spent: 0, lastStay: '', bookings: [] }
      current.bookings.push(booking)
      if (real) {
        current.stays += 1
        current.nights += booking.nights
        current.spent += booking.amountPaid
        if (booking.checkIn > current.lastStay) current.lastStay = booking.checkIn
      }
      map.set(key, current)
    }
    return [...map.values()].sort((a, b) => (b.lastStay || '').localeCompare(a.lastStay || '') || a.name.localeCompare(b.name))
  }, [db.bookings])

  const list = useMemo(() => {
    const text = query.trim().toLowerCase()
    return text ? guests.filter(guest => `${guest.name} ${guest.mobile} ${guest.email}`.toLowerCase().includes(text)) : guests
  }, [guests, query])

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const open = guests.find(guest => guest.key === openKey)
  const roomName = (id: string) => db.rooms.find(room => room.id === id)?.name ?? 'Removed room'

  const exportCsv = () =>
    downloadCsv('lantaw-guests.csv', [
      ['Guest', 'Mobile', 'Email', 'Stays', 'Nights', 'Paid (PHP)', 'Last stay'],
      ...list.map(guest => [guest.name, guest.mobile, guest.email, guest.stays, guest.nights, guest.spent / 100, guest.lastStay])
    ])

  return (
    <div>
      <PageHeader
        title="Guests"
        description="Everyone who has booked with you, and what they have spent."
        actions={<button type="button" className="btn btn-soft btn-sm h-9 min-h-0 px-4" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <div className="mt-5">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search guests</span>
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" />
          <input className="field field-compact h-9 min-h-0 rounded-full border-white/70 bg-white/35 pl-10 pr-4 text-sm font-medium shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_2px_rgb(22_35_29/0.06)] backdrop-blur-md placeholder:font-normal placeholder:text-muted focus:border-primary focus:bg-white/55" placeholder="Search guests" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} />
        </label>
      </div>

      <div className="glass glass-data mt-4 overflow-hidden">
        <div aria-hidden className={`hidden items-center gap-x-5 border-b border-ink/10 px-5 py-2.5 text-xs font-semibold text-muted lg:grid ${GRID}`}>
          <span>Guest</span>
          <span>Contact</span>
          <span>Stays</span>
          <span>Nights</span>
          <span className="text-right">Paid</span>
          <span />
        </div>
        {visible.length ? (
          <ul key={`${current}-${query}`} className="divide-y divide-ink/10">
            {visible.map((guest, index) => (
              <li key={guest.key} style={{ '--i': index } as React.CSSProperties} className="row-in">
                <button type="button" onClick={() => setOpenKey(guest.key)} className={`grid w-full cursor-pointer gap-x-5 gap-y-1 px-4 py-3.5 text-left transition-colors hover:bg-white/50 focus-visible:bg-white/50 focus-visible:outline-none sm:px-5 lg:items-center ${GRID}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{guest.name}</span>
                    <span className="block truncate text-xs text-muted">{guest.lastStay ? `Last stay ${formatShort(guest.lastStay)}` : 'No completed stays yet'}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm tabular-nums">{guest.mobile || 'No mobile'}</span>
                    <span className="block truncate text-xs text-muted">{guest.email || 'No email'}</span>
                  </span>
                  <span className="text-sm tabular-nums"><span className="text-xs text-muted lg:hidden">Stays </span>{guest.stays}</span>
                  <span className="text-sm tabular-nums"><span className="text-xs text-muted lg:hidden">Nights </span>{guest.nights}</span>
                  <span className="text-sm font-bold tabular-nums lg:text-right">{peso(guest.spent)}</span>
                  <ChevronRight size={16} aria-hidden className="hidden text-muted lg:block" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={query ? 'No guests match that search' : 'No guests yet'} description={query ? 'Try a name, mobile number or email.' : 'Guests appear here after their first booking.'} className="p-12" />
        )}
      </div>
      <Pagination page={current} pageSize={PAGE_SIZE} total={list.length} onChange={value => { setPage(value); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />

      <Dialog open={Boolean(open)} onClose={() => setOpenKey(null)} title={open?.name ?? 'Guest'} size="md">
        {open && (
          <div>
            <dl className="grid grid-cols-3 gap-4 rounded-card bg-ink/[0.045] p-4">
              <div><dt className="text-xs text-muted">Stays</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{open.stays}</dd></div>
              <div><dt className="text-xs text-muted">Nights</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{open.nights}</dd></div>
              <div><dt className="text-xs text-muted">Paid</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{peso(open.spent)}</dd></div>
              <div className="col-span-3 grid grid-cols-2 gap-4">
                <div><dt className="text-xs text-muted">Mobile</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{open.mobile || 'None'}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-muted">Email</dt><dd className="mt-0.5 truncate text-sm font-semibold">{open.email || 'None'}</dd></div>
              </div>
            </dl>
            <h3 className="mb-2 mt-5 text-sm font-bold">{plural(open.bookings.length, 'booking')}</h3>
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-card bg-ink/[0.045]">
              {open.bookings.map(booking => (
                <li key={booking.reference} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{roomName(booking.roomId)}</span>
                    <span className="block truncate text-xs tabular-nums text-muted">{formatShort(booking.checkIn)} to {formatShort(booking.checkOut)} · {booking.reference}</span>
                  </span>
                  <StatusChip status={booking.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog>
    </div>
  )
}
