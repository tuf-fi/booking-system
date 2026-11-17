import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BarChart3, BedDouble, Building2, CalendarDays, ExternalLink, LayoutDashboard, ListChecks, LogOut, RotateCcw, SprayCan, Tags, Users, Wallet } from 'lucide-react'
import { demoCredentials, signIn, signOut, useSignedIn } from '../../lib/auth'
import { resetDemo } from '../../store/api'
import { waitingForApproval } from '../../lib/reports'
import { useDb } from '../../store/db'
import { Dialog } from '../Dialog'
import { Logo } from '../Logo'
import { useToast } from '../Toast'

const GROUPS = [
  {
    label: 'Daily',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/bookings', label: 'Bookings', icon: ListChecks, end: false },
      { to: '/admin/calendar', label: 'Calendar', icon: CalendarDays, end: false },
      { to: '/admin/housekeeping', label: 'Housekeeping', icon: SprayCan, end: false }
    ]
  },
  {
    label: 'Guests and money',
    items: [
      { to: '/admin/guests', label: 'Guests', icon: Users, end: false },
      { to: '/admin/payments', label: 'Payments', icon: Wallet, end: false },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false }
    ]
  },
  {
    label: 'Setup',
    items: [
      { to: '/admin/rooms', label: 'Rooms', icon: BedDouble, end: false },
      { to: '/admin/rates', label: 'Rates and fees', icon: Tags, end: false },
      { to: '/admin/property', label: 'Property', icon: Building2, end: false }
    ]
  }
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
    <div className="container-page grain grid min-h-[70vh] place-items-center py-16">
      <form onSubmit={submit} className="glass-strong w-full max-w-md rounded-panel p-8">
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
        <Link to="/" className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">Back to the guest site</Link>
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

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `flex shrink-0 items-center gap-3 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-primary-tint text-primary-deep' : 'text-muted hover:bg-sand hover:text-ink'}`

  const tools = [
    { label: 'View site', icon: ExternalLink, to: '/' },
    { label: 'Reset demo', icon: RotateCcw, onClick: () => setResetting(true) },
    { label: 'Sign out', icon: LogOut, onClick: signOut }
  ]

  return (
    <div className="grain min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="glass glass-data rounded-none border-x-0 border-t-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-y-0 lg:border-l-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="leading-tight">
              <p className="font-display text-base font-extrabold">Lantaw admin</p>
              <p className="text-xs text-muted">Legazpi City</p>
            </div>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            {tools.map(({ label, icon: Icon, to, onClick }) =>
              to ? (
                <Link key={label} to={to} aria-label={label} className="grid size-9 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"><Icon size={16} /></Link>
              ) : (
                <button key={label} type="button" aria-label={label} onClick={onClick} className="grid size-9 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"><Icon size={16} /></button>
              )
            )}
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:overflow-x-visible lg:pb-3">
          {GROUPS.map((group, index) => (
            <div key={group.label} role="group" aria-label={group.label} className={`flex shrink-0 gap-1 lg:flex-col ${index > 0 ? 'border-l border-ink/10 pl-1 lg:mt-4 lg:border-l-0 lg:pl-0' : ''}`}>
              <p aria-hidden className="hidden px-3.5 pb-1 text-xs font-semibold text-muted lg:block">{group.label}</p>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navItem}>
                  <Icon size={17} aria-hidden />{label}
                  {to === '/admin/bookings' && waiting > 0 && <span className="chip ml-auto min-w-5 justify-center bg-accent px-1.5 text-ink">{waiting}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-line p-3 lg:block">
          {tools.map(({ label, icon: Icon, to, onClick }) =>
            to ? (
              <Link key={label} to={to} className="flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-sand hover:text-ink"><Icon size={16} aria-hidden />{label}</Link>
            ) : (
              <button key={label} type="button" onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 rounded-full px-3.5 py-2.5 text-left text-sm font-semibold text-muted transition-colors hover:bg-sand hover:text-ink"><Icon size={16} aria-hidden />{label}</button>
            )
          )}
        </div>
      </aside>
      <main className="min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>

      <Dialog open={resetting} onClose={() => setResetting(false)} title="Reset demo data?">
        <p className="text-muted">This removes the bookings and changes you made in the demo and puts back the sample data.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setResetting(false)}>Keep my changes</button>
          <button type="button" className="btn btn-secondary" onClick={() => { resetDemo(); setResetting(false); toast('Demo data reset.') }}>Reset demo</button>
        </div>
      </Dialog>
    </div>
  )
}
