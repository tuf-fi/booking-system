import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { AuthError, peekDemoCode, resendCode, verifyCode, type ChallengeInfo, type Profile } from '../../store/accounts'

interface CodeStepProps {
  info: ChallengeInfo
  onVerified: (profile: Profile | null) => void
  onBack: () => void
  backLabel: string
}

export function CodeStep({ info, onVerified, onBack, backLabel }: CodeStepProps) {
  const [current, setCurrent] = useState(info)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const demoCode = peekDemoCode(current.email, current.purpose)
  const secondsLeft = Math.max(0, Math.ceil((current.resendAt - now) / 1000))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onVerified(await verifyCode(current.email, current.purpose, code))
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  const resend = async () => {
    setError(null)
    try {
      const next = await resendCode(current.email, current.purpose)
      setCurrent(next)
      setNow(Date.now())
      setCode('')
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : 'Could not send a new code.')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm leading-[1.65] text-muted">
        Enter the 6-digit code we sent to <b className="text-ink">{current.email}</b>.
      </p>

      <div>
        <label className="label" htmlFor="auth-code">Verification code</label>
        <input
          id="auth-code"
          className="field field-compact font-display text-lg font-bold tabular-nums tracking-[0.35em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'auth-code-error' : 'auth-code-demo'}
        />
        {error && <p id="auth-code-error" role="alert" className="mt-1.5 text-sm text-danger">{error}</p>}
        <p id="auth-code-demo" className="mt-2 text-sm text-tertiary-deep">
          Demo: no email is sent.{' '}
          {demoCode ? (
            <>
              Your code is <b className="tabular-nums">{demoCode}</b>.{' '}
              <button type="button" onClick={() => { setCode(demoCode); setError(null) }} className="font-bold underline underline-offset-2">Fill it in</button>
            </>
          ) : (
            'There is no account with this email, so there is no code.'
          )}
        </p>
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary btn-block">{busy ? 'Checking…' : 'Verify and continue'}</button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1.5 font-bold text-ink hover:text-primary"><ArrowLeft size={14} aria-hidden />{backLabel}</button>
        <button type="button" onClick={resend} disabled={secondsLeft > 0} className="min-h-10 font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline">
          {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : 'Send a new code'}
        </button>
      </div>
    </form>
  )
}
