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
| `/` | Microbot intro: the swarm assembles the logo, then "Enter the portal" |
| `/portal` | Main page: hero + countdown, about, modules, fees, FAQ |
| `/modules/[slug]` · `/council` · `/sponsors` | Public content (editable in admin) |
| `/register` | 6-step team registration (Head Delegate), autosaved |
| `/dashboard` | Head Delegate: payment, receipt upload, WhatsApp, waivers, modules, check-in QR |
| `/admin` | Cubinet panel: overview, teams, allocation, check-in, emails, content, settings, roles, exports, audit |
| `/waiver` | Printable waiver template |

## Local development
Requires Node 20.9+ and Docker.

```bash
npm install
npx supabase start          # local Postgres/Auth/Storage + Mailpit (applies migrations and seed)
cp .env.example .env.local  # then paste the keys from `npx supabase status`
npm run dev                 # http://localhost:3000 (or the next free port)
```

- Sign-in emails go to **Mailpit**: http://127.0.0.1:54324
- Make yourself an admin: sign in once, then run `scripts/make-admin.sql` (edit the email) in
  Supabase Studio (http://127.0.0.1:54323) or with `psql`.
- Without `RESEND_API_KEY`, emails are recorded in `email_logs` with status `skipped`.
- If the dev server isn't on port 3000/3001, add its URL to
  `auth.additional_redirect_urls` in `supabase/config.jsonc`.

### Checks
```bash
npm run typecheck
npm test            # unit: fees, phone validation, registration rules, allocation
npm run test:rls    # security: anon / other user / owner against the LOCAL stack only
npm run build
```

## Deploying (Vercel + Supabase)
1. **Supabase project**: create one, then `npx supabase link` and `npx supabase db push`
   (applies `supabase/migrations`). Load `supabase/seed.sql` once in the SQL editor.
2. **Auth**
   - Site URL: `https://YOUR-DOMAIN`. Redirect URLs: `https://YOUR-DOMAIN/**`
     (plus Vercel preview URLs if you use them).
   - Google: create an OAuth client in Google Cloud (authorised redirect
     `https://<project>.supabase.co/auth/v1/callback`) and enable it under Auth → Providers.
   - Email: set up custom SMTP (e.g. Resend SMTP). The built-in mailer is heavily rate-limited.
3. **Resend**: verify your sending domain and set `EMAIL_FROM` to an address on it.
4. **Vercel**: import the repo and set the variables from `.env.example`.
   `SUPABASE_SECRET_KEY` must **not** be prefixed with `NEXT_PUBLIC_`. The build prerenders
   public pages, so the Supabase variables must be available at build time.
5. Sign in on the live site, then grant yourself `super_admin` with `scripts/make-admin.sql`.
   Add other Cubinet members from **Admin → Roles** (they must sign in once first).
6. Before launch: in **Admin → Settings**, set fees, dates, venue, contacts and bank details,
   and turn on "Registration open".

## Live project tools
```bash
npm run check:live          # health check of the project in .env.local (creates + deletes one throwaway user)
npm run make-admin -- you@example.com [super_admin|finance|module_head] [module-slug]
npm run db:types            # regenerate src/lib/database.types.ts from the linked project
npm run db:types:local      # same, from the local stack
```
In the app, **Admin → System** shows the same health checks and has a "Send test email" button.

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
- DB types: `npm run db:types`
