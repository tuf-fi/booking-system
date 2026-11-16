import type { Booking, Settings } from '../../types'
import { formatDay } from '../../lib/dates'
import { peso } from '../../lib/money'

const traceNumber = (reference: string) => {
  let hash = 0
  for (const char of reference) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000_007
  const digits = String(hash).padStart(10, '0')
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

export function PaymentProof({ booking, settings }: { booking: Booking; settings: Settings }) {
  if (booking.proof) {
    return <img src={booking.proof} alt="Payment screenshot uploaded by the guest" className="mx-auto max-h-[28rem] w-auto rounded-2xl border border-line" />
  }
  return (
    <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-line">
      <div className="bg-[#0a5dd6] px-5 py-4 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-white/75">GCash · Express Send</p>
        <p className="mt-1 font-display text-3xl font-bold">{peso(booking.downPayment)}</p>
      </div>
      <dl className="space-y-3 bg-surface px-5 py-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted">Sent to</dt><dd className="text-right font-semibold">{settings.gcashName}<br />{settings.gcashNumber}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted">Sent by</dt><dd className="text-right font-semibold">{booking.guestName}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted">Date</dt><dd className="font-semibold">{formatDay(booking.createdAt ? new Date(booking.createdAt).toISOString().slice(0, 10) : booking.checkIn)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted">Ref no.</dt><dd className="font-semibold tabular-nums">{traceNumber(booking.reference)}</dd></div>
      </dl>
      <p className="bg-sand px-5 py-2 text-center text-xs text-muted">Sample data for the demo</p>
    </div>
  )
}
