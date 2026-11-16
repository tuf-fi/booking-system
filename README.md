# Lantaw Booking System

A budget-friendly direct-booking website for a small inn or transient house. Guests browse rooms, pick dates on a live availability calendar and pay a down payment by GCash or card. The owner manages bookings, availability, rates and payments from an admin panel.

The clickable demo of the design is in `docs/demo.html`. Match its flows and screens unless this README says otherwise.

---

## Working with Claude (read this first)

These rules apply to every task in this repo, every session.

### 1. Use Impeccable for all UI work

Install once per machine:

```bash
npx impeccable skills install
```

or, inside Claude Code:

```
/plugin marketplace add pbakaus/impeccable
```

then open `/plugin` and install Impeccable from the list.

At the start of the project, run `/impeccable init` to write `PRODUCT.md` and `DESIGN.md`. Then:

- Before building any page, component or layout, plan it with `/impeccable shape`.
- After building or changing any UI, run `/impeccable critique` and `/impeccable audit`, and fix what they report before calling the task done.
- Follow `DESIGN.md` for colors, type, spacing and components. Don't invent new tokens without updating it.

This applies to every UI change, however small. Backend-only tasks don't need it.

### 2. No code comments

Don't add comments to code: no inline comments, block comments, docblocks or commented-out code. Use clear names and small functions instead. If something needs explaining, put it in this README or in `docs/`.

### 3. Always use real photos, never placeholders

Every image on the site must be a real photograph. No SVG illustrations, gray boxes, gradients, emoji, icons standing in for photos, or `placeholder.com`-style services.

- **Client photos first.** Use the owner's own photos from `storage/app/photos/client/` whenever they exist.
- **Until client photos arrive:** use free-license stock photos from Unsplash or Pexels. Download them into `storage/app/photos/stock/` (don't hotlink). Pick photos that match what's being shown: a real inn room with the right bed setup, a real roof deck, a real Mayon Volcano view.
- **Record every stock photo** in `docs/photo-credits.md`: file name, photographer, source URL and license.
- **Mark stock photos** with `is_stock = true` in the `photos` table. The admin shows a "Replace with your own photo" badge on these.
- **Before launch,** replace every stock photo of rooms or the property with the client's own photos. Guests must see the actual rooms they're paying for. Stock photos of the city or attractions can stay, with credits.
- **Serve all photos as WebP** in at least two sizes (card and full), with `width`, `height` and descriptive `alt` text.

### 4. General

- Write tests (Pest) for anything that touches money, availability or booking status.
- Show prices in pesos as `₱1,350`. Store money as integers in centavos.
- Use the Asia/Manila timezone everywhere.
- Keep the UI copy plain and short, in sentence case, written for guests and owners rather than developers.

---

## Frontend demo (no backend yet)

The current build is a working frontend-only demo for client presentations. React, TypeScript and Tailwind run in the browser, and all data is stored in `localStorage`.

```bash
npm install
npm run dev
npm test
npm run build
```

- Guest site: `/#/`. Owner admin: `/#/admin` (login `owner@lantaw.test` / `password`, prefilled). **Reset demo** in the admin restores the sample data.
- `dist/` after `npm run build` is a static site that works on any host or from a plain file server.
- All data access goes through `src/store/api.ts`. When the Laravel backend arrives, replace these functions with Inertia or HTTP calls and the pages stay as they are.
- Business rules (pricing, availability, booking status, payment windows) are covered by `npm test` and must be re-implemented and tested in Pest on the backend.
- `npm run photos` downloads the stock photos listed in `docs/photo-credits.md` and rebuilds the WebP sizes.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | **Laravel 13** (PHP 8.3+) | Mature, fast to build with. Auth, queues, scheduler, mail and file storage come built in. |
| Frontend | **Inertia.js + React + TypeScript** (Laravel React starter kit) | Gives us the interactive calendar and admin from the demo without building a separate API. |
| Styling | **Tailwind CSS** | Driven by the tokens in `DESIGN.md`. |
| Database | **MySQL 8** | Cheap and available on every host. |
| Queues and cache | Database driver | No Redis needed at this size. |
| Payments | **PayMongo** (Checkout API + webhooks) | Cards, GCash, Maya and QR Ph, with no monthly fee. |
| Manual GCash | Screenshot upload with admin approval | Zero fees for owners who prefer it. |
| SMS | **Semaphore** | Local gateway covering all Philippine networks, priced per message. |
| Email | SMTP (Brevo or Resend free tier) | Booking confirmations and receipts. |
| Images | `spatie/laravel-medialibrary` + `spatie/image` | WebP conversion and responsive sizes. |
| Calendar sync | `sabre/vobject` (import), `spatie/icalendar-generator` (export) | Two-way iCal sync with Airbnb and Booking.com. |
| Testing | **Pest** | Feature tests for the booking flow. |
| Hosting | Small VPS in Singapore (1 vCPU, 2 GB RAM) | Roughly ₱300–600 a month. Shared hosting also works for a single property. |
| Deploys | GitHub Actions to the VPS over SSH, or Laravel Forge | |

---

## Features

### Phase 1: launch (MVP)

**Guest site**
- Home page: hero photo, about the inn, photo gallery, amenities, location and travel times, house rules, payment and cancellation policy, FAQ, contact.
- Room cards: photos, beds, sleeps, size, perks, weekday and weekend price, and a "Book this room" button.
- Booking page:
  - Room picker and monthly availability calendar showing the price per night.
  - Booked and blocked dates can't be selected.
  - Live price breakdown: weeknights, weekend nights, cleaning fee, total, down payment and balance on arrival.
  - Guest details: name, mobile, email (optional) and number of guests, capped at the room's capacity.
  - Payment by GCash screenshot (manual) or PayMongo checkout (card, GCash, Maya, QR Ph).
  - Confirmation screen with a booking reference, plus SMS and email confirmation.
- "Manage my booking" page using the reference number and mobile number: view the booking and cancel within the policy.

**Owner admin**
- Login for owner and staff accounts (roles: `owner`, `staff`).
- Dashboard: money received this month, occupancy, arrivals in the next 7 days, and bookings waiting for approval.
- Bookings list with filters (waiting for approval, upcoming, staying now, completed, cancelled). Actions:
  - view the payment screenshot
  - approve or decline
  - mark fully paid
  - cancel
  - check in and check out
- Availability calendar per room: see bookings, block and unblock dates.
- Rooms & rates: add and edit room types, photos, descriptions, perks, base rate, weekend extra, cleaning fee, down payment %, and the GCash number shown to guests.
- Reports: money received per month and occupancy per room, with CSV export.

**System**
- Double-booking protection at the database level (see "Availability rules").
- Unpaid GCash bookings expire after 24 hours if no screenshot is uploaded. PayMongo checkouts expire after 30 minutes.
- SMS to the guest when a booking is received, approved, declined or cancelled, and the day before check-in.
- SMS or email to the owner for every new booking.

### Phase 2: after launch

- iCal sync with Airbnb and Booking.com (import every 30 minutes, plus an export feed per room).
- Seasonal and holiday rates (date ranges with a custom price), minimum-night rules.
- Promo codes.
- Multiple units per room type (for example, three Standard twin rooms).
- Guest reviews collected after check-out, shown only once a real stay is completed.
- Add-ons at checkout: breakfast, airport pickup, extra bed.
- Typhoon and volcano-alert rebooking: the owner moves a booking to new dates at no charge.
- Filipino (Tagalog) language toggle.

### Out of scope for now

Multi-property marketplace, host payouts, guest-to-host chat, channel manager integrations beyond iCal.

---

## Data model

| Table | Key columns |
|---|---|
| `users` | name, email, password, role (`owner`, `staff`) |
| `room_types` | name, slug, sleeps, beds, size_sqm, description, perks (json), base_rate, weekend_extra, sort_order, is_active |
| `rooms` | room_type_id, label (e.g. "201"), is_active |
| `bookings` | reference, room_id, room_type_id, guest_name, guest_mobile, guest_email, guests, check_in, check_out, nights, subtotal, cleaning_fee, total, down_payment, amount_paid, status, source (`direct`, `airbnb`, `booking`, `walk_in`), expires_at, cancelled_at, cancel_reason |
| `booking_nights` | booking_id, room_id, date. **Unique index on (room_id, date).** |
| `blocked_dates` | room_id, date, reason, created_by. **Unique on (room_id, date).** |
| `payments` | booking_id, method (`gcash_manual`, `paymongo`, `cash`), amount, status (`pending`, `paid`, `failed`, `refunded`), proof_path, paymongo_checkout_id, paymongo_payment_id, paid_at, verified_by |
| `rate_overrides` | room_type_id, starts_on, ends_on, nightly_rate, label |
| `photos` | via medialibrary, with `is_stock`, `credit`, `alt` |
| `calendar_feeds` | room_id, provider, import_url, last_synced_at |
| `settings` | key, value: cleaning_fee, down_payment_percent, gcash_number, gcash_name, check_in_time, check_out_time, cancellation_days |
| `sms_logs` | to, message, status, provider_message_id |

Booking statuses: `pending_payment`, `pending_approval`, `confirmed`, `checked_in`, `completed`, `cancelled`, `expired`.

---

## Availability rules

- A night is booked when a `booking_nights` row exists for that room and date. Check-out day is not a booked night.
- Creating a booking inserts its nights inside a database transaction. The unique index makes a second booking for the same night fail. Catch that and tell the guest the dates were just taken.
- Cancelling or expiring a booking deletes its `booking_nights` rows.
- Blocked dates and imported iCal events also make a night unavailable.
- Weekend nights are Friday and Saturday. A `rate_overrides` entry beats both the base and weekend rates.
- Price = sum of each night's rate + cleaning fee. The down payment is rounded to the nearest peso.

---

## Payments

**PayMongo checkout**
1. Create the booking with status `pending_payment` and `expires_at` set to now + 30 minutes.
2. Create a PayMongo Checkout Session for the down payment and redirect the guest.
3. The `checkout_session.payment.paid` webhook marks the payment as paid and the booking as `confirmed`. Verify the webhook signature.
4. Never confirm a booking from the success redirect alone.

**Manual GCash**
1. The guest uploads a screenshot. The booking becomes `pending_approval` and its nights are held.
2. The owner checks their GCash app, then approves or declines in the admin.
3. Screenshots are stored privately (`storage/app/private/proofs`) and only shown to logged-in staff.

The balance is collected at check-in and recorded in the admin as cash or GCash.

---

## Local setup

```bash
git clone <repo-url> lantaw
cd lantaw
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
composer run dev
```

The seeder creates an owner account (`owner@lantaw.test` / `password`), five room types with stock photos and sample bookings.

### Environment variables

```
APP_TIMEZONE=Asia/Manila
DB_CONNECTION=mysql
QUEUE_CONNECTION=database

PAYMONGO_PUBLIC_KEY=
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=

SEMAPHORE_API_KEY=
SEMAPHORE_SENDER_NAME=LANTAW

MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=bookings@lantaw.ph
OWNER_NOTIFY_MOBILE=
OWNER_NOTIFY_EMAIL=
```

### Scheduled jobs

Add the scheduler to cron on the server (`* * * * * php artisan schedule:run`):

| Job | Runs |
|---|---|
| Expire unpaid bookings | Every 5 minutes |
| Send check-in reminders | Daily at 9 AM |
| Mark past stays completed | Daily at 12 PM |
| Import iCal feeds (phase 2) | Every 30 minutes |

---

## Project structure

```
app/
  Actions/Bookings/      CreateBooking, ApproveBooking, CancelBooking, ExpireBookings
  Actions/Pricing/       QuoteStay
  Http/Controllers/Guest/
  Http/Controllers/Admin/
  Http/Controllers/Webhooks/PayMongoController.php
  Models/
  Services/PayMongo.php
  Services/Semaphore.php
resources/js/
  pages/guest/           Home, Book, Confirmation, ManageBooking
  pages/admin/           Dashboard, Bookings, Calendar, Rooms, Reports, Settings
  components/            AvailabilityCalendar, PriceSummary, RoomCard, StatusChip
tests/Feature/           Booking, Pricing, Payments, Admin
docs/
  demo.html
  photo-credits.md
```

---

## Milestones

| # | Milestone | Done when |
|---|---|---|
| 1 | Setup | Laravel + React starter kit, `/impeccable init`, `DESIGN.md` matches the demo, CI runs tests |
| 2 | Rooms and photos | Room types CRUD in admin, stock photos seeded and credited, guest home page live |
| 3 | Availability and pricing | Calendar shows real availability and prices, quote matches the rules above, tests pass |
| 4 | Booking flow | Guest can book with GCash screenshot, owner can approve and decline, double booking impossible |
| 5 | PayMongo | Card and e-wallet checkout in test mode, webhook confirms bookings |
| 6 | Notifications | SMS and email for every status change |
| 7 | Reports and polish | Dashboard and reports done, `/impeccable audit` clean on every page |
| 8 | Launch | Client photos replace stock room photos, live PayMongo keys, deployed to VPS, backups on |

---

## Definition of done (every task)

- Feature works on mobile (390 px) and desktop.
- Pest tests added or updated, and `php artisan test` passes.
- For UI work, `/impeccable critique` and `/impeccable audit` have been run and their findings fixed.
- No code comments, no placeholder images.
- New stock photos are listed in `docs/photo-credits.md`.
#   b o o k i n g - s y s t e m  
 