-- Module detail pages: brochure content + character dossier. Additive only: the old description / head_name /
-- cohead_name columns stay (still read by the deployed site) until a later cleanup migration drops them.
alter table public.modules
  add column if not exists brochure_number int,
  add column if not exists overview text not null default '',
  add column if not exists ideal_for text[] not null default '{}',
  add column if not exists skills_tested text[] not null default '{}',
  add column if not exists character_role text not null default '',
  add column if not exists character_tie_in text not null default '',
  add column if not exists rules_highlights jsonb not null default '[]'::jsonb,
  add column if not exists head_member_id bigint references public.council_members (id) on delete set null,
  add column if not exists cohead_member_id bigint references public.council_members (id) on delete set null;
create index if not exists modules_head_member_id_idx on public.modules (head_member_id);
create index if not exists modules_cohead_member_id_idx on public.modules (cohead_member_id);
alter table public.modules add constraint modules_rules_highlights_is_array check (jsonb_typeof(rules_highlights) = 'array');

-- keep anything already written as the description
update public.modules set overview = description where overview = '' and description <> '';

-- the official brochure (taglines, overviews, who it's for) + skills and the character dossier
update public.modules m set
  brochure_number = v.brochure_number,
  tagline = v.tagline,
  overview = v.overview,
  ideal_for = v.ideal_for,
  skills_tested = v.skills_tested,
  character_role = v.character_role,
  character_tie_in = v.character_tie_in
from (values
  ('baymaxs-blueprint', 1, 'The study of life, from cells and genes to whole ecosystems.', 'The module suits students who enjoy connecting how living things work at the smallest scale with how they interact, adapt and survive in the wider world.', array['You like careful observation', 'You enjoy explaining how one part of a living system affects the rest']::text[], array['Observation', 'Systems thinking', 'Cause and effect', 'Teamwork']::text[], 'Inflatable healthcare companion robot, built by Tadashi', 'Baymax is a healthcare companion built to understand the human body, one scan at a time. Think like him: observe carefully, then explain how one system affects the rest.'),
  ('maglevs-mayhem', 2, 'Forces, energy and the laws that govern the universe.', 'It is for students who like to reason from first principles, model how things move and interact, and test ideas against how the physical world behaves.', array['You like explaining what happens and why', 'You''re curious about everything from everyday motion to light and energy']::text[], array['First-principles reasoning', 'Modelling', 'Experimental testing', 'Estimation']::text[], 'Speed-loving engineering student who rides on maglev discs', 'Go Go lives for speed, momentum and her maglev wheels. Here physics is in motion: work out what happens, and why, before the disc stops spinning.'),
  ('lemons-labyrinth', 3, 'Matter, reactions and the chemistry of everyday life.', 'Contestants explore how substances are built and how they change, and how that explains the materials and processes around us.', array['You like linking atoms and molecules to what we can see, make and use in the real world']::text[], array['Molecular reasoning', 'Prediction', 'Observation', 'Real-world application']::text[], 'Chemistry student with a purse full of chem balls', 'Honey Lemon turns chemistry into a purse full of reactions. Mix what you know about atoms and molecules into answers you can see and use.'),
  ('hamadas-hangar', 4, 'Algorithms, code and computational thinking.', 'The module is about breaking problems into clear steps, designing sound solutions and thinking the way a programmer does.', array['You enjoy structure and building something that works', 'You always ask whether there is a simpler or faster way']::text[], array['Decomposition', 'Algorithm design', 'Efficiency', 'Debugging']::text[], 'Hiro''s older brother, robotics student and Baymax''s creator', 'Tadashi built Baymax line by line, to help people. Break problems into clear steps and build solutions that work, the way he did.'),
  ('wasabis-wits', 5, 'Patterns, proof and problem-solving under pressure.', 'It rewards both creativity and rigour: spotting structure, building a careful argument and finding a way through unfamiliar problems.', array['You think flexibly', 'You care about why an answer is right as much as what it is']::text[], array['Pattern spotting', 'Proof and rigour', 'Problem-solving under time', 'Creativity']::text[], 'Precise, orderly student who fights with plasma blades', 'Wasabi wants a place for everything and everything in its place. Bring that precision and order to patterns, proofs and problems under pressure.'),
  ('callaghans-conflict', 6, 'How the mind works and why people behave as they do.', 'Contestants look at thought, emotion and behaviour, and at how researchers study them.', array['You''re curious about memory, decision-making and social forces', 'You prefer evidence to assumption']::text[], array['Evidence over assumption', 'Research methods', 'Understanding behaviour', 'Critical thinking']::text[], 'Professor and head of the university''s robotics programme', 'Callaghan''s story is driven by grief and motive. Explore why minds do what they do, and how researchers find out.'),
  ('microbot-matrix', 7, 'Designing and building machines that sense and act.', 'It brings together engineering, electronics and programming. Teams think about how a machine gathers information, decides what to do and acts on it.', array['You like making ideas work in the real world']::text[], array['Engineering design', 'Electronics', 'Programming', 'Sense, decide, act', 'Teamwork']::text[], 'Teenage robotics prodigy and inventor of the microbots', 'Hiro is the robotics prodigy behind the microbots. Design machines that sense, decide and act, just as his swarm does.'),
  ('freds-fallacy', 8, 'Sharp reasoning, puzzles and clear thinking.', 'The module tests how well teams analyse arguments, notice patterns and reach sound conclusions.', array['You enjoy puzzles', 'You like spotting the flaw in a line of reasoning', 'You work from what is known to what must follow']::text[], array['Argument analysis', 'Pattern recognition', 'Deduction', 'Spotting fallacies']::text[], 'Comic-book fan and team mascot in a kaiju suit', 'Fred is the theory-loving fan who is always sure he''s right. Learn to spot the fallacy, in his reasoning and in yours.'),
  ('kabuki-caper', 9, 'Evidence, investigation and the study of crime.', 'Contestants weigh evidence, follow leads and think about why crime happens and how it is investigated. It draws on how investigators reason and how cases are built.', array['You question what the evidence really shows']::text[], array['Weighing evidence', 'Following leads', 'Reasoning about motive', 'Case building']::text[], 'The masked figure controlling the microbots', 'Yokai is the masked mystery at the heart of the story. Weigh the evidence, follow the leads and unmask the culprit.')
) as v(slug, brochure_number, tagline, overview, ideal_for, skills_tested, character_role, character_tie_in)
where m.slug = v.slug;

-- placeholders become empty, so the pages show "Announced soon" instead of "(TBC)"
update public.modules set format = '' where format like '%(TBC)%';
update public.modules set schedule_slot = '' where schedule_slot like '%(TBC)%';
update public.modules set team_size_note = '' where team_size_note like '%(TBC)%';
