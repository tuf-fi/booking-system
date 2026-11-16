import type { Booking, Db } from '../types'
import { addDays, eachNight, type DateKey } from './dates'

type Occupancy = Pick<Db, 'bookings' | 'blocked'>

export const holdsNights = (booking: Booking, now: number) => {
  if (booking.status === 'cancelled' || booking.status === 'expired') return false
  if (booking.status === 'pending_payment' && booking.expiresAt !== null && booking.expiresAt <= now) return false
  return true
}

export const bookingOnNight = (db: Pick<Db, 'bookings'>, roomId: string, night: DateKey, now = Date.now()) =>
  db.bookings.find(b => b.roomId === roomId && holdsNights(b, now) && b.checkIn <= night && night < b.checkOut)

export const isBlocked = (db: Pick<Db, 'blocked'>, roomId: string, night: DateKey) =>
  (db.blocked[roomId] ?? []).includes(night)

export const isNightTaken = (db: Occupancy, roomId: string, night: DateKey, now = Date.now()) =>
  Boolean(bookingOnNight(db, roomId, night, now)) || isBlocked(db, roomId, night)

export const isRangeFree = (db: Occupancy, roomId: string, checkIn: DateKey, checkOut: DateKey, now = Date.now()) =>
  eachNight(checkIn, checkOut).every(night => !isNightTaken(db, roomId, night, now))

export const firstAvailableRange = (db: Occupancy, roomId: string, from: DateKey, nights: number, horizon = 120) => {
  for (let offset = 0; offset < horizon; offset++) {
    const checkIn = addDays(from, offset)
    const checkOut = addDays(checkIn, nights)
    if (isRangeFree(db, roomId, checkIn, checkOut)) return { checkIn, checkOut }
  }
  return null
}
