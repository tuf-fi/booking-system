import { useRef, useState } from 'react'
import { ImagePlus, Plus, Star, Trash2, X } from 'lucide-react'
import type { Room } from '../../types'
import { LABEL, NumberField, PesoField, Switch, TEXTAREA, TextField } from '../../components/admin/fields'
import { Dialog } from '../../components/Dialog'
import { EmptyState } from '../../components/EmptyState'
import { PageHeader } from '../../components/PageHeader'
import { Photo } from '../../components/Photo'
import { useToast } from '../../components/Toast'
import { downscaleImage, plural } from '../../lib/format'
import { centavosToPesos, peso, pesosToCentavos } from '../../lib/money'
import { addUpload, deleteRoom, roomHasBookings, saveRoom } from '../../store/api'
import { useDb } from '../../store/db'

interface Draft {
  id: string | null
  name: string
  sleeps: string
  beds: string
  sizeSqm: string
  description: string
  perks: string
  base: string
  weekend: string
  mayonView: boolean
  isActive: boolean
  photos: string[]
}

const blank = (): Draft => ({ id: null, name: '', sleeps: '2', beds: '', sizeSqm: '', description: '', perks: '', base: '', weekend: '0', mayonView: false, isActive: true, photos: [] })

const fromRoom = (room: Room): Draft => ({
  id: room.id,
  name: room.name,
  sleeps: String(room.sleeps),
  beds: room.beds,
  sizeSqm: String(room.sizeSqm),
  description: room.description,
  perks: room.perks.join('\n'),
  base: String(centavosToPesos(room.baseRate)),
  weekend: String(centavosToPesos(room.weekendExtra)),
  mayonView: room.mayonView,
  isActive: room.isActive,
  photos: Array.from(new Set([room.photo, ...(room.gallery ?? [])]))
})

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'room'

export function Rooms() {
  const db = useDb()
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const patch = (changes: Partial<Draft>) => setDraft(current => (current ? { ...current, ...changes } : current))
  const openEditor = (next: Draft) => {
    setDraft(next)
    setError('')
    setConfirmDelete(false)
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !draft) return
    setUploading(true)
    try {
      const names: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        names.push(addUpload(await downscaleImage(file, 1400, 0.8)))
      }
      setDraft(current => (current ? { ...current, photos: [...current.photos, ...names] } : current))
    } catch {
      setError('We could not read one of those files. Use JPG or PNG images.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const makeCover = (name: string) => patch({ photos: [name, ...(draft?.photos ?? []).filter(item => item !== name)] })
  const removePhoto = (name: string) => patch({ photos: (draft?.photos ?? []).filter(item => item !== name) })

  const save = () => {
    if (!draft) return
    const sleeps = Math.round(Number(draft.sleeps))
    if (draft.name.trim().length < 2) return setError('Give the room a name.')
    if (!(sleeps >= 1 && sleeps <= 20)) return setError('Sleeps must be between 1 and 20.')
    if (!(Number(draft.base) > 0)) return setError('Enter a nightly rate above zero.')
    if (!(Number(draft.weekend) >= 0)) return setError('Weekend extra cannot be negative.')
    if (draft.photos.length === 0) return setError('Add at least one photo so guests can see the room.')
    const existing = db.rooms.find(room => room.id === draft.id)
    const used = new Set(db.rooms.map(room => room.id))
    let id = draft.id ?? slug(draft.name)
    if (!draft.id) for (let n = 2; used.has(id); n++) id = `${slug(draft.name)}-${n}`
    const room: Room = {
      id,
      name: draft.name.trim(),
      sleeps,
      beds: draft.beds.trim() || plural(sleeps, 'bed'),
      sizeSqm: Math.max(0, Math.round(Number(draft.sizeSqm) || 0)),
      description: draft.description.trim(),
      perks: draft.perks.split('\n').map(line => line.trim()).filter(Boolean),
      highlights: existing?.highlights ?? [],
      baseRate: pesosToCentavos(Number(draft.base)),
      weekendExtra: pesosToCentavos(Number(draft.weekend)),
      photo: draft.photos[0],
      gallery: draft.photos.slice(1),
      mayonView: draft.mayonView,
      isActive: draft.isActive
    }
    saveRoom(room)
    toast(existing ? `${room.name} saved.` : `${room.name} added.`)
    setDraft(null)
  }

  const remove = () => {
    if (!draft?.id) return
    try {
      deleteRoom(draft.id)
      toast(`${draft.name} deleted.`)
      setDraft(null)
    } catch (failure) {
      setConfirmDelete(false)
      setError(failure instanceof Error ? failure.message : 'Could not delete this room.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Rooms"
        description="Add rooms, edit their details and manage the photos guests see."
        actions={<button type="button" className="btn btn-primary btn-sm h-9 min-h-0 px-4" onClick={() => openEditor(blank())}><Plus size={15} />Add room</button>}
      />

      {db.rooms.length === 0 ? (
        <div className="glass glass-data mt-6"><EmptyState title="No rooms yet" description="Add your first room so guests can book." /></div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {db.rooms.map(room => (
            <li key={room.id}>
              <button type="button" onClick={() => openEditor(fromRoom(room))} className="glass glass-data group block w-full cursor-pointer overflow-hidden text-left transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-primary">
                <div className="relative p-2">
                  <Photo name={room.photo} sizes="360px" alt={room.name} className="aspect-[16/10] w-full rounded-card object-cover" />
                  <span className={`chip absolute left-5 top-5 ${room.isActive ? 'bg-primary-tint text-primary-deep' : 'bg-sand text-muted'}`}>{room.isActive ? 'Open' : 'Closed'}</span>
                </div>
                <div className="px-4 pb-4 pt-2">
                  <h2 className="truncate text-base font-bold leading-tight">{room.name}</h2>
                  <p className="mt-1 truncate text-xs text-muted">Sleeps {room.sleeps} · {room.beds}</p>
                  <p className="mt-3 flex items-baseline justify-between gap-3 text-sm">
                    <span><b className="font-bold tabular-nums">{peso(room.baseRate)}</b> <span className="text-muted">/ night</span></span>
                    <span className="text-xs text-muted">{plural(new Set([room.photo, ...(room.gallery ?? [])]).size, 'photo')}</span>
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? `Edit ${draft.name || 'room'}` : 'Add a room'} size="lg">
        {draft && (
          <form onSubmit={event => { event.preventDefault(); save() }}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <TextField id="r-name" label="Room name" value={draft.name} onChange={value => patch({ name: value })} placeholder="For example, Garden twin" />
                <div className="grid grid-cols-2 gap-3">
                  <NumberField id="r-sleeps" label="Sleeps" min={1} max={20} value={draft.sleeps} onChange={value => patch({ sleeps: value })} />
                  <NumberField id="r-size" label="Size" suffix="sqm" value={draft.sizeSqm} onChange={value => patch({ sizeSqm: value })} />
                </div>
                <TextField id="r-beds" label="Beds" value={draft.beds} onChange={value => patch({ beds: value })} placeholder="For example, 2 single beds" />
                <div className="grid grid-cols-2 gap-3">
                  <PesoField id="r-base" label="Per night" value={draft.base} onChange={value => patch({ base: value })} />
                  <PesoField id="r-weekend" label="Weekend extra" value={draft.weekend} onChange={value => patch({ weekend: value })} />
                </div>
                <div>
                  <label className={LABEL} htmlFor="r-desc">Description</label>
                  <textarea id="r-desc" className={TEXTAREA} rows={3} value={draft.description} onChange={event => patch({ description: event.target.value })} placeholder="A short, honest description guests will read." />
                </div>
                <div>
                  <label className={LABEL} htmlFor="r-perks">What is included (one per line)</label>
                  <textarea id="r-perks" className={TEXTAREA} rows={4} value={draft.perks} onChange={event => patch({ perks: event.target.value })} placeholder={'Aircon\nPrivate bathroom with hot shower'} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold"><Switch label="Open for booking" checked={draft.isActive} onChange={value => patch({ isActive: value })} />Open for booking</label>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold"><Switch label="Mayon view" checked={draft.mayonView} onChange={value => patch({ mayonView: value })} />Mayon view</label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className={`${LABEL} mb-0`}>Photos <span className="font-normal">· first is the cover</span></p>
                  <button type="button" className="btn btn-soft btn-sm h-8 min-h-0 px-3" onClick={() => fileRef.current?.click()} disabled={uploading}><ImagePlus size={14} />{uploading ? 'Adding…' : 'Add photos'}</button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-label="Upload room photos" onChange={event => void onFiles(event.target.files)} />
                </div>
                {draft.photos.length === 0 ? (
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 grid h-48 w-full cursor-pointer place-items-center rounded-card border border-dashed border-ink/20 bg-ink/[0.03] text-center text-sm text-muted transition-colors hover:bg-ink/[0.06]">
                    <span><ImagePlus size={22} className="mx-auto mb-2" aria-hidden />Add the first photo of this room</span>
                  </button>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-2.5">
                    {draft.photos.map((name, index) => (
                      <li key={name} className="relative overflow-hidden rounded-card bg-sand">
                        <Photo name={name} sizes="220px" alt={`${draft.name || 'Room'} photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                        {index === 0 && <span className="chip chip-photo absolute left-2 top-2">Cover</span>}
                        <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                          {index > 0 && <button type="button" aria-label="Make cover photo" data-tip="Make cover" onClick={() => makeCover(name)} className="tip grid size-8 cursor-pointer place-items-center rounded-full bg-white text-ink shadow-soft transition-transform hover:scale-105"><Star size={14} /></button>}
                          <button type="button" aria-label="Remove photo" data-tip="Remove" onClick={() => removePhoto(name)} className="tip grid size-8 cursor-pointer place-items-center rounded-full bg-white text-danger shadow-soft transition-transform hover:scale-105"><X size={14} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted">Use real photos of the room. Photos are saved in this browser for the demo.</p>
              </div>
            </div>

            {error && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{error}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {draft.id ? (
                confirmDelete ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">{roomHasBookings(draft.id) ? 'This room has bookings, so it cannot be deleted. Close it instead.' : 'Delete this room for good?'}</span>
                    {!roomHasBookings(draft.id) && <button type="button" className="btn btn-danger h-10 min-h-0 px-4 text-sm" onClick={remove}>Yes, delete</button>}
                  </span>
                ) : (
                  <button type="button" className="btn btn-soft h-10 min-h-0 px-4 text-sm text-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Delete room</button>
                )
              ) : <span />}
              <span className="flex gap-2">
                <button type="button" className="btn btn-soft h-10 min-h-0 px-5 text-sm" onClick={() => setDraft(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary h-10 min-h-0 px-5 text-sm">{draft.id ? 'Save changes' : 'Add room'}</button>
              </span>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
