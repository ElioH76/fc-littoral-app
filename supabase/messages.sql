-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Messagerie (canal d'équipe)
--  À exécuter dans Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender_name text not null,                 -- nom dénormalisé (évite une jointure profiles)
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Lecture par tous les membres connectés
drop policy if exists "messages_read_authenticated" on public.messages;
create policy "messages_read_authenticated"
  on public.messages for select to authenticated using (true);

-- Chacun n'envoie qu'en son propre nom
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid());

-- Temps réel : ajoute la table à la publication realtime.
-- (Si déjà ajoutée, l'erreur "already member of publication" est sans gravité.)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when others then null;
end $$;
