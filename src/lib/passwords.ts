const ITERATIONS = 100_000

const toHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')

const fromHex = (hex: string) => Uint8Array.from(hex.match(/.{2}/g) ?? [], pair => parseInt(pair, 16))

export const makeSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)))

export const hashPassword = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(salt), iterations: ITERATIONS }, key, 256)
  return toHex(new Uint8Array(bits))
}

export const makeCode = () => {
  const [value] = crypto.getRandomValues(new Uint32Array(1))
  return String(value % 1_000_000).padStart(6, '0')
}
