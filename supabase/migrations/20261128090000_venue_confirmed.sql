-- Venue confirmed: Heuser College. New default, and fix the seeded placeholder if it was never edited.
alter table public.settings alter column venue_name set default 'Heuser College';
update public.settings set venue_name = 'Heuser College' where venue_name = 'Heuser College (venue TBC)';
