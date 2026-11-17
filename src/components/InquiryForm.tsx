import { useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { SITE } from '../lib/site'
import { sendInquiry, validateInquiry, type InquiryErrors, type InquiryInput, type InquiryResult } from '../lib/inquiry'

const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-muted'
const inputClass =
  'block w-full border-0 border-b border-ink/30 bg-transparent px-1 py-2 text-base text-ink transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-muted focus:border-primary focus:bg-primary-tint/50 focus:shadow-[0_1px_0_0_var(--color-primary)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-danger'

const EMPTY: InquiryInput = { name: '', email: '', mobile: '', message: '' }

type Status = 'idle' | 'sending' | 'failed'

export function InquiryForm() {
  const [form, setForm] = useState<InquiryInput>(EMPTY)
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<InquiryResult | null>(null)
  const confirmationRef = useRef<HTMLHeadingElement>(null)

  const update = (field: keyof InquiryInput, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    if (errors[field]) setErrors(current => ({ ...current, [field]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found = validateInquiry(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = (['name', 'email', 'mobile', 'message'] as const).find(field => found[field])
      if (first) document.getElementById(`inq-${first}`)?.focus()
      return
    }
    setStatus('sending')
    try {
      const outcome = await sendInquiry(form)
      setResult(outcome)
      setStatus('idle')
      requestAnimationFrame(() => confirmationRef.current?.focus())
    } catch {
      setStatus('failed')
    }
  }

  const reset = () => {
    setForm(EMPTY)
    setErrors({})
    setResult(null)
  }

  if (result) {
    return (
      <div className="p-6 sm:p-9">
        <span aria-hidden className="grid size-11 place-items-center rounded-full bg-primary text-white">
          <Check size={20} strokeWidth={2.25} />
        </span>
        <h3 ref={confirmationRef} tabIndex={-1} className="mt-6 text-xl font-extrabold leading-tight outline-none">
          {result === 'sent' ? 'Inquiry sent' : 'Almost there'}
        </h3>
        <p className="mt-3 max-w-md text-base leading-[1.7] text-muted">
          {result === 'sent'
            ? `Thanks, ${form.name.trim().split(' ')[0]}. We will reply to ${form.email.trim()}.`
            : 'Your email app should have opened with your message ready. Press send there to finish.'}
        </p>
        <button type="button" onClick={reset} className="btn btn-ghost mt-8">Send another inquiry</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="p-6 sm:p-9" aria-labelledby="inquiry-h">
      <h3 id="inquiry-h" className="mb-3 text-lg font-bold leading-tight">Send a message</h3>
      <div className="grid gap-y-6">
        <div>
          <label className={labelClass} htmlFor="inq-name">Full name</label>
          <input id="inq-name" className={inputClass} autoComplete="name" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'inq-name-e' : undefined} />
          {errors.name && <p id="inq-name-e" className="mt-1.5 text-sm text-danger">{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="inq-email">E-mail</label>
          <input id="inq-email" type="email" className={inputClass} autoComplete="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'inq-email-e' : undefined} />
          {errors.email && <p id="inq-email-e" className="mt-1.5 text-sm text-danger">{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="inq-message">Message</label>
          <textarea id="inq-message" rows={2} className={`${inputClass} resize-none`} placeholder="How can we help?" value={form.message} onChange={e => update('message', e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'inq-message-e' : undefined} />
          {errors.message && <p id="inq-message-e" className="mt-1.5 text-sm text-danger">{errors.message}</p>}
        </div>
      </div>

      {status === 'failed' && (
        <p role="alert" className="mt-5 rounded-control bg-danger-tint px-4 py-3 text-sm leading-relaxed text-danger">
          We could not send your inquiry. Try again, or text us at {SITE.phone}.
        </p>
      )}

      <button type="submit" disabled={status === 'sending'} className="btn btn-secondary mt-8 w-full py-4 text-sm">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
