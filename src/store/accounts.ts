import { useSyncExternalStore } from 'react'
import { seedAccounts } from '../data/seedAccounts'
import { hashPassword, makeCode, makeSalt } from '../lib/passwords'
import { isValidEmail, isValidMobile, passwordProblem } from '../lib/validation'

export type Purpose = 'signup' | 'signin' | 'reset'

export interface Account {
  id: string
  name: string
  email: string
  mobile: string
  avatar: string | null
  passwordHash: string | null
  passwordSalt: string | null
  hasGoogle: boolean
  emailVerified: boolean
  createdAt: number
  saved: string[]
  birthDate?: string
  address?: string
  emergencyContact?: string
}

export type Profile = Omit<Account, 'passwordHash' | 'passwordSalt'> & { hasPassword: boolean }

export interface ChallengeInfo {
  email: string
  purpose: Purpose
  expiresAt: number
  resendAt: number
}

export interface GoogleProfile {
  email: string
  name: string
  picture: string | null
}

interface Challenge {
  code: string
  expiresAt: number
  resendAt: number
  attempts: number
  verified: boolean
}

interface State {
  accounts: Account[]
  sessionUserId: string | null
}

export class AuthError extends Error {}

const STORAGE_KEY = 'lantaw-accounts-v1'
const CODE_LIFETIME_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 30 * 1000
const MAX_CODE_ATTEMPTS = 5
const MAX_PASSWORD_FAILURES = 5
const LOCK_MS = 5 * 60 * 1000
const GENERIC_SIGN_IN_ERROR = 'That email or password is not right.'
const DUMMY_SALT = 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1'

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const empty = (): State => ({ accounts: seedAccounts(), sessionUserId: null })

const read = (): State => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...empty(), ...(JSON.parse(raw) as State) }
  } catch {
    return empty()
  }
  return empty()
}

let state = read()
const listeners = new Set<() => void>()
const challenges = new Map<string, Challenge>()
const failures = new Map<string, { count: number; lockedUntil: number }>()
let cachedProfile: { source: Account | undefined; profile: Profile | null } = { source: undefined, profile: null }

const commit = (next: State) => {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    state = next
  }
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return
    state = read()
    listeners.forEach(listener => listener())
  })
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const challengeKey = (email: string, purpose: Purpose) => `${purpose}:${email}`

const findByEmail = (email: string) => state.accounts.find(account => account.email === email)

export const getAccountById = (id: string | null | undefined) => state.accounts.find(account => account.id === id)

const toProfile = (account: Account): Profile => {
  const { passwordHash, passwordSalt, ...rest } = account
  return { ...rest, hasPassword: Boolean(passwordHash && passwordSalt) }
}

const sessionAccount = () => {
  const account = getAccountById(state.sessionUserId)
  return account && account.emailVerified ? account : undefined
}

export const currentProfile = (): Profile | null => {
  const account = sessionAccount()
  if (cachedProfile.source !== account) cachedProfile = { source: account, profile: account ? toProfile(account) : null }
  return cachedProfile.profile
}

export const useAccount = () => useSyncExternalStore(subscribe, currentProfile)

const patchAccount = (id: string, patch: Partial<Account>) =>
  commit({ ...state, accounts: state.accounts.map(account => (account.id === id ? { ...account, ...patch } : account)) })

const infoFor = (email: string, purpose: Purpose, challenge?: Challenge): ChallengeInfo => {
  const now = Date.now()
  return { email, purpose, expiresAt: challenge?.expiresAt ?? now + CODE_LIFETIME_MS, resendAt: challenge?.resendAt ?? now + RESEND_COOLDOWN_MS }
}

const issueChallenge = (email: string, purpose: Purpose): ChallengeInfo => {
  const now = Date.now()
  const challenge: Challenge = { code: makeCode(), expiresAt: now + CODE_LIFETIME_MS, resendAt: now + RESEND_COOLDOWN_MS, attempts: 0, verified: false }
  challenges.set(challengeKey(email, purpose), challenge)
  return infoFor(email, purpose, challenge)
}

export const peekDemoCode = (email: string, purpose: Purpose) => challenges.get(challengeKey(normalizeEmail(email), purpose))?.code ?? null

const lockMessage = (until: number) => {
  const minutes = Math.max(1, Math.ceil((until - Date.now()) / 60_000))
  return `Too many tries. Wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} or reset your password.`
}

const assertNotLocked = (email: string) => {
  const record = failures.get(email)
  if (record && record.lockedUntil > Date.now()) throw new AuthError(lockMessage(record.lockedUntil))
}

const recordFailure = (email: string) => {
  const count = (failures.get(email)?.count ?? 0) + 1
  failures.set(email, count >= MAX_PASSWORD_FAILURES ? { count: 0, lockedUntil: Date.now() + LOCK_MS } : { count, lockedUntil: 0 })
}

const newId = () => `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export interface RegisterInput {
  name: string
  email: string
  mobile: string
  password: string
}

export const registerAccount = async (input: RegisterInput): Promise<ChallengeInfo> => {
  await wait(350)
  const email = normalizeEmail(input.email)
  if (input.name.trim().length < 2) throw new AuthError('Enter your full name.')
  if (!isValidEmail(email)) throw new AuthError('Enter a valid email address.')
  if (!isValidMobile(input.mobile)) throw new AuthError('Enter an 11-digit mobile number, like 0917 123 4567.')
  const problem = passwordProblem(input.password)
  if (problem) throw new AuthError(problem)
  const existing = findByEmail(email)
  if (existing?.emailVerified) throw new AuthError('There is already an account with this email. Sign in instead.')

  const salt = makeSalt()
  const account: Account = {
    id: existing?.id ?? newId(),
    name: input.name.trim(),
    email,
    mobile: input.mobile.trim(),
    avatar: existing?.avatar ?? null,
    passwordHash: await hashPassword(input.password, salt),
    passwordSalt: salt,
    hasGoogle: existing?.hasGoogle ?? false,
    emailVerified: false,
    createdAt: Date.now(),
    saved: []
  }
  commit({ ...state, accounts: [...state.accounts.filter(a => a.email !== email), account] })
  return issueChallenge(email, 'signup')
}

export const startSignIn = async (rawEmail: string, password: string): Promise<ChallengeInfo> => {
  await wait(300)
  const email = normalizeEmail(rawEmail)
  assertNotLocked(email)
  const account = findByEmail(email)
  const hash = await hashPassword(password, account?.passwordSalt ?? DUMMY_SALT)
  if (!account || !account.passwordHash || hash !== account.passwordHash) {
    recordFailure(email)
    throw new AuthError(GENERIC_SIGN_IN_ERROR)
  }
  failures.delete(email)
  return issueChallenge(email, account.emailVerified ? 'signin' : 'signup')
}

export const signInWithGoogle = async (profile: GoogleProfile): Promise<ChallengeInfo> => {
  await wait(250)
  const email = normalizeEmail(profile.email)
  if (!isValidEmail(email)) throw new AuthError('Google did not share an email address.')
  const existing = findByEmail(email)
  if (existing) {
    patchAccount(existing.id, { hasGoogle: true, avatar: profile.picture ?? existing.avatar })
  } else {
    const account: Account = {
      id: newId(),
      name: profile.name.trim() || email.split('@')[0],
      email,
      mobile: '',
      avatar: profile.picture,
      passwordHash: null,
      passwordSalt: null,
      hasGoogle: true,
      emailVerified: false,
      createdAt: Date.now(),
      saved: []
    }
    commit({ ...state, accounts: [...state.accounts, account] })
  }
  return issueChallenge(email, 'signin')
}

export const requestPasswordReset = async (rawEmail: string): Promise<ChallengeInfo> => {
  await wait(300)
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) throw new AuthError('Enter a valid email address.')
  return findByEmail(email) ? issueChallenge(email, 'reset') : infoFor(email, 'reset')
}

export const resendCode = async (rawEmail: string, purpose: Purpose): Promise<ChallengeInfo> => {
  await wait(250)
  const email = normalizeEmail(rawEmail)
  const current = challenges.get(challengeKey(email, purpose))
  if (current && current.resendAt > Date.now()) {
    const seconds = Math.ceil((current.resendAt - Date.now()) / 1000)
    throw new AuthError(`Wait ${seconds} seconds before asking for another code.`)
  }
  if (!findByEmail(email)) {
    if (purpose === 'reset') return infoFor(email, purpose)
    throw new AuthError('Start again to get a new code.')
  }
  return issueChallenge(email, purpose)
}

export const verifyCode = async (rawEmail: string, purpose: Purpose, code: string): Promise<Profile | null> => {
  await wait(300)
  const email = normalizeEmail(rawEmail)
  const key = challengeKey(email, purpose)
  const challenge = challenges.get(key)
  if (!challenge || challenge.expiresAt <= Date.now()) {
    challenges.delete(key)
    throw new AuthError('That code has expired. Send a new one.')
  }
  if (challenge.code !== code.trim()) {
    challenge.attempts += 1
    if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
      challenges.delete(key)
      throw new AuthError('Too many wrong codes. Send a new one.')
    }
    throw new AuthError(`That code is not right. ${MAX_CODE_ATTEMPTS - challenge.attempts} tries left.`)
  }
  if (purpose === 'reset') {
    challenge.verified = true
    return null
  }
  const account = findByEmail(email)
  if (!account) throw new AuthError('Start again to get a new code.')
  challenges.delete(key)
  commit({
    accounts: state.accounts.map(a => (a.id === account.id ? { ...a, emailVerified: true } : a)),
    sessionUserId: account.id
  })
  return currentProfile()
}

export const completePasswordReset = async (rawEmail: string, password: string) => {
  await wait(300)
  const email = normalizeEmail(rawEmail)
  const key = challengeKey(email, 'reset')
  const challenge = challenges.get(key)
  if (!challenge || !challenge.verified || challenge.expiresAt <= Date.now()) throw new AuthError('Your reset session expired. Start again.')
  const problem = passwordProblem(password)
  if (problem) throw new AuthError(problem)
  const account = findByEmail(email)
  if (!account) throw new AuthError('Start again to reset your password.')
  const salt = makeSalt()
  const passwordHash = await hashPassword(password, salt)
  patchAccount(account.id, { passwordHash, passwordSalt: salt, emailVerified: true })
  challenges.delete(key)
  failures.delete(email)
}

export const signOut = () => commit({ ...state, sessionUserId: null })

export type ProfilePatch = Partial<Pick<Account, 'name' | 'mobile' | 'birthDate' | 'address' | 'emergencyContact'>>

export const updateProfile = async (id: string, patch: ProfilePatch) => {
  await wait(250)
  const next: ProfilePatch = {}
  if (patch.name !== undefined) {
    if (patch.name.trim().length < 2) throw new AuthError('Enter your full name.')
    next.name = patch.name.trim()
  }
  if (patch.mobile !== undefined) {
    if (!isValidMobile(patch.mobile)) throw new AuthError('Enter an 11-digit mobile number, like 0917 123 4567.')
    next.mobile = patch.mobile.trim()
  }
  if (patch.birthDate !== undefined) {
    const value = patch.birthDate.trim()
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value >= new Date().toISOString().slice(0, 10) || value < '1900-01-01')) throw new AuthError('Enter a valid date of birth.')
    next.birthDate = value
  }
  if (patch.address !== undefined) {
    const value = patch.address.trim()
    if (value && value.length < 5) throw new AuthError('Enter your city and province, like Legazpi City, Albay.')
    next.address = value
  }
  if (patch.emergencyContact !== undefined) {
    const value = patch.emergencyContact.trim()
    if (value && value.length < 5) throw new AuthError('Enter a name and a mobile number.')
    next.emergencyContact = value
  }
  patchAccount(id, next)
}

export const setAvatar = (id: string, avatar: string | null) => patchAccount(id, { avatar })

export const changePassword = async (id: string, current: string, next: string) => {
  await wait(300)
  const account = getAccountById(id)
  if (!account) throw new AuthError('Sign in again to change your password.')
  if (account.passwordHash && account.passwordSalt) {
    const currentHash = await hashPassword(current, account.passwordSalt)
    if (currentHash !== account.passwordHash) throw new AuthError('Your current password is not right.')
  }
  const problem = passwordProblem(next)
  if (problem) throw new AuthError(problem)
  const salt = makeSalt()
  patchAccount(id, { passwordHash: await hashPassword(next, salt), passwordSalt: salt })
}

export const toggleSavedRoom = (id: string, roomId: string) => {
  const account = getAccountById(id)
  if (!account) return
  const saved = account.saved.includes(roomId) ? account.saved.filter(r => r !== roomId) : [...account.saved, roomId]
  patchAccount(id, { saved })
}

export const resetAccounts = () => {
  challenges.clear()
  failures.clear()
  commit(empty())
}
