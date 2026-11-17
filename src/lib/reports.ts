import type { Booking, Db, BookingStatus } from '../types'
import { addDays, addMonths, daysInMonth, formatMonthShort, monthStart, nightsBetween, today, type DateKey } from './dates'
import { holdsNights } from './availability'

const REVENUE_STATUSES: BookingStatus[] = ['pending_approval', 'confirmed', 'checked_in', 'completed']
const OCCUPIED_STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'completed']

export const monthlyRevenue = (db: Db, monthKey: DateKey) =>
  db.bookings
    .filter(b => REVENUE_STATUSES.includes(b.status) && b.checkIn.slice(0, 7) === monthKey.slice(0, 7))
    .reduce((sum, b) => sum + b.amountPaid, 0)

export const monthlyBookingCount = (db: Db, monthKey: DateKey) =>
  db.bookings.filter(b => REVENUE_STATUSES.includes(b.status) && b.checkIn.slice(0, 7) === monthKey.slice(0, 7)).length

export const occupiedDays = (db: Db, roomId: string, monthKey: DateKey) => {
  const start = monthStart(monthKey)
  const bookings = db.bookings.filter(b => b.roomId === roomId && OCCUPIED_STATUSES.includes(b.status))
  return Array.from({ length: daysInMonth(start) }, (_, i) => {
    const day = addDays(start, i)
    return bookings.some(b => b.checkIn <= day && day < b.checkOut)
  })
}

export const lastMonths =(count: number, from: DateKey = today()) =>
  Array.from({ length: count }, (_, i) => addMonths(monthStart(from), i - (count - 1)))

export const revenueSeries = (db: Db, count = 6) =>
  lastMonths(count).map(key => ({ key, label: formatMonthShort(key), value: monthlyRevenue(db, key) }))

export const occupancyForMonth = (db: Db, monthKey: DateKey) => {
  const start = monthStart(monthKey)
  const days = daysInMonth(start)
  const end = addDays(start, days)
  const perRoom = Object.fromEntries(db.rooms.map(room => [room.id, 0]))
  db.bookings
    .filter(b => OCCUPIED_STATUSES.includes(b.status))
    .forEach(b => {
      const from = b.checkIn > start ? b.checkIn : start
      const to = b.checkOut < end ? b.checkOut : end
      if (to > from && b.roomId in perRoom) perRoom[b.roomId] += nightsBetween(from, to)
    })
  const booked = Object.values(perRoom).reduce((a, b) => a + b, 0)
  const capacity = days * db.rooms.length
  return {
    days,
    perRoom,
    percent: capacity ? Math.round((booked / capacity) * 100) : 0,
    roomPercent: (roomId: string) => Math.round((perRoom[roomId] / days) * 100)
  }
}

export const arrivalsWithin = (db: Db, days: number, from: DateKey = today()) => {
  const end = addDays(from, days)
  return db.bookings.filter(b => b.status === 'confirmed' && b.checkIn >= from && b.checkIn < end).sort((a, b) => a.checkIn.localeCompare(b.checkIn))
}

export const stayingNow = (db: Db) => db.bookings.filter(b => b.status === 'checked_in')

export const waitingForApproval = (db: Db) => db.bookings.filter(b => b.status === 'pending_approval')

export const activeBookings = (db: Db, now = Date.now()) => db.bookings.filter(b => holdsNights(b, now))

export type BookingFilter = 'all' | 'waiting' | 'upcoming' | 'staying' | 'completed' | 'cancelled'

export const FILTERS: { id: BookingFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting for approval' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'staying', label: 'Staying now' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
]

export const matchesFilter = (booking: Booking, filter: BookingFilter) => {
  switch (filter) {
    case 'all':
      return true
    case 'waiting':
      return booking.status === 'pending_approval'
    case 'upcoming':
      return booking.status === 'confirmed' || booking.status === 'pending_payment'
    case 'staying':
      return booking.status === 'checked_in'
    case 'completed':
      return booking.status === 'completed'
    case 'cancelled':
      return booking.status === 'cancelled' || booking.status === 'expired'
  }
}

const RANK: Record<BookingStatus, number> = { pending_approval: 0, checked_in: 1, confirmed: 2, pending_payment: 3, completed: 4, cancelled: 5, expired: 6 }

export const sortBookings = (bookings: Booking[]) =>
  [...bookings].sort((a, b) => RANK[a.status] - RANK[b.status] || (RANK[a.status] >= 4 ? b.checkIn.localeCompare(a.checkIn) : a.checkIn.localeCompare(b.checkIn)))

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

export const toCsv = (rows: (string | number)[][]) => rows.map(row => row.map(csvCell).join(',')).join('\r\n')

export const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const blob = new Blob([`﻿${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
