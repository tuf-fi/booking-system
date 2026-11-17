import type { Booking, BookingStatus, Db, PaymentMethod, Room, Settings } from '../types'
import { eachNight, nightsBetween, today, type DateKey } from '../lib/dates'
import { isRangeFree } from '../lib/availability'
import { peso } from '../lib/money'
import { quoteStay } from '../lib/pricing'
import { normalizeMobile } from '../lib/validation'
import { getAccountById } from './accounts'
import { commit, getDb, resetDb } from './db'

export class DatesTakenError extends Error {
  constructor() {
    super('Someone just booked those dates.')
  }
}

export { isValidMobile, normalizeMobile } from '../lib/validation'

export class BookingError extends Error {}

export interface CreateBookingInput {
  userId: string
  roomId: string
  checkIn: DateKey
  checkOut: DateKey
  guestName: string
  guestMobile: string
  guests: number
  otherGuests?: string[]
  method: Extract<PaymentMethod, 'gcash_manual' | 'paymongo'>
  proof: string | null
}

const PAYMONGO_WINDOW_MS = 30 * 60 * 1000
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const makeReference = (db: Db) => {
  for (;;) {
    let code = ''
    for (let i = 0; i < 5; i++) code += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)]
    const reference = `LTW-${code}`
    if (!db.bookings.some(b => b.reference === reference)) return reference
  }
}

const withSms = (db: Db, to: string, message: string): Db => ({
  ...db,
  smsLogs: [{ id: db.smsLogs.length + 1, to, message, sentAt: Date.now() }, ...db.smsLogs].slice(0, 50)
})

const patchBooking = (db: Db, reference: string, patch: Partial<Booking>): Db => ({
  ...db,
  bookings: db.bookings.map(b => (b.reference === reference ? { ...b, ...patch } : b))
})

const requireBooking = (db: Db, reference: string) => {
  const booking = db.bookings.find(b => b.reference === reference)
  if (!booking) throw new BookingError('Booking not found.')
  return booking
}

export const sweepExpired = () => {
  const db = getDb()
  const now = Date.now()
  const stale = db.bookings.filter(b => b.status === 'pending_payment' && b.expiresAt !== null && b.expiresAt <= now)
  if (!stale.length) return
  commit({ ...db, bookings: db.bookings.map(b => (stale.includes(b) ? { ...b, status: 'expired' as BookingStatus } : b)) })
}

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  await wait(450)
  sweepExpired()
  const db = getDb()
  const account = getAccountById(input.userId)
  if (!account || !account.emailVerified) throw new BookingError('Sign in with a verified account to book.')
  const room = db.rooms.find(r => r.id === input.roomId && r.isActive)
  if (!room) throw new BookingError('That room is not available.')
  if (input.checkIn < today() || input.checkOut <= input.checkIn) throw new BookingError('Pick valid dates.')
  if (input.guests < 1 || input.guests > room.sleeps) throw new BookingError(`This room sleeps up to ${room.sleeps}.`)
  if (!isRangeFree(db, room.id, input.checkIn, input.checkOut)) throw new DatesTakenError()

  const quote = quoteStay(room, db.settings, input.checkIn, input.checkOut)
  const now = Date.now()
  const reference = makeReference(db)
  const isGcash = input.method === 'gcash_manual'
  const booking: Booking = {
    reference,
    roomId: room.id,
    guestName: input.guestName.trim(),
    guestMobile: input.guestMobile.trim(),
    guestEmail: account.email,
    userId: account.id,
    guests: input.guests,
    otherGuests: (input.otherGuests ?? []).map(name => name.trim()).filter(Boolean).slice(0, Math.max(0, input.guests - 1)),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: quote.nights,
    subtotal: quote.subtotal,
    cleaningFee: quote.cleaningFee,
    total: quote.total,
    downPayment: quote.downPayment,
    amountPaid: 0,
    status: isGcash ? 'pending_approval' : 'pending_payment',
    source: 'direct',
    method: input.method,
    proof: isGcash ? input.proof : null,
    createdAt: now,
    expiresAt: isGcash ? null : now + PAYMONGO_WINDOW_MS,
    cancelledAt: null,
    cancelReason: null,
    seen: false
  }
  const message = isGcash
    ? `Lantaw Inn: We got your booking ${reference}. The owner will check your GCash payment and text you soon.`
    : `Lantaw Inn: Booking ${reference} is on hold for 30 minutes. Finish your card payment to confirm it.`
  commit(withSms({ ...db, bookings: [...db.bookings, booking] }, booking.guestMobile, message))
  return booking
}

export const completeCardPayment = async (reference: string): Promise<Booking> => {
  await wait(900)
  sweepExpired()
  const db = getDb()
  const booking = requireBooking(db, reference)
  if (booking.status === 'expired') throw new BookingError('This checkout expired. Please book again.')
  if (booking.status !== 'pending_payment') return booking
  const next = patchBooking(db, reference, { status: 'confirmed', amountPaid: booking.downPayment, expiresAt: null })
  const message = `Lantaw Inn: Booking ${reference} is confirmed. We received ${peso(booking.downPayment)}. See you on ${booking.checkIn}.`
  commit(withSms(next, booking.guestMobile, message))
  return requireBooking(getDb(), reference)
}

export const approveBooking = (reference: string) => {
  const db = getDb()
  const booking = requireBooking(db, reference)
  const next = patchBooking(db, reference, { status: 'confirmed', amountPaid: booking.downPayment, seen: true })
  commit(withSms(next, booking.guestMobile, `Lantaw Inn: Booking ${reference} is confirmed. We received your down payment of ${peso(booking.downPayment)}.`))
}

const releaseBooking = (reference: string, reason: string, message: string) => {
  const db = getDb()
  const booking = requireBooking(db, reference)
  const next = patchBooking(db, reference, { status: 'cancelled', cancelledAt: Date.now(), cancelReason: reason, seen: true })
  commit(booking.guestMobile ? withSms(next, booking.guestMobile, message) : next)
}

export const declineBooking = (reference: string) =>
  releaseBooking(reference, 'Declined by owner', `Lantaw Inn: Sorry, we could not confirm booking ${reference}. Please text us at 0917 555 0142.`)

export const cancelBooking = (reference: string, reason = 'Cancelled by owner') =>
  releaseBooking(reference, reason, `Lantaw Inn: Booking ${reference} was cancelled.`)

export const markFullyPaid = (reference: string) => {
  const booking = requireBooking(getDb(), reference)
  commit(patchBooking(getDb(), reference, { amountPaid: booking.total, seen: true }))
}

export const checkInGuest = (reference: string) => commit(patchBooking(getDb(), reference, { status: 'checked_in', seen: true }))

export const checkOutGuest = (reference: string) => commit(patchBooking(getDb(), reference, { status: 'completed', seen: true }))

export const markSeen = (reference: string) => commit(patchBooking(getDb(), reference, { seen: true }))

export const isWithinFreeCancellation = (booking: Booking, settings: Settings, now = today()) =>
  nightsBetween(now, booking.checkIn) >= settings.cancellationDays

export const findBooking = async (reference: string, mobile: string): Promise<Booking | null> => {
  await wait(350)
  const booking = getDb().bookings.find(b => b.reference.toLowerCase() === reference.trim().toLowerCase())
  if (!booking || !booking.guestMobile) return null
  return normalizeMobile(booking.guestMobile) === normalizeMobile(mobile) ? booking : null
}

export const getBooking = (reference: string) => getDb().bookings.find(b => b.reference === reference) ?? null

export const guestCancel = async (reference: string): Promise<Booking> => {
  await wait(400)
  const db = getDb()
  const booking = requireBooking(db, reference)
  if (!['pending_approval', 'confirmed', 'pending_payment'].includes(booking.status)) throw new BookingError('This booking can no longer be cancelled online.')
  const refundable = isWithinFreeCancellation(booking, db.settings)
  releaseBooking(reference, refundable ? 'Guest cancelled, refund due' : 'Guest cancelled, no refund', `Lantaw Inn: Booking ${reference} was cancelled as you asked.`)
  return requireBooking(getDb(), reference)
}

export const setBlockedNight = (roomId: string, night: DateKey, blocked: boolean, reason?: string) => {
  const db = getDb()
  const current = new Set(db.blocked[roomId] ?? [])
  const reasons = { ...(db.blockedReasons ?? {}) }
  if (blocked) {
    current.add(night)
    if (reason?.trim()) reasons[`${roomId}:${night}`] = reason.trim()
  } else {
    current.delete(night)
    delete reasons[`${roomId}:${night}`]
  }
  commit({ ...db, blocked: { ...db.blocked, [roomId]: [...current].sort() }, blockedReasons: reasons })
}

export const blockRange = (roomId: string, checkIn: DateKey, checkOut: DateKey) => {
  const db = getDb()
  const current = new Set(db.blocked[roomId] ?? [])
  eachNight(checkIn, checkOut).forEach(night => current.add(night))
  commit({ ...db, blocked: { ...db.blocked, [roomId]: [...current].sort() } })
}

export const updateRooms = (rooms: Room[]) => commit({ ...getDb(), rooms })

export const addUpload = (dataUrl: string) => {
  const db = getDb()
  const id = Math.random().toString(36).slice(2, 10)
  commit({ ...db, uploads: { ...(db.uploads ?? {}), [id]: dataUrl } })
  return `upload:${id}`
}

export const saveRoom = (room: Room) => {
  const db = getDb()
  const exists = db.rooms.some(candidate => candidate.id === room.id)
  commit({ ...db, rooms: exists ? db.rooms.map(candidate => (candidate.id === room.id ? room : candidate)) : [...db.rooms, room] })
}

export const roomHasBookings = (roomId: string) => getDb().bookings.some(booking => booking.roomId === roomId)

export const deleteRoom = (roomId: string) => {
  const db = getDb()
  if (roomHasBookings(roomId)) throw new BookingError('This room has bookings, so it can only be closed, not deleted.')
  const blocked = { ...db.blocked }
  delete blocked[roomId]
  commit({ ...db, rooms: db.rooms.filter(room => room.id !== roomId), blocked })
}

export const setHousekeepingDone = (key: string, done: boolean) => {
  const db = getDb()
  commit({ ...db, housekeeping: { ...(db.housekeeping ?? {}), [key]: done } })
}

export const updateSettings = (settings: Settings) => commit({ ...getDb(), settings })

export const resetDemo = () => resetDb()
