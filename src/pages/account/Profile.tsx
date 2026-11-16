import { useRef, useState, type FormEvent } from 'react'
import { BadgeCheck, Camera, Pencil, Phone, Plus, ShieldAlert, UserRound } from 'lucide-react'
import { AccountCard } from '../../components/AccountCard'
import { Avatar } from '../../components/Avatar'
import { useToast } from '../../components/Toast'
import { parseKey, today } from '../../lib/dates'
import { downscaleImage } from '../../lib/format'
import { AuthError, setAvatar, updateProfile, useAccount, type ProfilePatch } from '../../store/accounts'

type Field = keyof ProfilePatch

interface FieldConfig {
  field: Field
  label: string
  success: string
  input: { type?: 'date'; inputMode?: 'tel'; autoComplete: string; placeholder?: string }
}

const FIELD: Record<Field, FieldConfig> = {
  name: { field: 'name', label: 'Full name', success: 'Your name was updated.', input: { autoComplete: 'name' } },
  mobile: { field: 'mobile', label: 'Mobile number', success: 'Your mobile number was updated.', input: { inputMode: 'tel', autoComplete: 'tel', placeholder: '0917 123 4567' } },
  birthDate: { field: 'birthDate', label: 'Date of birth', success: 'Your date of birth was updated.', input: { type: 'date', autoComplete: 'bday' } },
  address: { field: 'address', label: 'Address', success: 'Your address was updated.', input: { autoComplete: 'street-address', placeholder: 'City and province, like Legazpi City, Albay' } },
  emergencyContact: { field: 'emergencyContact', label: 'Name and mobile number', success: 'Your emergency contact was updated.', input: { autoComplete: 'off', placeholder: 'Maria Reyes, 0917 123 4567' } }
}

const showValue = (field: Field, value: string) =>
  field === 'birthDate' ? parseKey(value).toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : value

export function Profile() {
  const account = useAccount()!
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<Field | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const current = (field: Field) => account[field] ?? ''

  const start = (field: Field) => {
    setEditing(field)
    setDraft(current(field))
    setError(null)
  }

  const cancel = () => {
    setEditing(null)
    setError(null)
  }

  const save = async (event: FormEvent, config: FieldConfig) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await updateProfile(account.id, { [config.field]: draft })
      toast(config.success)
      setEditing(null)
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : 'Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      setAvatar(account.id, await downscaleImage(file, 320, 0.85))
      toast('Your profile photo was updated.')
    } catch {
      toast('We could not read that file. Choose a photo.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const item = (field: Field, label: string, empty = 'Not added') => {
    const config = FIELD[field]
    const value = current(field)
    if (editing === field) {
      return (
        <form key={field} onSubmit={event => save(event, config)} noValidate className="py-2.5">
          <label htmlFor={`p-${field}`} className="text-xs text-muted">{label}</label>
          <div className="mt-1.5 flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1 basis-48">
              <input
                id={`p-${field}`}
                autoFocus
                className="field field-compact rounded-none"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                max={config.input.type === 'date' ? today() : undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `p-${field}-error` : undefined}
                {...config.input}
              />
              {error && <p id={`p-${field}-error`} role="alert" className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>}
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary btn-sm h-[2.6rem] rounded-none px-5">{busy ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={cancel} className="btn btn-ghost btn-sm h-[2.6rem] rounded-none px-4">Cancel</button>
          </div>
        </form>
      )
    }
    return (
      <div key={field} className="group flex items-center justify-between gap-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className={`mt-0.5 break-words text-[0.875rem] ${value ? 'font-bold' : 'text-muted/70'}`}>{value ? showValue(field, value) : empty}</p>
        </div>
        <button
          type="button"
          onClick={() => start(field)}
          aria-label={`${value ? 'Edit' : 'Add'} ${label.toLowerCase()}`}
          className="grid size-8 shrink-0 place-items-center text-muted transition-colors hover:bg-sand hover:text-ink"
        >
          {value ? <Pencil size={14} aria-hidden /> : <Plus size={16} aria-hidden />}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <AccountCard icon={Camera} title="Profile photo">
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Avatar profile={account} className="size-16 text-xl" />
              <input ref={fileRef} id="p-photo" type="file" accept="image/*" className="sr-only" onChange={event => onPhoto(event.target.files?.[0])} />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-ghost btn-sm rounded-none"><Camera size={15} aria-hidden />{uploading ? 'Uploading…' : account.avatar ? 'Change photo' : 'Add photo'}</button>
                {account.avatar && (
                  <button type="button" onClick={() => { setAvatar(account.id, null); toast('Your profile photo was removed.') }} className="btn btn-ghost btn-sm rounded-none text-danger">Remove</button>
                )}
              </div>
            </div>
          </AccountCard>
          <AccountCard icon={Phone} title="Contact">
            {item('mobile', 'Mobile number')}
            <div className="py-2.5">
              <p className="text-xs text-muted">Email</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 break-words text-[0.875rem] font-bold">
                {account.email}
                <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf-deep"><BadgeCheck size={13} aria-hidden />Verified</span>
              </p>
            </div>
          </AccountCard>
          <AccountCard icon={ShieldAlert} title="Emergency contact">
            {item('emergencyContact', 'Name and mobile number')}
          </AccountCard>
        </div>

        <AccountCard icon={UserRound} title="About you">
          {item('name', 'Full name')}
          {item('birthDate', 'Date of birth')}
          {item('address', 'Address')}
        </AccountCard>
      </div>
    </div>
  )
}
