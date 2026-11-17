import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { Photo } from '../../components/Photo'
import { RoomCard } from '../../components/RoomCard'
import { useAccount } from '../../store/accounts'
import { useDb } from '../../store/db'

export function Saved() {
  const account = useAccount()!
  const db = useDb()
  const rooms = db.rooms.filter(room => room.isActive && account.saved.includes(room.id))

  return (
    <section aria-labelledby="saved-h">
      <h2 id="saved-h" className="text-lg font-bold">Saved rooms</h2>
      <p className="mt-1 text-sm text-muted">Rooms you hearted, with the price per night.</p>

      {rooms.length === 0 ? (
        <div className="mt-6 grid overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-[minmax(0,16rem)_1fr]">
          <Photo name="roof-deck" sizes="256px" className="h-40 w-full object-cover sm:h-full" />
          <EmptyState
            className="text-left sm:p-8"
            title="No saved rooms yet"
            description="Tap the heart on a room card to keep it here for later."
            action={<Link to="/" state={{ scroll: 'rooms' }} className="btn btn-primary">Browse rooms</Link>}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
