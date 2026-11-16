import { describe, expect, it } from 'vitest'
import { addDays, eachNight, isWeekendNight, nightsBetween } from './dates'
import { quoteStay } from './pricing'
import { peso, pesosToCentavos } from './money'

const room = { baseRate: pesosToCentavos(1350), weekendExtra: pesosToCentavos(200) }
const settings = { cleaningFee: pesosToCentavos(200), downPaymentPercent: 50 }

describe('dates', () => {
  it('treats Friday and Saturday as weekend nights', () => {
    expect(isWeekendNight('2030-01-03')).toBe(false)
    expect(isWeekendNight('2030-01-04')).toBe(true)
    expect(isWeekendNight('2030-01-05')).toBe(true)
    expect(isWeekendNight('2030-01-06')).toBe(false)
  })

  it('does not count the check-out day as a night', () => {
    expect(eachNight('2030-01-03', '2030-01-05')).toEqual(['2030-01-03', '2030-01-04'])
    expect(nightsBetween('2030-01-03', '2030-01-05')).toBe(2)
  })

  it('adds days across month ends', () => {
    expect(addDays('2030-01-31', 1)).toBe('2030-02-01')
    expect(addDays('2030-03-01', -1)).toBe('2030-02-28')
  })
})

describe('quoteStay', () => {
  it('prices weeknights and weekend nights separately and adds the cleaning fee once', () => {
    const quote = quoteStay(room, settings, '2030-01-03', '2030-01-07')
    expect(quote.nights).toBe(4)
    expect(quote.weekendNights).toBe(2)
    expect(quote.weeknights).toBe(2)
    expect(quote.subtotal).toBe(pesosToCentavos(2 * 1350 + 2 * 1550))
    expect(quote.total).toBe(quote.subtotal + settings.cleaningFee)
  })

  it('splits the total into down payment and balance with no leftover', () => {
    const quote = quoteStay(room, settings, '2030-01-03', '2030-01-07')
    expect(quote.downPayment + quote.balance).toBe(quote.total)
  })

  it('rounds the down payment to the nearest peso', () => {
    const odd = quoteStay({ baseRate: pesosToCentavos(1001), weekendExtra: 0 }, { cleaningFee: 0, downPaymentPercent: 50 }, '2030-01-01', '2030-01-02')
    expect(odd.downPayment % 100).toBe(0)
    expect(peso(odd.downPayment)).toBe('₱501')
  })

  it('formats pesos from centavos', () => {
    expect(peso(135000)).toBe('₱1,350')
  })
})
