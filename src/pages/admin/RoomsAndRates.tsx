import { useState, type FormEvent } from 'react'
import { ImageIcon } from 'lucide-react'
import type { Room, Settings } from '../../types'
import { LABEL, INPUT, NumberField, PesoField, Switch } from '../../components/admin/fields'
import { Photo } from '../../components/Photo'
import { PageHeader } from '../../components/PageHeader'
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
      <PageHeader title="Rates and fees" description="Guests see new rates as soon as you save. Existing bookings keep the price they booked at." />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <section className="glass glass-data divide-y divide-ink/10" aria-label="Rooms">
          {db.rooms.map(room => {
            const draft = rooms.find(r => r.id === room.id)!
            const photo = photos[room.photo] ?? { isStock: false }
            return (
              <div key={room.id} className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <Photo name={room.photo} sizes="80px" className="size-16 shrink-0 rounded-control object-cover" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold leading-tight">{room.name}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted">Sleeps {room.sleeps} · {room.beds}</p>
                    {photo.isStock && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent-deep"><ImageIcon size={12} aria-hidden />Stock photo</p>}
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-xs font-semibold">
                    <span className={draft.isActive ? 'text-primary-deep' : 'text-muted'}>{draft.isActive ? 'Open' : 'Closed'}</span>
                    <Switch label={`${room.name} open for booking`} checked={draft.isActive} onChange={value => patchRoom(room.id, { isActive: value })} />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PesoField id={`b-${room.id}`} label="Per night" value={draft.base} onChange={value => patchRoom(room.id, { base: value })} />
                  <PesoField id={`w-${room.id}`} label="Weekend extra" value={draft.weekend} onChange={value => patchRoom(room.id, { weekend: value })} />
                </div>
              </div>
            )
          })}
        </section>

        <section className="glass glass-data p-5 lg:sticky lg:top-6" aria-label="Fees and payments">
          <h2 className="text-base font-bold">Fees and payments</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PesoField id="s-clean" label="Cleaning fee" value={settings.cleaning} onChange={value => setSettings({ ...settings, cleaning: value })} />
            <NumberField id="s-down" label="Down payment" suffix="%" max={100} value={settings.down} onChange={value => setSettings({ ...settings, down: value })} />
            <div className="col-span-2">
              <NumberField id="s-days" label="Free cancellation until" suffix="days before" value={settings.cancellationDays} onChange={value => setSettings({ ...settings, cancellationDays: value })} />
            </div>
          </div>
          <div className="mt-5 border-t border-ink/10 pt-5">
            <h3 className="text-sm font-bold">GCash payments</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className={LABEL} htmlFor="s-gcash">Number shown to guests</label>
                <input id="s-gcash" className={INPUT} value={settings.gcashNumber} onChange={e => setSettings({ ...settings, gcashNumber: e.target.value })} />
              </div>
              <div>
                <label className={LABEL} htmlFor="s-gname">Account name</label>
                <input id="s-gname" className={INPUT} value={settings.gcashName} onChange={e => setSettings({ ...settings, gcashName: e.target.value })} />
              </div>
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block mt-5 h-10 min-h-0 text-sm">Save changes</button>
        </section>
      </div>
    </form>
  )
}
