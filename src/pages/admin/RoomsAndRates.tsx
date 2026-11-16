import { useState, type FormEvent } from 'react'
import { ImageIcon } from 'lucide-react'
import type { Room, Settings } from '../../types'
import { Photo } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { photos } from '../../data/photos'
import { centavosToPesos, pesosToCentavos } from '../../lib/money'
import { updateRooms, updateSettings } from '../../store/api'
import { useDb } from '../../store/db'

interface RoomDraft {
  id: string
  base: string
  weekend: string
  isActive: boolean
}

interface SettingsDraft {
  cleaning: string
  down: string
  gcashNumber: string
  gcashName: string
  cancellationDays: string
}

const toRoomDraft = (room: Room): RoomDraft => ({ id: room.id, base: String(centavosToPesos(room.baseRate)), weekend: String(centavosToPesos(room.weekendExtra)), isActive: room.isActive })

const toSettingsDraft = (settings: Settings): SettingsDraft => ({
  cleaning: String(centavosToPesos(settings.cleaningFee)),
  down: String(settings.downPaymentPercent),
  gcashNumber: settings.gcashNumber,
  gcashName: settings.gcashName,
  cancellationDays: String(settings.cancellationDays)
})

export function RoomsAndRates() {
  const db = useDb()
  const toast = useToast()
  const [rooms, setRooms] = useState(() => db.rooms.map(toRoomDraft))
  const [settings, setSettings] = useState(() => toSettingsDraft(db.settings))
  const [error, setError] = useState('')

  const patchRoom = (id: string, patch: Partial<RoomDraft>) => setRooms(current => current.map(r => (r.id === id ? { ...r, ...patch } : r)))

  const save = (event: FormEvent) => {
    event.preventDefault()
    for (const draft of rooms) {
      const room = db.rooms.find(r => r.id === draft.id)!
      if (!(Number(draft.base) > 0) || !(Number(draft.weekend) >= 0)) return setError(`Enter a nightly rate above zero for the ${room.name}.`)
    }
    const down = Number(settings.down)
    if (!(down >= 0 && down <= 100)) return setError('Down payment must be between 0 and 100%.')
    if (!(Number(settings.cleaning) >= 0)) return setError('Cleaning fee cannot be negative.')
    if (!settings.gcashNumber.trim()) return setError('Enter the GCash number guests should pay.')
    setError('')
    updateRooms(db.rooms.map(room => {
      const draft = rooms.find(r => r.id === room.id)!
      return { ...room, baseRate: pesosToCentavos(Number(draft.base)), weekendExtra: pesosToCentavos(Number(draft.weekend)), isActive: draft.isActive }
    }))
    updateSettings({
      ...db.settings,
      cleaningFee: pesosToCentavos(Number(settings.cleaning)),
      downPaymentPercent: Math.round(down),
      gcashNumber: settings.gcashNumber.trim(),
      gcashName: settings.gcashName.trim() || db.settings.gcashName,
      cancellationDays: Math.max(0, Math.round(Number(settings.cancellationDays) || 0))
    })
    toast('Saved. Guests see the new prices now.')
  }

  return (
    <form onSubmit={save}>
      <h1 className="text-4xl font-extrabold">Rooms and rates</h1>
      <p className="mt-1 text-muted">Guests see new rates as soon as you save. Existing bookings keep the price they booked at.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="card divide-y divide-line">
          {db.rooms.map(room => {
            const draft = rooms.find(r => r.id === room.id)!
            const photo = photos[room.photo]
            return (
              <div key={room.id} className="grid gap-4 p-5 sm:grid-cols-[7rem_1fr]">
                <div className="relative">
                  <Photo name={room.photo} sizes="112px" className="aspect-[4/3] w-full rounded-xl object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold">{room.name}</h2>
                      <p className="text-sm text-muted">Sleeps {room.sleeps}, {room.beds}</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" className="size-4 accent-leaf" checked={draft.isActive} onChange={e => patchRoom(room.id, { isActive: e.target.checked })} />
                      Open for booking
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor={`b-${room.id}`}>Per night (₱)</label>
                      <input id={`b-${room.id}`} type="number" min="0" inputMode="numeric" className="field" value={draft.base} onChange={e => patchRoom(room.id, { base: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" htmlFor={`w-${room.id}`}>Weekend extra (₱)</label>
                      <input id={`w-${room.id}`} type="number" min="0" inputMode="numeric" className="field" value={draft.weekend} onChange={e => patchRoom(room.id, { weekend: e.target.value })} />
                    </div>
                  </div>
                  {photo.isStock && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun-tint px-3 py-1 text-xs font-bold text-sun-ink"><ImageIcon size={13} />Stock photo. Replace with your own photo.</p>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <section className="card p-6 lg:sticky lg:top-6">
          <h2 className="text-2xl font-bold">Fees and payments</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="s-clean">Cleaning fee per stay (₱)</label>
              <input id="s-clean" type="number" min="0" className="field" value={settings.cleaning} onChange={e => setSettings({ ...settings, cleaning: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="s-down">Down payment to confirm a booking (%)</label>
              <input id="s-down" type="number" min="0" max="100" className="field" value={settings.down} onChange={e => setSettings({ ...settings, down: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="s-days">Free cancellation until (days before check-in)</label>
              <input id="s-days" type="number" min="0" className="field" value={settings.cancellationDays} onChange={e => setSettings({ ...settings, cancellationDays: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="s-gcash">GCash number shown to guests</label>
              <input id="s-gcash" className="field" value={settings.gcashNumber} onChange={e => setSettings({ ...settings, gcashNumber: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="s-gname">GCash account name</label>
              <input id="s-gname" className="field" value={settings.gcashName} onChange={e => setSettings({ ...settings, gcashName: e.target.value })} />
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block mt-6">Save changes</button>
        </section>
      </div>
    </form>
  )
}
