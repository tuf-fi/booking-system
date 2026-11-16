const MANILA = 'Asia/Manila'

const manilaParts = new Intl.DateTimeFormat('en-CA', { timeZone: MANILA, year: 'numeric', month: '2-digit', day: '2-digit' })

export type DateKey = string

export const today = (): DateKey => manilaParts.format(new Date())

export const parseKey = (key: DateKey): Date => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export const toKey = (date: Date): DateKey => date.toISOString().slice(0, 10)

export const addDays = (key: DateKey, days: number): DateKey => {
  const date = parseKey(key)
  date.setUTCDate(date.getUTCDate() + days)
  return toKey(date)
}

export const nightsBetween = (checkIn: DateKey, checkOut: DateKey) =>
  Math.round((parseKey(checkOut).getTime() - parseKey(checkIn).getTime()) / 86_400_000)

export const eachNight = (checkIn: DateKey, checkOut: DateKey): DateKey[] => {
  const nights: DateKey[] = []
  for (let key = checkIn; key < checkOut; key = addDays(key, 1)) nights.push(key)
  return nights
}

export const isWeekendNight = (key: DateKey) => {
  const day = parseKey(key).getUTCDay()
  return day === 5 || day === 6
}

export const monthStart = (key: DateKey): DateKey => `${key.slice(0, 7)}-01`

export const addMonths = (key: DateKey, months: number): DateKey => {
  const date = parseKey(monthStart(key))
  date.setUTCMonth(date.getUTCMonth() + months)
  return toKey(date)
}

export const daysInMonth = (key: DateKey) => {
  const date = parseKey(monthStart(key))
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

export const monthCells = (key: DateKey): (DateKey | null)[] => {
  const first = monthStart(key)
  const lead = parseKey(first).getUTCDay()
  const cells: (DateKey | null)[] = Array(lead).fill(null)
  for (let d = 0; d < daysInMonth(first); d++) cells.push(addDays(first, d))
  return cells
}

const format = (key: DateKey, options: Intl.DateTimeFormatOptions) =>
  parseKey(key).toLocaleDateString('en-PH', { timeZone: 'UTC', ...options })

export const formatDay = (key: DateKey) => format(key, { weekday: 'short', month: 'short', day: 'numeric' })
export const formatShort = (key: DateKey) => format(key, { month: 'short', day: 'numeric' })
export const formatLong = (key: DateKey) => format(key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
export const formatMonth = (key: DateKey) => format(key, { month: 'long', year: 'numeric' })
export const formatMonthShort = (key: DateKey) => format(key, { month: 'short' })

export const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
