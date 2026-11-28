# Synaxis S1

The registration site and admin panel for **Synaxis Season 1**, a Big Hero 6–themed
science olympiad run by the Heuser Science Society (15–17 January 2027, Karachi).

- Requirements: [`docs/BRIEF.md`](docs/BRIEF.md) (the single source of truth)
- Plan, design tokens, effects spec, easter eggs and the **assumptions to confirm**:
  [`docs/PHASE-1-PLAN.md`](docs/PHASE-1-PLAN.md)

## Stack
Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (Postgres + RLS, Auth, Storage) · Resend + React Email · zod + react-hook-form · Vercel.

## Map
| Path | What |
|---|---|
| `/` | Main page (hero + countdown, about, modules, fees, FAQ) with the microbot intro as an overlay on every full page load |
| `/portal` | Redirects permanently to `/` |
| `/terms` · `/privacy` | Drafts in `content/legal/*.mdx` |
| `/modules/[slug]` · `/council` · `/sponsors` | Public content (editable in admin) |
| `/register` | 6-step team registration (Head Delegate), autosaved |
| `/dashboard` | Head Delegate: payment, receipt upload, WhatsApp, waivers, modules, check-in QR |
| `/admin` | Cabinet panel: overview, teams, allocation, check-in, emails, content, settings, roles, exports, audit |
| `/waiver` | Printable waiver template |

## Setup

> Never commit real keys. Variable names are listed in `.env.example`; values live in `.env.local`
> (local) and in Vercel (production).

### 1. Supabase
1. Create a project, then copy into `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`
   (Project Settings → API Keys; the secret key starts with `sb_secret_`, server-only).
2. Link and push the schema plus the seed (run the seed **once**):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --remote --include-seed
   ```
3. Generate types: `npm run db:types`.
4. Check everything: `npm run check:live`.
5. Make admins (each person signs in once at `/login` first):
   `npm run make-admin -- someone@example.com [super_admin|finance|module_head] [module-slug]`.
6. Auth → URL configuration: Site URL `https://heusersynaxis.com`. Redirect URLs `https://heusersynaxis.com/**`
   and `http://localhost:3001/**`.

### 2. Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application).
2. **Authorised JavaScript origins:** `https://heusersynaxis.com` and `http://localhost:3001`.
3. **Authorised redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Supabase → Authentication → Providers → Google: paste the client ID and secret, then enable it.

### 3. Resend (email)
1. Create a Resend account → **Domains → Add domain** → `heusersynaxis.com`.
2. Add the DNS records Resend shows at your domain registrar:
   - **SPF** (TXT on the `send` subdomain)
   - **DKIM** (TXT `resend._domainkey`)
   - **MX** (on the `send` subdomain, for bounce handling)
   - Optional but recommended: a **DMARC** TXT record on `_dmarc` (e.g. `v=DMARC1; p=none;`)

   Wait until the domain shows **Verified**.
3. **API Keys → Create API key** ("Sending access"). Set `RESEND_API_KEY` in `.env.local` and Vercel.
4. Set the sender: `RESEND_FROM="Synaxis <noreply@heusersynaxis.com>"`. Replies go to `EMAIL_REPLY_TO`
   (for example the contact email shown in Admin → Settings).
5. **Supabase sign-in emails through Resend:** Supabase → Authentication → **SMTP Settings** → enable custom SMTP:
   - Host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key
   - Sender email `noreply@heusersynaxis.com`, sender name `Synaxis`
6. Supabase → Authentication → **Rate Limits**: raise "emails sent per hour" (the default is very low)
   before registration opens.
7. Test it: **Admin → System → Send test email**.
8. If emails land in spam:
   - Check that SPF, DKIM and DMARC all pass (Resend → Domains, or "Show original" in Gmail).
   - Send from your own domain, not `onboarding@resend.dev`.
   - Avoid link-only or all-caps subjects.
   - Make sure the reply-to address is a real inbox.

### 4. Vercel (hosting)
1. Import the repository. Framework: Next.js.
2. Add the environment variables from `.env.example`: Supabase URL and keys, `RESEND_API_KEY`, `RESEND_FROM`,
   `EMAIL_REPLY_TO`, `ADMIN_NOTIFY_EMAILS`, and `NEXT_PUBLIC_SITE_URL=https://heusersynaxis.com`.
   The build prerenders public pages, so the Supabase variables must be available at build time.
3. Domains → add `heusersynaxis.com` (and `www`) and follow the DNS instructions.

### 5. Google Search Console
1. Open [Google Search Console](https://search.google.com/search-console) → **Add property** → **URL prefix**
   `https://heusersynaxis.com` (or a **Domain** property verified by a DNS TXT record).
2. Pick the **HTML tag** method and copy only the `content="…"` value into `GOOGLE_SITE_VERIFICATION` (in Vercel),
   then redeploy and click **Verify**.
3. **Sitemaps** → submit `sitemap.xml`.
4. **URL inspection** → paste `https://heusersynaxis.com/` → **Request indexing**. Repeat for `/register` and a
   module page.
5. Check rich results with Google's [Rich Results Test](https://search.google.com/test/rich-results)
   (Event, FAQ, Breadcrumbs).
6. **After every deploy that changes the home page's icon, title or site name**: Search Console →
   **URL Inspection** → `https://heusersynaxis.com/` → **Request indexing**, so Google recrawls it. The search
   result icon (`/favicon.ico`, `/icon-48.png`, …) and the site name ("Synaxis", from the `WebSite` JSON-LD on `/`)
   only update after a recrawl, which can take days to a few weeks.

### 6. PostHog (analytics)
1. Create a PostHog project (US or EU cloud). Set `NEXT_PUBLIC_POSTHOG_KEY` (the project API key) and
   `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) in Vercel. Without a key,
   analytics stays off.
2. Events go through the first-party proxy `/ingest` (rewrites in `next.config.ts`), so ad blockers don't drop them.
3. Privacy setup:
   - **Cookieless** (`persistence: "memory"`): nothing is stored on the device, so no consent banner is needed.
   - No autocapture, no session recording, inputs masked, IP not stored, query strings stripped.
   - **/admin is never tracked.**
4. Events: `$pageview`, `register_started`, `register_step_completed` (step), `registration_submitted` (team_size),
   `receipt_uploaded`, `module_viewed` (slug), `easter_egg_found` (id), `cta_clicked` (location). Never add personal
   data to event properties.

### 7. Big Hero 6 images
Drop files into `public/assets/bh6/` using the names in [`docs/IMAGE-SOURCING.md`](docs/IMAGE-SOURCING.md).
Then run `npm run assets:process` and check **/admin/assets**. Missing images are hidden or replaced
by a small icon. Add `?debug=assets` to any URL to see the labelled placeholders.

### Local development
Requires Node 20.9+ and Docker.
```bash
npm install
npx supabase start            # local Postgres/Auth/Storage + Mailpit (http://127.0.0.1:54324)
npm run dev
```

### npm scripts
| Script | What it does |
|---|---|
| `dev` / `build` / `start` | Next.js dev server / production build / production server |
| `lint` / `typecheck` | ESLint / TypeScript |
| `test` | Unit tests (fees, phone numbers, registration rules, allocation, safe redirects) |
| `test:rls` | Security tests against the **local** stack only |
| `check:live` | Health check of the project in `.env.local` (creates and deletes one throwaway user) |
| `make-admin -- <email> [role] [module]` | Grant a Cabinet role |
| `db:types` / `db:types:local` | Regenerate DB types from the linked project / local stack |
| `assets:process` | Trim, resize and register new Big Hero 6 images |
| `assets:placeholders` | Recreate labelled placeholders for missing images |

### Legal pages
`/terms` and `/privacy` are written in `content/legal/*.mdx`. They are **drafts, to be reviewed by the
organising team** (placeholders: retention period, reply time, refund policy). Admin → System flags this
until the check is removed.

## Security model (summary)
- RLS on every table. Browsers can only **read** what they're allowed to; the only browser
  write is the user's own registration draft.
- All other writes run in server actions with the service-role key, after verifying the user
  (`getClaims`) and their role. Every status change is written to `audit_logs`.
- Receipts and waivers sit in **private** buckets. Uploads use one-time signed upload URLs,
  and viewing uses 5-minute signed URLs.
- Sponsor form, uploads, team-name checks and submissions are rate-limited in Postgres.
- `tests/rls.test.mjs` covers the main abuse cases (16 checks).

## Regenerating assets
- Logo SVG: `node scripts/trace-logo.mjs`, then `node scripts/build-logo-component.mjs`
- Heuser College marks (SVGs, `src/components/brand/heuser-paths.ts`, email PNGs) from the PNG originals in
  `public/brand/heuser/`: `node scripts/trace-heuser.mjs`
- Favicons (`favicon.ico`, `icon-48/96/192.png`, `apple-touch-icon.png`) from `public/icon.svg`: `node scripts/make-icons.mjs`
- DB types: `npm run db:types`

## Credits
Website by [Abdul Hadi Millwala](https://abdul-hadi-millwala.vercel.app) & Muhammad Aoun Imran.
Big Hero 6 © Disney. Fan-made for a student event.
