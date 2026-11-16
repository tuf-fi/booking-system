import { useState, type FormEvent } from 'react'
import { demoGuest, demoSignUp } from '../../data/seedAccounts'
import { isValidEmail, isValidMobile, passwordProblem } from '../../lib/validation'
import {
  AuthError,
  completePasswordReset,
  registerAccount,
  requestPasswordReset,
  signInWithGoogle,
  startSignIn,
  type ChallengeInfo,
  type GoogleProfile,
  type Profile
} from '../../store/accounts'
import { CodeStep } from './CodeStep'
import { GoogleButton } from './GoogleButton'
import { PasswordField } from './PasswordField'

export type AuthMode = 'signin' | 'signup' | 'forgot'

type Step = 'form' | 'verify' | 'newpassword'

interface AuthFlowProps {
  initialMode: AuthMode
  initialEmail?: string
  notice?: string | null
  embedded?: boolean
  onSignedIn: (profile: Profile) => void
  onModeChange?: (mode: AuthMode, carry: { email: string; notice: string | null }) => void
}

type FieldErrors = Partial<Record<'name' | 'email' | 'mobile' | 'password', string>>

const asMessage = (failure: unknown, fallback = 'Something went wrong. Try again.') => (failure instanceof AuthError || failure instanceof Error ? failure.message : fallback)

const TITLES: Record<AuthMode, string> = {
  signin: 'Sign in',
  signup: 'Create your account',
  forgot: 'Reset your password'
}

const INTROS: Record<AuthMode, string> = {
  signin: '',
  signup: '',
  forgot: 'Enter the email you signed up with. We will send a code so you can choose a new password.'
}

export function AuthFlow({ initialMode, initialEmail, notice, embedded = false, onSignedIn, onModeChange }: AuthFlowProps) {
  const [mode, setModeState] = useState(initialMode)
  const [step, setStep] = useState<Step>('form')
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null)
  const [name, setName] = useState(initialMode === 'signup' ? demoSignUp.name : '')
  const [mobile, setMobile] = useState(initialMode === 'signup' ? demoSignUp.mobile : '')
  const [email, setEmail] = useState(initialEmail || (initialMode === 'signup' ? demoSignUp.email : initialMode === 'signin' ? demoGuest.email : ''))
  const [password, setPassword] = useState(initialMode === 'signup' ? demoSignUp.password : initialMode === 'signin' && !initialEmail ? demoGuest.password : '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(notice ?? null)
  const [busy, setBusy] = useState(false)

  const Heading = embedded ? 'h2' : 'h1'

  const changeMode = (next: AuthMode, carry: { email: string; notice: string | null } = { email, notice: null }) => {
    setModeState(next)
    setStep('form')
    setErrors({})
    setFormError(null)
    setMessage(carry.notice)
    setPassword('')
    setChallenge(null)
    onModeChange?.(next, carry)
  }

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    setFormError(null)
    setMessage(null)
    try {
      await task()
    } catch (failure) {
      setFormError(asMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  const submitSignIn = (event: FormEvent) => {
    event.preventDefault()
    const found: FieldErrors = {}
    if (!isValidEmail(email)) found.email = 'Enter a valid email address.'
    if (!password) found.password = 'Enter your password.'
    setErrors(found)
    if (Object.keys(found).length) return
    run(async () => {
      setChallenge(await startSignIn(email, password))
      setStep('verify')
    })
  }

  const submitSignUp = (event: FormEvent) => {
    event.preventDefault()
    const found: FieldErrors = {}
    if (name.trim().length < 2) found.name = 'Enter your full name.'
    if (!isValidEmail(email)) found.email = 'Enter a valid email address.'
    if (!isValidMobile(mobile)) found.mobile = 'Enter an 11-digit mobile number, like 0917 123 4567.'
    const problem = passwordProblem(password)
    if (problem) found.password = problem
    setErrors(found)
    if (Object.keys(found).length) return
    run(async () => {
      setChallenge(await registerAccount({ name, email, mobile, password }))
      setStep('verify')
    })
  }

  const submitForgot = (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setErrors({ email: 'Enter a valid email address.' })
      return
    }
    setErrors({})
    run(async () => {
      setChallenge(await requestPasswordReset(email))
      setStep('verify')
    })
  }

  const submitNewPassword = (event: FormEvent) => {
    event.preventDefault()
    const problem = passwordProblem(password)
    setErrors(problem ? { password: problem } : {})
    if (problem) return
    run(async () => {
      await completePasswordReset(email, password)
      changeMode('signin', { email, notice: 'Password changed. Sign in with your new password.' })
    })
  }

  const onGoogle = (profile: GoogleProfile) =>
    run(async () => {
      setEmail(profile.email)
      setChallenge(await signInWithGoogle(profile))
      setStep('verify')
    })

  const onVerified = (profile: Profile | null) => {
    if (profile) onSignedIn(profile)
    else {
      setPassword('')
      setStep('newpassword')
    }
  }

  const heading = step === 'verify' ? 'Check your email' : step === 'newpassword' ? 'Choose a new password' : TITLES[mode]
  const intro = step === 'verify' ? null : step === 'newpassword' ? 'Pick a password you have not used before. You will sign in with it next.' : INTROS[mode]

  return (
    <div>
      <Heading className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{heading}</Heading>
      {intro && <p className="mt-2 text-[0.875rem] leading-[1.65] text-muted">{intro}</p>}

      {message && <p role="status" className="mt-5 bg-leaf-tint px-4 py-3 text-[0.875rem] font-bold text-leaf-deep">{message}</p>}

      <div className="mt-6">
        {step === 'verify' && challenge && (
          <CodeStep
            key={`${challenge.purpose}:${challenge.email}`}
            info={challenge}
            onVerified={onVerified}
            onBack={() => {
              setStep('form')
              setChallenge(null)
              setPassword('')
            }}
            backLabel={mode === 'forgot' ? 'Use a different email' : 'Back'}
          />
        )}

        {step === 'newpassword' && (
          <form onSubmit={submitNewPassword} noValidate className="space-y-5">
            <PasswordField id="auth-new" label="New password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} hint="At least 8 characters, with a letter and a number." />
            {formError && <p role="alert" className="text-[0.875rem] font-bold text-danger">{formError}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary btn-block rounded-none">{busy ? 'Saving…' : 'Save new password'}</button>
          </form>
        )}

        {step === 'form' && mode === 'signin' && (
          <form onSubmit={submitSignIn} noValidate className="space-y-5">
            <div>
              <label className="label" htmlFor="auth-email">Email <span aria-hidden className="text-danger">*</span></label>
              <input id="auth-email" type="email" className="field field-compact rounded-none" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
              {errors.email && <p id="auth-email-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.email}</p>}
            </div>
            <PasswordField
              id="auth-password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              error={errors.password}
              aside={<button type="button" onClick={() => changeMode('forgot')} className="text-[0.8125rem] font-bold text-leaf hover:underline">Forgot password?</button>}
            />
            {formError && <p role="alert" className="text-[0.875rem] font-bold text-danger">{formError}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary btn-block rounded-none">{busy ? 'Checking…' : 'Sign in'}</button>
          </form>
        )}

        {step === 'form' && mode === 'signup' && (
          <form onSubmit={submitSignUp} noValidate className="space-y-5">
            <div>
              <label className="label" htmlFor="auth-name">Full name <span aria-hidden className="text-danger">*</span></label>
              <input id="auth-name" className="field field-compact rounded-none" autoComplete="name" value={name} onChange={e => setName(e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'auth-name-error' : undefined} />
              {errors.name && <p id="auth-name-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="auth-email">Email <span aria-hidden className="text-danger">*</span></label>
              <input id="auth-email" type="email" className="field field-compact rounded-none" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
              {errors.email && <p id="auth-email-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.email}</p>}
            </div>
            <div>
              <label className="label" htmlFor="auth-mobile">Mobile number <span aria-hidden className="text-danger">*</span></label>
              <input id="auth-mobile" className="field field-compact rounded-none" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={mobile} onChange={e => setMobile(e.target.value)} aria-invalid={Boolean(errors.mobile)} aria-describedby="auth-mobile-hint" />
              <p id="auth-mobile-hint" className={`mt-1.5 text-[0.8125rem] ${errors.mobile ? 'text-danger' : 'text-muted'}`}>{errors.mobile ?? 'We text your booking updates here.'}</p>
            </div>
            <PasswordField id="auth-password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} hint="At least 8 characters, with a letter and a number." />
            {formError && <p role="alert" className="text-[0.875rem] font-bold text-danger">{formError}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary btn-block rounded-none">{busy ? 'Creating…' : 'Create account'}</button>
          </form>
        )}

        {step === 'form' && mode === 'forgot' && (
          <form onSubmit={submitForgot} noValidate className="space-y-5">
            <div>
              <label className="label" htmlFor="auth-email">Email <span aria-hidden className="text-danger">*</span></label>
              <input id="auth-email" type="email" className="field field-compact rounded-none" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined} />
              {errors.email && <p id="auth-email-error" className="mt-1.5 text-[0.8125rem] text-danger">{errors.email}</p>}
            </div>
            {formError && <p role="alert" className="text-[0.875rem] font-bold text-danger">{formError}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary btn-block rounded-none">{busy ? 'Sending…' : 'Send code'}</button>
          </form>
        )}

        {step === 'form' && mode !== 'forgot' && (
          <>
            <div className="my-6 flex items-center gap-3 text-[0.8125rem] text-muted" role="separator">
              <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
            </div>
            <GoogleButton label={mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'} onProfile={onGoogle} onError={setFormError} disabled={busy} />
          </>
        )}
      </div>

      {step === 'form' && (
        <p className="mt-7 text-[0.875rem] text-muted">
          {mode === 'signin' && (
            <>New here? <button type="button" onClick={() => changeMode('signup', { email: '', notice: null })} className="font-bold text-leaf hover:underline">Create an account</button></>
          )}
          {mode === 'signup' && (
            <>Already have an account? <button type="button" onClick={() => changeMode('signin')} className="font-bold text-leaf hover:underline">Sign in</button></>
          )}
          {mode === 'forgot' && (
            <>Remembered it? <button type="button" onClick={() => changeMode('signin')} className="font-bold text-leaf hover:underline">Back to sign in</button></>
          )}
        </p>
      )}
    </div>
  )
}
