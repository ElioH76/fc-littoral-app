-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Page événement détaillée (façon SportEasy)
--  À exécuter dans Supabase → SQL Editor (après phase2b.sql + accounts.sql
--  + coach.sql + messages.sql).
-- ─────────────────────────────────────────────────────────────

-- Événement : rendez-vous (convocation), heure de fin, adresse complète.
alter table public.events
  add column if not exists meet_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists address text;

-- Messages : rattachement optionnel à un événement (forum par événement).
-- event_id NULL = canal d'équipe global ; renseigné = forum de l'événement.
alter table public.messages
  add column if not exists event_id uuid references public.events(id) on delete cascade;

-- Profils (noms/postes) lisibles par tous les membres connectés
-- (nécessaire pour afficher la liste des présences à tout le monde).
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
  on public.profiles for select to authenticated using (true);

-- Présences visibles par TOUS les membres connectés (et plus seulement soi/staff).
drop policy if exists "attendance_select_own" on public.attendance;
drop policy if exists "attendance_select_staff" on public.attendance;
drop policy if exists "attendance_select_all" on public.attendance;
create policy "attendance_select_all"
  on public.attendance for select to authenticated using (true);

-- Le staff peut gérer la présence de n'importe quel membre (« Gérer les présences »).
drop policy if exists "attendance_insert_staff" on public.attendance;
create policy "attendance_insert_staff"
  on public.attendance for insert to authenticated with check (public.is_staff());

drop policy if exists "attendance_update_staff" on public.attendance;
create policy "attendance_update_staff"
  on public.attendance for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
