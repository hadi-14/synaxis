-- Synaxis S1 seed data. All values are editable in /admin. Placeholders are marked (TBC).

insert into public.settings (id) values (1) on conflict (id) do nothing;
insert into public.payment_details (id) values (1) on conflict (id) do nothing;

insert into public.modules
  (slug, name, subject, character, accent, motif, tagline, description, format, team_size_note, schedule_slot, capacity, is_compulsory, sort)
values
  ('kabuki-caper', 'Kabuki Caper', 'Criminology', 'Yokai', '#DC2A35', 'kabuki',
   'Unmask the culprit before the microbots scatter.',
   'A forensic investigation built around a masked mystery. Teams read crime scenes, weigh evidence, interview witnesses and reason their way to the truth. This module is compulsory for every team.',
   'Live case file + evidence stations (TBC)', 'Whole team', 'Day 1 (TBC)', null, true, 0),
  ('baymaxs-blueprint', 'Baymax''s Blueprint', 'Biology', 'Baymax', '#F24B59', 'baymax',
   'On a scale of 1 to 10, how well do you know the human body?',
   'Diagnose, dissect and decode living systems, from cells to clinical cases. Inspired by the gentlest healthcare companion in San Fransokyo.',
   'Written round + practical diagnosis stations (TBC)', '2–3 delegates (TBC)', 'Day 1 (TBC)', 40, false, 1),
  ('lemons-labyrinth', 'Lemon''s Labyrinth', 'Chemistry', 'Honey Lemon', '#FF5FA2', 'chem',
   'Mix it, measure it, make it pop.',
   'A maze of reactions, titrations and molecular puzzles. Find the right formula to get out, just like a chem-ball that hits the target.',
   'Lab practical + puzzle maze (TBC)', '2–3 delegates (TBC)', 'Day 2 (TBC)', 40, false, 2),
  ('maglevs-mayhem', 'Maglev''s Mayhem', 'Physics', 'Go Go Tomago', '#F5C400', 'maglev',
   'Woman up. Physics waits for no one.',
   'Fast-paced mechanics, electromagnetism and problem-solving under pressure. Speed matters, but so does precision.',
   'Speed rounds + experimental challenge (TBC)', '2–3 delegates (TBC)', 'Day 2 (TBC)', 40, false, 3),
  ('hamadas-hangar', 'Hamada''s Hangar', 'Computer Science', 'Tadashi Hamada', '#3B82F6', 'blueprint',
   'Build something that helps people.',
   'Algorithms, debugging and build challenges in the spirit of Tadashi''s lab: thoughtful engineering with a purpose.',
   'Coding challenge + logic build (TBC)', '2–3 delegates (TBC)', 'Day 2 (TBC)', 40, false, 4),
  ('microbot-matrix', 'Microbot Matrix', 'Robotics', 'Hiro Hamada', '#7C5CFF', 'microbots',
   'Look for another angle.',
   'Design, wire and program small machines that work together. Think like Hiro: simple parts, clever systems.',
   'Hands-on build + task arena (TBC)', '2–3 delegates (TBC)', 'Day 3 (TBC)', 30, false, 5),
  ('wasabis-wits', 'Wasabi''s Wits', 'Mathematics', 'Wasabi', '#2BB673', 'plasma',
   'There''s a place for everything.',
   'Clean, precise problem-solving across algebra, geometry, combinatorics and number theory. Neat working is rewarded.',
   'Individual + team rounds (TBC)', '2–3 delegates (TBC)', 'Day 1 (TBC)', 40, false, 6),
  ('callaghans-conflict', 'Callaghan''s Conflict', 'Psychology', 'Robert Callaghan', '#8A8F98', 'portal',
   'Every mind has a motive.',
   'Explore behaviour, cognition and the decisions people make under pressure, through case studies and debate.',
   'Case analysis + panel round (TBC)', '2–3 delegates (TBC)', 'Day 3 (TBC)', 40, false, 7),
  ('freds-fallacy', 'Fred''s Fallacy', 'Logic', 'Fred', '#2FB8AC', 'kaiju',
   'Spot the flaw before it breathes fire.',
   'Arguments, paradoxes and puzzles. Find the hidden fallacy, build airtight reasoning and outwit the kaiju.',
   'Puzzle hunt + argument round (TBC)', '2–3 delegates (TBC)', 'Day 3 (TBC)', 40, false, 8)
on conflict (slug) do nothing;

insert into public.faqs (question, answer, category, sort) values
  ('What is Synaxis?', 'Synaxis is the Heuser Science Society''s first science olympiad: three days of competitive modules across biology, chemistry, physics, computer science, robotics, maths, psychology, logic and criminology, themed around Big Hero 6.', 'General', 1),
  ('When and where is it?', '15–17 January 2027 in Karachi. The exact venue will be announced on our Instagram and on this page.', 'General', 2),
  ('Who can take part?', 'Students currently enrolled in high or secondary school (9th grade, O-Level/Matric, AS, A-Level/Intermediate or equivalent). HSSC completers preparing for MDCAT are welcome. University students are not eligible.', 'Eligibility', 3),
  ('How big is a team?', 'Teams have 4 to 6 members, including the Head Delegate. Only the Head Delegate fills in the registration form.', 'Teams', 4),
  ('How many modules does a team compete in?', 'Each team competes in 4 or 5 modules. Kabuki Caper (Criminology) is compulsory for every team. You rank the other modules you want, and we allocate by preference and availability. Preferences are not guaranteed.', 'Modules', 5),
  ('How much does it cost?', 'A one-time delegation fee per team plus a per-delegate fee. The per-delegate fee is lower for early-bird registrations. You''ll see your exact total before you submit, and again on the payment screen. Current fees are listed in the "How to register" section.', 'Fees', 6),
  ('How do I pay?', 'After you submit, your dashboard shows our bank details, your exact total and your registration ID. Transfer the amount using the registration ID as the reference, then upload the receipt on the site or send it to us on WhatsApp.', 'Fees', 7),
  ('What is the dress code?', 'Official school delegations wear school uniform. Independent delegations dress semi-formal.', 'Event', 8),
  ('Do I need a waiver?', 'Yes. Every delegate needs a signed waiver of liability. Download the template from your dashboard and upload the signed copies there (one combined PDF or one per member).', 'Event', 9),
  ('Can I edit my team after submitting?', 'Yes, until registration closes. Changes to members can change your fee, and your dashboard will always show the current amount.', 'Teams', 10);

insert into public.sponsors (name, tier, blurb, sort, is_published) values
  ('Your brand here', 'title', 'Title sponsorship of Synaxis Season 1 (TBA)', 0, true);
