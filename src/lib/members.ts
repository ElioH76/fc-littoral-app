import { players } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position: string;
  group: "Gardiens" | "Défenseurs" | "Milieux" | "Attaquants";
  goals: number;
  matches: number;
  captain: boolean;
};

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  number: number;
  position: string;
  team_group: Member["group"];
  goals: number | null;
  matches: number | null;
  captain: boolean | null;
};

function mapRow(r: Row): Member {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    number: r.number,
    position: r.position,
    group: r.team_group,
    goals: r.goals ?? 0,
    matches: r.matches ?? 0,
    captain: !!r.captain,
  };
}

/** Repli : données de démo si Supabase est vide / indisponible. */
function fallback(): Member[] {
  return players.map((p) => ({ ...p, captain: p.captain ?? false }));
}

/** Liste des membres (table `members` Supabase, sinon démo). */
export async function fetchMembers(): Promise<Member[]> {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("number");
    if (error || !data || data.length === 0) return fallback();
    return (data as Row[]).map(mapRow);
  } catch {
    return fallback();
  }
}

export async function fetchMember(id: string): Promise<Member | undefined> {
  return (await fetchMembers()).find((m) => m.id === id);
}
