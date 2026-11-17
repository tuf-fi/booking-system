import type { BookingStatus } from '../types'

const STYLES: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Awaiting payment', className: 'bg-tertiary-tint text-tertiary-deep' },
  pending_approval: { label: 'Waiting for approval', className: 'bg-accent-tint text-accent-deep' },
  confirmed: { label: 'Confirmed', className: 'bg-primary-tint text-primary-deep' },
  checked_in: { label: 'Staying now', className: 'bg-tertiary-tint text-tertiary-deep' },
  completed: { label: 'Completed', className: 'bg-sand text-muted' },
  cancelled: { label: 'Cancelled', className: 'bg-danger-tint text-danger' },
  expired: { label: 'Expired', className: 'bg-sand text-muted' }
}

export const statusLabel = (status: BookingStatus) => STYLES[status].label

export function StatusChip({ status }: { status: BookingStatus }) {
  const { label, className } = STYLES[status]
  return <span className={`chip ${className}`}>{label}</span>
}
