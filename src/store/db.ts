import { useSyncExternalStore } from 'react'
import type { Db } from '../types'
import { DB_VERSION, seedDb } from '../data/seed'

const STORAGE_KEY = 'lantaw-db-v1'

const read = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      if (parsed.version === DB_VERSION) return parsed
    }
  } catch {
    return seedDb()
  }
  return seedDb()
}

const write = (db: Db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    return
  }
}

let state: Db = read()
const listeners = new Set<() => void>()

export const getDb = () => state

export const commit = (next: Db) => {
  state = next
  write(next)
  listeners.forEach(listener => listener())
}

export const resetDb = () => commit(seedDb())

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

export const useDb = () => useSyncExternalStore(subscribe, getDb)
