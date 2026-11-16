import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { addDays, today } from '../lib/dates'
import { peso } from '../lib/money'
import { useDb } from '../store/db'
import { FIELD_LABEL, FIELD_PAD, FIELD_SHELL, SearchSelect, type SelectOption } from './SearchSelect'

const DIVIDER = 'lg:before:absolute lg:before:left-0 lg:before:top-2.5 lg:before:bottom-2.5 lg:before:w-px lg:before:bg-ink/10'
const DATE_CONTROL = 'block h-6 w-full appearance-none bg-transparent text-[0.8125rem] font-semibold leading-6 text-ink outline-none'

function DateField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={`${FIELD_SHELL} ${FIELD_PAD} ${DIVIDER}`}>
      <span className={FIELD_LABEL}>{label}</span>
      {children}
    </label>
  )
}

export function SearchBar() {
  const db = useDb()
  const navigate = useNavigate()
  const start = today()
  const [roomId, setRoomId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)

  const onCheckIn = (value: string) => {
    setCheckIn(value)
    if (value && (!checkOut || checkOut <= value)) setCheckOut(addDays(value, 1))
  }

  const onGuests = (value: string) => {
    const next = Number(value)
    setGuests(next)
    const chosen = db.rooms.find(room => room.id === roomId)
    if (chosen && chosen.sleeps < next) setRoomId('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (roomId) params.set('room', roomId)
    if (checkIn && checkOut && checkOut > checkIn) {
      params.set('in', checkIn)
      params.set('out', checkOut)
    }
    params.set('guests', String(guests))
    navigate(`/book?${params.toString()}`)
  }

  const roomOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: 'Any room' },
      ...db.rooms
        .filter(room => room.isActive && room.sleeps >= guests)
        .map(room => ({ value: room.id, label: room.name, hint: `${peso(room.baseRate)} / night` }))
    ],
    [db.rooms, guests]
  )

  const guestOptions = useMemo<SelectOption[]>(
    () => Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} guest${i ? 's' : ''}` })),
    []
  )

  return (
    <form
      onSubmit={submit}
      className="glass-strong grid grid-cols-2 gap-1.5 rounded-3xl p-1.5 lg:grid-cols-[1.35fr_1fr_1fr_0.85fr_auto] lg:items-center lg:gap-0 lg:rounded-full lg:py-1.5 lg:pl-2 lg:pr-1.5"
    >
      <SearchSelect label="Room" value={roomId} options={roomOptions} onChange={setRoomId} className="col-span-2 lg:col-span-1" />
      <DateField label="Check-in">
        <input type="date" min={start} value={checkIn} onChange={event => onCheckIn(event.target.value)} className={DATE_CONTROL} />
      </DateField>
      <DateField label="Check-out">
        <input type="date" min={checkIn ? addDays(checkIn, 1) : addDays(start, 1)} value={checkOut} onChange={event => setCheckOut(event.target.value)} className={DATE_CONTROL} />
      </DateField>
      <div className={`${DIVIDER} relative col-span-2 lg:col-span-1`}>
        <SearchSelect label="Guests" value={String(guests)} options={guestOptions} onChange={onGuests} />
      </div>
      <button type="submit" className="btn btn-primary col-span-2 mt-0.5 h-11 min-h-0 px-6 text-sm lg:col-span-1 lg:mt-0 lg:ml-1.5">
        <Search size={16} />Search
      </button>
    </form>
  )
}
