import { isValidMobile } from '../store/api'

export const INQUIRY_FALLBACK_EMAIL = 'inquiries@lantaw.example'

export type InquiryInput = {
  name: string
  email: string
  mobile: string
  message: string
}

export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>

export type InquiryResult = 'sent' | 'mail-app'

type Fetcher = (input: string, init: RequestInit) => Promise<{ ok: boolean }>

export function validateInquiry(input: InquiryInput): InquiryErrors {
  const errors: InquiryErrors = {}
  if (!input.name.trim()) errors.name = 'Tell us your name.'
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.email = 'Enter an email we can reply to.'
  if (input.mobile.trim() && !isValidMobile(input.mobile)) errors.mobile = 'Enter an 11-digit mobile number, like 0917 123 4567.'
  if (!input.message.trim()) errors.message = 'Write your question so we can answer it.'
  return errors
}

export function buildMailto(input: InquiryInput, to = INQUIRY_FALLBACK_EMAIL) {
  const subject = `Inquiry from ${input.name.trim()}`
  const lines = [input.message.trim(), '', `Name: ${input.name.trim()}`, `Email: ${input.email.trim()}`]
  if (input.mobile.trim()) lines.push(`Mobile: ${input.mobile.trim()}`)
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}

export async function sendInquiry(
  input: InquiryInput,
  endpoint: string | undefined = import.meta.env.VITE_INQUIRY_ENDPOINT,
  fetcher: Fetcher = fetch
): Promise<InquiryResult> {
  if (!endpoint) {
    window.location.href = buildMailto(input)
    return 'mail-app'
  }
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim(),
      mobile: input.mobile.trim(),
      message: input.message.trim(),
      _subject: `Inquiry from ${input.name.trim()}`
    })
  })
  if (!response.ok) throw new Error('Inquiry was not delivered')
  return 'sent'
}
