import { peso } from '../lib/money'

export interface PriceLine {
  label: string
  amount: number
  tone?: 'default' | 'total' | 'due' | 'muted'
}

const TONES = {
  default: 'text-[0.8125rem]',
  total: 'mt-2 border-t border-line pt-3 text-base font-bold',
  due: 'text-[0.8125rem] font-bold text-leaf',
  muted: 'text-[0.8125rem] text-muted'
}

export function PriceLines({ lines }: { lines: PriceLine[] }) {
  return (
    <ul className="space-y-1.5">
      {lines.map(line => (
        <li key={line.label} className={`flex justify-between gap-4 ${TONES[line.tone ?? 'default']}`}>
          <span>{line.label}</span>
          <span className="tabular-nums">{peso(line.amount)}</span>
        </li>
      ))}
    </ul>
  )
}
