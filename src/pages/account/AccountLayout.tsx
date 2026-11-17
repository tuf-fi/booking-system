import { useEffect, useRef } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Heart, LockKeyhole, Luggage, UserRound } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { firstName } from '../../lib/format'
import { useAccount } from '../../store/accounts'

const TABS = [
  { to: '/account', label: 'Trips', icon: Luggage, end: true },
  { to: '/account/saved', label: 'Saved rooms', icon: Heart, end: false },
  { to: '/account/profile', label: 'Profile', icon: UserRound, end: false },
  { to: '/account/security', label: 'Security', icon: LockKeyhole, end: false }
]

export function AccountLayout() {
  const account = useAccount()
  const location = useLocation()
  const tabsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [location.pathname, account?.id])

  const memberSince = account ? new Date(account.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' }) : ''

  if (!account) return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />

  return (
    <div className="container-page grain pb-10 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4 glass glass-data p-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar profile={account} className="size-12 text-base" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold leading-tight">Hi, {firstName(account.name)}</h1>
            <p className="mt-0.5 truncate text-sm text-muted">{account.email} · Member since {memberSince}</p>
          </div>
        </div>
        <Link to="/book" className="btn btn-primary h-10 min-h-0 px-5 text-sm">Book a room</Link>
      </header>

      <nav ref={tabsRef} aria-label="Account" className="-mx-5 mt-6 overflow-x-auto overflow-y-hidden border-b border-line px-5 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-1">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 border-b-2 px-3.5 text-sm font-bold transition-colors ${isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              >
                <Icon size={15} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  )
}
