export type Stat = { label: string; value: string; note?: string }

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="card grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-surface p-5">
          <dt className="text-sm font-semibold text-muted">{stat.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{stat.value}</dd>
          {stat.note && <dd className="mt-0.5 text-sm text-muted">{stat.note}</dd>}
        </div>
      ))}
    </dl>
  )
}
