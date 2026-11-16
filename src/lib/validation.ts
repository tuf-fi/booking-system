export const normalizeMobile = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : digits
}

export const isValidMobile = (value: string) => /^(09|\+?639)\d{9}$/.test(value.replace(/[\s-]/g, ''))

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

export const passwordProblem = (password: string): string | null => {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.'
  return null
}
