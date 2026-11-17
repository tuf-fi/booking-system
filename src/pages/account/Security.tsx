import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, MailCheck } from 'lucide-react'
import { AccountCard } from '../../components/AccountCard'
import { PasswordField } from '../../components/auth/PasswordField'
import { useToast } from '../../components/Toast'
import { passwordProblem } from '../../lib/validation'
import { AuthError, changePassword, signOut, useAccount } from '../../store/accounts'

export function Security() {
  const account = useAccount()!
  const toast = useToast()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({})
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: typeof errors = {}
    if (account.hasPassword && !current) found.current = 'Enter your current password.'
    const problem = passwordProblem(next)
    if (problem) found.next = problem
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await changePassword(account.id, current, next)
      setCurrent('')
      setNext('')
      toast(account.hasPassword ? 'Your password was changed.' : 'Your password was set.')
    } catch (failure) {
      const message = failure instanceof AuthError ? failure.message : 'Could not save. Try again.'
      setErrors(account.hasPassword && message.includes('current') ? { current: message } : { next: message })
    } finally {
      setBusy(false)
    }
  }

  const status = (on: boolean, yes: string, no: string) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${on ? 'text-primary-deep' : 'text-muted'}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${on ? 'bg-primary' : 'bg-muted/50'}`} />
      {on ? yes : no}
    </span>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <AccountCard icon={KeyRound} title={account.hasPassword ? 'Change password' : 'Set a password'}>
        <p className="pb-3 text-sm leading-[1.6] text-muted">
          {account.hasPassword ? 'Use a password you do not use anywhere else.' : 'You signed up with Google. Add a password to sign in with your email too.'}
        </p>
        <form onSubmit={submit} noValidate className="space-y-4">
          {account.hasPassword && <PasswordField id="s-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" error={errors.current} />}
          <PasswordField id="s-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" error={errors.next} hint="At least 8 characters, with a letter and a number." />
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm px-5">{busy ? 'Saving…' : account.hasPassword ? 'Change password' : 'Set password'}</button>
        </form>
      </AccountCard>

      <div className="space-y-6">
        <AccountCard icon={MailCheck} title="How you sign in">
          <div className="py-2.5">
            <p className="text-xs text-muted">Email code</p>
            <p className="mt-0.5 text-sm font-bold">Sent to {account.email} on every sign-in</p>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <div>
              <p className="text-xs text-muted">Password</p>
              <p className="mt-0.5 text-sm font-bold">{account.hasPassword ? 'Set' : 'Not set'}</p>
            </div>
            {status(account.hasPassword, 'On', 'Off')}
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <div>
              <p className="text-xs text-muted">Google</p>
              <p className="mt-0.5 text-sm font-bold">{account.hasGoogle ? 'Connected' : 'Not connected'}</p>
            </div>
            {status(account.hasGoogle, 'On', 'Off')}
          </div>
        </AccountCard>

        <AccountCard icon={LogOut} title="Sign out">
          <p className="pb-3 text-sm leading-[1.6] text-muted">Sign out of Lantaw Inn on this device.</p>
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/', { replace: true })
              toast('You are signed out.')
            }}
            className="btn btn-ghost btn-sm"
          >
            <LogOut size={15} aria-hidden />Sign out
          </button>
        </AccountCard>
      </div>
    </div>
  )
}
