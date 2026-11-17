import { pesosToCentavos } from './money'

export const SITE = {
  phone: '0917 555 0142',
  phoneHref: 'tel:+639175550142',
  parkingSpaces: 4
}

export const EXTRAS = {
  laundry: pesosToCentavos(150),
  airportPickup: pesosToCentavos(600),
  breakfast: pesosToCentavos(180),
  lateCheckOut: pesosToCentavos(300),
  petCleaning: pesosToCentavos(3000)
}
