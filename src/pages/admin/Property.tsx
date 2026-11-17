import { useState, type FormEvent } from 'react'
import { LABEL, TEXTAREA, TextField } from '../../components/admin/fields'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/Toast'
import { SITE } from '../../lib/site'
import { updateSettings } from '../../store/api'
import { useDb } from '../../store/db'

export function Property() {
  const db = useDb()
  const toast = useToast()
  const { settings } = db
  const [form, setForm] = useState(() => ({
    innName: settings.innName ?? 'Lantaw Inn',
    address: settings.address ?? 'Legazpi City, Albay, Philippines',
    phone: settings.phone ?? SITE.phone,
    email: settings.email ?? '',
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    houseRules: (settings.houseRules ?? []).join('\n'),
    policyNote: settings.policyNote ?? ''
  }))
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof form>) => setForm(current => ({ ...current, ...patch }))

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (form.innName.trim().length < 2) return setError('Enter the name of your inn.')
    if (!form.checkInTime.trim() || !form.checkOutTime.trim()) return setError('Enter the check-in and check-out times.')
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address, or leave it empty.')
    setError('')
    updateSettings({
      ...settings,
      innName: form.innName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      checkInTime: form.checkInTime.trim(),
      checkOutTime: form.checkOutTime.trim(),
      houseRules: form.houseRules.split('\n').map(line => line.trim()).filter(Boolean),
      policyNote: form.policyNote.trim()
    })
    toast('Property details saved.')
  }

  return (
    <form onSubmit={save}>
      <PageHeader title="Property" description="Your inn's details, check-in times and house rules." />

      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
        <section className="glass glass-data p-5" aria-labelledby="p-inn">
          <h2 id="p-inn" className="text-base font-bold">The inn</h2>
          <div className="mt-4 space-y-3">
            <TextField id="p-name" label="Inn name" value={form.innName} onChange={value => set({ innName: value })} />
            <TextField id="p-address" label="Address" value={form.address} onChange={value => set({ address: value })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField id="p-phone" label="Phone" value={form.phone} onChange={value => set({ phone: value })} />
              <TextField id="p-email" label="Email" type="email" value={form.email} onChange={value => set({ email: value })} placeholder="hello@yourinn.ph" />
            </div>
          </div>
          <div className="mt-5 border-t border-ink/10 pt-5">
            <h3 className="text-sm font-bold">Arrival and departure</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <TextField id="p-in" label="Check-in from" value={form.checkInTime} onChange={value => set({ checkInTime: value })} placeholder="2 PM" />
              <TextField id="p-out" label="Check-out until" value={form.checkOutTime} onChange={value => set({ checkOutTime: value })} placeholder="11 AM" />
            </div>
          </div>
        </section>

        <section className="glass glass-data p-5" aria-labelledby="p-rules">
          <h2 id="p-rules" className="text-base font-bold">Rules and policy</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className={LABEL} htmlFor="p-rules-text">House rules (one per line)</label>
              <textarea id="p-rules-text" className={TEXTAREA} rows={6} value={form.houseRules} onChange={event => set({ houseRules: event.target.value })} placeholder={'No smoking inside\nQuiet hours from 10 PM'} />
            </div>
            <div>
              <label className={LABEL} htmlFor="p-policy">Extra note on payment and cancellation</label>
              <textarea id="p-policy" className={TEXTAREA} rows={4} value={form.policyNote} onChange={event => set({ policyNote: event.target.value })} placeholder="For example, refunds are sent by GCash within 3 days." />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">The cancellation window and down payment are set under Rates and fees.</p>
        </section>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button type="submit" className="btn btn-primary h-10 min-h-0 px-6 text-sm">Save changes</button>
      </div>
    </form>
  )
}
