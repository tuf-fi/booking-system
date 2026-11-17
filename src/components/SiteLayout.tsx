import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Menu, Phone, UserRound, X } from 'lucide-react'
import { signOut, useAccount } from '../store/accounts'
import { AccountMenu } from './AccountMenu'
import { SITE } from '../lib/site'
import { Logo } from './Logo'

const SECTIONS = [
  { id: 'inn', label: 'The inn' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'location', label: 'Location' },
  { id: 'faq', label: 'Questions' }
]

export const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

const linkBase = 'group relative px-3 py-2 text-sm tracking-normal transition-colors duration-300'
const linkTone = (isActive: boolean) => (isActive ? 'font-bold text-ink' : 'font-bold text-ink/85 hover:text-ink')

function ActiveDot({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-x-0 -bottom-0.5 mx-auto size-1 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:bg-ink/30 group-hover:opacity-100'}`}
    />
  )
}

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setActive(null)
      return
    }
    const targets = SECTIONS.map(s => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    targets.forEach(target => observer.observe(target))
    const onScroll = () => {
      if (window.scrollY < 240) setActive(null)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [enabled])

  return active
}

export function SiteLayout() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const account = useAccount()
  const menuRef = useRef<HTMLDivElement>(null)
  const isHome = location.pathname === '/'
  const active = useActiveSection(isHome)

  useEffect(() => {
    setOpen(false)
    const target = (location.state as { scroll?: string } | null)?.scroll
    if (target) requestAnimationFrame(() => scrollToSection(target))
    else window.scrollTo(0, 0)
  }, [location.pathname, location.state])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const goTo = (id: string) => {
    setOpen(false)
    if (isHome) scrollToSection(id)
    else navigate('/', { state: { scroll: id } })
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-secondary focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

      <header className="sticky top-0 z-40 h-0">
        <div ref={menuRef} className="mx-auto max-w-5xl px-3 pt-2.5 sm:pt-3">
          <div className={`flex h-14 items-center justify-between gap-3 rounded-full pl-3 pr-2 transition-all duration-300 md:grid md:grid-cols-[1fr_auto_1fr] sm:h-16 sm:pl-4 sm:pr-2.5 ${scrolled || open || !isHome ? 'glass-strong' : 'glass'}`}>
            <Link to="/" aria-label="Lantaw Inn, home" className="flex items-center gap-2.5 justify-self-start rounded-full py-1 pr-3 font-display text-base font-extrabold tracking-normal">
              <Logo className="size-8" />
              <span>Lantaw</span>
            </Link>

            <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
              {SECTIONS.map(section => {
                const isActive = active === section.id
                return (
                  <button key={section.id} type="button" onClick={() => goTo(section.id)} aria-current={isActive ? 'location' : undefined} className={`${linkBase} ${linkTone(isActive)}`}>
                    {section.label}
                    <ActiveDot isActive={isActive} />
                  </button>
                )
              })}
              <NavLink to="/manage" className={({ isActive }) => `${linkBase} ${linkTone(isActive)}`}>
                {({ isActive }) => (
                  <>
                    Manage booking
                    <ActiveDot isActive={isActive} />
                  </>
                )}
              </NavLink>
            </nav>

            <div className="flex items-center gap-1.5 justify-self-end">
              {account ? (
                <AccountMenu account={account} />
              ) : (
                <Link to="/signin" aria-label="Sign in" className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]">
                  <UserRound size={22} aria-hidden />
                </Link>
              )}
              <Link to="/book" className="group btn btn-secondary hidden h-9 min-h-0 px-4 text-sm sm:inline-flex">
                Book now<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'} className="grid size-10 place-items-center rounded-full transition-colors hover:bg-ink/[0.06] md:hidden">
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          <div id="mobile-nav" className={`grid transition-all duration-300 ease-out md:hidden ${open ? 'mt-2 grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`} aria-hidden={!open}>
            <div className="overflow-hidden rounded-panel">
              <nav aria-label="Mobile" className="glass-strong rounded-panel p-3">
                <ul>
                  {SECTIONS.map(section => (
                    <li key={section.id}>
                      <button type="button" tabIndex={open ? 0 : -1} onClick={() => goTo(section.id)} className="flex w-full items-center justify-between rounded-control px-4 py-3.5 text-left text-base font-bold hover:bg-sand">
                        {section.label}
                        <ArrowRight size={16} className="text-muted" />
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link to="/manage" tabIndex={open ? 0 : -1} className="flex items-center justify-between rounded-control px-4 py-3.5 text-base font-bold hover:bg-sand">
                      Manage booking
                      <ArrowRight size={16} className="text-muted" />
                    </Link>
                  </li>
                  <li>
                    <Link to={account ? '/account' : '/signin'} tabIndex={open ? 0 : -1} className="flex items-center justify-between rounded-control px-4 py-3.5 text-base font-bold hover:bg-sand">
                      {account ? 'My account' : 'Sign in'}
                      <ArrowRight size={16} className="text-muted" />
                    </Link>
                  </li>
                  {account && (
                    <li>
                      <button type="button" tabIndex={open ? 0 : -1} onClick={() => { signOut(); setOpen(false); navigate('/') }} className="flex w-full items-center justify-between rounded-control px-4 py-3.5 text-left text-base font-bold text-danger hover:bg-sand">
                        Log out
                      </button>
                    </li>
                  )}
                </ul>
                <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
                  <Link to="/book" tabIndex={open ? 0 : -1} className="btn btn-primary flex-1">Book now</Link>
                  <a href={SITE.phoneHref} tabIndex={open ? 0 : -1} aria-label="Call Lantaw Inn" className="grid size-11 place-items-center rounded-full border border-line hover:bg-sand"><Phone size={18} /></a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className={`flex-1 ${isHome ? '' : 'pt-[4.5rem] sm:pt-20'}`}>
        <Outlet />
      </main>

      <footer className="mt-24 bg-secondary text-white">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:gap-16 lg:py-16">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 font-display text-lg font-extrabold tracking-normal"><Logo className="size-8" />Lantaw Inn</Link>
            <p className="mt-4 max-w-xs text-pretty text-base leading-[1.7] text-white/75">A small inn in Legazpi with a roof deck that looks straight at Mayon. Book direct and skip the booking-site fees.</p>
          </div>
          <nav aria-label="Footer">
            <h2 className="text-sm font-bold text-white">Explore</h2>
            <ul className="mt-4 space-y-3 text-base text-white/80">
              {SECTIONS.map(section => (
                <li key={section.id}>
                  <button type="button" className="transition-colors hover:text-white" onClick={() => goTo(section.id)}>{section.label}</button>
                </li>
              ))}
              <li><Link className="transition-colors hover:text-white" to="/book">Book a room</Link></li>
              <li><Link className="transition-colors hover:text-white" to="/manage">Manage booking</Link></li>
              <li><Link className="transition-colors hover:text-white" to={account ? '/account' : '/signin'}>{account ? 'My account' : 'Sign in'}</Link></li>
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-bold text-white">Contact</h2>
            <ul className="mt-4 space-y-3 text-base text-white/80">
              <li><a href={SITE.phoneHref} className="transition-colors hover:text-white">{SITE.phone}</a></li>
              <li><address className="not-italic">Lantaw Inn, Legazpi City, Albay, Philippines</address></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="container-page flex flex-col gap-3 py-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-pretty">Demo version. Photos are free stock images from Pexels and will be replaced with the inn's own photos. Prices in Philippine pesos.</p>
            <Link to="/admin" className="shrink-0 transition-colors hover:text-white">Owner login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
