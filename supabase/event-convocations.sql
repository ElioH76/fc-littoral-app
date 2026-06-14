-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Convocations à la demande
--  À exécuter dans Supabase → SQL Editor.
--  Un événement naît AVEC convocations fermées ; le coach les ouvre.
-- ─────────────────────────────────────────────────────────────

alter table public.events
  add column if not exists convocations_open boolean not null default false;
