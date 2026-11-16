import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthFlow, type AuthMode } from '../components/auth/AuthFlow'
import { Logo } from '../components/Logo'
import { Photo } from '../components/Photo'
import { peso } from '../lib/money'
import { useAccount } from '../store/accounts'
import { useDb } from '../store/db'

const PATHS: Record<AuthMode, string> = { signin: '/signin', signup: '/signup', forgot: '/forgot' }

export const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/account')

export function Auth({ mode }: { mode: AuthMode }) {
  const account = useAccount()
  const db = useDb()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const carried = (location.state as { email?: string; notice?: string } | null) ?? {}
  const lowestRate = Math.min(...db.rooms.filter(room => room.isActive).map(room => room.baseRate))

  if (account) return <Navigate to={next} replace />

  const suffix = params.get('next') ? `?next=${encodeURIComponent(next)}` : ''

  return (
    <div className="grid min-h-screen bg-surface lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <main id="main" className="flex flex-col px-6 lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden py-8 sm:px-12 lg:px-[clamp(3rem,8vw,8rem)]">
        <Link to="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-[0.9375rem] font-bold text-ink transition-colors hover:text-leaf">
          <ArrowLeft size={16} aria-hidden />Back to the site
        </Link>

        <div className="my-auto w-full max-w-xl py-10">
          <AuthFlow
            key={mode}
            initialMode={mode}
            initialEmail={carried.email}
            notice={carried.notice}
            onSignedIn={() => navigate(next, { replace: true })}
            onModeChange={(nextMode, carry) => navigate(`${PATHS[nextMode]}${suffix}`, { replace: true, state: { email: carry.email, notice: carry.notice } })}
          />
        </div>
      </main>

      <aside className="relative isolate hidden overflow-hidden bg-ink lg:block">
        <Photo name="mayon-sunrise" size="full" priority sizes="50vw" className="absolute inset-0 -z-20 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/35" />

        <div className="absolute left-8 top-8 flex items-center gap-3 text-white">
          <Logo className="size-9" />
          <span className="font-display text-lg font-extrabold">Lantaw Inn</span>
        </div>

        <div className="absolute inset-x-8 bottom-10 max-w-md text-white">
          <p className="text-sm text-white/85">Legazpi City, Albay</p>
          <p className="mt-1 text-3xl font-extrabold leading-tight">Wake up to Mayon</p>
          <p className="mt-3 text-[0.9375rem] text-white/90">Rooms from {peso(lowestRate)} a night. Book direct and skip the booking-site fees.</p>
        </div>
      </aside>
    </div>
  )
}
