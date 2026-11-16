import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Luggage, UserRound } from 'lucide-react'
import { signOut, type Profile } from '../store/accounts'
import { Avatar } from './Avatar'
import { useToast } from './Toast'

const ITEM = 'flex min-h-11 w-full items-center gap-3 px-4 text-left text-[0.875rem] font-bold transition-colors hover:bg-sand focus-visible:bg-sand'

export function AccountMenu({ account }: { account: Profile }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const logOut = () => {
    setOpen(false)
    signOut()
    navigate('/', { replace: true })
    toast('You are signed out.')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu, ${account.name}`}
        className="grid size-10 place-items-center rounded-full transition-colors hover:bg-ink/[0.06]"
      >
        <Avatar profile={account} className="size-8 text-xs" />
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="menu-pop absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden border border-line bg-surface shadow-lift">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[0.875rem] font-bold">{account.name}</p>
            <p className="truncate text-[0.8125rem] text-muted">{account.email}</p>
          </div>
          <Link to="/account/profile" role="menuitem" onClick={() => setOpen(false)} className={ITEM}><UserRound size={16} aria-hidden />View profile</Link>
          <Link to="/account" role="menuitem" onClick={() => setOpen(false)} className={ITEM}><Luggage size={16} aria-hidden />My trips</Link>
          <button type="button" role="menuitem" onClick={logOut} className={`${ITEM} border-t border-line text-danger`}><LogOut size={16} aria-hidden />Log out</button>
        </div>
      )}
    </div>
  )
}
