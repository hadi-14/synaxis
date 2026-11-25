-- Grant a Cubinet role to someone who has signed in at least once.
-- Run in the Supabase dashboard → SQL editor (or psql). Replace the email and role.
-- Roles: super_admin | finance | module_head (module_head also needs a module slug)
insert into public.user_roles (user_id, role, module_id)
select u.id, 'super_admin'::public.app_role, null
from auth.users u
where lower(u.email) = lower('president@example.com')
on conflict do nothing;

-- Module Head example:
-- insert into public.user_roles (user_id, role, module_id)
-- select u.id, 'module_head', m.id from auth.users u, public.modules m
-- where lower(u.email) = lower('head@example.com') and m.slug = 'wasabis-wits'
-- on conflict do nothing;
