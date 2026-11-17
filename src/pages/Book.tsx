import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CreditCard, ImagePlus, Smartphone, Users } from 'lucide-react'
import type { Booking } from '../types'
import { AuthFlow } from '../components/auth/AuthFlow'
import { AvailabilityCalendar } from '../components/AvailabilityCalendar'
import { CardCheckoutDialog } from '../components/CardCheckoutDialog'
import { Photo } from '../components/Photo'
import { PriceLines } from '../components/PriceLines'
import { RoomGallery } from '../components/RoomGallery'
import { RoomReviews } from '../components/RoomReviews'
import { StayDates } from '../components/StayDates'
import { useToast } from '../components/Toast'
import { today, type DateKey } from '../lib/dates'
import { downscaleImage, plural } from '../lib/format'
import { isRangeFree } from '../lib/availability'
import { peso } from '../lib/money'
import { quoteStay } from '../lib/pricing'
import { signOut, useAccount } from '../store/accounts'
import { createBooking, DatesTakenError, isValidMobile } from '../store/api'
import { useDb } from '../store/db'

type Method = 'gcash_manual' | 'paymongo'

interface FormState {
  name: string
  mobile: string
  guests: number
}

const STEPS = ['Room', 'Dates', 'Your details', 'Payment'] as const

type Errors = Partial<Record<'name' | 'mobile' | 'proof' | 'dates', string>>

const isDateKey = (value: string | null): value is DateKey => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

export function Book() {
  const db = useDb()
  const toast = useToast()
  const account = useAccount()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const rooms = db.rooms.filter(room => room.isActive)

  const initialRoom = rooms.find(room => room.id === params.get('room')) ?? rooms.find(room => room.id === 'twin') ?? rooms[0]
  const [roomId, setRoomId] = useState(initialRoom.id)
  const [checkIn, setCheckIn] = useState<DateKey | null>(null)
  const [checkOut, setCheckOut] = useState<DateKey | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', mobile: '', guests: Math.min(Number(params.get('guests')) || 2, initialRoom.sleeps) })
  const [method, setMethod] = useState<Method>('gcash_manual')
  const [proof, setProof] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [checkout, setCheckout] = useState<Booking | null>(null)
  const [step, setStep] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const room = rooms.find(r => r.id === roomId) ?? rooms[0]
  const gated = step === 2 && !account
  const hasDates = checkIn !== null && checkOut !== null
  const quote = useMemo(() => (hasDates ? quoteStay(room, db.settings, checkIn, checkOut) : null), [hasDates, room, db.settings, checkIn, checkOut])

  useEffect(() => {
    if (!account) return
    setForm(current => ({ ...current, name: current.name || account.name, mobile: current.mobile || account.mobile }))
  }, [account?.id])

  useEffect(() => {
    const requestedIn = params.get('in')
    const requestedOut = params.get('out')
    if (isDateKey(requestedIn) && isDateKey(requestedOut) && requestedIn >= today() && requestedOut > requestedIn) {
      if (isRangeFree(db, initialRoom.id, requestedIn, requestedOut)) {
        setCheckIn(requestedIn)
        setCheckOut(requestedOut)
      } else {
        toast('Those dates are taken for this room. Pick new dates below.', 'warning')
      }
    }
  }, [])

  const chooseRoom = (id: string) => {
    const next = rooms.find(r => r.id === id)
    if (!next) return
    setRoomId(id)
    setForm(current => ({ ...current, guests: Math.min(current.guests, next.sleeps) }))
    if (checkIn && checkOut && !isRangeFree(db, id, checkIn, checkOut)) {
      setCheckIn(null)
      setCheckOut(null)
      toast('Those dates are taken for this room. Pick new dates.', 'warning')
    }
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }))

  const onProof = async (file: File | undefined) => {
    if (!file) return
    try {
      setProof(await downscaleImage(file))
      setErrors(current => ({ ...current, proof: undefined }))
    } catch {
      setErrors(current => ({ ...current, proof: 'We could not read that file. Upload a screenshot image.' }))
    }
  }

  const validate = (forStep: number): Errors => {
    const found: Errors = {}
    if (forStep === 1 && !hasDates) found.dates = 'Pick your check-in and check-out dates on the calendar.'
    if (forStep === 2) {
      if (!account) return found
      if (form.name.trim().length < 2) found.name = 'Enter your full name.'
      if (!isValidMobile(form.mobile)) found.mobile = 'Enter an 11-digit mobile number, like 0917 123 4567.'
    }
    if (forStep === 3 && method === 'gcash_manual' && !proof) found.proof = 'Upload your GCash screenshot so the owner can check it.'
    return found
  }

  const goTo = (next: number) => {
    setStep(next)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!account && step === 0) {
      toast('Login to book', 'warning')
      navigate(`/signin?next=${encodeURIComponent(`/book?room=${room.id}`)}`)
      return
    }
    if (!account) return
    const found = validate(step)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"], [data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1)
      return
    }
    setSubmitting(true)
    try {
      const booking = await createBooking({
        userId: account.id,
        roomId: room.id,
        checkIn: checkIn!,
        checkOut: checkOut!,
        guestName: form.name,
        guestMobile: form.mobile,
        guests: form.guests,
        method,
        proof: method === 'gcash_manual' ? proof : null
      })
      if (booking.status === 'pending_payment') setCheckout(booking)
      else navigate(`/booking/${booking.reference}`)
    } catch (failure) {
      if (failure instanceof DatesTakenError) {
        setCheckIn(null)
        setCheckOut(null)
        toast('Someone just booked those dates. Pick new dates.', 'warning')
        goTo(1)
      } else {
        toast(failure instanceof Error ? failure.message : 'Something went wrong. Please try again.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const lines = quote
    ? [
        ...(quote.weeknights ? [{ label: `${plural(quote.weeknights, 'weeknight')} × ${peso(quote.weeknightRate)}`, amount: quote.weeknights * quote.weeknightRate }] : []),
        ...(quote.weekendNights ? [{ label: `${plural(quote.weekendNights, 'weekend night')} × ${peso(quote.weekendRate)}`, amount: quote.weekendNights * quote.weekendRate }] : []),
        { label: 'Cleaning fee', amount: quote.cleaningFee },
        { label: `Total for ${plural(quote.nights, 'night')}`, amount: quote.total, tone: 'total' as const },
        { label: `Down payment due now (${db.settings.downPaymentPercent}%)`, amount: quote.downPayment, tone: 'due' as const },
        { label: 'Pay on arrival', amount: quote.balance, tone: 'muted' as const }
      ]
    : []

  const stepTitle = 'text-xl font-bold leading-tight'
  const stepHint = 'mt-1.5 max-w-xl text-base leading-[1.7] text-muted'
  const isLast = step === STEPS.length - 1
  const nextLabel = isLast
    ? submitting
      ? 'Reserving…'
      : method === 'gcash_manual'
        ? 'Send booking request'
        : quote
          ? `Pay ${peso(quote.downPayment)} and book`
          : 'Book now'
    : step === 0
      ? `Choose ${room.name}`
      : 'Continue'

  return (
    <div ref={topRef} className="container-page scroll-mt-20 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"><ArrowLeft size={14} />Back to Lantaw Inn</Link>
      <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Book your stay</h1>

      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Booking steps">
        {STEPS.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!done}
                onClick={() => goTo(i)}
                aria-current={current ? 'step' : undefined}
                className={`flex w-full border-t-2 pt-2 text-left transition-colors ${current ? 'border-ink' : done ? 'cursor-pointer border-primary' : 'border-line'}`}
              >
                <span className={`flex items-center gap-2 text-xs font-bold ${current ? 'text-ink' : done ? 'text-primary-deep' : 'text-muted'}`}>
                  <span className={`grid size-5 place-items-center rounded-full ${current ? 'bg-secondary text-white' : done ? 'bg-primary text-white' : 'bg-sand text-muted'}`}>
                    {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-sm font-bold text-muted sm:hidden">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-12">
        {gated ? (
          <div className="min-w-0">
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <AuthFlow key="book-auth" embedded initialMode="signin" onSignedIn={() => undefined} />
            </div>
            <button type="button" onClick={() => goTo(1)} className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 text-base font-bold text-ink transition-colors hover:text-primary"><ArrowLeft size={16} aria-hidden />Back</button>
          </div>
        ) : (
        <form onSubmit={submit} noValidate className="min-w-0">
          {step === 0 && (
            <section aria-labelledby="room-h" className="space-y-8">
              <div>
                <h2 id="room-h" className={stepTitle}>Choose a room</h2>
                <p className={stepHint}>Look through the photos and reviews, then pick the room that suits you.</p>
              </div>
              <div role="radiogroup" aria-label="Room" className="grid gap-2.5 sm:grid-cols-2">
                {rooms.map(r => {
                  const selected = r.id === room.id
                  return (
                    <label key={r.id} className={`group flex cursor-pointer gap-3 rounded-card border bg-surface p-2 pr-3.5 transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${selected ? 'border-primary bg-primary-tint/40 ring-1 ring-primary' : 'border-line hover:border-ink/30'}`}>
                      <input type="radio" name="room" value={r.id} checked={selected} onChange={() => chooseRoom(r.id)} className="sr-only" />
                      <Photo name={r.photo} sizes="80px" className="size-16 shrink-0 rounded-control object-cover" />
                      <span className="flex min-w-0 flex-1 flex-col justify-center">
                        <span className="text-base font-bold leading-tight">{r.name}</span>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted"><Users size={12} />Sleeps {r.sleeps}</span>
                        <span className="mt-1 text-sm"><b className="text-base">{peso(r.baseRate)}</b><span className="text-muted"> / night</span></span>
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="space-y-6">
                <RoomGallery key={room.id} room={room} />
                <div>
                  <h3 className="text-lg font-bold">{room.name}</h3>
                  <p className="mt-1 text-sm text-muted">{room.beds}, sleeps {room.sleeps}, {room.sizeSqm} sqm</p>
                  <p className="mt-3 max-w-prose text-pretty text-base leading-[1.7] text-muted">{room.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink">
                    {room.perks.map(perk => <li key={perk} className="inline-flex items-center gap-1.5"><Check size={13} className="text-primary" aria-hidden />{perk}</li>)}
                  </ul>
                </div>
                <RoomReviews roomId={room.id} />
              </div>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="dates-h">
              <h2 id="dates-h" className={stepTitle}>Pick your dates</h2>
              <p className={stepHint} aria-live="polite">
                {!checkIn || checkOut ? 'Select your check-in date, then your check-out date.' : 'Now select your check-out date.'}
              </p>
       <div className="card mt-4 p-4 sm:p-5" data-error={Boolean(errors.dates)}>
                <AvailabilityCalendar
                  room={room}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onChange={(a, b) => {
                    setCheckIn(a)
                    setCheckOut(b)
                    setErrors(current => ({ ...current, dates: undefined }))
                  }}
                  onRejected={toast}
                />
              </div>
              {errors.dates && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{errors.dates}</p>}
              {hasDates && (
                <button type="button" onClick={() => { setCheckIn(null); setCheckOut(null) }} className="mt-3 text-sm font-semibold text-primary hover:underline">Clear dates</button>
              )}
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="who-h">
              <h2 id="who-h" className={stepTitle}>Who is staying?</h2>
              <p className={stepHint}>We use these details to send your confirmation.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="f-name">Full name</label>
                  <input id="f-name" className="field field-compact" autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'e-name' : undefined} />
                  {errors.name && <p id="e-name" className="mt-1.5 text-sm text-danger">{errors.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="f-mobile">Mobile number</label>
                  <input id="f-mobile" className="field field-compact" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={form.mobile} onChange={e => update('mobile', e.target.value)} aria-invalid={Boolean(errors.mobile)} aria-describedby="h-mobile" />
                  <p id="h-mobile" className={`mt-1.5 text-sm ${errors.mobile ? 'text-danger' : 'text-muted'}`}>{errors.mobile ?? 'We text your confirmation here.'}</p>
                </div>
                <div>
                  <label className="label" htmlFor="f-guests">Guests</label>
                  <select id="f-guests" className="field field-compact" value={form.guests} onChange={e => update('guests', Number(e.target.value))}>
                    {Array.from({ length: room.sleeps }, (_, i) => i + 1).map(n => <option key={n} value={n}>{plural(n, 'guest')}</option>)}
                  </select>
                  <p className="mt-1.5 text-sm text-muted">This room sleeps up to {room.sleeps}.</p>
                </div>
                <p className="text-sm text-muted sm:col-span-2">
                  Confirmation goes to <b className="text-ink">{account?.email}</b>.{' '}
                  <button type="button" onClick={() => signOut()} className="font-bold text-primary hover:underline">Not you? Sign out</button>
                </p>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="pay-h">
              <h2 id="pay-h" className={stepTitle}>Pay the down payment</h2>
              <p className={stepHint}>Check your booking summary, then choose how to pay.</p>
              <div role="radiogroup" aria-label="Payment method" className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {([
                  ['gcash_manual', 'GCash', 'Send it, then upload a screenshot', Smartphone],
                  ['paymongo', 'Card, Maya or QR Ph', 'Secure checkout, confirmed right away', CreditCard]
                ] as const).map(([value, title, hint, Icon]) => (
                  <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-card border bg-surface p-3.5 transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${method === value ? 'border-primary bg-primary-tint/40 ring-1 ring-primary' : 'border-line hover:border-ink/30'}`}>
                    <input type="radio" name="method" className="sr-only" checked={method === value} onChange={() => setMethod(value)} />
                    <span className={`grid size-9 shrink-0 place-items-center rounded-control ${method === value ? 'bg-primary text-white' : 'bg-sand text-ink'}`}><Icon size={17} /></span>
                    <span>
                      <span className="block text-base font-bold">{title}</span>
                      <span className="block text-sm text-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              {method === 'gcash_manual' ? (
                <div className="mt-3 bg-tertiary-tint p-4" data-error={Boolean(errors.proof)}>
                  <p className="text-sm leading-[1.65] text-tertiary-deep">
                    Send {quote ? <b>{peso(quote.downPayment)}</b> : 'the down payment'} to GCash <b>{db.settings.gcashNumber}</b> ({db.settings.gcashName}), then upload the screenshot.
                    The owner checks it and texts you, usually within a few hours.
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="f-proof" onChange={e => onProof(e.target.files?.[0])} aria-describedby={errors.proof ? 'e-proof' : undefined} />
                  <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm bg-surface"><ImagePlus size={15} />{proof ? 'Change screenshot' : 'Upload screenshot'}</button>
                    {proof && <img src={proof} alt="Your uploaded GCash screenshot" className="h-14 w-auto rounded-control border border-line object-cover" />}
                  </div>
                  {errors.proof && <p id="e-proof" role="alert" className="mt-2.5 text-sm font-semibold text-danger">{errors.proof}</p>}
                </div>
              ) : (
                <p className="mt-3 rounded-control bg-sand/70 p-4 text-sm leading-[1.65] text-muted">
                  You will pay on a secure checkout page. Your dates are held for 30 minutes while you pay.
                </p>
              )}
            </section>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={() => goTo(step - 1)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-base font-bold text-ink transition-colors hover:text-primary"><ArrowLeft size={16} aria-hidden />Back</button>
            ) : <span />}
            <button type="submit" disabled={submitting} className="btn btn-primary px-6">
              {nextLabel}
              {!isLast && <ArrowRight size={16} aria-hidden />}
            </button>
          </div>
        </form>
        )}

        <aside aria-live="polite" className="lg:sticky lg:top-20">
          <div className="glass-strong overflow-hidden rounded-panel shadow-lift">
            <Photo name={room.photo} sizes="352px" className="aspect-[2/1] w-full object-cover" />
            <div className="p-5">
              <h2 className="text-lg font-bold">{room.name}</h2>
              <p className="mt-0.5 text-sm text-muted">{room.beds}, sleeps {room.sleeps}</p>
              {quote && checkIn && checkOut ? (
                <>
                  <StayDates checkIn={checkIn} checkOut={checkOut} checkInTime={db.settings.checkInTime} checkOutTime={db.settings.checkOutTime} className="my-4" compact />
                  <PriceLines lines={lines} />
                  <p className="mt-4 text-center text-xs leading-relaxed text-muted">Free cancellation up to {db.settings.cancellationDays} days before check-in. After that the down payment is not refunded.</p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm text-muted">Pick your check-in and check-out dates to see the total.</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    <li className="flex justify-between"><span>Weeknights</span><span>{peso(room.baseRate)}</span></li>
                    <li className="flex justify-between"><span>Friday and Saturday nights</span><span>{peso(room.baseRate + room.weekendExtra)}</span></li>
                    <li className="flex justify-between"><span>Cleaning fee, once per stay</span><span>{peso(db.settings.cleaningFee)}</span></li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <CardCheckoutDialog
        booking={checkout}
        onClose={() => {
          if (checkout) navigate(`/booking/${checkout.reference}`)
          setCheckout(null)
        }}
        onPaid={booking => {
          setCheckout(null)
          navigate(`/booking/${booking.reference}`)
        }}
      />
    </div>
  )
}
