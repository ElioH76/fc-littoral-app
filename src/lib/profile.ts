import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type Role = "player" | "coach" | "admin";

/** Profil de l'utilisateur connecté (jointure profiles + members). */
export type MyProfile = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  initials: string;
  team: string;
  role: Role;
  memberId: string | null;
  // Données joueur (absentes pour un coach non rattaché à l'effectif)
  number?: number;
  position?: string;
  group?: string;
  goals?: number;
  matches?: number;
  captain?: boolean;
};

/** Équipe rattachée à l'appli (équipe fanion). */
const TEAM = "Seniors Après-Midi";

function initialsOf(first: string, last: string): string {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

type MemberEmbed = {
  first_name: string;
  last_name: string;
  number: number;
  position: string;
  team_group: string;
  goals: number | null;
  matches: number | null;
  captain: boolean | null;
};

type ProfileRow = {
  id: string;
  login: string;
  full_name: string;
  role: Role;
  member_id: string | null;
  member: MemberEmbed | null;
};

/** Repli : construit un profil minimal depuis les métadonnées du compte. */
function fromMetadata(user: User): MyProfile {
  const md = (user.user_metadata ?? {}) as Record<string, string>;
  const full = md.full_name || md.login || user.email?.split("@")[0] || "";
  const [first, ...rest] = full.replace(/\./g, " ").trim().split(/\s+/);
  const firstName = first ?? "";
  const lastName = rest.join(" ");
  return {
    id: user.id,
    login: md.login ?? "",
    firstName,
    lastName,
    initials: initialsOf(firstName, lastName),
    team: TEAM,
    role: (md.role as Role) ?? "player",
    memberId: null,
  };
}

/** Récupère le profil du membre actuellement connecté (ou null si déconnecté). */
export async function fetchMyProfile(): Promise<MyProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, login, full_name, role, member_id, member:members ( first_name, last_name, number, position, team_group, goals, matches, captain )",
      )
      .eq("id", user.id)
      .single();

    if (error || !data) return fromMetadata(user);

    const row = data as unknown as ProfileRow;
    const m = row.member;
    const fallbackName = (row.full_name ?? "").trim().split(/\s+/);
    const firstName = m?.first_name ?? fallbackName[0] ?? row.login;
    const lastName = m?.last_name ?? fallbackName.slice(1).join(" ");

    return {
      id: row.id,
      login: row.login,
      firstName,
      lastName,
      initials: initialsOf(firstName, lastName),
      team: TEAM,
      role: row.role,
      memberId: row.member_id,
      number: m?.number,
      position: m?.position,
      group: m?.team_group,
      goals: m?.goals ?? undefined,
      matches: m?.matches ?? undefined,
      captain: m?.captain ?? undefined,
    };
  } catch {
    return fromMetadata(user);
  }
}
