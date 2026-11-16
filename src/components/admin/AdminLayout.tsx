import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BarChart3, CalendarDays, ExternalLink, LayoutDashboard, ListChecks, LogOut, RotateCcw, Tags } from 'lucide-react'
import { demoCredentials, signIn, signOut, useSignedIn } from '../../lib/auth'
import { resetDemo } from '../../store/api'
import { waitingForApproval } from '../../lib/reports'
import { useDb } from '../../store/db'
import { Dialog } from '../Dialog'
import { Logo } from '../Logo'
import { useToast } from '../Toast'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: ListChecks, end: false },
  { to: '/admin/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/admin/rooms', label: 'Rooms and rates', icon: Tags, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false }
]

function Login() {
  const [email, setEmail] = useState(demoCredentials.email)
  const [password, setPassword] = useState(demoCredentials.password)
  const [error, setError] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(!signIn(email, password))
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <form onSubmit={submit} className="card w-full max-w-md p-8 shadow-soft">
        <Logo className="size-11" />
        <h1 className="mt-5 text-3xl font-extrabold">Owner login</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage bookings, dates and rates. The demo login is filled in for you.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="a-email">Email</label>
            <input id="a-email" type="email" className="field" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="a-pass">Password</label>
            <input id="a-pass" type="password" className="field" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" aria-invalid={error} />
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-danger">That email or password is not right.</p>}
        <button type="submit" className="btn btn-primary btn-block mt-6">Sign in</button>
        <Link to="/" className="mt-4 block text-center text-sm font-semibold text-leaf hover:underline">Back to the guest site</Link>
      </form>
    </div>
  )
}

export function AdminLayout() {
  const signedIn = useSignedIn()
  const db = useDb()
  const toast = useToast()
  const [resetting, setResetting] = useState(false)
  const waiting = waitingForApproval(db).length

  if (!signedIn) return <Login />

  return (
    <div className="min-h-screen">
      <div className="glass-strong sticky top-0 z-40 rounded-none border-x-0 border-t-0">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold">Lantaw admin</p>
              <p className="hidden text-xs text-muted sm:block">Lantaw Inn, Legazpi City</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="btn btn-ghost btn-sm"><ExternalLink size={14} /><span className="hidden sm:inline">View site</span></Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetting(true)}><RotateCcw size={14} /><span className="hidden sm:inline">Reset demo</span></button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}><LogOut size={14} /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <nav aria-label="Admin" className="container-page -mb-px flex gap-1 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 border-b-[3px] px-3.5 py-3 text-sm font-semibold transition-colors ${isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
              <Icon size={16} />{label}
              {to === '/admin/bookings' && waiting > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-sun px-1.5 text-xs font-bold text-ink">{waiting}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="container-page pb-20 pt-8"><Outlet /></div>

      <Dialog open={resetting} onClose={() => setResetting(false)} title="Reset demo data?">
        <p className="text-muted">This removes the bookings and changes you made in the demo and puts back the sample data.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setResetting(false)}>Keep my changes</button>
          <button type="button" className="btn btn-dark" onClick={() => { resetDemo(); setResetting(false); toast('Demo data reset.') }}>Reset demo</button>
        </div>
      </Dialog>
    </div>
  )
}
