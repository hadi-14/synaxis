# Project Brief: SYNAXIS — Season 1 Website

> **Single source of truth.** Last revised 2026-11-25. This version includes the
> organisers' corrections (modules, team rules, logo location, palette roles,
> typography direction and build order). If this file and any other document
> disagree, this file wins.

Heuser Science Society (an A-Level college in Karachi) is hosting its first science
olympiad. Build a memorable, clean, artistic, fully responsive website with custom
registration and a strong admin panel. The theme is **Big Hero 6**. The site should
feel like San Fransokyo: playful, techy, warm and polished.

## 0. Ground rules
- **Plan before you build.** Phase 1 (research and plan) is in
  `docs/PHASE-1-PLAN.md`. The organisers have said to work through every phase
  without stopping for approval, so the plan's assumptions are flagged for later review.
- **Every effect must reference Big Hero 6.** No generic UI effects. Every animation,
  transition, hover, loader and micro-interaction must be tied to something from the
  Big Hero 6 universe. See section 5. This applies from the MVP onward; MVP effects
  just need to stay lightweight.
- Mobile-first. Most delegates will register from their phones.
- Performance and accessibility are not optional. Every heavy animation must have a
  `prefers-reduced-motion` fallback and a "Skip intro" option, and Lighthouse
  performance on mobile should stay at 85 or above.
- **Logo.** The original file was `/logo.png` in the project root (1080×1080, with
  transparent padding). It is now in `/public/logo/`:
  - `synaxis-logo-original.png`: the untouched original
  - `synaxis-logo-trimmed.png`: padding removed (890×126)
  - `synaxis-logo.svg`: traced vector, used for the microbot swarm, the favicon and
    the OG images

  Use the logo as is; don't redraw it.
- Asset policy: Big Hero 6 is Disney IP. Prefer **original illustrations or
  stylised, inspired-by artwork** (silhouettes, line art, icons, motion) over ripped
  stills. If official imagery is used, keep it minimal, credit it, and never hotlink.
  Keep all sourced assets in `/public/assets` with a `CREDITS.md`.

## 1. Event facts
- **Name:** Synaxis (Season 1)
- **Dates:** 15, 16, 17 January 2027
- **Organiser:** Heuser Science Society
- **Core team:** "Cabinet" (President, Vice President, Module Heads, Module Co-Heads)
- **Instagram:** https://www.instagram.com/heusersynaxis/ (organisers will send
  screenshots; start from the logo and update when they arrive)
- **Reference site:** https://kgso.net (study its structure and registration flow,
  then improve on it, not copy it)

## 2. Modules (final)
| Subject | Module name | Character | Notes |
|---|---|---|---|
| Biology | Baymax's Blueprint | Baymax | |
| Chemistry | Lemon's Labyrinth | Honey Lemon | |
| Physics | Maglev's Mayhem | Go Go Tomago | |
| Computer Science | Hamada's Hangar | Tadashi Hamada | |
| Robotics | Microbot Matrix | Hiro Hamada | |
| Mathematics | Wasabi's Wits | Wasabi | |
| Psychology | Callaghan's Conflict | Robert Callaghan | |
| Logic | Fred's Fallacy | Fred | |
| Criminology | Kabuki Caper | Yokai (Callaghan's villain identity) | **Compulsory for every team** |

Each module gets a card and a detail view (description, format, team size, schedule
slot, Module Head / Co-Head) and its own **character accent colour** and signature
visual motif:
- Baymax: vinyl inflate, healthcare scan line
- Honey Lemon: chem balls
- Go Go: maglev discs and speed lines
- Tadashi: SFIT cap, blueprint lab
- Hiro: microbots, neurocranial transmitter
- Wasabi: plasma blades and neat grids
- Callaghan: SFIT lecture hall, portal rings
- Fred: kaiju doodles, fire breath
- Yokai: kabuki mask and microbot swirl

Module data, including an `is_compulsory` flag per module, must be editable from
the admin panel, not hard-coded.

## 3. Design system
**Colour roles**
- **Coral `#F24B59`: primary UI/action colour.** Use much more of it.
- **Logo deep red `#DC2A35`:** the darker red. Use it for pressed/active states,
  Battle Mode accents and anywhere the logo appears. Coral and deep red must read as
  a deliberate pair (light and dark ends of one red ramp), not a mismatch.
- **Logo grey (`#737375`, sampled):** neutral for secondary text, borders, disabled
  states and HUD lines, adjusted per mode for AA contrast.
- **Unchanged:** navy `#18243A`, indigo `#424CBC`, off-white `#F7F5F0`.

Refinements (tints, shades, a deeper dark background, character accents) are allowed
as long as contrast meets WCAG AA. Deliver the palette as design tokens.

### Two modes (theme toggle, remembered per user, default follows the system setting)
1. **Peaceful Medical Mode** (light): soft, clinical and friendly, like Baymax's
   healthcare mode. Off-white backgrounds, coral as the main action colour, rounded
   "inflated" shapes, soft shadows, gentle motion.
2. **Battle Mode** (dark): Baymax's armour. Deep navy/near-black backgrounds, glowing
   coral, deep red and indigo, panel lines, HUD-style details, faster and punchier
   motion.
- The toggle itself is themed (Baymax "suiting up" into armour / a
  "Healthcare / Combat" chip switch) with a short transition animation.

### Typography
- **Display:** a techy face that matches the logo's wide, blocky, squared-off
  lettering. Fredoka-style rounded faces are **not** required.
- **Body:** clean and highly legible on mobile.
- **Mono/HUD:** labels, counters, Battle Mode details.
- Rounded/soft styling only for Peaceful Medical Mode details and the Baymax guide.
- Load fonts with `next/font` (self-hosted, subset, `display: swap`).
- Clean and artistic: generous whitespace, soft-but-precise shapes, a subtle
  Japanese/San Francisco fusion (Golden Gate torii, lanterns, cherry blossoms) used
  sparingly.

## 4. Signature interactions
1. **Animated landing / entrance page.** A microbot swarm assembles the SYNAXIS logo,
   then forms a gateway; "Enter" parts the swarm. Full version on the first visit,
   short version after that (localStorage), and "Skip" is always available.
2. **Microbot headings.** Section headings resolve out of a connected microbot mesh,
   ripple on hover, then re-form. One shared canvas, only runs in the viewport,
   static DOM text kept for SEO and screen readers.
3. **Baymax with thrusters while scrolling.** Armoured Baymax works as the scroll
   progress indicator. The thruster flame grows with scroll speed, he idles and
   bobs at rest, and he lands at the footer.
4. **Baymax Guide.** A floating, minimisable helper that guides registration: wave,
   point and fist-bump gestures, a squishy inflated feel, and a bounce on appear and
   on click. Opening line: "Hello. I am Baymax, your personal registration companion."
5. **Payment receipt from Honey Lemon's purse** (experimental, with a plain fallback).
   The receipt card that floats out of the purse is the upload drop zone and the
   WhatsApp-share option. It folds back into the purse on success.

## 5. Big Hero 6 effects language
Every effect, on the public site and the admin panel, must reference the Big Hero 6
universe. The full map, with timings and reduced-motion fallbacks, is in
`docs/PHASE-1-PLAN.md §7`. Most micro-interactions should finish in under 300 ms.
The theme should delight, never slow the user down or make forms harder to use.

## 6. Easter eggs
Subtle, discoverable, shareable, never in the way. The list is in
`docs/PHASE-1-PLAN.md §8`.

## 7. Site map
`/` landing intro → `/portal` main page (header, hero + countdown, about, modules,
registration teaser, FAQ, footer) · `/modules/[slug]` · `/sponsors` · `/council` ·
`/register` · `/dashboard` · `/admin`.

## 8. Competition rules and registration
**Rules (configurable in admin; current values in brackets):**
- Team size: **4–6 members including the Head Delegate**
- Modules per team: **4–5 in total**
- **Kabuki Caper is compulsory.** It is pre-selected and locked on the form with a
  "Compulsory" badge. Teams pick and rank **3–4 more** modules.
- Delegation fee and per-delegate fees (early bird / regular): **TBD**, seeded with
  placeholders
- Early-bird deadline, registration close and payment deadline: **TBD**. Assume
  registration opens ASAP and payment closes a few days before 15 Jan. All of these
  live in admin settings.

**Flow (filled in by the Head Delegate only):**
0. Sign in with Google (Supabase Auth), with an email magic link as a fallback.
1. Eligibility and delegation type (internal / external official / external
   independent). Internal teams need college-domain emails for every member.
2. Head Delegate and institution: name, email, WhatsApp (PK format), alt phone,
   grade, institution, city, team name (unique, checked live), guardian contact.
3. Team members: repeatable cards, live "N of 4–6" counter.
4. Module preferences: Kabuki Caper locked in, plus a ranked list of 3–4 more.
   Note: "Modules are allocated by preference and availability; your preferences
   are not guaranteed."
5. Extras and consent: how they heard about Synaxis, dietary/accessibility needs,
   rules, code of conduct, dress code and media consent.
6. Review and fee: an instant breakdown (delegation fee + members × rate). Submitting
   creates `SYN-S1-0042`, sets the status to `pending_payment` and sends a Resend
   email.

**After submission:** the payment screen (bank details, total, the reference ID,
a deadline countdown, receipt upload to a private bucket or a WhatsApp `wa.me`
share), then waivers, then admin verification, then module allocation (every team
gets Kabuki Caper automatically, the rest are allocated by preference and capacity,
and each team stays at 4–5 modules), then the dashboard with modules, schedule and
check-in QR codes. Edits are allowed until registration closes and are recorded in
the audit log.

Statuses: `draft → pending_payment → under_review → verified | rejected | reupload_requested`,
plus `waiver_pending`, `modules_allocated`, `cancelled` and `checked_in`.

## 9. Admin panel (Cabinet)
Roles: Super Admin (everything), Module Head / Co-Head (read access to their
modules' teams, edit access to their module content), Finance/Verifier (payments).
Includes the dashboard stats, a teams table with a drawer, the allocation tool,
CSV/XLSX exports, content management, bulk emails, a QR check-in scanner, attendance
tracking and an audit log. The look is Hiro's garage lab, calmer and
efficiency-first.

## 10. Tech stack
Next.js (App Router) + TypeScript + Tailwind (CSS-variable tokens) · Supabase
(Postgres, Auth, private Storage, RLS on every table) · Resend + React Email · zod +
react-hook-form · Vercel. Secrets stay server-side. Form and upload endpoints are
rate-limited.

## 11. UX requirements
A clear primary action on every screen, and the Register CTA is always one tap away.
Forms have inline validation, autosave and no data loss on refresh. Every async
action has themed loading, empty, error and success states. Keyboard access, AA
contrast in both modes, metadata, OG images, a sitemap and a favicon set.

## 12. Build order (organisers' priority, replaces the old phase order)
1. **MVP launch (target: live within ~1–2 weeks):** main page (header, hero with
   countdown, about, modules, FAQ, footer), both modes, Google sign-in, the full
   registration form, fee calculation, the payment screen with receipt upload and
   WhatsApp share, Resend emails, and an admin panel for payment verification and
   exports. Simple Big Hero 6 effects.
2. **Admin depth:** module allocation, waivers, bulk emails, content management,
   audit log, then the council and sponsors pages.
3. **Signature effects:** the microbot landing intro, microbot headings, Baymax
   thrusters, the Baymax guide, the Honey Lemon purse, and the full effects language.
4. **Event-day tools:** QR check-in and attendance (**must be ready before 15 Jan**).
5. **Easter eggs, polish, performance and accessibility pass.**
