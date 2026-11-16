import { beforeEach, describe, expect, it } from 'vitest'
import { demoGuest } from '../data/seedAccounts'
import {
  AuthError,
  changePassword,
  completePasswordReset,
  currentProfile,
  peekDemoCode,
  registerAccount,
  requestPasswordReset,
  resendCode,
  resetAccounts,
  signInWithGoogle,
  signOut,
  startSignIn,
  setAvatar,
  toggleSavedRoom,
  updateProfile,
  verifyCode
} from './accounts'
import { createVerifiedAccount } from './accounts.testing'

const EMAIL = 'guest@example.com'

beforeEach(() => resetAccounts())

describe('seeded demo guest', () => {
  it('signs in with the seeded password and the emailed code', async () => {
    const info = await startSignIn(demoGuest.email, demoGuest.password)
    expect(info.purpose).toBe('signin')
    await verifyCode(demoGuest.email, 'signin', peekDemoCode(demoGuest.email, 'signin')!)
    expect(currentProfile()).toMatchObject({ id: demoGuest.id, name: demoGuest.name, saved: ['deluxe'] })
  })
})

describe('sign up', () => {
  it('does not sign anyone in until the emailed code is entered', async () => {
    await registerAccount({ name: 'Ana Reyes', email: EMAIL, mobile: '09171234567', password: 'secret123' })
    expect(currentProfile()).toBeNull()
    await verifyCode(EMAIL, 'signup', peekDemoCode(EMAIL, 'signup')!)
    expect(currentProfile()?.email).toBe(EMAIL)
  })

  it('rejects weak passwords and bad mobile numbers', async () => {
    await expect(registerAccount({ name: 'Ana', email: EMAIL, mobile: '09171234567', password: 'short' })).rejects.toBeInstanceOf(AuthError)
    await expect(registerAccount({ name: 'Ana', email: EMAIL, mobile: '123', password: 'secret123' })).rejects.toThrow('mobile')
  })

  it('refuses a second account for a verified email', async () => {
    await createVerifiedAccount(EMAIL)
    await expect(registerAccount({ name: 'Other', email: EMAIL.toUpperCase(), mobile: '09171234567', password: 'secret123' })).rejects.toThrow('already an account')
  })

  it('never exposes the password hash on the profile', async () => {
    const profile = await createVerifiedAccount(EMAIL)
    expect(profile).not.toHaveProperty('passwordHash')
    expect(profile.hasPassword).toBe(true)
  })
})

describe('sign in verification', () => {
  it('asks for a code every time, even with the right password', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    const info = await startSignIn(EMAIL, 'secret123')
    expect(info.purpose).toBe('signin')
    expect(currentProfile()).toBeNull()
    await verifyCode(EMAIL, 'signin', peekDemoCode(EMAIL, 'signin')!)
    expect(currentProfile()?.email).toBe(EMAIL)
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    await createVerifiedAccount(EMAIL)
    const wrong = await startSignIn(EMAIL, 'nope1234').catch((e: Error) => e.message)
    const unknown = await startSignIn('who@example.com', 'secret123').catch((e: Error) => e.message)
    expect(wrong).toBe(unknown)
  })

  it('locks after repeated wrong passwords', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    for (let i = 0; i < 5; i++) await startSignIn(EMAIL, 'wrong1234').catch(() => undefined)
    await expect(startSignIn(EMAIL, 'secret123')).rejects.toThrow('Too many tries')
  })

  it('invalidates the code after five wrong guesses', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    await startSignIn(EMAIL, 'secret123')
    const real = peekDemoCode(EMAIL, 'signin')!
    const wrong = real === '000000' ? '111111' : '000000'
    for (let i = 0; i < 5; i++) await verifyCode(EMAIL, 'signin', wrong).catch(() => undefined)
    await expect(verifyCode(EMAIL, 'signin', real)).rejects.toThrow('expired')
    expect(currentProfile()).toBeNull()
  })

  it('makes the guest wait before another code is sent', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    await startSignIn(EMAIL, 'secret123')
    await expect(resendCode(EMAIL, 'signin')).rejects.toThrow('Wait')
  })
})

describe('google sign in', () => {
  it('still needs the emailed code', async () => {
    await signInWithGoogle({ email: 'maria@gmail.com', name: 'Maria Cruz', picture: null })
    expect(currentProfile()).toBeNull()
    await verifyCode('maria@gmail.com', 'signin', peekDemoCode('maria@gmail.com', 'signin')!)
    expect(currentProfile()).toMatchObject({ email: 'maria@gmail.com', hasGoogle: true, hasPassword: false })
  })

  it('links to an existing account with the same email', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    await signInWithGoogle({ email: EMAIL, name: 'Test Guest', picture: null })
    await verifyCode(EMAIL, 'signin', peekDemoCode(EMAIL, 'signin')!)
    expect(currentProfile()).toMatchObject({ hasGoogle: true, hasPassword: true })
  })
})

describe('forgot password', () => {
  it('resets only after the code is verified, then the new password works', async () => {
    await createVerifiedAccount(EMAIL)
    signOut()
    await requestPasswordReset(EMAIL)
    await expect(completePasswordReset(EMAIL, 'brandnew99')).rejects.toBeInstanceOf(AuthError)
    await verifyCode(EMAIL, 'reset', peekDemoCode(EMAIL, 'reset')!)
    await completePasswordReset(EMAIL, 'brandnew99')
    await expect(startSignIn(EMAIL, 'secret123')).rejects.toBeInstanceOf(AuthError)
    await expect(startSignIn(EMAIL, 'brandnew99')).resolves.toMatchObject({ purpose: 'signin' })
  })

  it('does not reveal whether the email has an account', async () => {
    const info = await requestPasswordReset('ghost@example.com')
    expect(info.purpose).toBe('reset')
    expect(peekDemoCode('ghost@example.com', 'reset')).toBeNull()
  })
})

describe('account settings', () => {
  it('needs the current password to change it', async () => {
    const profile = await createVerifiedAccount(EMAIL)
    await expect(changePassword(profile.id, 'wrong', 'newpass123')).rejects.toThrow('current password')
    await changePassword(profile.id, 'secret123', 'newpass123')
    signOut()
    await expect(startSignIn(EMAIL, 'newpass123')).resolves.toBeTruthy()
  })

  it('saves and unsaves rooms', async () => {
    const profile = await createVerifiedAccount(EMAIL)
    toggleSavedRoom(profile.id, 'twin')
    expect(currentProfile()?.saved).toEqual(['twin'])
    toggleSavedRoom(profile.id, 'twin')
    expect(currentProfile()?.saved).toEqual([])
  })

  it('updates personal details and validates them', async () => {
    const profile = await createVerifiedAccount(EMAIL)
    await updateProfile(profile.id, { birthDate: '1995-04-12', address: 'Legazpi City, Albay', emergencyContact: 'Maria Reyes 09171234567' })
    expect(currentProfile()).toMatchObject({ birthDate: '1995-04-12', address: 'Legazpi City, Albay' })
    await expect(updateProfile(profile.id, { birthDate: '2999-01-01' })).rejects.toThrow('date of birth')
    await expect(updateProfile(profile.id, { mobile: '123' })).rejects.toThrow('mobile')
    await expect(updateProfile(profile.id, { name: 'A' })).rejects.toThrow('full name')
  })

  it('sets and removes the profile photo', async () => {
    const profile = await createVerifiedAccount(EMAIL)
    setAvatar(profile.id, 'data:image/jpeg;base64,AAAA')
    expect(currentProfile()?.avatar).toBe('data:image/jpeg;base64,AAAA')
    setAvatar(profile.id, null)
    expect(currentProfile()?.avatar).toBeNull()
  })
})
