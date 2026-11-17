import { peso } from '../lib/money'

export interface PriceLine {
  label: string
  amount: number
  tone?: 'default' | 'total' | 'due' | 'muted'
}

const TONES = {
  default: 'text-sm',
  total: 'mt-3 border-t border-line pt-4 text-lg font-extrabold',
  due: 'text-sm font-bold text-primary-deep',
  muted: 'text-sm text-muted'
}

export function PriceLines({ lines }: { lines: PriceLine[] }) {
  return (
    <ul className="space-y-2">
      {lines.map(line => (
        <li key={line.label} className={`flex justify-between gap-4 ${TONES[line.tone ?? 'default']}`}>
          <span>{line.label}</span>
          <span className="tabular-nums">{peso(line.amount)}</span>
        </li>
      ))}
    </ul>
  )
}
