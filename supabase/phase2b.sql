-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Phase 2b (événements + présences)
--  À exécuter dans Supabase → SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────

-- Événements (matchs / entraînements)
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('match','training')),
  title      text not null,
  opponent   text,
  starts_at  timestamptz not null,
  venue      text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
drop policy if exists "events_read_authenticated" on public.events;
create policy "events_read_authenticated"
  on public.events for select to authenticated using (true);

-- Présences (réponse de chaque membre à un événement)
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status     text not null check (status in ('present','absent')),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.attendance enable row level security;

-- Chaque membre gère uniquement SES réponses
drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own"
  on public.attendance for select to authenticated using (user_id = auth.uid());

drop policy if exists "attendance_insert_own" on public.attendance;
create policy "attendance_insert_own"
  on public.attendance for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "attendance_update_own" on public.attendance;
create policy "attendance_update_own"
  on public.attendance for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Quelques événements de départ (dates relatives à aujourd'hui)
insert into public.events (type, title, opponent, starts_at, venue) values
  ('match',    'Championnat · J13', 'Olympique Vallée', now() + interval '5 days',  'Stade Municipal'),
  ('training', 'Entraînement',      null,               now() + interval '2 days',  'Stade Municipal'),
  ('training', 'Entraînement',      null,               now() - interval '1 days',  'Stade Municipal'),
  ('match',    'Championnat · J12', 'AC Falaises',       now() - interval '8 days',  'Stade Municipal');
