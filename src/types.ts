import type { DateKey } from './lib/dates'

export type PhotoName = string

export interface Photo {
  alt: string
  credit: string
  source: string
  isStock: boolean
  width: number
  height: number
  card: { width: number; height: number }
  full: { width: number; height: number }
}

export type HighlightIcon = 'aircon' | 'bath' | 'tv' | 'mountain' | 'lock' | 'balcony'

export interface Highlight {
  label: string
  icon: HighlightIcon
}

export interface Room {
  id: string
  name: string
  sleeps: number
  beds: string
  sizeSqm: number
  description: string
  perks: string[]
  highlights: Highlight[]
  baseRate: number
  weekendExtra: number
  photo: PhotoName
  gallery?: PhotoName[]
  mayonView: boolean
  isActive: boolean
}

export interface Settings {
  cleaningFee: number
  downPaymentPercent: number
  gcashNumber: string
  gcashName: string
  cancellationDays: number
  checkInTime: string
  checkOutTime: string
  innName?: string
  address?: string
  phone?: string
  email?: string
  houseRules?: string[]
  policyNote?: string
}

export type BookingStatus =
  | 'pending_payment'
  | 'pending_approval'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'expired'

export type PaymentMethod = 'gcash_manual' | 'paymongo' | 'cash'

export type BookingSource = 'direct' | 'airbnb' | 'booking' | 'walk_in'

export interface Booking {
  reference: string
  userId?: string
  roomId: string
  guestName: string
  guestMobile: string
  guestEmail: string
  guests: number
  otherGuests?: string[]
  checkIn: DateKey
  checkOut: DateKey
  nights: number
  subtotal: number
  cleaningFee: number
  total: number
  downPayment: number
  amountPaid: number
  status: BookingStatus
  source: BookingSource
  method: PaymentMethod
  proof: string | null
  createdAt: number
  expiresAt: number | null
  cancelledAt: number | null
  cancelReason: string | null
  seen: boolean
}

export interface SmsLog {
  id: number
  to: string
  message: string
  sentAt: number
}

export interface Db {
  version: number
  rooms: Room[]
  settings: Settings
  bookings: Booking[]
  blocked: Record<string, DateKey[]>
  blockedReasons?: Record<string, string>
  uploads?: Record<string, string>
  housekeeping?: Record<string, boolean>
  smsLogs: SmsLog[]
  sequence: number
}

export interface Quote {
  nights: number
  weeknights: number
  weekendNights: number
  weeknightRate: number
  weekendRate: number
  subtotal: number
  cleaningFee: number
  total: number
  downPayment: number
  balance: number
}
