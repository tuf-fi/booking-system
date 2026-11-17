import { useState } from 'react'
import { googleConfigured, requestGoogleProfile } from '../../lib/google'
import type { GoogleProfile } from '../../store/accounts'
import { Dialog } from '../Dialog'

interface GoogleButtonProps {
  label: string
  onProfile: (profile: GoogleProfile) => void
  onError: (message: string) => void
  disabled?: boolean
}

const DEMO_GOOGLE_ACCOUNTS: GoogleProfile[] = [
  { name: 'Carlo Mendoza', email: 'carlo.mendoza@gmail.com', picture: null },
  { name: 'Bea Ramos', email: 'bea.ramos@gmail.com', picture: null }
]

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export function GoogleButton({ label, onProfile, onError, disabled }: GoogleButtonProps) {
  const [chooser, setChooser] = useState(false)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    if (!googleConfigured) {
      setChooser(true)
      return
    }
    setBusy(true)
    try {
      onProfile(await requestGoogleProfile())
    } catch (failure) {
      onError(failure instanceof Error ? failure.message : 'Google sign-in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={start} disabled={disabled || busy} className="btn btn-ghost btn-block bg-surface">
        <GoogleMark />
        {busy ? 'Opening Google…' : label}
      </button>

      <Dialog open={chooser} onClose={() => setChooser(false)} title="Choose a Google account">
        <p className="text-sm leading-[1.65] text-muted">Demo accounts. Real Google sign-in turns on when a Google client ID is set in <b>VITE_GOOGLE_CLIENT_ID</b>.</p>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {DEMO_GOOGLE_ACCOUNTS.map(account => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => {
                  setChooser(false)
                  onProfile(account)
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sand"
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-tint text-sm font-extrabold text-primary-deep">{account.name.slice(0, 1)}</span>
                <span>
                  <span className="block text-base font-bold">{account.name}</span>
                  <span className="block text-sm text-muted">{account.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  )
}
