import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  error?: string | null
  hint?: string
  aside?: React.ReactNode
}

export function PasswordField({ id, label, value, onChange, autoComplete, error, hint, aside }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="label !mb-0" htmlFor={id}>{label} <span aria-hidden className="text-danger">*</span></label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="field field-compact pr-12"
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-muted transition-colors hover:text-ink"
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
