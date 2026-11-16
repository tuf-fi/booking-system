import { describe, expect, it, vi } from 'vitest'
import { buildMailto, sendInquiry, validateInquiry } from './inquiry'

const valid = { name: 'Ana Reyes', email: 'ana@example.com', mobile: '', message: 'Is the roof deck open at night?' }

describe('validateInquiry', () => {
  it('accepts a complete inquiry with no mobile number', () => {
    expect(validateInquiry(valid)).toEqual({})
  })

  it('flags every missing or malformed field', () => {
    const errors = validateInquiry({ name: ' ', email: 'nope', mobile: '123', message: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'mobile', 'name'])
  })
})

describe('buildMailto', () => {
  it('puts the guest details and message in an encoded mailto link', () => {
    const link = buildMailto({ ...valid, mobile: '0917 123 4567' }, 'owner@example.com')
    expect(link.startsWith('mailto:owner@example.com?subject=')).toBe(true)
    expect(decodeURIComponent(link)).toContain('Mobile: 0917 123 4567')
    expect(decodeURIComponent(link)).toContain('Is the roof deck open at night?')
  })
})

describe('sendInquiry', () => {
  it('posts the inquiry to the endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    await expect(sendInquiry(valid, 'https://example.com/f/abc', fetcher)).resolves.toBe('sent')
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://example.com/f/abc')
    expect(JSON.parse(init.body)).toMatchObject({ name: 'Ana Reyes', email: 'ana@example.com' })
  })

  it('throws when the endpoint rejects the inquiry', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false })
    await expect(sendInquiry(valid, 'https://example.com/f/abc', fetcher)).rejects.toThrow()
  })
})
