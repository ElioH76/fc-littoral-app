-- ─────────────────────────────────────────────────────────────
--  FC Littoral — App équipe · Schéma Supabase (Phase 2a)
--  À exécuter dans Supabase → SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────

-- Table de l'effectif
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  number      int  not null default 0,
  position    text not null default '',
  team_group  text not null default 'Attaquants',  -- Gardiens | Défenseurs | Milieux | Attaquants
  goals       int  not null default 0,
  matches     int  not null default 0,
  captain     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Sécurité : on active RLS et on autorise la lecture aux membres connectés
alter table public.members enable row level security;

drop policy if exists "members_read_authenticated" on public.members;
create policy "members_read_authenticated"
  on public.members
  for select
  to authenticated
  using (true);

-- Effectif réel — équipe fanion (Seniors Après-Midi), aligné sur le site.
-- On repart d'une base propre pour remplacer l'ancien effectif de démo.
delete from public.members;
insert into public.members (first_name, last_name, number, position, team_group, goals, matches, captain) values
  ('Vincent','Malandain',1,'Gardien','Gardiens',0,0,false),
  ('Théo','Debris',2,'Piston droit','Défenseurs',16,0,false),
  ('Thomas','Cocault-Duverger',3,'Latéral gauche','Défenseurs',4,0,false),
  ('Corentin','Savalle',4,'Défenseur central','Défenseurs',3,0,false),
  ('Elio','Hardouin',5,'Défenseur central','Défenseurs',9,0,true),
  ('Adrien','Debris',6,'Milieu défensif','Milieux',8,0,false),
  ('Alban','Pusset',7,'Ailier','Attaquants',12,0,false),
  ('Erwan','Ligney',8,'Milieu','Milieux',10,0,false),
  ('Alexandre','Ferreira Moreira',9,'Buteur','Attaquants',17,0,false),
  ('Mathys','Linquier',10,'Milieu offensif','Milieux',24,0,false),
  ('Benjamin','Friboulet',11,'Ailier','Attaquants',28,0,false),
  ('Mattéo','Ebersvillier',12,'Milieu défensif','Milieux',3,0,false),
  ('Noam','Julien',13,'Ailier','Attaquants',2,0,false),
  ('Axel','Hauchecorne',14,'Ailier','Attaquants',0,0,false),
  ('Thomas','Guérout',15,'Latéral droit','Défenseurs',0,0,false),
  ('Valentin','Joly',16,'Milieu','Milieux',7,0,false),
  ('William','Tassel',17,'Défenseur central','Défenseurs',2,0,false),
  ('Mathis','Hardouin',18,'Milieu offensif','Milieux',15,0,false);
