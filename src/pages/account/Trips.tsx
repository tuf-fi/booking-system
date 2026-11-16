import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { Pagination } from '../../components/Pagination'
import { Photo } from '../../components/Photo'
import { statusLabel } from '../../components/StatusChip'
import { useToast } from '../../components/Toast'
import { addDays, formatDay, formatLong } from '../../lib/dates'
import { plural } from '../../lib/format'
import { peso } from '../../lib/money'
import type { Booking, BookingStatus } from '../../types'
import { useAccount } from '../../store/accounts'
import { BookingError, guestCancel, isWithinFreeCancellation } from '../../store/api'
import { useDb } from '../../store/db'

type Tab = 'upcoming' | 'past' | 'cancelled'

const GROUPS: Record<Tab, BookingStatus[]> = {
  upcoming: ['pending_payment', 'pending_approval', 'confirmed', 'checked_in'],
  past: ['completed'],
  cancelled: ['cancelled', 'expired']
}

const DOTS: Record<BookingStatus, string> = {
  pending_payment: 'bg-sky-ink',
  pending_approval: 'bg-sun',
  confirmed: 'bg-leaf',
  checked_in: 'bg-sky-ink',
  completed: 'bg-muted',
  cancelled: 'bg-danger',
  expired: 'bg-muted'
}

const PAGE_SIZE = 10

const TABS: Tab[] = ['upcoming', 'past', 'cancelled']

const LABELS: Record<Tab, string> = { upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled' }

const EMPTY: Record<Tab, string> = {
  upcoming: 'You have no upcoming trips. Pick your dates and we will hold the room.',
  past: 'Your completed stays will show up here.',
  cancelled: 'No cancelled bookings.'
}

const CANCELLABLE: BookingStatus[] = ['pending_approval', 'pending_payment', 'confirmed']

export function Trips() {
  const account = useAccount()!
  const db = useDb()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLElement>(null)
  const [cancelling, setCancelling] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)

  const mine = db.bookings.filter(booking => booking.userId === account.id)
  const inTab = (key: Tab) => mine.filter(booking => GROUPS[key].includes(booking.status))
  const shown = inTab(tab).sort((a, b) => (tab === 'upcoming' ? a.checkIn.localeCompare(b.checkIn) : b.checkIn.localeCompare(a.checkIn)))
  const lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const visible = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const refundable = cancelling ? isWithinFreeCancellation(cancelling, db.settings) : false

  const confirmCancel = async () => {
    if (!cancelling) return
    setBusy(true)
    try {
      await guestCancel(cancelling.reference)
      toast('Your booking was cancelled.')
    } catch (failure) {
      toast(failure instanceof BookingError ? failure.message : 'Could not cancel. Please text us.', 'error')
    } finally {
      setBusy(false)
      setCancelling(null)
    }
  }

  return (
    <section ref={topRef} aria-labelledby="trips-h">
      <h2 id="trips-h" className="sr-only">Your trips</h2>

      <div role="tablist" aria-label="Trips" className="relative grid w-full max-w-md grid-cols-3 bg-sand/80 p-1">
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] bg-surface shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(${TABS.indexOf(tab) * 100}%)` }}
        />
        {TABS.map(key => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key)
              setPage(1)
            }}
            className={`relative inline-flex min-h-10 items-center justify-center gap-1.5 text-[0.8125rem] font-bold transition-colors duration-300 ${tab === key ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            {LABELS[key]}
            <span className={`text-xs tabular-nums ${tab === key ? 'text-leaf' : 'text-muted/80'}`}>{inTab(key).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 grid overflow-hidden border border-line bg-surface sm:grid-cols-[minmax(0,16rem)_1fr]">
          <Photo name="mayon-dusk" sizes="256px" className="h-40 w-full object-cover sm:h-full" />
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold">Nothing here yet</h3>
            <p className="mt-2 max-w-md text-[0.9375rem] leading-[1.7] text-muted">{EMPTY[tab]}</p>
            <Link to="/book" className="btn btn-primary mt-5 rounded-none">Find a room</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map(booking => {
            const room = db.rooms.find(r => r.id === booking.roomId)
            if (!room) return null
            return (
              <li key={booking.reference} className="grid overflow-hidden border border-line bg-surface transition-shadow duration-300 hover:shadow-soft sm:grid-cols-[14rem_1fr]">
                <div className="group relative h-40 overflow-hidden sm:h-full">
                  <Photo name={room.photo} sizes="224px" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                  <span className="glass absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-ink">
                    <span aria-hidden className={`size-2 rounded-full ${DOTS[booking.status]}`} />
                    {statusLabel(booking.status)}
                  </span>
                </div>
                <div className="flex flex-col p-5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold leading-tight">{room.name}</h3>
                    <p className="mt-0.5 text-xs text-muted">Ref {booking.reference}</p>
                  </div>

                  <div className="mt-4">
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.875rem] font-bold">
                      <CalendarDays size={15} className="text-leaf" aria-hidden />
                      {formatDay(booking.checkIn)}
                      <ArrowRight size={13} className="text-muted" aria-hidden />
                      {formatDay(booking.checkOut)}
                    </p>
                    <p className="mt-1.5 text-[0.8125rem] text-muted">{plural(booking.nights, 'night')} · {plural(booking.guests, 'guest')}</p>
                  </div>

                  <div className="min-h-6 flex-1" />

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-5">
                    <p className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold leading-none tabular-nums">{peso(booking.total)}</span>
                      <span className="text-xs text-muted">{peso(booking.amountPaid)} paid</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CANCELLABLE.includes(booking.status) && (
                        <button type="button" onClick={() => setCancelling(booking)} className="btn btn-ghost btn-sm rounded-none text-danger">Cancel</button>
                      )}
                      {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'expired') && (
                        <Link to={`/book?room=${room.id}`} className="btn btn-ghost btn-sm rounded-none">Book again</Link>
                      )}
                      <Link to={`/booking/${booking.reference}`} className="btn btn-dark btn-sm rounded-none">View booking</Link>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={shown.length}
        onChange={next => {
          setPage(next)
          topRef.current?.scrollIntoView({ block: 'start' })
        }}
      />

      <Dialog open={cancelling !== null} onClose={() => setCancelling(null)} title="Cancel this booking?">
        <p className="text-muted">
          {refundable
            ? `You can cancel for free until ${cancelling ? formatLong(addDays(cancelling.checkIn, -db.settings.cancellationDays)) : ''}. Your down payment will be refunded in full.`
            : 'Your down payment will not be refunded.'}{' '}
          Your dates open up for other guests right away.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setCancelling(null)}>Keep booking</button>
          <button type="button" className="btn btn-danger" onClick={confirmCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel booking'}</button>
        </div>
      </Dialog>
    </section>
  )
}
