-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Droits coach/admin (espace coach)
--  À exécuter dans Supabase → SQL Editor APRÈS accounts.sql + phase2b.sql.
--  S'appuie sur la fonction public.is_staff() (définie dans accounts.sql).
-- ─────────────────────────────────────────────────────────────

-- Le staff (coach/admin) voit TOUTES les présences (pas seulement les siennes).
drop policy if exists "attendance_select_staff" on public.attendance;
create policy "attendance_select_staff"
  on public.attendance for select to authenticated
  using (public.is_staff());

-- Le staff gère les événements (création / édition / suppression).
drop policy if exists "events_insert_staff" on public.events;
create policy "events_insert_staff"
  on public.events for insert to authenticated
  with check (public.is_staff());

drop policy if exists "events_update_staff" on public.events;
create policy "events_update_staff"
  on public.events for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "events_delete_staff" on public.events;
create policy "events_delete_staff"
  on public.events for delete to authenticated
  using (public.is_staff());
