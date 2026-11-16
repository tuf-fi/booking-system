import { beforeEach, describe, expect, it } from 'vitest'
import { addDays, today } from '../lib/dates'
import { isRangeFree } from '../lib/availability'
import { approveBooking, cancelBooking, completeCardPayment, createBooking, DatesTakenError, findBooking, guestCancel, setBlockedNight, sweepExpired, type CreateBookingInput } from './api'
import { commit, getDb, resetDb } from './db'

const stay = (offset: number, nights: number, overrides: Partial<CreateBookingInput> = {}): CreateBookingInput => ({
  roomId: 'twin',
  checkIn: addDays(today(), offset),
  checkOut: addDays(today(), offset + nights),
  guestName: 'Test Guest',
  guestMobile: '09171234567',
  guestEmail: '',
  guests: 2,
  method: 'gcash_manual',
  proof: 'data:image/jpeg;base64,AAAA',
  ...overrides
})

beforeEach(() => resetDb())

describe('createBooking', () => {
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
