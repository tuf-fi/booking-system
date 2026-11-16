import { Link } from 'react-router-dom'
import { Accessibility, ArrowRight, Bus, Check,CircleX, Clock, KeyRound, Landmark, Moon, PawPrint, Plane, SquareParking, Users } from 'lucide-react'
import { FaqList } from '../components/FaqList'
import { InquiryForm } from '../components/InquiryForm'
import { Photo } from '../components/Photo'
import { PolicyTimeline } from '../components/PolicyTimeline'
import { RoomCarousel } from '../components/RoomCarousel'
import { SearchBar } from '../components/SearchBar'
import { SocialLinks } from '../components/SocialLinks'
import { scrollToSection } from '../components/SiteLayout'
import { INQUIRY_FALLBACK_EMAIL } from '../lib/inquiry'
import { useDb } from '../store/db'

const AMENITIES = [
  { title: 'Fiber Wi-Fi', text: 'Fast enough for video calls, in every room and on the roof deck.' },
  { title: 'Hot showers', text: 'Water heaters in every bathroom.' },
  { title: 'Roof deck', text: 'Chairs, tables and a clear view of Mayon.' },
  { title: 'Shared kitchen', text: 'Fridge, stove, rice cooker, plates and cutlery.' },
  { title: 'Free parking', text: 'Space for four cars inside the gate.' },
  { title: 'Drinking water', text: 'Free purified water refills on every floor.' },
  { title: 'Laundry', text: 'Wash, dry and fold for ₱150 per load, ready the same day.' },
  { title: 'Airport pickup', text: 'From Bicol International Airport for ₱600 per trip, booked a day ahead.' },
  { title: 'Tour help', text: 'We can arrange ATV rides, Cagsawa trips and van hire with local guides.' },
  { title: 'Safe and secure', text: 'Gated, with CCTV in the halls and staff on site 24 hours.' }
]

const HOUSE_RULES = [
  [
    { label: 'Check-in', lines: ['From 2 PM'], Icon: Clock },
    { label: 'Check-out', lines: ['Until 11 AM'], Icon: Clock },
    { label: 'Quiet hours', lines: ['10 PM to 7 AM'], Icon: Moon },
    { label: 'Guests', lines: ['Up to {MAX_GUESTS} per room'], Icon: Users }
  ],
  [
    { label: 'Minimum age', lines: ['Guests must be 18 or older to check in'], Icon: Check },
    { label: 'Smoke-free property', lines: ['Smoking is not allowed on the property'], Icon: CircleX },
    { label: 'Accessibility', lines: ['Ask the front desk about accessibility features'], Icon: Accessibility },
    { label: 'Entry and front desk', lines: ['Key card access, front desk open 24 hours'], Icon: KeyRound }
  ],
  [
    { label: 'Pets welcome', lines: ['Dogs only, up to 6.8 kg, 2 per room', 'A ₱3,000 cleaning fee applies per stay'], Icon: PawPrint },
    { label: 'On-site parking', lines: ['Daily ₱150, or valet ₱150 per stay', 'Free for checked-in guests and restaurant patrons'], Icon: SquareParking }
  ]
]

const FAQ = [
  ['Is breakfast included?', "No, but you can order a Filipino breakfast (longganisa, tapa or tocino with rice, egg and coffee) for ₱180 the night before. You're also free to cook in the shared kitchen."],
  ['Can I check in early or check out late?', 'If your room is ready, early check-in is free. Late check-out until 2 PM costs ₱300 if nobody is checking in after you. Message us on the day.'],
  ['Do you accept walk-in guests?', 'Yes, if a room is free. Booking online is safer, especially from December to May and during the Ibalong Festival in August.'],
  ['Can I see Mayon from my room?', 'From the Deluxe double and the Family room, yes. From every room you can walk up to the roof deck. Mayon is clearest early in the morning.'],
  ['How do I pay the balance?', 'Pay the rest at check-in, in cash or by GCash.']
]

export function Home() {
  const db = useDb()
  const rooms = db.rooms.filter(room => room.isActive)

  return (
    <>
      <section aria-label="Welcome" className="relative isolate flex min-h-screen min-h-[100svh] w-full flex-col lg:min-h-[calc(100svh-2.5rem)]">
        <Photo name="mayon-sunrise" size="full" priority sizes="100vw" className="absolute inset-0 -z-10 size-full object-cover object-[50%_60%]" />
        <div className="absolute inset-0 -z-10 bg-ink/25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/15 to-ink/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/50 via-ink/10 to-transparent" />
        <div className="flex w-full flex-1 flex-col justify-end gap-8 px-5 pb-8 pt-28 sm:gap-10 sm:px-10 sm:pb-14 lg:px-[7.5%] lg:pb-24">
          <div className="max-w-xl text-white">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/85">
              <span className="h-px w-7 bg-leaf" aria-hidden />Legazpi City, Albay
            </p>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.75rem]">Wake up to Mayon from the roof deck.</h1>
            <p className="mt-4 max-w-md text-sm text-white/90 sm:text-base">Clean rooms, hot showers and fast Wi-Fi at local prices. Book direct and skip the booking-site fees.</p>
          </div>
          <div className="w-full max-w-4xl lg:absolute lg:bottom-0 lg:left-1/2 lg:z-20 lg:w-[min(56rem,calc(100%-2.5rem))] lg:-translate-x-1/2 lg:translate-y-1/2">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container-page">
        <section id="inn" aria-labelledby="about-h" className="grid items-center gap-14 pt-20 lg:grid-cols-2 lg:gap-24 lg:pt-36">
          <div className="max-w-lg">
            <p className="eyebrow">The inn</p>
            <h2 id="about-h" className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Quiet street, warm welcome.</h2>
            <div className="mt-5 space-y-4 text-pretty text-[0.9375rem] leading-[1.7] text-muted">
              <p>Five room types across three floors, from a budget single to a family room that sleeps six. The owners live on the ground floor, so someone is always around for directions, tricycle rides or a late check-in.</p>
              <p>The best spot in the house is the roof deck, where Mayon fills the view on clear mornings. We are a short ride from the city center, SM City Legazpi and the bay.</p>
            </div>
            <button type="button" onClick={() => scrollToSection('rooms')} className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-ink">
              See the rooms
              <span className="grid size-8 place-items-center rounded-none bg-ink text-white transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span>
            </button>
          </div>

          <div className="relative pb-10 pl-0 sm:pl-6">
            <figure className="relative overflow-hidden rounded-none">
              <Photo name="roof-deck" sizes="(min-width: 1024px) 640px, 100vw" className="aspect-[5/4] w-full object-cover" />
              <figcaption className="glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-bold">Roof deck, open 5 AM to 10 PM</figcaption>
            </figure>
            <figure className="absolute bottom-0 left-4 w-[42%] overflow-hidden rounded-none shadow-lift ring-[6px] ring-paper sm:left-0 sm:w-[38%]">
              <Photo name="kitchen" sizes="(min-width: 1024px) 240px, 40vw" className="aspect-square w-full object-cover" />
            </figure>
          </div>
        </section>

        <section id="rooms" aria-labelledby="rooms-h" className="pt-24 lg:pt-32">
          <RoomCarousel
            rooms={rooms}
            heading={
              <div>
                <p className="eyebrow">Rooms</p>
                <h2 id="rooms-h" className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Pick your room</h2>
                <p className="mt-3 max-w-md text-pretty text-[0.9375rem] leading-[1.7] text-muted">All rooms have aircon, Wi-Fi, fresh towels and toiletries. Friday and Saturday nights cost a little more.</p>
              </div>
            }
          />
        </section>

        <section aria-labelledby="amen-h" className="grid gap-10 pt-24 md:grid-cols-[0.8fr_1.5fr] md:gap-12 lg:gap-20 lg:pt-32">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow">At the inn</p>
            <h2 id="amen-h" className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">What you get</h2>
            <p className="mt-3 max-w-xs text-pretty text-[0.9375rem] leading-[1.7] text-muted">Most of this is part of every stay. Laundry and airport pickup are paid extras.</p>
          </div>
          <dl className="max-w-2xl border-t border-line md:max-w-none">
            {AMENITIES.map(({ title, text }) => (
              <div key={title} className="group grid items-baseline gap-y-1 border-b border-line py-6 sm:grid-cols-[11rem_1fr] sm:gap-x-8 lg:grid-cols-[13rem_1fr] lg:gap-x-12">
                <dt className="font-display text-lg font-bold leading-snug transition-colors duration-300 group-hover:text-leaf">{title}</dt>
                <dd className="max-w-prose text-pretty text-[0.9375rem] leading-[1.7] text-muted transition-colors duration-300 group-hover:text-ink/80">{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="location" aria-labelledby="loc-h" className="pt-24 lg:pt-32">
          <div className="relative left-1/2 w-screen -translate-x-1/2 bg-ink text-white/90">
           <div className="container-page grid gap-8 py-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14 lg:py-12">
            <div>
              <h3 id="loc-h" className="text-white/95 text-xl font-extrabold leading-tight sm:text-2xl">Getting here</h3>
              <address className="mt-4 text-[0.9375rem] not-italic leading-[1.7] tracking-normal text-white/70">
                Lantaw Inn, Legazpi City, Albay, Philippines
              </address>
              <p className="mt-2 text-[0.9375rem] tracking-normal text-white/70">Tel: <a href="tel:+639175550142" className="font-semibold text-white/90 underline decoration-white/30 underline-offset-4">0917 555 0142</a></p>

              <div className="mt-6 border-t border-white/12">
                {[
                  [Plane, 'Bicol International Airport, Daraga', 'About 40 minutes from the inn by car or tricycle.'],
                  [Bus, 'Legazpi Grand Central Terminal', 'About 10 minutes from the inn by car or tricycle.'],
                  [Landmark, 'Cagsawa Ruins, Daraga', 'About 25 minutes from the inn by car or tricycle.']
                ].map(([Icon, place, detail]) => {
                  const RowIcon = Icon as typeof Plane
                  return (
                    <div key={place as string} className="flex items-start gap-3 border-b border-white/12 py-4">
                      <RowIcon aria-hidden size={18} className="mt-1 shrink-0 text-white/60" />
                      <div>
                        <p className="text-[0.9375rem] font-bold tracking-normal text-white/90">{place as string}</p>
                        <p className="mt-1 text-sm leading-[1.65] text-white/60">{detail as string}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative -mx-5 -mb-10 min-h-[18rem] overflow-hidden bg-sand lg:mx-0 lg:-my-12 lg:-mr-[7.5vw] lg:min-h-[22rem]">
              <iframe
                title="Map of Legazpi City, Albay"
                src="https://www.openstreetmap.org/export/embed.html?bbox=123.719%2C13.126%2C123.769%2C13.153&layer=mapnik&marker=13.1391%2C123.7438"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 size-full"
              />
            </div>
           </div>
          </div>

          <div className="mt-20 lg:mt-24">
            <div>
              <p className="eyebrow">Before you arrive</p>
              <h3 className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">House rules</h3>
              <p className="mt-3 max-w-md text-pretty text-[0.9375rem] leading-[1.7] text-muted">A few simple rules to keep every stay comfortable for everyone.</p>
            </div>
            <div className="mt-10 grid items-start gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
              {HOUSE_RULES.map((column, index) => (
                <dl key={index} className="space-y-7">
                  {column.map(({ label, lines, Icon }) => (
                    <div key={label} className="flex items-start gap-3.5">
                      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-leaf" strokeWidth={1.5} />
                      <div>
                        <dt className="text-[0.9375rem] font-bold leading-snug">{label}</dt>
                        {lines.map(line => (
                          <dd key={line} className="mt-1 text-[0.875rem] leading-[1.6] text-muted">
                            {line.replace('{MAX_GUESTS}', String(Math.max(...rooms.map(room => room.sleeps))))}
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
            <p className="eyebrow">Booking policy</p>
            <h2 id="pol-h" className="mt-3 text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Payment and cancellation</h2>
            <p className="mt-3 max-w-md text-pretty text-[0.9375rem] leading-[1.7] text-muted">How the down payment works, and when you can cancel for a full refund.</p>
          </div>

          <PolicyTimeline downPaymentPercent={db.settings.downPaymentPercent} cancellationDays={db.settings.cancellationDays} />
        </section>

        <section id="faq" aria-labelledby="faq-h" className="grid gap-10 pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pt-32">
          <div>
            <h2 id="faq-h" className="mb-4 text-[clamp(1.625rem,3vw,2.375rem)] font-extrabold leading-[1.1]">
              <span className="text-leaf">Answers,</span><br />before you ask.
            </h2>
            <p className="mb-6 max-w-xs text-[0.9375rem] leading-[1.7] text-muted">Can't find what you're looking for? We're happy to help directly.</p>
            <button type="button" onClick={() => scrollToSection('contact')} className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold uppercase tracking-wide text-leaf-deep underline decoration-leaf/40 underline-offset-4 transition-colors hover:decoration-leaf-deep">
              Get in touch <ArrowRight aria-hidden size={15} />
            </button>
          </div>
          <FaqList items={FAQ} />
        </section>

        <section id="contact" aria-labelledby="contact-h" className="grid gap-10 pt-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:pt-32">
          <figure className="relative aspect-[4/3] overflow-hidden border border-ink/10 sm:aspect-[16/9] lg:aspect-auto">
            <Photo name="mayon-dusk" sizes="(min-width: 1024px) 40vw, 100vw" className="absolute inset-0 size-full object-cover" />
          </figure>

          <div className="flex h-full flex-col justify-end">
            <h2 id="contact-h" className="mb-6 text-[clamp(2rem,4.2vw,3.375rem)] font-extrabold leading-[1] text-ink">
              Let's <span className="text-leaf">talk.</span>
            </h2>

            <div className="grid grid-cols-1 divide-y divide-ink/15 border border-ink/15 md:grid-cols-2 md:divide-x md:divide-y-0">
              <InquiryForm />
              <dl className="flex flex-col gap-6 p-6 sm:p-9">
                <div>
                  <dt className="mb-1 text-[0.9375rem] font-bold leading-tight">Contact</dt>
                  <dd className="text-[0.8125rem] leading-[1.6] text-muted">
                    <a href="tel:+639175550142" className="block transition-colors hover:text-leaf">0917 555 0142</a>
                    <a href={`mailto:${INQUIRY_FALLBACK_EMAIL}`} className="block transition-colors hover:text-leaf">{INQUIRY_FALLBACK_EMAIL}</a>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-[0.9375rem] font-bold leading-tight">Based in</dt>
                  <dd className="text-[0.8125rem] leading-[1.6] text-muted">Legazpi City, Albay</dd>
                </div>
                <div>
                  <dt className="mb-1 text-[0.9375rem] font-bold leading-tight">Front desk</dt>
                  <dd className="text-[0.8125rem] leading-[1.6] text-muted">Staff on site 24 hours a day</dd>
                </div>
                <div>
                  <dt className="mb-2 text-[0.9375rem] font-bold leading-tight">Follow</dt>
                  <dd><SocialLinks /></dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="pt-24 lg:pt-32">
          <div className="relative isolate overflow-hidden rounded-none text-white">
            <Photo name="mayon-sunrise" size="full" sizes="1200px" className="absolute inset-0 -z-20 size-full object-cover object-[50%_55%]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent sm:bg-gradient-to-r sm:from-ink/80 sm:via-ink/35 sm:to-transparent" />
            <div className="flex min-h-[22rem] flex-col justify-end gap-8 px-6 py-10 sm:min-h-[24rem] sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-14">
              <div className="max-w-md">
                <h2 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">Ready to book your stay?</h2>
                <p className="mt-3 text-pretty text-[0.9375rem] leading-[1.7] text-white/90">Pick your room and dates and see the full price right away.</p>
              </div>
              <Link to="/book" className="btn rounded-none shrink-0 px-7 py-4 self-start bg-white text-ink transition-colors hover:bg-leaf hover:text-white sm:self-auto">
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
