import type { Quote, Room, Settings } from '../types'
import { eachNight, isWeekendNight, type DateKey } from './dates'

export const nightRate = (room: Pick<Room, 'baseRate' | 'weekendExtra'>, night: DateKey) =>
  room.baseRate + (isWeekendNight(night) ? room.weekendExtra : 0)

const roundToPeso = (centavos: number) => Math.round(centavos / 100) * 100

export const quoteStay = (
  room: Pick<Room, 'baseRate' | 'weekendExtra'>,
  settings: Pick<Settings, 'cleaningFee' | 'downPaymentPercent'>,
  checkIn: DateKey,
  checkOut: DateKey
): Quote => {
  const nights = eachNight(checkIn, checkOut)
  const weekendNights = nights.filter(isWeekendNight).length
  const weeknights = nights.length - weekendNights
  const subtotal = nights.reduce((sum, night) => sum + nightRate(room, night), 0)
  const total = subtotal + settings.cleaningFee
  const downPayment = roundToPeso((total * settings.downPaymentPercent) / 100)
  return {
    nights: nights.length,
    weeknights,
    weekendNights,
    weeknightRate: room.baseRate,
    weekendRate: room.baseRate + room.weekendExtra,
    subtotal,
    cleaningFee: settings.cleaningFee,
    total,
    downPayment,
    balance: total - downPayment
  }
}
