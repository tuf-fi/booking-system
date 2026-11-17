import { useCallback, useEffect, useRef, useState } from 'react'
import type { Room } from '../types'
import { Photo } from './Photo'

const AUTOPLAY_MS = 4000

export function RoomGallery({ room }: { room: Room }) {
  const names = Array.from(new Set([room.photo, ...(room.gallery ?? [])]))
  const many = names.length > 1
  const trackRef = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((next: number) => {
    const track = trackRef.current
    if (!track) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: next * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
  }, [])

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    setIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  useEffect(() => {
    if (!many || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => goTo((index + 1) % names.length), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [many, paused, index, names.length, goTo])

  return (
    <div
      className="relative overflow-hidden rounded-card bg-sand"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${room.name} photos`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
    >
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {names.map((name, i) => (
          <li key={name} aria-roledescription="slide" aria-label={`${i + 1} of ${names.length}`} className="w-full shrink-0 snap-center">
            <Photo name={name} size="full" sizes="(min-width: 1024px) 640px, 100vw" className="aspect-[16/10] w-full object-cover" />
          </li>
        ))}
      </ul>

      {many && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center">
          {names.map((name, i) => (
            <button
              key={name}
              type="button"
              aria-label={`Show photo ${i + 1} of ${names.length}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className="grid h-6 w-6 place-items-center"
            >
              <span className={`block h-0.5 shadow-[0_1px_4px_rgb(0_0_0/0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${i === index ? 'w-6 bg-white' : 'w-3 bg-white/60 hover:bg-white/85'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
