import { Link } from 'react-router-dom'
import { BedDouble, ChevronRight, DoorOpen, Lock, Mountain, ShowerHead, Snowflake, Tv, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { HighlightIcon, Room } from '../types'
import { peso } from '../lib/money'
import { Photo } from './Photo'

const ICONS: Record<HighlightIcon, ComponentType<{ size?: number; className?: string }>> = {
  aircon: Snowflake,
  bath: ShowerHead,
  tv: Tv,
  mountain: Mountain,
  lock: Lock,
  balcony: DoorOpen
}

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="group relative isolate flex aspect-[2/3] w-full flex-col justify-end overflow-hidden rounded-none bg-ink shadow-soft transition-shadow duration-300 hover:shadow-lift">
      <Photo name={room.photo} sizes="(min-width: 640px) 640px, 85vw" className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[44%] backdrop-blur-[2.5px] [-webkit-mask-image:linear-gradient(to_top,#000_45%,transparent)] [mask-image:linear-gradient(to_top,#000_45%,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[58%] bg-gradient-to-t from-ink/85 via-ink/50 to-transparent" />

      <div className="p-5 text-white">
        <h3 className="text-xl font-bold leading-tight">{room.name}</h3>
        <p className="mt-1 flex items-center gap-2 text-[0.8125rem] text-white/90">
          <BedDouble size={15} className="shrink-0" />
          <span className="truncate">{room.beds}</span>
        </p>

        <p className="mt-3 text-[0.8125rem] text-white/90">
          <span className="text-base font-bold text-white">{peso(room.baseRate)}</span> a night
        </p>
        <ul className="mt-1.5 flex min-h-[1.25rem] flex-wrap content-start gap-x-3.5 gap-y-1 text-[0.8125rem] font-medium text-white/95">
          <li className="inline-flex items-center gap-1"><Users size={12} />Sleeps {room.sleeps}</li>
          {room.highlights.map(({ label, icon }) => {
            const Icon = ICONS[icon]
            return <li key={label} className="inline-flex items-center gap-1 whitespace-nowrap"><Icon size={12} />{label}</li>
          })}
        </ul>

        <Link
          to={`/book?room=${room.id}`}
          className="btn btn-block rounded-none mt-4 h-11 min-h-0 justify-center bg-white text-[0.9375rem] text-ink transition-colors duration-200 hover:bg-leaf hover:text-white active:[transform:none]! after:absolute after:inset-0  after:content-[''] focus-visible:outline-white"
        >
          See availability
          <ChevronRight size={18} aria-hidden />
          <span className="sr-only">, {room.name}</span>
        </Link>
      </div>
    </article>
  )
}
