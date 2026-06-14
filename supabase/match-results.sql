-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Résultats de match (score + buteurs)
--  À exécuter dans Supabase → SQL Editor (après phase2b.sql + accounts.sql).
--  Saisie réservée au staff (coach/admin) via is_staff().
-- ─────────────────────────────────────────────────────────────

-- Score final sur l'événement (us = FC Littoral, them = adversaire).
alter table public.events
  add column if not exists score_us   int,
  add column if not exists score_them int;

-- Buts : buteur + passeur éventuel (rattachés à l'effectif `members`).
create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  scorer_id  uuid references public.members(id) on delete set null,
  assist_id  uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

-- Lecture par tous les membres connectés
drop policy if exists "goals_read_authenticated" on public.goals;
create policy "goals_read_authenticated"
  on public.goals for select to authenticated using (true);

-- Écriture réservée au staff
drop policy if exists "goals_write_staff" on public.goals;
create policy "goals_write_staff"
  on public.goals for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
