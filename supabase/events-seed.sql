-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Jeu d'événements de démo
--  À exécuter dans Supabase → SQL Editor (après phase2b.sql).
--  Dates RELATIVES à l'exécution → toujours un mélange passé / à venir.
--  Ré-exécutable : repart d'une base propre.
--  ⚠️ Le delete efface aussi les présences liées (attendance, on delete cascade).
-- ─────────────────────────────────────────────────────────────

delete from public.events;

insert into public.events (type, title, opponent, starts_at, venue) values
  -- Passés → s'afficheront « Terminé »
  ('match',    'Championnat · J10', 'Étoile du Port',    now() - interval '14 days', 'Stade François Maillot'),
  ('training', 'Entraînement',      null,                now() - interval '6 days',  'Stade François Maillot'),
  ('match',    'Championnat · J11', 'AC Falaises',        now() - interval '3 days',  'Stade François Maillot'),
  -- À venir → carte active (Présent / Absent), la page s'ouvre ici
  ('training', 'Entraînement',      null,                now() + interval '2 days',  'Stade François Maillot'),
  ('match',    'Championnat · J13', 'Olympique Vallée',  now() + interval '5 days',  'Stade François Maillot'),
  ('training', 'Entraînement',      null,                now() + interval '9 days',  'Stade François Maillot'),
  ('match',    'Championnat · J14', 'US Rivière',         now() + interval '12 days', 'Stade François Maillot');
