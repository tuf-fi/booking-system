import { formatDay } from '../lib/dates'

type Props = {
  checkIn: string
  checkOut: string
  checkInTime: string
  checkOutTime: string
  className?: string
  compact?: boolean
}

export function StayDates({ checkIn, checkOut, checkInTime, checkOutTime, className = '', compact = false }: Props) {
  const pad = compact ? 'p-3' : 'p-4'
  const day = compact ? 'text-sm' : 'text-base'
  return (
    <div className={`grid grid-cols-2 rounded-card border border-line bg-surface ${className}`}>
      <div className={pad}>
        <small className="block text-xs font-bold uppercase tracking-wide text-muted">Check-in</small>
        <b className={day}>{formatDay(checkIn)}</b>
        <small className="block text-sm text-muted">from {checkInTime}</small>
      </div>
      <div className={`border-l border-line ${pad}`}>
        <small className="block text-xs font-bold uppercase tracking-wide text-muted">Check-out</small>
        <b className={day}>{formatDay(checkOut)}</b>
        <small className="block text-sm text-muted">until {checkOutTime}</small>
      </div>
    </div>
  )
}
