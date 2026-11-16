import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Room } from '../types'
import { RoomCard } from './RoomCard'

const EDGE_TOLERANCE = 4

export function RoomCarousel({ rooms, heading }: { rooms: Room[]; heading: React.ReactNode }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setAtStart(track.scrollLeft <= EDGE_TOLERANCE)
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - EDGE_TOLERANCE)
  }, [])

  useEffect(() => {
    update()
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update, rooms.length])

  const step = (direction: 1 | -1) => {
    const track = trackRef.current
    const first = track?.firstElementChild as HTMLElement | null
    if (!track || !first) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({ left: direction * (first.offsetWidth + 16) * 2, behavior: reduced ? 'auto' : 'smooth' })
  }

  const arrow = 'grid size-11 place-items-center rounded-none border border-line bg-surface shadow-soft transition-all hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-35'

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        {heading}
        <div className={`hidden shrink-0 gap-2 sm:flex ${atStart && atEnd ? 'min-[1760px]:hidden' : ''}`}>
          <button type="button" aria-label="Previous rooms" onClick={() => step(-1)} disabled={atStart} className={arrow}><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next rooms" onClick={() => step(1)} disabled={atEnd} className={arrow}><ChevronRight size={18} /></button>
        </div>
      </div>

      <ul
        ref={trackRef}
        aria-label="Rooms"
        className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-8 pt-2 min-[1024px]:mx-0 min-[1024px]:px-0 min-[1024px]:scroll-px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rooms.map(room => (
          <li key={room.id} className="flex w-[17.5rem] shrink-0 snap-start sm:w-[20rem] min-[1760px]:w-[calc((100%-4rem)/5)]!">
            <RoomCard room={room} />
          </li>
        ))}
      </ul>
    </div>
  )
}
