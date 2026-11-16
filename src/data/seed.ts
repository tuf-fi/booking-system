import type { Booking, BookingStatus, Db, PaymentMethod, Room, Settings } from '../types'
import { addDays, today } from '../lib/dates'
import { pesosToCentavos } from '../lib/money'
import { quoteStay } from '../lib/pricing'

export const DB_VERSION = 2

const rooms: Room[] = [
  {
    id: 'single',
    name: 'Budget single',
    sleeps: 1,
    beds: '1 single bed',
    sizeSqm: 10,
    description: 'A small, quiet room for solo travelers on a budget.',
    perks: ['Aircon and electric fan', 'Shared bathroom with hot shower', 'Desk and wall hooks'],
    highlights: [{ label: 'Aircon', icon: 'aircon' }, { label: 'Shared bathroom', icon: 'bath' }],
    baseRate: pesosToCentavos(950),
    weekendExtra: pesosToCentavos(150),
    photo: 'room-single',
    gallery: ['roof-deck', 'kitchen', 'mayon-sunrise'],
    mayonView: false,
    isActive: true
  },
  {
    id: 'twin',
    name: 'Standard twin',
    sleeps: 2,
    beds: '2 single beds',
    sizeSqm: 14,
    description: 'Two beds for friends, coworkers or a parent and child.',
    perks: ['Private bathroom with hot shower', 'Aircon and smart TV', 'Bedside table and reading lamp'],
    highlights: [{ label: 'Aircon', icon: 'aircon' }, { label: 'Private bathroom', icon: 'bath' }],
    baseRate: pesosToCentavos(1350),
    weekendExtra: pesosToCentavos(200),
    photo: 'room-twin',
    gallery: ['kitchen', 'roof-deck', 'mayon-dusk'],
    mayonView: false,
    isActive: true
  },
  {
    id: 'deluxe',
    name: 'Deluxe double',
    sleeps: 3,
    beds: '1 double bed and 1 pull-out bed',
    sizeSqm: 18,
    description: "Our couples' favorite. The window looks straight at Mayon.",
    perks: ['Window facing Mayon', 'Private bathroom with hot shower', 'Smart TV, mini fridge and kettle'],
    highlights: [{ label: 'Mayon view', icon: 'mountain' }, { label: 'Smart TV', icon: 'tv' }],
    baseRate: pesosToCentavos(1800),
    weekendExtra: pesosToCentavos(250),
    photo: 'room-deluxe',
    gallery: ['mayon-sunrise', 'roof-deck', 'mayon-dusk'],
    mayonView: true,
    isActive: true
  },
  {
    id: 'triple',
    name: 'Triple room',
    sleeps: 3,
    beds: '3 single beds',
    sizeSqm: 20,
    description: 'Three proper beds, so nobody gets the floor. Good for barkadas.',
    perks: ['Private bathroom with hot shower', 'Aircon and smart TV', 'Lockers for each guest'],
    highlights: [{ label: 'Private bathroom', icon: 'bath' }, { label: 'Lockers', icon: 'lock' }],
    baseRate: pesosToCentavos(2100),
    weekendExtra: pesosToCentavos(300),
    photo: 'room-triple',
    gallery: ['kitchen', 'roof-deck', 'mayon-sunrise'],
    mayonView: false,
    isActive: true
  },
  {
    id: 'family',
    name: 'Family room',
    sleeps: 6,
    beds: '2 double beds and 1 bunk bed',
    sizeSqm: 28,
    description: 'Our biggest room, on the top floor next to the roof deck.',
    perks: ['Small balcony with a Mayon view', 'Private bathroom with hot shower', 'Mini fridge, kettle and dining table'],
    highlights: [{ label: 'Mayon view', icon: 'mountain' }, { label: 'Balcony', icon: 'balcony' }],
    baseRate: pesosToCentavos(3200),
    weekendExtra: pesosToCentavos(400),
    photo: 'room-family',
    gallery: ['mayon-dusk', 'kitchen', 'roof-deck'],
    mayonView: true,
    isActive: true
  }
]

const settings: Settings = {
  cleaningFee: pesosToCentavos(200),
  downPaymentPercent: 50,
  gcashNumber: '0917 555 0142',
  gcashName: 'Lantaw Inn',
  cancellationDays: 3,
  checkInTime: '2 PM',
  checkOutTime: '11 AM'
}

const guestNames = [
  'Andrea Lim', 'Paolo Reyes', 'Joanna Cruz', 'Mark Villanueva', 'Liza Bautista', 'Kevin Santos',
  'Rhea Dela Cruz', 'Carlo Mendoza', 'Bea Ramos', 'Nico Aquino', 'Trisha Garcia', 'Jerome Tan',
  'Camille Navarro', 'Ramon Flores', 'Ella Ocampo', 'Miguel Torres', 'Sheila Gomez', 'Arvin Castro'
]

type SeedStay = [offset: number, roomId: string, nights: number, status: BookingStatus, method: PaymentMethod]

const seedStays: SeedStay[] = [
  [-160, 'family', 3, 'completed', 'paymongo'], [-150, 'deluxe', 2, 'completed', 'gcash_manual'],
  [-131, 'single', 4, 'completed', 'gcash_manual'], [-118, 'family', 2, 'completed', 'paymongo'],
  [-104, 'deluxe', 3, 'completed', 'gcash_manual'], [-96, 'family', 4, 'completed', 'gcash_manual'],
  [-80, 'triple', 2, 'completed', 'paymongo'], [-71, 'deluxe', 2, 'completed', 'gcash_manual'],
  [-66, 'family', 3, 'completed', 'gcash_manual'], [-52, 'twin', 3, 'completed', 'paymongo'],
  [-44, 'family', 2, 'completed', 'gcash_manual'], [-38, 'triple', 4, 'completed', 'gcash_manual'],
  [-27, 'family', 3, 'completed', 'paymongo'], [-21, 'twin', 2, 'completed', 'gcash_manual'],
  [-15, 'single', 3, 'completed', 'gcash_manual'], [-9, 'deluxe', 2, 'completed', 'paymongo'],
  [-1, 'family', 3, 'checked_in', 'gcash_manual'],
  [2, 'deluxe', 2, 'confirmed', 'paymongo'],
  [4, 'twin', 3, 'pending_approval', 'gcash_manual'],
  [6, 'family', 2, 'pending_approval', 'gcash_manual'],
  [9, 'triple', 4, 'confirmed', 'gcash_manual'],
  [13, 'family', 3, 'confirmed', 'paymongo'],
  [17, 'twin', 2, 'confirmed', 'gcash_manual'],
  [22, 'deluxe', 2, 'pending_approval', 'gcash_manual'],
  [26, 'family', 4, 'confirmed', 'gcash_manual'],
  [31, 'single', 3, 'cancelled', 'paymongo'],
  [40, 'family', 2, 'pending_approval', 'gcash_manual']
]

const mobileFor = (index: number) => `09${17 + (index % 8)}${String(1000000 + ((index * 7919) % 8999999)).slice(0, 7)}`

export const seedDb = (): Db => {
  const base = today()
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]))
  const now = Date.now()

  const bookings: Booking[] = seedStays.map(([offset, roomId, nights, status, method], index) => {
    const checkIn = addDays(base, offset)
    const checkOut = addDays(checkIn, nights)
    const quote = quoteStay(roomById[roomId], settings, checkIn, checkOut)
    const paid = status === 'completed' ? quote.total : status === 'confirmed' || status === 'checked_in' ? quote.downPayment : 0
    return {
      reference: `LTW-${String(4200 + index * 17).padStart(4, '0')}`,
      roomId,
      guestName: guestNames[index % guestNames.length],
      guestMobile: mobileFor(index),
      guestEmail: '',
      guests: Math.min(roomById[roomId].sleeps, 1 + (index % 3)),
      checkIn,
      checkOut,
      nights: quote.nights,
      subtotal: quote.subtotal,
      cleaningFee: quote.cleaningFee,
      total: quote.total,
      downPayment: quote.downPayment,
      amountPaid: paid,
      status,
      source: 'direct',
      method,
      proof: null,
      createdAt: now + (offset - 6) * 86_400_000,
      expiresAt: null,
      cancelledAt: status === 'cancelled' ? now - 86_400_000 : null,
      cancelReason: status === 'cancelled' ? 'Guest cancelled' : null,
      seen: status !== 'pending_approval'
    }
  })

  bookings.push({
    ...bookings[0],
    reference: 'LTW-4999',
    roomId: 'twin',
    guestName: 'Booking.com guest',
    guestMobile: '',
    checkIn: addDays(base, 20),
    checkOut: addDays(base, 22),
    nights: 2,
    status: 'confirmed',
    source: 'booking',
    method: 'cash',
    amountPaid: 0,
    createdAt: now - 3 * 86_400_000,
    seen: true,
    ...(() => {
      const quote = quoteStay(roomById.twin, settings, addDays(base, 20), addDays(base, 22))
      return { subtotal: quote.subtotal, total: quote.total, downPayment: 0, cleaningFee: quote.cleaningFee }
    })()
  })

  return {
    version: DB_VERSION,
    rooms,
    settings,
    bookings,
    blocked: { single: [], twin: [], deluxe: [], triple: [], family: [addDays(base, 10), addDays(base, 11)] },
    smsLogs: [],
    sequence: 1
  }
}
