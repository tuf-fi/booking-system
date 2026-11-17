import type { Profile } from '../store/accounts'

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.slice(0, 1).toUpperCase())
    .join('')

export function Avatar({ profile, className = 'size-9 text-sm' }: { profile: Pick<Profile, 'name' | 'avatar'>; className?: string }) {
  if (profile.avatar) return <img src={profile.avatar} alt="" referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-full object-cover`} />
  return <span aria-hidden className={`${className} grid shrink-0 place-items-center rounded-full bg-primary font-extrabold text-white`}>{initials(profile.name) || '?'}</span>
}
