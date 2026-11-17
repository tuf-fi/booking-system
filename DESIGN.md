# Design system

Tokens live in `src/index.css` under `@theme`. Don't add new colors or radii without updating this file.

## Direction

Warm, calm and photo-led, in the spirit of Airbnb and Vrbo: large photos, generous space, one strong action per screen. Friendly rather than corporate. Sentence-case copy, short and plain.

## Color

Four roles, each with a base, a `-deep` for text and hover, and a `-tint` for quiet backgrounds. Don't add colors outside these roles.

| Role | Base / deep / tint | Use |
|---|---|---|
| primary | #2F6B4F / #1F4D38 / #E5EFE9 | Main action, links, confirmed, in-range dates, focus ring |
| secondary | #1B2F26 / #121E18 / #E8EEEA | Dark buttons, footer, dark bands, selected dates |
| tertiary | #2D6F8F / #1F4B62 / #E3EEF3 | Information, payment instructions, staying now, house-rule icons |
| accent | #F2B33D / #7A5200 / #FBEFD0 | Waiting states, paid extras, the not-refunded part of the policy timeline, location icons |

Neutrals: paper #FAF8F4 (page), surface #FFFFFF (cards, inputs), sand #F1EDE5 (hover, quiet panels), ink #16231D (text), muted #5A665F (secondary text), line #E6E2DA (borders). Feedback: danger #A8402E and danger-tint #F7E4DF. heart #FF4D5E is only for the saved-room heart.

Text on a tint uses the matching `-deep` token to keep contrast above 4.5:1. Buttons: `btn-primary`, `btn-secondary`, `btn-tertiary`, `btn-accent`, `btn-ghost`, `btn-danger`.

## Type

- One family: Nanum Gothic, in 400, 700 and 800. Headings and prices use 700 to 800 with slightly tight tracking. Body uses 400 and 700.
- One type scale, defined in `@theme` in `src/index.css`. Use the named sizes only, never arbitrary values like `text-[0.8125rem]`.

| Class | Size | Use |
|---|---|---|
| `text-xs` | 12 px | Labels, captions, small buttons |
| `text-sm` | 13 px | Secondary text, nav, details |
| `text-base` | 14 px | Body text, the page default |
| `text-lg` | 16 px | Card titles, form fields |
| `text-xl` | 18 px | Subheadings, prices |
| `text-2xl` | 22 px | Section headings on small screens |
| `text-3xl` | 26 px | Section headings, page titles |
| `text-4xl` | 32 px | Page titles on large screens |

- The home hero is the only exception. It uses its own tokens: `text-hero-sm`, `text-hero-md` and `text-hero` (32, 36 and 44 px) for the headline, and `text-eyebrow` (11 px) for the line above it.
- Chips are 11 px (see Shape and depth).
- No eyebrows above headings, except the small line above the home hero headline.
- The font is bundled through `@fontsource/nanum-gothic` (latin subset), so the demo works offline.

## Shape and depth

- The navbar and search bar are ovals (fully rounded; on mobile the stacked search bar uses `rounded-panel` and goes oval from `lg`). Everything else is set against that: buttons, icon buttons, tabs, filters, calendar arrows and the search fields are pills (`rounded-full`).
- Containers use a three-step scale in `src/index.css`: `rounded-control` (10 px) for text inputs, callouts, menu rows and calendar cells; `rounded-card` (16 px) for cards, menus, photos and tables; `rounded-panel` (24 px) for dialogs, room cards, the mobile menu and large photos. `.field`, `.card` and the glass classes carry their radius.
- Nested corners step down one level. Edge-to-edge bars such as the admin top bar stay square.
- Badges and chips are always solid pills (`.chip`, status chips, count badges, photo caption chips), never glass. The glass navbar and search bar are the exception to "pills are solid": they are large ovals, not badges.
- Shadows: `shadow-soft` for resting cards, `shadow-lift` for hover and floating search.

## Glass

Glassmorphism here is light and luminous: frosted panels with a bright rim, a soft top shine, a fine noise grain and a deep soft shadow, so they read as thick glass over photos.

| Class | Recipe | Use |
|---|---|---|
| `.glass` | 80 to 62% white gradient, 22 px blur, 185% saturation, white rim, inner top highlight, grain | Navbar over the hero, photo captions that are not pills |
| `.glass-strong` | 93 to 84% white gradient, 28 px blur, stronger rim | Navbar after scrolling, search bar, mobile menu, dialogs, sticky bars, booking summary |
| `.glass-dark` | 74 to 58% ink-green gradient, 22 px blur, faint white rim | Toasts, labels on bright photos |

Rules:

- Tune a glass surface only through its `--glass-*` custom properties in `src/index.css`. Don't hand-roll blur or transparency on components.
- Glass needs something to blur: the page's soft gradient and the photos.
- Pills (badges, chips, caption chips, count badges) are always solid, never glass. They use `.chip`: 11 px bold text, 1 px by 7 px padding, 16 px tall, no border. Use `.chip-photo` for a chip over a photo.
- Never put glass on glass. One layer per area.
- Keep tables, calendars, forms, stat blocks and price breakdowns solid white.
- Text on glass must keep 4.5:1 contrast. Raise opacity before lowering text contrast.
- Every glass class falls back to a near-opaque surface when `backdrop-filter` is unsupported or the user prefers reduced transparency.

## Components

Reuse these instead of repeating markup. Check this list before building a new block.

- `.btn` with a color variant, `btn-sm` and `btn-block`. Minimum 44 px tall (36 px for admin `btn-sm`). `.field` inputs with a visible 3 px focus ring and `aria-invalid` styling. `.card` for solid surfaces. `.chip` for badges.
- `PageHeader`: admin page title, description and actions.
- `SectionHeading`: heading and short description for guest page sections.
- `EmptyState`: title, description and action for empty lists.
- `StatGrid`: label, value and note blocks for dashboards.
- `SectionHeading` also takes `size` (md or lg) and `tone` (default or light) for dark bands.
- `src/lib/site.ts` holds the phone number, parking spaces and extra prices. Don't type them into copy.
- `StayDates`: check-in and check-out block, used in the receipt and the booking summary.
- `AvailabilityCalendar`: price per night in every cell, bold on Friday and Saturday, striped when booked, secondary for start and end, `primary-tint` for the range.
- `StatusChip` maps each booking status to one tone. Don't invent new status colors.

## Sign-in and account

- Auth screens are solid forms (`rounded-control` fields, `btn-primary`) beside a Mayon photo with one `.glass-strong` caption. Inside the booking flow the same `AuthFlow` renders inline at the "Your details" step, with no photo and no dialog.
- The code step shows a sky-tint demo panel with the code until a real mailer exists.
- The navbar user icon links to `/signin`, or to `/account` as an initials avatar once signed in.
- The account area uses underline tabs (Trips, Saved rooms, Profile, Security) and `rounded-card` bordered cards. Trip status uses `StatusChip`.

## Motion

Short transitions only (150 ms to 500 ms for photo zoom). The one exception is the payment and cancellation timeline, which plays once on scroll-in: the line draws, dots pop and text rises over about 1.5 s with an exponential ease-out. All motion is disabled under `prefers-reduced-motion`.

## Photos

Real photographs only. See `docs/photo-credits.md`. Served as WebP in card (640 px) and full (1600 px) sizes with width, height and alt text, generated by `npm run photos`.
