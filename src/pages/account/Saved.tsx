import { Link } from 'react-router-dom'
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
      <p className="mt-1 text-[0.8125rem] text-muted">Rooms you hearted, with the price per night.</p>

      {rooms.length === 0 ? (
        <div className="mt-6 grid overflow-hidden border border-line bg-surface sm:grid-cols-[minmax(0,16rem)_1fr]">
          <Photo name="roof-deck" sizes="256px" className="h-40 w-full object-cover sm:h-full" />
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold">No saved rooms yet</h3>
            <p className="mt-2 max-w-md text-[0.9375rem] leading-[1.7] text-muted">Tap the heart on a room card to keep it here for later.</p>
            <Link to="/" state={{ scroll: 'rooms' }} className="btn btn-primary mt-5 rounded-none">Browse rooms</Link>
          </div>
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
