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
    return <img src={booking.proof} alt="Payment screenshot uploaded by the guest" className="mx-auto max-h-[28rem] w-auto rounded-card border border-line" />
  }
  const sentOn = formatDay(booking.createdAt ? new Date(booking.createdAt).toISOString().slice(0, 10) : booking.checkIn)
  return (
    <div className="overflow-hidden rounded-card border border-ink/10 bg-white/50">
      <div className="flex items-end justify-between gap-4 bg-[#0a5dd6] px-5 py-4 text-white">
        <div>
          <p className="text-xs font-semibold text-white/80">GCash Express Send</p>
          <p className="mt-1 font-display text-3xl font-extrabold leading-none tabular-nums">{peso(booking.downPayment)}</p>
        </div>
        <p className="pb-0.5 text-xs font-semibold text-white/80">Sent {sentOn}</p>
      </div>
      <dl className="divide-y divide-ink/10 text-sm">
        <div className="flex items-start justify-between gap-4 px-5 py-3"><dt className="text-muted">Sent to</dt><dd className="text-right font-semibold">{settings.gcashName}<span className="block font-normal tabular-nums text-muted">{settings.gcashNumber}</span></dd></div>
        <div className="flex items-center justify-between gap-4 px-5 py-3"><dt className="text-muted">Sent by</dt><dd className="text-right font-semibold">{booking.guestName}</dd></div>
        <div className="flex items-center justify-between gap-4 px-5 py-3"><dt className="text-muted">Reference no.</dt><dd className="font-semibold tabular-nums">{traceNumber(booking.reference)}</dd></div>
      </dl>
      <p className="border-t border-ink/10 bg-ink/[0.04] px-5 py-2 text-center text-xs text-muted">Sample data for the demo</p>
    </div>
  )
}
