import { useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronLeft, ChevronRight, Download, TrendingDown, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { compactPeso, peso } from '../../lib/money'
import { addMonths, formatMonth, monthStart, today } from '../../lib/dates'
import { downloadCsv, monthlyBookingCount, occupancyForMonth, occupiedDays, revenueSeries } from '../../lib/reports'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { useDb } from '../../store/db'

const RANGES = [3, 6, 12]
const MONTH_LIMITS = { back: 11, forward: 2 }
const COLORS = { primary: 'var(--color-primary)', primaryDeep: 'var(--color-primary-deep)', tint: 'var(--color-primary-tint)', accent: 'var(--color-accent)', line: 'var(--color-line)', muted: 'var(--color-muted)', surface: 'var(--color-surface)' }
const AXIS_TICK = { fill: COLORS.muted, fontSize: 12 }

const segmented = 'inline-flex rounded-full bg-primary-tint p-1'
const segment = (active: boolean) =>
  `h-8 rounded-full px-3.5 text-xs font-bold transition-[background-color,color,box-shadow] duration-200 ${active ? 'bg-surface text-primary-deep shadow-soft' : 'text-muted hover:text-primary-deep'}`

const rise = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } } }
const stagger = { hidden: {}, shown: { transition: { staggerChildren: 0.12 } } }
const nightsStrip = { hidden: {}, shown: { transition: { staggerChildren: 0.018 } } }
const nightCell = { hidden: { opacity: 0, scale: 0.6 }, shown: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } } }

type TipProps = { active?: boolean; payload?: { payload: Record<string, unknown> }[]; render: (row: Record<string, unknown>) => { title: string; value: string; note?: string } }

function ChartTip({ active, payload, render }: TipProps) {
  if (!active || !payload?.length) return null
  const { title, value, note } = render(payload[0].payload)
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 shadow-lift">
      <p className="text-lg font-extrabold tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-muted">{title}</p>
      {note ? <p className="mt-0.5 text-xs text-muted">{note}</p> : null}
    </div>
  )
}

export function Reports() {
  const db = useDb()
  const current = monthStart(today())
  const [range, setRange] = useState(6)
  const [pinned, setPinned] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [month, setMonth] = useState(current)
  const [roomId, setRoomId] = useState<string | null>(null)
  const animate = !useReducedMotion()

  const series = revenueSeries(db, range).map(point => ({ ...point, bookings: monthlyBookingCount(db, point.key) }))
  const total = series.reduce((sum, s) => sum + s.value, 0)
  const average = total / series.length
  const activeKey = hovered ?? pinned ?? series[series.length - 1].key
  const activeIndex = Math.max(0, series.findIndex(s => s.key === activeKey))
  const active = series[activeIndex]
  const previous = activeIndex > 0 ? series[activeIndex - 1] : null
  const change = previous && previous.value > 0 ? Math.round(((active.value - previous.value) / previous.value) * 100) : null
  const share = total ? Math.round((active.value / total) * 100) : 0
  const bestKey = series.reduce((best, s) => (s.value > best.value ? s : best), series[0]).key

  const occupancy = occupancyForMonth(db, month)
  const roomRows = db.rooms.map(room => ({ id: room.id, name: room.name, percent: occupancy.roomPercent(room.id), nights: occupancy.perRoom[room.id] }))
  const perRoomDays = db.rooms.map(room => occupiedDays(db, room.id, month))
  const daily = Array.from({ length: occupancy.days }, (_, i) => ({ day: i + 1, rooms: perRoomDays.filter(days => days[i]).length }))
  const chosenRoom = db.rooms.find(room => room.id === roomId) ?? null
  const chosenDays = chosenRoom ? perRoomDays[db.rooms.indexOf(chosenRoom)] : []
  const chosenNights = chosenDays.filter(Boolean).length
  const canGoBack = month > addMonths(current, -MONTH_LIMITS.back)
  const canGoForward = month < addMonths(current, MONTH_LIMITS.forward)
  const todayDay = month === current ? Number(today().slice(8, 10)) : 0
  const monthName = formatMonth(month).split(' ')[0]

  const exportCsv = () => {
    downloadCsv('lantaw-report.csv', [
      ['Money received by month', 'Amount (PHP)'],
      ...series.map(s => [formatMonth(s.key), s.value / 100]),
      [],
      [`Occupancy, ${formatMonth(month)}`, 'Percent'],
      ...db.rooms.map(room => [room.name, occupancy.roomPercent(room.id)])
    ])
  }

  return (
    <MotionConfig reducedMotion="user">
    <div>
      <PageHeader
        title="Reports"
        description="Money received and how full the rooms are."
        actions={<button type="button" className="btn btn-soft btn-sm h-9 min-h-0 px-4" onClick={exportCsv}><Download size={14} />Export CSV</button>}
      />

      <motion.div className="mt-8 space-y-6" variants={stagger} initial="hidden" animate="shown">
        <motion.section variants={rise} className="glass glass-data p-5 sm:p-7" aria-labelledby="rev-h">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="rev-h" className="text-lg font-bold">Money received</h2>
              <p className="mt-1 text-sm text-muted">Grouped by check-in month. Hover or tap a bar for details.</p>
            </div>
            <ToggleGroup.Root
              type="single"
              className={segmented}
              aria-label="Time range"
              value={String(range)}
              onValueChange={value => { if (value) { setRange(Number(value)); setPinned(null); setHovered(null) } }}
            >
              {RANGES.map(value => (
                <ToggleGroup.Item key={value} value={String(value)} className={segment(range === value)}>
                  {value} months
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <p className="mt-6 text-sm text-muted">Total over {range} months</p>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight"><AnimatedNumber value={total} format={peso} /></p>

          <div className="mt-4 h-72" role="img" aria-label={`Bar chart of money received per month. ${series.map(s => `${formatMonth(s.key)} ${peso(s.value)}`).join(', ')}.`}>
            <ResponsiveContainer width="100%" height="100%" key={range}>
              <BarChart
                data={series}
                margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
                barCategoryGap="22%"
                accessibilityLayer={false}
                onMouseMove={state => {
                  const index = Number(state?.activeTooltipIndex)
                  setHovered(Number.isInteger(index) && series[index] ? series[index].key : null)
                }}
                onMouseLeave={() => setHovered(null)}
              >
                <CartesianGrid vertical={false} stroke={COLORS.line} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
                <YAxis width={52} tickLine={false} axisLine={false} tick={AXIS_TICK} tickCount={5} tickFormatter={value => compactPeso(value)} />
                <Tooltip
                  cursor={{ fill: COLORS.tint, opacity: 0.7, radius: 8 }}
                  content={<ChartTip render={row => ({ title: formatMonth(String(row.key)), value: peso(Number(row.value)), note: `${row.bookings} bookings` })} />}
                />
                <ReferenceLine y={average} stroke={COLORS.primary} strokeOpacity={0.55} strokeDasharray="5 4" label={{ value: `Average ${compactPeso(Math.round(average / 100000) * 100000)}`, position: 'insideTopLeft', fill: COLORS.primaryDeep, fontSize: 12, fontWeight: 700, dy: -16 }} />
                <Bar
                  dataKey="value"
                  maxBarSize={44}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={animate}
                  animationDuration={900}
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(_, index) => setPinned(pinned === series[index].key ? null : series[index].key)}
                >
                  {series.map(point => (
                    <Cell
                      key={point.key}
                      fill={point.key === current ? COLORS.accent : COLORS.primary}
                      fillOpacity={hovered || pinned ? (point.key === active.key ? 1 : 0.45) : 1}
                      style={{ transition: 'fill-opacity 200ms ease-out' }}
                    />
                  ))}
                  {range <= 6 ? <LabelList dataKey="value" position="top" offset={8} formatter={(value: unknown) => (Number(value) ? compactPeso(Number(value)) : '0')} style={{ fill: 'var(--color-ink)', fontSize: 12, fontWeight: 700 }} /> : null}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>Money received per month</caption>
            <thead><tr><th>Month</th><th>Received</th><th>Bookings</th></tr></thead>
            <tbody>{series.map(s => <tr key={s.key}><td>{formatMonth(s.key)}</td><td>{peso(s.value)}</td><td>{s.bookings}</td></tr>)}</tbody>
          </table>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-5 sm:grid-cols-4" aria-live="polite">
            <div>
              <dt className="text-xs text-muted">Month</dt>
              <dd className="mt-1 text-lg font-bold">{formatMonth(active.key)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Received</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{peso(active.value)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Bookings</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{active.bookings}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Against last month</dt>
              <dd className={`mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums ${change !== null && change < 0 ? 'text-danger' : 'text-primary-deep'}`}>
                {change === null ? <span className="text-muted">No earlier month</span> : (
                  <>
                    {change < 0 ? <TrendingDown size={18} aria-hidden /> : <TrendingUp size={18} aria-hidden />}
                    {change > 0 ? '+' : ''}{change}%
                  </>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            {share}% of the total{active.key === bestKey ? ', your best month in this range' : ''}.
          </p>
        </motion.section>

        <motion.section variants={rise} className="glass glass-data p-5 sm:p-7" aria-labelledby="occ-h">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="occ-h" className="text-lg font-bold">Occupancy</h2>
              <p className="mt-1 text-sm text-muted">Confirmed nights only. Pick a room to see its nights.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-soft h-9 min-h-0 w-9 p-0 disabled:opacity-40" aria-label="Previous month" disabled={!canGoBack} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={16} /></button>
              <span className="min-w-36 text-center text-sm font-bold" aria-live="polite">{formatMonth(month)}</span>
              <button type="button" className="btn btn-soft h-9 min-h-0 w-9 p-0 disabled:opacity-40" aria-label="Next month" disabled={!canGoForward} onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={16} /></button>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted">All rooms together</p>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight"><AnimatedNumber value={occupancy.percent} duration={0.7} format={value => `${value}%`} /></p>
          <p className="text-sm text-muted">of all room nights in {formatMonth(month)}</p>

          <h3 className="mt-6 text-base font-bold">By room</h3>
          <div style={{ height: roomRows.length * 52 + 8 }} role="img" aria-label={`Occupancy by room: ${roomRows.map(r => `${r.name} ${r.percent}%`).join(', ')}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomRows} layout="vertical" margin={{ top: 4, right: 0, bottom: 4, left: 0 }} barCategoryGap="30%" accessibilityLayer={false}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={112} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-ink)', fontSize: 13, fontWeight: 700 }} />
                <YAxis
                  yAxisId="values"
                  orientation="right"
                  type="category"
                  dataKey="name"
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) => (
                    <text x={Number(x) + 8} y={Number(y)} dy={4} fill="var(--color-ink)" fontSize={13} fontWeight={700}>{roomRows[index ?? 0].percent}%</text>
                  )}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTip render={row => ({ title: String(row.name), value: `${row.percent}%`, note: `${row.nights} of ${occupancy.days} nights booked` })} />}
                />
                <Bar
                  dataKey="percent"
                  barSize={16}
                  radius={[0, 6, 6, 0]}
                  background={{ fill: COLORS.tint, radius: 6 }}
                  isAnimationActive={animate}
                  animationDuration={800}
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(_, index) => setRoomId(roomId === roomRows[index].id ? null : roomRows[index].id)}
                >
                  {roomRows.map(row => (
                    <Cell key={row.id} fill={row.id === roomId ? COLORS.primaryDeep : COLORS.primary} fillOpacity={roomId && row.id !== roomId ? 0.5 : 1} style={{ transition: 'fill-opacity 200ms ease-out' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ToggleGroup.Root
            type="single"
            className="mt-2 flex flex-wrap items-center gap-2"
            aria-label="Show nights for a room"
            value={roomId ?? ''}
            onValueChange={value => setRoomId(value || null)}
          >
            {db.rooms.map(room => (
              <ToggleGroup.Item key={room.id} value={room.id} className={`btn btn-sm h-8 min-h-0 px-3 text-xs ${room.id === roomId ? 'btn-primary' : 'btn-soft'}`}>
                {room.name}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>

          <AnimatePresence mode="wait" initial={false}>
          {chosenRoom ? (
            <motion.div
              key={`${chosenRoom.id}-${month}`}
              className="mt-5 overflow-hidden border-t border-line pt-5"
              aria-live="polite"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-sm">
                <b>{chosenRoom.name}</b> has <b className="tabular-nums">{chosenNights}</b> of <span className="tabular-nums">{occupancy.days}</span> nights booked in {formatMonth(month)}, <span className="tabular-nums">{occupancy.days - chosenNights}</span> still free.
              </p>
              <motion.ol variants={nightsStrip} initial="hidden" animate="shown" className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1.5" aria-label={`Nights for ${chosenRoom.name}`}>
                {chosenDays.map((booked, i) => (
                  <motion.li
                    key={i}
                    variants={nightCell}
                    className={`grid h-8 place-items-center rounded-control text-xs font-bold tabular-nums ${booked ? 'bg-primary text-white' : 'bg-primary-tint text-primary-deep'} ${i + 1 === todayDay ? 'ring-2 ring-accent ring-offset-1' : ''}`}
                    aria-label={`${monthName} ${i + 1}: ${booked ? 'booked' : 'free'}`}
                  >
                    {i + 1}
                  </motion.li>
                ))}
              </motion.ol>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-primary" />Booked</span>
                <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm bg-primary-tint" />Free</span>
                {todayDay > 0 ? <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-sm ring-2 ring-accent" />Today</span> : null}
              </p>
            </motion.div>
          ) : null}
          </AnimatePresence>

          <h3 className="mt-8 text-base font-bold">Rooms taken each night</h3>
          <p className="mt-1 text-sm text-muted">Out of {db.rooms.length} rooms. Hover to read a night.</p>
          <div className="mt-3 h-52" role="img" aria-label={`Rooms taken each night in ${formatMonth(month)}, out of ${db.rooms.length}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
                <CartesianGrid vertical={false} stroke={COLORS.line} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} interval="preserveStartEnd" minTickGap={18} />
                <YAxis width={28} tickLine={false} axisLine={false} tick={AXIS_TICK} domain={[0, db.rooms.length]} allowDecimals={false} tickCount={db.rooms.length + 1} />
                <Tooltip
                  cursor={{ stroke: COLORS.muted, strokeWidth: 1 }}
                  content={<ChartTip render={row => ({ title: `${monthName} ${row.day}`, value: `${row.rooms} of ${db.rooms.length} rooms` })} />}
                />
                <Area
                  key={month}
                  type="stepAfter"
                  dataKey="rooms"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  fill={COLORS.primary}
                  fillOpacity={0.12}
                  activeDot={{ r: 5, fill: COLORS.primary, stroke: COLORS.surface, strokeWidth: 2 }}
                  isAnimationActive={animate}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                {todayDay > 0 ? <ReferenceLine x={todayDay} stroke={COLORS.accent} strokeWidth={2} label={{ value: 'Today', position: 'insideTopRight', fill: 'var(--color-accent-deep)', fontSize: 12, fontWeight: 700 }} /> : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </motion.div>
    </div>
    </MotionConfig>
  )
}
