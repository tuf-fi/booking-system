import { beforeEach, describe, expect, it } from 'vitest'
import { addDays, today } from '../lib/dates'
import { isRangeFree } from '../lib/availability'
import { addUpload, approveBooking, cancelBooking, completeCardPayment, createBooking, DatesTakenError, deleteRoom, findBooking, guestCancel, saveRoom, setBlockedNight, sweepExpired, type CreateBookingInput } from './api'
import { resetAccounts } from './accounts'
import { createVerifiedAccount } from './accounts.testing'
import { commit, getDb, resetDb } from './db'

let userId = ''

const stay = (offset: number, nights: number, overrides: Partial<CreateBookingInput> = {}): CreateBookingInput => ({
  userId,
  roomId: 'twin',
  checkIn: addDays(today(), offset),
  checkOut: addDays(today(), offset + nights),
  guestName: 'Test Guest',
  guestMobile: '09171234567',
  guests: 2,
  method: 'gcash_manual',
  proof: 'data:image/jpeg;base64,AAAA',
  ...overrides
})

beforeEach(async () => {
  resetDb()
  resetAccounts()
  userId = (await createVerifiedAccount()).id
})

describe('createBooking', () => {
  it('refuses guests without a verified account', async () => {
    await expect(createBooking(stay(300, 2, { userId: 'nobody' }))).rejects.toThrow('Sign in')
  })

  it('links the booking to the account and uses its verified email', async () => {
    const booking = await createBooking(stay(300, 2))
    expect(booking.userId).toBe(userId)
    expect(booking.guestEmail).toBe('guest@example.com')
  })

  it('holds the nights and waits for approval on GCash', async () => {
    const booking = await createBooking(stay(300, 2))
    expect(booking.status).toBe('pending_approval')
    expect(isRangeFree(getDb(), 'twin', booking.checkIn, booking.checkOut)).toBe(false)
  })

  it('refuses a second booking for the same nights', async () => {
    await createBooking(stay(300, 3))
    await expect(createBooking(stay(301, 2))).rejects.toBeInstanceOf(DatesTakenError)
  })

  it('lets the next guest check in on the previous guest check-out day', async () => {
    await createBooking(stay(300, 2))
    await expect(createBooking(stay(302, 1))).resolves.toBeTruthy()
  })

  it('refuses nights the owner blocked', async () => {
    setBlockedNight('twin', addDays(today(), 310), true)
    await expect(createBooking(stay(309, 3))).rejects.toBeInstanceOf(DatesTakenError)
  })

  it('refuses more guests than the room sleeps', async () => {
    await expect(createBooking(stay(300, 2, { guests: 3 }))).rejects.toThrow(/sleeps/)
  })

  it('refuses dates in the past', async () => {
    await expect(createBooking(stay(-2, 2))).rejects.toThrow()
  })
})

describe('payments and status', () => {
  it('confirms a card booking only after payment completes', async () => {
    const booking = await createBooking(stay(320, 2, { method: 'paymongo', proof: null }))
    expect(booking.status).toBe('pending_payment')
    expect(booking.amountPaid).toBe(0)
    const paid = await completeCardPayment(booking.reference)
    expect(paid.status).toBe('confirmed')
    expect(paid.amountPaid).toBe(booking.downPayment)
  })

  it('expires an unpaid card checkout and releases the dates', async () => {
    const booking = await createBooking(stay(330, 2, { method: 'paymongo', proof: null }))
    commit({ ...getDb(), bookings: getDb().bookings.map(b => (b.reference === booking.reference ? { ...b, expiresAt: Date.now() - 1 } : b)) })
    sweepExpired()
    expect(getDb().bookings.find(b => b.reference === booking.reference)?.status).toBe('expired')
    expect(isRangeFree(getDb(), 'twin', booking.checkIn, booking.checkOut)).toBe(true)
    await expect(completeCardPayment(booking.reference)).rejects.toThrow(/expired/)
  })

  it('records the down payment when the owner approves', async () => {
    const booking = await createBooking(stay(340, 2))
    approveBooking(booking.reference)
    const approved = getDb().bookings.find(b => b.reference === booking.reference)!
    expect(approved.status).toBe('confirmed')
    expect(approved.amountPaid).toBe(approved.downPayment)
  })

  it('frees the nights when a booking is cancelled', async () => {
    const booking = await createBooking(stay(350, 2))
    cancelBooking(booking.reference)
    expect(isRangeFree(getDb(), 'twin', booking.checkIn, booking.checkOut)).toBe(true)
  })
})

describe('manage my booking', () => {
  it('finds a booking only when reference and mobile both match', async () => {
    const booking = await createBooking(stay(360, 2))
    expect(await findBooking(booking.reference, '0917 123 4567')).not.toBeNull()
    expect(await findBooking(booking.reference, '09179999999')).toBeNull()
    expect(await findBooking('LTW-NOPE', '09171234567')).toBeNull()
  })

  it('flags the cancellation as refundable only inside the policy window', async () => {
    const far = await createBooking(stay(380, 2))
    const cancelledFar = await guestCancel(far.reference)
    expect(cancelledFar.cancelReason).toMatch(/refund due/)
    const near = await createBooking(stay(1, 2, { roomId: 'triple', guests: 2 }))
    const cancelledNear = await guestCancel(near.reference)
    expect(cancelledNear.cancelReason).toMatch(/no refund/)
  })
})

describe('room management', () => {
  it('adds a new room and stores an uploaded photo', () => {
    const photo = addUpload('data:image/jpeg;base64,AAAA')
    expect(photo.startsWith('upload:')).toBe(true)
    expect(getDb().uploads?.[photo.slice(7)]).toBe('data:image/jpeg;base64,AAAA')
    const base = getDb().rooms[0]
    saveRoom({ ...base, id: 'garden', name: 'Garden twin', photo, gallery: [] })
    expect(getDb().rooms.some(room => room.id === 'garden')).toBe(true)
    saveRoom({ ...base, id: 'garden', name: 'Garden suite', photo, gallery: [] })
    expect(getDb().rooms.filter(room => room.id === 'garden')).toHaveLength(1)
    expect(getDb().rooms.find(room => room.id === 'garden')?.name).toBe('Garden suite')
  })

  it('deletes a room with no bookings and refuses one that has bookings', async () => {
    const base = getDb().rooms[0]
    saveRoom({ ...base, id: 'spare', name: 'Spare room' })
    deleteRoom('spare')
    expect(getDb().rooms.some(room => room.id === 'spare')).toBe(false)
    await createBooking(stay(300, 2))
    expect(() => deleteRoom('twin')).toThrow(/has bookings/)
  })
})
