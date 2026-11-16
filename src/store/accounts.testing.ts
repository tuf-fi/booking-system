import { peekDemoCode, registerAccount, verifyCode } from './accounts'

export const createVerifiedAccount = async (email = 'guest@example.com') => {
  await registerAccount({ name: 'Test Guest', email, mobile: '09171234567', password: 'secret123' })
  const profile = await verifyCode(email, 'signup', peekDemoCode(email, 'signup')!)
  return profile!
}
