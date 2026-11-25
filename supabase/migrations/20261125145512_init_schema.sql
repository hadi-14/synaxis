-- Synaxis S1: initial schema
-- Security model:
--   * RLS is enabled on every table in `public`.
--   * Browsers (anon/authenticated) can only READ, filtered by RLS. The single exception is the
--     Head Delegate's own `registration_drafts` row (autosave).
--   * All other writes happen in Next.js server actions with the service role, AFTER the action
--     verifies the caller's identity (getClaims) and role. Each write is recorded in audit_logs.
--   * Uploads use signed upload URLs that the server creates, so storage has no client write policies.

create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role;

-- ---------------------------------------------------------------- enums
create type public.delegation_type as enum ('internal', 'external_official', 'external_independent');
create type public.team_status as enum (
  'draft', 'pending_payment', 'under_review', 'verified', 'rejected', 'reupload_requested',
  'waiver_pending', 'modules_allocated', 'cancelled', 'checked_in'
);
create type public.payment_status as enum ('under_review', 'verified', 'rejected', 'reupload_requested');
create type public.payment_method as enum ('upload', 'whatsapp');
create type public.app_role as enum ('super_admin', 'finance', 'module_head');

-- ---------------------------------------------------------------- helpers
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------- modules
create table public.module_categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort int not null default 0
);

create table public.modules (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  subject text not null,
  character text not null,
  accent text not null default '#F24B59',
  motif text not null default '',
  tagline text not null default '',
  description text not null default '',
  format text not null default '',
  team_size_note text not null default '',
  schedule_slot text not null default '',
  head_name text not null default '',
  cohead_name text not null default '',
  capacity int check (capacity is null or capacity >= 0),
  is_compulsory boolean not null default false,
  is_active boolean not null default true,
  sort int not null default 0,
  category_id bigint references public.module_categories (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index modules_category_id_idx on public.modules (category_id);
create trigger modules_updated_at before update on public.modules
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------- roles
create table public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  module_id bigint references public.modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_roles_module_head_needs_module check (role <> 'module_head' or module_id is not null),
  constraint user_roles_unique unique nulls not distinct (user_id, role, module_id)
);
create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_module_id_idx on public.user_roles (module_id);

-- ---------------------------------------------------------------- settings (single row)
create table public.settings (
  id int primary key default 1 check (id = 1),
  season_label text not null default 'Season 1',
  event_start date not null default '2027-01-15',
  event_end date not null default '2027-01-17',
  venue_name text not null default 'Heuser College (venue TBC)',
  venue_address text not null default 'Karachi, Pakistan',
  venue_map_url text not null default '',
  delegation_fee int not null default 4500 check (delegation_fee >= 0),
  early_fee int not null default 2500 check (early_fee >= 0),
  regular_fee int not null default 3500 check (regular_fee >= 0),
  registration_opens_at timestamptz not null default '2026-11-25 00:00+05',
  early_bird_deadline timestamptz not null default '2026-12-15 23:59+05',
  registration_closes_at timestamptz not null default '2027-01-08 23:59+05',
  payment_deadline timestamptz not null default '2027-01-11 23:59+05',
  team_min int not null default 4 check (team_min >= 1),
  team_max int not null default 6,
  modules_min int not null default 4 check (modules_min >= 1),
  modules_max int not null default 5,
  best_institute_min_teams int not null default 4,
  registration_open boolean not null default true,
  internal_email_domain text not null default 'heusercollege.edu.pk',
  announcement text not null default '',
  announcement_active boolean not null default false,
  contact_email text not null default 'synaxis@example.com',
  contact_whatsapp text not null default '+92 300 0000000',
  instagram_url text not null default 'https://www.instagram.com/heusersynaxis/',
  waiver_template_url text not null default '/waiver',
  updated_at timestamptz not null default now(),
  constraint settings_team_range check (team_max >= team_min),
  constraint settings_module_range check (modules_max >= modules_min)
);
create trigger settings_updated_at before update on public.settings
  for each row execute function private.set_updated_at();

-- Bank details are only needed by registrants. Kept out of the public settings row.
create table public.payment_details (
  id int primary key default 1 check (id = 1),
  bank_name text not null default 'Bank name (TBC)',
  account_title text not null default 'Heuser Science Society (TBC)',
  account_number text not null default '0000000000000',
  iban text not null default 'PK00XXXX0000000000000000',
  receipt_whatsapp text not null default '923000000000',
  instructions text not null default 'Use your registration ID as the transfer reference.',
  updated_at timestamptz not null default now()
);
create trigger payment_details_updated_at before update on public.payment_details
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------- registration
create table public.registration_drafts (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  step int not null default 1 check (step between 1 and 6),
  updated_at timestamptz not null default now()
);
create trigger registration_drafts_updated_at before update on public.registration_drafts
  for each row execute function private.set_updated_at();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  reg_no int generated always as identity unique,
  reg_code text not null unique,
  owner_id uuid not null unique references auth.users (id) on delete restrict,
  team_name text not null check (char_length(team_name) between 2 and 40),
  team_name_key text generated always as (lower(regexp_replace(btrim(team_name), '\s+', ' ', 'g'))) stored unique,
  delegation_type public.delegation_type not null,
  head_name text not null,
  head_email text not null,
  head_whatsapp text not null,
  head_alt_phone text,
  head_grade text not null,
  institution text not null,
  city text not null,
  guardian_name text not null,
  guardian_phone text not null,
  heard_from text not null,
  heard_from_other text,
  needs text,
  consents jsonb not null default '{}'::jsonb,
  status public.team_status not null default 'pending_payment',
  member_count int not null check (member_count >= 1),
  fee_tier text not null check (fee_tier in ('early', 'regular')),
  total_fee int not null check (total_fee >= 0),
  fee_breakdown jsonb not null,
  whatsapp_shared_at timestamptz,
  checkin_token uuid not null default gen_random_uuid() unique,
  admin_notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index teams_status_idx on public.teams (status);
create index teams_institution_idx on public.teams (institution);
create index teams_submitted_at_idx on public.teams (submitted_at);
create trigger teams_updated_at before update on public.teams
  for each row execute function private.set_updated_at();

-- reg_code: SYN-S1-0042, derived from the identity value inside a trigger
create or replace function private.set_reg_code() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.reg_code := 'SYN-S1-' || lpad(new.reg_no::text, 4, '0');
  return new;
end $$;
create trigger teams_reg_code before insert on public.teams
  for each row execute function private.set_reg_code();

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  position int not null,
  is_head boolean not null default false,
  full_name text not null,
  email text not null,
  phone text not null,
  grade text not null,
  institution text not null,
  created_at timestamptz not null default now(),
  unique (team_id, position)
);
create index team_members_team_id_idx on public.team_members (team_id);

create table public.module_preferences (
  team_id uuid not null references public.teams (id) on delete cascade,
  module_id bigint not null references public.modules (id) on delete cascade,
  rank int not null check (rank >= 0), -- 0 = compulsory
  primary key (team_id, module_id)
);
create index module_preferences_module_id_idx on public.module_preferences (module_id);

create table public.module_allocations (
  team_id uuid not null references public.teams (id) on delete cascade,
  module_id bigint not null references public.modules (id) on delete cascade,
  allocated_by uuid references auth.users (id) on delete set null,
  allocated_at timestamptz not null default now(),
  primary key (team_id, module_id)
);
create index module_allocations_module_id_idx on public.module_allocations (module_id);
create index module_allocations_allocated_by_idx on public.module_allocations (allocated_by);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  amount int not null,
  fee_breakdown jsonb not null,
  method public.payment_method not null,
  receipt_path text,
  status public.payment_status not null default 'under_review',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index payments_team_id_idx on public.payments (team_id);
create index payments_status_idx on public.payments (status);
create index payments_reviewed_by_idx on public.payments (reviewed_by);

create table public.waivers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  member_id uuid references public.team_members (id) on delete cascade, -- null = combined PDF for the team
  file_path text not null,
  received boolean not null default false,
  received_by uuid references auth.users (id) on delete set null,
  received_at timestamptz,
  uploaded_at timestamptz not null default now()
);
create index waivers_team_id_idx on public.waivers (team_id);
create index waivers_member_id_idx on public.waivers (member_id);
create index waivers_received_by_idx on public.waivers (received_by);

create table public.checkins (
  id bigint generated always as identity primary key,
  team_id uuid not null references public.teams (id) on delete cascade,
  day_no int not null check (day_no between 1 and 3),
  module_id bigint references public.modules (id) on delete cascade,
  checked_in_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint checkins_unique unique nulls not distinct (team_id, day_no, module_id)
);
create index checkins_module_id_idx on public.checkins (module_id);
create index checkins_checked_in_by_idx on public.checkins (checked_in_by);

-- ---------------------------------------------------------------- content
create table public.faqs (
  id bigint generated always as identity primary key,
  question text not null,
  answer text not null,
  category text not null default 'General',
  sort int not null default 0,
  is_published boolean not null default true
);

create table public.council_members (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null,
  tier text not null default 'module' check (tier in ('executive', 'module')),
  module_id bigint references public.modules (id) on delete set null,
  photo_url text,
  instagram text,
  linkedin text,
  email text,
  bio text,
  sort int not null default 0,
  is_published boolean not null default true
);
create index council_members_module_id_idx on public.council_members (module_id);

create table public.sponsors (
  id bigint generated always as identity primary key,
  name text not null,
  tier text not null default 'partner' check (tier in ('title', 'platinum', 'gold', 'community', 'partner')),
  logo_url text,
  url text,
  blurb text,
  sort int not null default 0,
  is_published boolean not null default true
);

create table public.sponsor_inquiries (
  id bigint generated always as identity primary key,
  name text not null,
  organisation text not null,
  email text not null,
  phone text,
  interest text,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- logs
create table public.email_logs (
  id bigint generated always as identity primary key,
  to_email text not null,
  template text not null,
  subject text not null,
  team_id uuid references public.teams (id) on delete set null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id text,
  error text,
  sent_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index email_logs_team_id_idx on public.email_logs (team_id);
create index email_logs_sent_by_idx on public.email_logs (sent_by);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  team_id uuid references public.teams (id) on delete set null,
  before jsonb,
  after jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index audit_logs_team_id_idx on public.audit_logs (team_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- Fixed-window rate limiter, called only by the server (service role).
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits int not null
);

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql set search_path = '' as $$
declare
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- ---------------------------------------------------------------- authorization helpers
-- SECURITY DEFINER so policies can read user_roles/teams without recursive RLS. They live in the
-- unexposed `private` schema and only ever answer about the CURRENT user (auth.uid()).
create or replace function private.has_role(p_role public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = p_role
  );
$$;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()));
$$;

create or replace function private.can_view_team(p_team_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    exists (select 1 from public.teams t where t.id = p_team_id and t.owner_id = (select auth.uid()))
    or exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role in ('super_admin', 'finance')
    )
    or exists (
      select 1
      from public.user_roles r
      where r.user_id = (select auth.uid())
        and r.role = 'module_head'
        and (
          exists (select 1 from public.module_preferences p where p.team_id = p_team_id and p.module_id = r.module_id)
          or exists (select 1 from public.module_allocations a where a.team_id = p_team_id and a.module_id = r.module_id)
        )
    );
$$;

revoke all on function private.has_role(public.app_role) from public;
revoke all on function private.is_staff() from public;
revoke all on function private.can_view_team(uuid) from public;
-- anon needs EXECUTE because public-content policies call these; they return false without a session.
grant execute on function private.has_role(public.app_role) to authenticated, anon;
grant execute on function private.is_staff() to authenticated, anon;
grant execute on function private.can_view_team(uuid) to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.module_categories enable row level security;
alter table public.modules enable row level security;
alter table public.user_roles enable row level security;
alter table public.settings enable row level security;
alter table public.payment_details enable row level security;
alter table public.registration_drafts enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.module_preferences enable row level security;
alter table public.module_allocations enable row level security;
alter table public.payments enable row level security;
alter table public.waivers enable row level security;
alter table public.checkins enable row level security;
alter table public.faqs enable row level security;
alter table public.council_members enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsor_inquiries enable row level security;
alter table public.email_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

-- Explicit grants: browsers get SELECT only (plus drafts). Writes go through the service role.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.modules, public.module_categories, public.settings, public.faqs,
  public.council_members, public.sponsors to anon, authenticated;
grant select on public.profiles, public.user_roles, public.payment_details, public.teams,
  public.team_members, public.module_preferences, public.module_allocations, public.payments,
  public.waivers, public.checkins, public.sponsor_inquiries, public.email_logs, public.audit_logs
  to authenticated;
grant select, insert, update, delete on public.registration_drafts to authenticated;

-- public content
create policy "content: read active modules" on public.modules for select to anon, authenticated
  using (is_active or (select private.is_staff()));
create policy "content: read categories" on public.module_categories for select to anon, authenticated
  using (true);
create policy "content: read settings" on public.settings for select to anon, authenticated
  using (true);
create policy "content: read published faqs" on public.faqs for select to anon, authenticated
  using (is_published or (select private.is_staff()));
create policy "content: read published council" on public.council_members for select to anon, authenticated
  using (is_published or (select private.is_staff()));
create policy "content: read published sponsors" on public.sponsors for select to anon, authenticated
  using (is_published or (select private.is_staff()));

-- profiles / roles
create policy "profiles: own or staff" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_staff()));
create policy "roles: own or super admin" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('super_admin')));

-- payment details: team owners and staff
create policy "payment details: team owners and staff" on public.payment_details for select to authenticated
  using (
    exists (select 1 from public.teams t where t.owner_id = (select auth.uid()))
    or (select private.is_staff())
  );

-- drafts: owner only, full CRUD
create policy "drafts: owner select" on public.registration_drafts for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "drafts: owner insert" on public.registration_drafts for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "drafts: owner update" on public.registration_drafts for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "drafts: owner delete" on public.registration_drafts for delete to authenticated
  using (owner_id = (select auth.uid()));

-- team data
create policy "teams: viewable" on public.teams for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.can_view_team(id)));
create policy "members: viewable" on public.team_members for select to authenticated
  using ((select private.can_view_team(team_id)));
create policy "prefs: viewable" on public.module_preferences for select to authenticated
  using ((select private.can_view_team(team_id)));
create policy "allocations: viewable" on public.module_allocations for select to authenticated
  using ((select private.can_view_team(team_id)));
create policy "payments: viewable" on public.payments for select to authenticated
  using ((select private.can_view_team(team_id)));
create policy "waivers: viewable" on public.waivers for select to authenticated
  using ((select private.can_view_team(team_id)));
create policy "checkins: viewable" on public.checkins for select to authenticated
  using ((select private.can_view_team(team_id)));

-- staff-only logs/inbox
create policy "inquiries: super admin" on public.sponsor_inquiries for select to authenticated
  using ((select private.has_role('super_admin')));
create policy "email logs: super admin or finance" on public.email_logs for select to authenticated
  using ((select private.has_role('super_admin')) or (select private.has_role('finance')));
create policy "audit: super admin or finance" on public.audit_logs for select to authenticated
  using ((select private.has_role('super_admin')) or (select private.has_role('finance')));
-- rate_limits: no policies (service role only)

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('waivers', 'waivers', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
-- No storage.objects policies for receipts/waivers: uploads use server-issued signed upload URLs and
-- reads use short-lived signed URLs created after an authorization check.

-- ---------------------------------------------------------------- atomic registration writes
-- Called ONLY by the server (service role) after validation. Not executable by browsers.
create or replace function public.save_team(
  p_owner uuid,
  p_team_id uuid,          -- null = create
  p_team jsonb,
  p_members jsonb,         -- array of {full_name,email,phone,grade,institution}; head is NOT included
  p_module_ids bigint[],   -- ranked non-compulsory modules, in order
  p_compulsory_ids bigint[]
) returns public.teams
language plpgsql set search_path = '' as $$
declare
  v_team public.teams;
  i int;
begin
  if p_team_id is null then
    insert into public.teams (
      owner_id, team_name, delegation_type, head_name, head_email, head_whatsapp, head_alt_phone, head_grade,
      institution, city, guardian_name, guardian_phone, heard_from, heard_from_other, needs, consents,
      member_count, fee_tier, total_fee, fee_breakdown, status
    ) values (
      p_owner, p_team ->> 'team_name', (p_team ->> 'delegation_type')::public.delegation_type, p_team ->> 'head_name',
      p_team ->> 'head_email', p_team ->> 'head_whatsapp', nullif(p_team ->> 'head_alt_phone', ''), p_team ->> 'head_grade',
      p_team ->> 'institution', p_team ->> 'city', p_team ->> 'guardian_name', p_team ->> 'guardian_phone',
      p_team ->> 'heard_from', nullif(p_team ->> 'heard_from_other', ''), nullif(p_team ->> 'needs', ''),
      coalesce(p_team -> 'consents', '{}'::jsonb), (p_team ->> 'member_count')::int, p_team ->> 'fee_tier',
      (p_team ->> 'total_fee')::int, p_team -> 'fee_breakdown', 'pending_payment'
    ) returning * into v_team;
  else
    update public.teams set
      team_name = p_team ->> 'team_name',
      delegation_type = (p_team ->> 'delegation_type')::public.delegation_type,
      head_name = p_team ->> 'head_name',
      head_email = p_team ->> 'head_email',
      head_whatsapp = p_team ->> 'head_whatsapp',
      head_alt_phone = nullif(p_team ->> 'head_alt_phone', ''),
      head_grade = p_team ->> 'head_grade',
      institution = p_team ->> 'institution',
      city = p_team ->> 'city',
      guardian_name = p_team ->> 'guardian_name',
      guardian_phone = p_team ->> 'guardian_phone',
      heard_from = p_team ->> 'heard_from',
      heard_from_other = nullif(p_team ->> 'heard_from_other', ''),
      needs = nullif(p_team ->> 'needs', ''),
      consents = coalesce(p_team -> 'consents', consents),
      member_count = (p_team ->> 'member_count')::int,
      total_fee = (p_team ->> 'total_fee')::int,
      fee_breakdown = p_team -> 'fee_breakdown'
    where id = p_team_id and owner_id = p_owner
    returning * into v_team;
    if v_team.id is null then
      raise exception 'team not found for owner' using errcode = 'P0002';
    end if;
    delete from public.team_members where team_id = v_team.id;
    delete from public.module_preferences where team_id = v_team.id;
  end if;

  insert into public.team_members (team_id, position, is_head, full_name, email, phone, grade, institution)
  values (v_team.id, 0, true, v_team.head_name, v_team.head_email, v_team.head_whatsapp, v_team.head_grade, v_team.institution);

  for i in 0 .. coalesce(jsonb_array_length(p_members), 0) - 1 loop
    insert into public.team_members (team_id, position, is_head, full_name, email, phone, grade, institution)
    values (
      v_team.id, i + 1, false, p_members -> i ->> 'full_name', p_members -> i ->> 'email', p_members -> i ->> 'phone',
      p_members -> i ->> 'grade', p_members -> i ->> 'institution'
    );
  end loop;

  insert into public.module_preferences (team_id, module_id, rank)
  select v_team.id, c, 0 from unnest(coalesce(p_compulsory_ids, '{}')) as c;
  insert into public.module_preferences (team_id, module_id, rank)
  select v_team.id, m, ord::int from unnest(coalesce(p_module_ids, '{}')) with ordinality as t(m, ord);

  return v_team;
end $$;
revoke all on function public.save_team(uuid, uuid, jsonb, jsonb, bigint[], bigint[]) from public, anon, authenticated;
grant execute on function public.save_team(uuid, uuid, jsonb, jsonb, bigint[], bigint[]) to service_role;
