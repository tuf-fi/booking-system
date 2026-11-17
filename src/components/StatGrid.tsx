export type Stat = { label: string; value: string; note?: string }

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="glass glass-data overflow-hidden">
      <dl className="-mb-px -mr-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, note }) => (
          <div key={label} className="border-b border-r border-ink/10 px-4 py-3.5 sm:px-5">
            <dd className="font-display text-lg font-extrabold leading-tight tabular-nums">{value}</dd>
            <dt className="mt-0.5 text-xs font-semibold">{label}</dt>
            {note && <dd className="mt-0.5 text-xs leading-snug text-muted">{note}</dd>}
          </div>
        ))}
      </dl>
    </div>
  )
}
