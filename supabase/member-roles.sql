-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Gestion des rôles (staff)
--  À exécuter dans Supabase → SQL Editor (après accounts.sql).
--  Permet au staff (coach/admin) de modifier le rôle des membres.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff"
  on public.profiles for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
