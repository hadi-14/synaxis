-- Synaxis S1 seed data. All values are editable in /admin. Empty fields show "Announced soon" on the site.

insert into public.settings (id) values (1) on conflict (id) do nothing;
insert into public.payment_details (id) values (1) on conflict (id) do nothing;

insert into public.modules
  (slug, name, subject, character, accent, motif, tagline, description, format, team_size_note, schedule_slot, capacity, is_compulsory, sort)
values
  ('kabuki-caper', 'Kabuki Caper', 'Criminology', 'Yokai', '#DC2A35', 'kabuki',
   'Unmask the culprit before the microbots scatter.',
   'A forensic investigation built around a masked mystery. Teams read crime scenes, weigh evidence, interview witnesses and reason their way to the truth. This module is compulsory for every team.',
   '', 'Whole team', '', null, true, 0),
  ('baymaxs-blueprint', 'Baymax''s Blueprint', 'Biology', 'Baymax', '#F24B59', 'baymax',
   'On a scale of 1 to 10, how well do you know the human body?',
   'Diagnose, dissect and decode living systems, from cells to clinical cases. Inspired by the gentlest healthcare companion in San Fransokyo.',
   '', '', '', 40, false, 1),
  ('lemons-labyrinth', 'Lemon''s Labyrinth', 'Chemistry', 'Honey Lemon', '#FF5FA2', 'chem',
   'Mix it, measure it, make it pop.',
   'A maze of reactions, titrations and molecular puzzles. Find the right formula to get out, just like a chem-ball that hits the target.',
   '', '', '', 40, false, 2),
  ('maglevs-mayhem', 'Maglev''s Mayhem', 'Physics', 'Go Go Tomago', '#F5C400', 'maglev',
   'Woman up. Physics waits for no one.',
   'Fast-paced mechanics, electromagnetism and problem-solving under pressure. Speed matters, but so does precision.',
   '', '', '', 40, false, 3),
  ('hamadas-hangar', 'Hamada''s Hangar', 'Computer Science', 'Tadashi Hamada', '#3B82F6', 'blueprint',
   'Build something that helps people.',
   'Algorithms, debugging and build challenges in the spirit of Tadashi''s lab: thoughtful engineering with a purpose.',
   '', '', '', 40, false, 4),
  ('microbot-matrix', 'Microbot Matrix', 'Robotics', 'Hiro Hamada', '#7C5CFF', 'microbots',
   'Look for another angle.',
   'Design, wire and program small machines that work together. Think like Hiro: simple parts, clever systems.',
   '', '', '', 30, false, 5),
  ('wasabis-wits', 'Wasabi''s Wits', 'Mathematics', 'Wasabi', '#2BB673', 'plasma',
   'There''s a place for everything.',
   'Clean, precise problem-solving across algebra, geometry, combinatorics and number theory. Neat working is rewarded.',
   '', '', '', 40, false, 6),
  ('callaghans-conflict', 'Callaghan''s Conflict', 'Psychology', 'Robert Callaghan', '#8A8F98', 'portal',
   'Every mind has a motive.',
   'Explore behaviour, cognition and the decisions people make under pressure, through case studies and debate.',
   '', '', '', 40, false, 7),
  ('freds-fallacy', 'Fred''s Fallacy', 'Logic', 'Fred', '#2FB8AC', 'kaiju',
   'Spot the flaw before it breathes fire.',
   'Arguments, paradoxes and puzzles. Find the hidden fallacy, build airtight reasoning and outwit the kaiju.',
   '', '', '', 40, false, 8)
on conflict (slug) do nothing;

-- Official brochure content and the character dossier (same as migration 20261128120000_module_pages.sql).
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


insert into public.faqs (question, answer, category, sort) values
  ('What is Synaxis?', 'Synaxis is the Heuser Science Society''s first science olympiad: three days of competitive modules across biology, chemistry, physics, computer science, robotics, maths, psychology, logic and criminology, themed around Big Hero 6.', 'General', 1),
  ('When and where is it?', '15–17 January 2027 at Heuser College, Karachi.', 'General', 2),
  ('Who can take part?', 'Open to students currently in Grade 9, O-Level/Matric, AS or A-Level/Intermediate (or equivalent), and recent school graduates on a gap year, including those preparing for entrance tests like MDCAT, BizCAT or ECAT. University students are not eligible. Register as a Heuser team, an official school delegation or an independent team.', 'Eligibility', 3),
  ('How big is a team?', 'Teams have 4 to 6 members, including the Head Delegate. Only the Head Delegate fills in the registration form.', 'Teams', 4),
  ('How many modules does a team compete in?', 'Each team competes in 4 or 5 modules. Kabuki Caper (Criminology) is compulsory for every team. You rank the other modules you want, and we allocate by preference and availability. Preferences are not guaranteed.', 'Modules', 5),
  ('How much does it cost?', '{{fees}} You''ll see your exact total before you submit, and again on the payment screen.', 'Fees', 6),
  ('How do I pay?', 'After you submit, your dashboard shows our bank details, your exact total and your registration ID. Transfer the amount using the registration ID as the reference, then upload the receipt on the site or send it to us on WhatsApp.', 'Fees', 7),
  ('Do I need a waiver?', 'Yes. Every delegate needs a signed waiver of liability. Download the template from your dashboard and upload the signed copies there (one combined PDF or one per member).', 'Event', 9),
  ('Can I edit my team after submitting?', 'Yes, until registration closes. Changes to members can change your fee, and your dashboard will always show the current amount.', 'Teams', 10);

insert into public.sponsors (name, tier, blurb, sort, is_published) values
  ('Your brand here', 'title', 'Title sponsorship of Synaxis Season 1 (TBA)', 0, true);
