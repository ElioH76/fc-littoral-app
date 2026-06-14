-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Comptes & rôles (auth)
--  À exécuter dans Supabase → SQL Editor APRÈS schema.sql.
--  Puis lancer : node scripts/seed-accounts.mjs  (crée les comptes)
-- ─────────────────────────────────────────────────────────────

-- Profil applicatif rattaché à un compte Supabase Auth.
--   role : 'player' (joueur) | 'coach' (droits étendus à venir) | 'admin'
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  login      text unique not null,                 -- identifiant "prenom.nom"
  full_name  text not null,
  role       text not null default 'player',
  member_id  uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fonction d'aide (SECURITY DEFINER) pour savoir si l'utilisateur courant
-- est coach/admin — évite la récursion RLS sur la table profiles.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('coach', 'admin')
  );
$$;

-- Chacun lit son propre profil…
drop policy if exists "profiles_read_self" on public.profiles;
create policy "profiles_read_self"
  on public.profiles for select to authenticated
  using (id = auth.uid());

-- …et le staff (coach/admin) voit tous les profils (droits étendus).
drop policy if exists "profiles_read_staff" on public.profiles;
create policy "profiles_read_staff"
  on public.profiles for select to authenticated
  using (public.is_staff());
