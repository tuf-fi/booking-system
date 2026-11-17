import { Link } from 'react-router-dom'
import { Accessibility, ArrowRight, Bus, Check, CircleX, Clock, Landmark, Moon, PawPrint, Plane, SquareParking, Users } from 'lucide-react'
import { FaqList } from '../components/FaqList'
import { InquiryForm } from '../components/InquiryForm'
import { Photo } from '../components/Photo'
import { PolicyTimeline } from '../components/PolicyTimeline'
import { RoomCarousel } from '../components/RoomCarousel'
import { SearchBar } from '../components/SearchBar'
import { SocialLinks } from '../components/SocialLinks'
import { SectionHeading } from '../components/SectionHeading'
import { scrollToSection } from '../components/SiteLayout'
import { INQUIRY_FALLBACK_EMAIL } from '../lib/inquiry'
import { peso } from '../lib/money'
import { EXTRAS, SITE } from '../lib/site'
import { useDb } from '../store/db'

const AMENITIES = [
  { title: 'Fiber Wi-Fi', text: 'Fast enough for video calls, in every room and on the roof deck.' },
  { title: 'Hot showers', text: 'Water heaters in every bathroom.' },
  { title: 'Roof deck', text: 'Chairs, tables and a clear view of Mayon.' },
  { title: 'Shared kitchen', text: 'Fridge, stove, rice cooker, plates and cutlery.' },
  { title: 'Free parking', text: `Space for ${SITE.parkingSpaces === 4 ? 'four' : SITE.parkingSpaces} cars inside the gate.` },
  { title: 'Safe and secure', text: 'Gated, with CCTV in the halls and staff on site 24 hours.' }
]

const PAID_EXTRAS = [
  { title: 'Laundry', text: 'Wash, dry and fold, ready the same day.', price: `${peso(EXTRAS.laundry)} per load` },
  { title: 'Airport pickup', text: 'From Bicol International Airport, booked a day ahead.', price: `${peso(EXTRAS.airportPickup)} per trip` },
  { title: 'Tour help', text: 'ATV rides, Cagsawa trips and van hire with local guides.', price: 'Ask us' }
]

const HOUSE_RULES = [
  [
    { label: 'Check-in', lines: ['From 2 PM'], Icon: Clock },
    { label: 'Check-out', lines: ['Until 11 AM'], Icon: Clock },
    { label: 'Quiet hours', lines: ['10 PM to 7 AM'], Icon: Moon }
  ],
  [
    { label: 'Guests', lines: ['Up to {MAX_GUESTS} per room'], Icon: Users },
    { label: 'Minimum age', lines: ['Guests must be 18 or older to check in'], Icon: Check },
    { label: 'Smoke-free property', lines: ['Smoking is not allowed on the property'], Icon: CircleX }
  ],
  [
    { label: 'Front desk', lines: ['Open 24 hours. Ask about accessibility features.'], Icon: Accessibility },
    { label: 'Parking', lines: ['Free for guests, inside the gate'], Icon: SquareParking },
    { label: 'Pets', lines: ['Dogs only, up to 6.8 kg, 2 per room', `A ${peso(EXTRAS.petCleaning)} cleaning fee applies per stay`], Icon: PawPrint }
  ]
]

const FAQ = [
  ['Is breakfast included?', `No, but you can order a Filipino breakfast (longganisa, tapa or tocino with rice, egg and coffee) for ${peso(EXTRAS.breakfast)} the night before. You're also free to cook in the shared kitchen.`],
  ['Can I check in early or check out late?', `If your room is ready, early check-in is free. Late check-out until 2 PM costs ${peso(EXTRAS.lateCheckOut)} if nobody is checking in after you. Message us on the day.`],
  ['Do you accept walk-in guests?', 'Yes, if a room is free. Booking online is safer, especially from December to May and during the Ibalong Festival in August.'],
  ['Can I see Mayon from my room?', 'From the Deluxe double and the Family room, yes. From every room you can walk up to the roof deck. Mayon is clearest early in the morning.'],
  ['How do I pay the balance?', 'Pay the rest at check-in, in cash or by GCash.']
]

export function Home() {
  const db = useDb()
  const rooms = db.rooms.filter(room => room.isActive)
  const maxWeekendExtra = rooms.reduce((max, room) => Math.max(max, room.weekendExtra), 0)
  const maxGuests = rooms.reduce((max, room) => Math.max(max, room.sleeps), 0)

  return (
    <>
      <section aria-label="Welcome" className="relative isolate flex min-h-screen min-h-[100svh] w-full flex-col lg:min-h-[calc(100svh-2.5rem)]">
        <Photo name="mayon-sunrise" size="full" priority sizes="100vw" className="absolute inset-0 -z-10 size-full object-cover object-[50%_60%]" />
        <div className="absolute inset-0 -z-10 bg-ink/25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/15 to-ink/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/50 via-ink/10 to-transparent" />
        <div className="flex w-full flex-1 flex-col justify-end gap-8 px-5 pb-8 pt-28 sm:gap-10 sm:px-10 sm:pb-14 lg:px-[7.5%] lg:pb-24">
          <div className="max-w-xl text-white">
            <p className="flex items-center gap-3 text-eyebrow font-bold uppercase tracking-[0.22em] text-white/85">
              <span className="h-px w-7 bg-primary" aria-hidden />Legazpi City, Albay
            </p>
            <h1 className="mt-4 text-hero-sm font-extrabold leading-[1.1] sm:text-hero-md lg:text-hero">Wake up to Mayon from the roof deck.</h1>
            <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">Clean rooms, hot showers and fast Wi-Fi at local prices. Book direct and skip the booking-site fees.</p>
          </div>
          <div className="w-full max-w-4xl lg:absolute lg:bottom-0 lg:left-1/2 lg:z-20 lg:w-[min(56rem,calc(100%-2.5rem))] lg:-translate-x-1/2 lg:translate-y-1/2">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container-page">
        <section id="inn" aria-labelledby="about-h" className="grid items-center gap-14 pt-20 lg:grid-cols-2 lg:gap-24 lg:pt-36">
          <div className="max-w-lg">
            <h2 id="about-h" className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Quiet street, warm welcome.</h2>
            <div className="mt-5 space-y-4 text-pretty text-base leading-[1.7] text-muted">
              <p>{rooms.length} room types across three floors, from a budget single to a family room that sleeps {maxGuests}. The owners live on the ground floor, so someone is always around for directions, tricycle rides or a late check-in.</p>
              <p>The best spot in the house is the roof deck, where Mayon fills the view on clear mornings. We are a short ride from the city center, SM City Legazpi and the bay.</p>
            </div>
            <button type="button" onClick={() => scrollToSection('rooms')} className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-ink">
              See the rooms
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-white transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span>
            </button>
          </div>

          <div className="relative pb-10 pl-0 sm:pl-6">
            <figure className="relative overflow-hidden rounded-panel">
              <Photo name="roof-deck" sizes="(min-width: 1024px) 640px, 100vw" className="aspect-[5/4] w-full object-cover" />
              <figcaption className="chip chip-photo absolute left-4 top-4">Roof deck, open 5 AM to 10 PM</figcaption>
            </figure>
            <figure className="absolute bottom-0 left-4 w-[42%] overflow-hidden rounded-card shadow-lift ring-[6px] ring-paper sm:left-0 sm:w-[38%]">
              <Photo name="kitchen" sizes="(min-width: 1024px) 240px, 40vw" className="aspect-square w-full object-cover" />
            </figure>
          </div>
        </section>

        <section id="rooms" aria-labelledby="rooms-h" className="pt-24 lg:pt-32">
          <RoomCarousel
            rooms={rooms}
            heading={
              <SectionHeading
                id="rooms-h"
                title="Pick your room"
                description={`All rooms have aircon, Wi-Fi, fresh towels and toiletries.${maxWeekendExtra > 0 ? ` Friday and Saturday nights cost up to ${peso(maxWeekendExtra)} more.` : ''} Hold a room with a ${db.settings.downPaymentPercent}% down payment, and cancel free up to ${db.settings.cancellationDays} days before check-in.`}
              />
            }
          />
        </section>

        <section aria-labelledby="amen-h" className="grid gap-10 pt-24 md:grid-cols-[0.8fr_1.5fr] md:gap-12 lg:gap-20 lg:pt-32">
          <div className="md:sticky md:top-28 md:self-start">
            <SectionHeading id="amen-h" title="What you get" description="Everything here is part of every stay. Paid extras are listed after." />
          </div>
          <div className="max-w-2xl md:max-w-none">
            <dl className="border-t border-line">
              {AMENITIES.map(({ title, text }) => (
                <div key={title} className="group grid items-baseline gap-y-1 border-b border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-x-8 lg:grid-cols-[13rem_1fr] lg:gap-x-12">
                  <dt className="font-display text-lg font-bold leading-snug transition-colors duration-300 group-hover:text-primary">{title}</dt>
                  <dd className="max-w-prose text-pretty text-base leading-[1.7] text-muted">{text}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-10 font-display text-lg font-bold">Paid extras</h3>
            <dl className="mt-3 border-t border-line">
              {PAID_EXTRAS.map(({ title, text, price }) => (
                <div key={title} className="grid items-baseline gap-y-1 border-b border-line py-4 sm:grid-cols-[11rem_1fr_auto] sm:gap-x-8 lg:grid-cols-[13rem_1fr_auto] lg:gap-x-12">
                  <dt className="font-display text-lg font-bold leading-snug">{title}</dt>
                  <dd className="max-w-prose text-pretty text-base leading-[1.7] text-muted">{text}</dd>
                  <dd><span className="chip bg-accent-tint text-accent-deep">{price}</span></dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <section id="location" aria-labelledby="loc-h" className="mt-24 bg-secondary text-white/90 lg:mt-32">
        <div className="grid lg:grid-cols-[1fr_1.15fr]">
          <div className="px-5 py-12 lg:py-16 lg:pl-[5vw] lg:pr-14">
            <SectionHeading id="loc-h" title="Getting here" tone="light" />
            <address className="mt-4 text-base not-italic leading-[1.7] tracking-normal text-white/80">
              Lantaw Inn, Legazpi City, Albay, Philippines
            </address>
            <p className="mt-2 text-base tracking-normal text-white/80">Tel: <a href={SITE.phoneHref} className="font-semibold text-white underline decoration-white/40 underline-offset-4">{SITE.phone}</a></p>

            <div className="mt-6 border-t border-white/15">
              {[
                [Plane, 'Bicol International Airport, Daraga', 'About 40 minutes from the inn by car or tricycle.'],
                [Bus, 'Legazpi Grand Central Terminal', 'About 10 minutes from the inn by car or tricycle.'],
                [Landmark, 'Cagsawa Ruins, Daraga', 'About 25 minutes from the inn by car or tricycle.']
              ].map(([Icon, place, detail]) => {
                const RowIcon = Icon as typeof Plane
                return (
                  <div key={place as string} className="flex items-start gap-3 border-b border-white/15 py-4">
                    <RowIcon aria-hidden size={18} className="mt-1 shrink-0 text-accent" />
                    <div>
                      <p className="text-base font-bold tracking-normal text-white">{place as string}</p>
                      <p className="mt-1 text-sm leading-[1.65] text-white/75">{detail as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative min-h-[18rem] bg-sand lg:min-h-[26rem]">
            <iframe
              title="Map of Legazpi City, Albay"
              src="https://www.openstreetmap.org/export/embed.html?bbox=123.719%2C13.126%2C123.769%2C13.153&layer=mapnik&marker=13.1391%2C123.7438"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 size-full"
            />
            <a href="https://www.openstreetmap.org/?mlat=13.1391&mlon=123.7438#map=14/13.1391/123.7438" target="_blank" rel="noreferrer" className="glass-strong absolute bottom-3 left-3 px-3 py-2 text-sm font-bold text-ink">Open the map</a>
          </div>
        </div>
      </section>

      <div className="container-page">
        <section aria-labelledby="rules-h" className="pt-24 lg:pt-32">
          <div>
            <SectionHeading id="rules-h" title="House rules" description="A few simple rules to keep every stay comfortable for everyone." />
            <div className="mt-10 grid items-start gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
              {HOUSE_RULES.map((column, index) => (
                <dl key={index} className="space-y-7">
                  {column.map(({ label, lines, Icon }) => (
                    <div key={label} className="flex items-start gap-3.5">
                      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-tertiary" strokeWidth={1.5} />
                      <div>
                        <dt className="text-base font-bold leading-snug">{label}</dt>
                        {lines.map(line => (
                          <dd key={line} className="mt-1 text-sm leading-[1.6] text-muted">
                            {line.replace('{MAX_GUESTS}', String(maxGuests))}
                          </dd>
                        ))}
                      </div>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="pol-h" className="pt-24 lg:pt-32">
          <div>
            <SectionHeading id="pol-h" title="Payment and cancellation" description="How the down payment works, and when you can cancel for a full refund." />
          </div>

          <PolicyTimeline downPaymentPercent={db.settings.downPaymentPercent} cancellationDays={db.settings.cancellationDays} />
        </section>

        <section id="faq" aria-labelledby="faq-h" className="grid gap-10 pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pt-32">
          <div>
            <SectionHeading id="faq-h" title={<><span className="text-primary">Answers,</span> before you ask.</>} description="Can't find what you're looking for? We're happy to help directly." />
            <button type="button" onClick={() => scrollToSection('contact')} className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary-deep underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary-deep">
              Get in touch <ArrowRight aria-hidden size={15} />
            </button>
          </div>
          <FaqList items={FAQ} />
        </section>

        <section id="contact" aria-labelledby="contact-h" className="grid gap-10 pt-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:pt-32">
          <figure className="relative aspect-[4/3] overflow-hidden rounded-panel border border-ink/10 sm:aspect-[16/9] lg:aspect-auto">
            <Photo name="mayon-dusk" sizes="(min-width: 1024px) 40vw, 100vw" className="absolute inset-0 size-full object-cover" />
          </figure>

          <div className="flex h-full flex-col justify-end">
            <SectionHeading id="contact-h" size="lg" className="mb-6" title={<>Let's <span className="text-primary">talk.</span></>} />

            <div className="grid grid-cols-1 divide-y divide-ink/15 overflow-hidden rounded-card border border-ink/15 md:grid-cols-2 md:divide-x md:divide-y-0">
              <InquiryForm />
              <dl className="flex flex-col gap-6 p-6 sm:p-9">
                <div>
                  <dt className="mb-1 text-base font-bold leading-tight">Contact</dt>
                  <dd className="text-sm leading-[1.6] text-muted">
                    <a href={SITE.phoneHref} className="block transition-colors hover:text-primary">{SITE.phone}</a>
                    <a href={`mailto:${INQUIRY_FALLBACK_EMAIL}`} className="block transition-colors hover:text-primary">{INQUIRY_FALLBACK_EMAIL}</a>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-base font-bold leading-tight">Based in</dt>
                  <dd className="text-sm leading-[1.6] text-muted">Legazpi City, Albay</dd>
                </div>
                <div>
                  <dt className="mb-1 text-base font-bold leading-tight">Front desk</dt>
                  <dd className="text-sm leading-[1.6] text-muted">Staff on site 24 hours a day</dd>
                </div>
                <div>
                  <dt className="mb-2 text-base font-bold leading-tight">Follow</dt>
                  <dd><SocialLinks /></dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="pt-24 lg:pt-32">
          <div className="relative isolate overflow-hidden rounded-panel text-white">
            <Photo name="room-deluxe" size="full" sizes="1200px" className="absolute inset-0 -z-20 size-full object-cover object-[50%_55%]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent sm:bg-gradient-to-r sm:from-ink/80 sm:via-ink/35 sm:to-transparent" />
            <div className="flex min-h-[22rem] flex-col justify-end gap-8 px-6 py-10 sm:min-h-[24rem] sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-14">
              <div className="max-w-md">
                <h2 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Ready to book your stay?</h2>
                <p className="mt-3 text-pretty text-base leading-[1.7] text-white/90">Pick your room and dates and see the full price right away.</p>
              </div>
              <Link to="/book" className="btn shrink-0 px-7 py-4 self-start bg-white text-ink transition-colors hover:bg-primary hover:text-white sm:self-auto">
                Check dates and book
                <ArrowRight aria-hidden size={18} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
