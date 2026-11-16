import type { Account } from '../store/accounts'

export const demoGuest = {
  id: 'u_demo_guest',
  name: 'Ana Reyes',
  email: 'guest@lantaw.test',
  mobile: '09171234567',
  password: 'Guest1234'
}

export const demoSignUp = {
  name: 'Mia Santos',
  email: 'mia.santos@lantaw.test',
  mobile: '09181234567',
  password: 'Welcome2025'
}

const DEMO_SALT = '5eed5a1750c0ffee5eed5a1750c0ffee'
const DEMO_HASH = '6c216c1192996e0ceae442f206fe29dfed982ef9b0e4937958a2b20a9893060a'

export const seedAccounts = (): Account[] => [
  {
    id: demoGuest.id,
    name: demoGuest.name,
    email: demoGuest.email,
    mobile: demoGuest.mobile,
    avatar: null,
    passwordHash: DEMO_HASH,
    passwordSalt: DEMO_SALT,
    hasGoogle: false,
    emailVerified: true,
    createdAt: Date.now() - 200 * 86_400_000,
    saved: ['deluxe']
  }
]
