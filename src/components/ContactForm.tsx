import { FormEvent, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

const STORAGE_KEY = 'lantaw.inquiries'

const labelClass = 'text-xs font-bold uppercase tracking-[0.18em] text-white/60'
const inputClass =
  'mt-2 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 text-base text-white placeholder:text-white/40 transition-colors duration-300 focus:border-white focus:outline-none focus:ring-0'

const saveInquiry = (inquiry: Record<string, string>) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown[]
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, { ...inquiry, sentAt: new Date().toISOString() }]))
  } catch {
    return
  }
}

export function ContactForm() {
  const [sent, setSent] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    saveInquiry(data)
    setSent(true)
  }

  if (sent) {
    return (
      <div role="status" className="grid min-h-[22rem] place-content-center justify-items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-white text-ink"><Check aria-hidden size={22} /></span>
        <h3 className="text-2xl font-extrabold leading-tight">Message sent</h3>
        <p className="max-w-sm leading-relaxed text-white/70">Thanks for writing. For anything urgent, call us on 0917 555 0142.</p>
        <button type="button" onClick={() => setSent(false)} className="text-sm underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">Send another message</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-10">
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input name="name" type="text" required autoComplete="name" placeholder="Your name" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@email.com" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Subject</span>
          <input name="subject" type="text" required placeholder="What is this about?" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Message</span>
          <textarea name="message" required rows={4} placeholder="Tell us about your stay" className={`${inputClass} resize-none`} />
        </label>
      </div>
      <button type="submit" className="group btn mt-9 w-full bg-white py-4 text-ink transition-colors hover:bg-sun">
        Send message
        <ArrowRight aria-hidden size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </form>
  )
}
