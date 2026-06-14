import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/profile";

export type PlayerAccount = { id: string; name: string };

export type Account = {
  id: string;
  name: string;
  login: string;
  role: Role;
  position?: string;
};

type AccountRow = {
  id: string;
  full_name: string;
  login: string;
  role: Role;
  member: { position: string } | null;
};

/** Tous les comptes (profiles) avec rôle + poste — gestion des membres (staff). */
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, login, role, member:members(position)")
    .order("full_name");
  if (error || !data) return [];
  return (data as unknown as AccountRow[]).map((r) => ({
    id: r.id,
    name: r.full_name,
    login: r.login,
    role: r.role,
    position: r.member?.position,
  }));
}

/** Change le rôle d'un membre (réservé staff via RLS). */
export async function setRole(id: string, role: Role): Promise<{ error?: string }> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  return { error: error?.message };
}

/**
 * Liste des comptes joueurs (table profiles, role='player') — pour la vue
 * présences côté coach. Lecture autorisée au staff via la policy profiles_read_staff.
 */
export async function fetchPlayers(): Promise<PlayerAccount[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "player")
    .order("full_name");
  if (error || !data) return [];
  return (data as { id: string; full_name: string }[]).map((p) => ({
    id: p.id,
    name: p.full_name,
  }));
}
