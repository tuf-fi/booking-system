import { useSyncExternalStore } from 'react'

const KEY = 'lantaw-admin-session'
const DEMO_EMAIL = 'owner@lantaw.test'
const DEMO_PASSWORD = 'password'

const listeners = new Set<() => void>()

const read = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

let signedIn = read()

const set = (value: boolean) => {
  signedIn = value
  try {
    if (value) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    signedIn = value
  }
  listeners.forEach(listener => listener())
}

export const demoCredentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD }

export const signIn = (email: string, password: string) => {
  const ok = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
  if (ok) set(true)
  return ok
}

export const signOut = () => set(false)

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useSignedIn = () => useSyncExternalStore(subscribe, () => signedIn)
