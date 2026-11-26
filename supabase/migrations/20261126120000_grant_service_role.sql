-- Newer Supabase projects don't auto-grant table privileges to the Data API roles.
-- The server (service role, never exposed to browsers) needs full access to public tables;
-- anon/authenticated keep exactly the SELECT/draft grants from the init migration (RLS still applies).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Re-assert the browser-facing grants (idempotent) in case the project started with none.
grant usage on schema public to anon, authenticated;
grant select on public.modules, public.module_categories, public.settings, public.faqs,
  public.council_members, public.sponsors to anon, authenticated;
grant select on public.profiles, public.user_roles, public.payment_details, public.teams,
  public.team_members, public.module_preferences, public.module_allocations, public.payments,
  public.waivers, public.checkins, public.sponsor_inquiries, public.email_logs, public.audit_logs
  to authenticated;
grant select, insert, update, delete on public.registration_drafts to authenticated;
