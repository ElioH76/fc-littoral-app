import { supabase } from "@/lib/supabase";
import { fetchEvents } from "@/lib/events";
import { fetchAllAttendance } from "@/lib/attendance";
import { fetchMembers } from "@/lib/members";
import { fetchPlayers } from "@/lib/coach";

export type ScorerStat = {
  memberId: string;
  name: string;
  number: number;
  goals: number;
  assists: number;
};

type GoalJoin = {
  scorer_id: string | null;
  assist_id: string | null;
  scorer: { first_name: string; last_name: string; number: number } | null;
  assist: { first_name: string; last_name: string; number: number } | null;
};

/** Classement buteurs / passeurs agrégé depuis la table goals (lisible par tous). */
export async function fetchScorers(): Promise<ScorerStat[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(
      "scorer_id, assist_id, scorer:members!scorer_id(first_name,last_name,number), assist:members!assist_id(first_name,last_name,number)",
    );
  if (error || !data) return [];
  const map = new Map<string, ScorerStat>();
  const bump = (
    id: string | null,
    m: { first_name: string; last_name: string; number: number } | null,
    key: "goals" | "assists",
  ) => {
    if (!id || !m) return;
    let s = map.get(id);
    if (!s) {
      s = {
        memberId: id,
        name: `${m.first_name} ${m.last_name}`,
        number: m.number,
        goals: 0,
        assists: 0,
      };
      map.set(id, s);
    }
    s[key]++;
  };
  for (const r of data as unknown as GoalJoin[]) {
    bump(r.scorer_id, r.scorer, "goals");
    bump(r.assist_id, r.assist, "assists");
  }
  return [...map.values()].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

/** Buts / passes d'un membre donné (fiche joueur, public). */
export async function fetchMemberStats(
  memberId: string,
): Promise<{ goals: number; assists: number }> {
  const { data } = await supabase.from("goals").select("scorer_id, assist_id");
  let goals = 0;
  let assists = 0;
  if (data)
    for (const r of data as { scorer_id: string | null; assist_id: string | null }[]) {
      if (r.scorer_id === memberId) goals++;
      if (r.assist_id === memberId) assists++;
    }
  return { goals, assists };
}

export type MyStats = {
  goals: number;
  assists: number;
  presenceRate: number | null; // % de présence parmi les événements répondus
  present: number;
  responded: number;
};

/** Stats du joueur connecté : buts/passes (goals) + présence (attendance). */
export async function fetchMyStats(memberId: string | null): Promise<MyStats> {
  const base = memberId
    ? await fetchMemberStats(memberId)
    : { goals: 0, assists: 0 };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let present = 0;
  let responded = 0;
  if (user) {
    const { data } = await supabase
      .from("attendance")
      .select("status")
      .eq("user_id", user.id);
    if (data)
      for (const r of data as { status: string }[]) {
        responded++;
        if (r.status === "present") present++;
      }
  }
  const presenceRate =
    responded > 0 ? Math.round((present / responded) * 100) : null;
  return { ...base, presenceRate, present, responded };
}

/* ───────────────────────────── Équipe ───────────────────────────── */

export type TeamStats = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

/** Bilan des matchs joués (score saisi) — public (table events). */
export async function fetchTeamStats(): Promise<TeamStats> {
  const events = await fetchEvents();
  let played = 0,
    wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;
  for (const e of events) {
    if (e.type !== "match" || e.scoreUs == null || e.scoreThem == null) continue;
    played++;
    goalsFor += e.scoreUs;
    goalsAgainst += e.scoreThem;
    if (e.scoreUs > e.scoreThem) wins++;
    else if (e.scoreUs < e.scoreThem) losses++;
    else draws++;
  }
  return { played, wins, draws, losses, goalsFor, goalsAgainst };
}

/** Taux de présence moyen de l'équipe (réservé staff via RLS attendance). */
export async function fetchTeamPresence(): Promise<{
  present: number;
  absent: number;
  rate: number | null;
}> {
  const map = await fetchAllAttendance();
  let present = 0;
  let total = 0;
  for (const ev of Object.values(map)) {
    for (const st of Object.values(ev)) {
      total++;
      if (st === "present") present++;
    }
  }
  const rate = total > 0 ? Math.round((present / total) * 100) : null;
  return { present, absent: total - present, rate };
}

export type PlayerStatRow = {
  memberId: string;
  name: string;
  number: number;
  goals: number;
  assists: number;
};

/** Tableau buts/passes de TOUT l'effectif (joueurs sans but inclus). Public. */
export async function fetchPlayerTable(): Promise<PlayerStatRow[]> {
  const [members, scorers] = await Promise.all([fetchMembers(), fetchScorers()]);
  const byId = new Map(scorers.map((s) => [s.memberId, s]));
  return members
    .map((m) => {
      const s = byId.get(m.id);
      return {
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`,
        number: m.number,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.goals - a.goals || b.assists - a.assists || a.number - b.number,
    );
}

export type PresenceRow = {
  id: string;
  name: string;
  present: number;
  absent: number;
  rate: number | null;
};

/** Bilan des présences par joueur (réservé staff via RLS attendance). */
export async function fetchPresenceTable(): Promise<PresenceRow[]> {
  const [players, att] = await Promise.all([fetchPlayers(), fetchAllAttendance()]);
  const counts = new Map<string, { present: number; absent: number }>();
  for (const ev of Object.values(att)) {
    for (const [uid, st] of Object.entries(ev)) {
      const c = counts.get(uid) ?? { present: 0, absent: 0 };
      if (st === "present") c.present++;
      else c.absent++;
      counts.set(uid, c);
    }
  }
  return players
    .map((p) => {
      const c = counts.get(p.id) ?? { present: 0, absent: 0 };
      const tot = c.present + c.absent;
      return {
        id: p.id,
        name: p.name,
        present: c.present,
        absent: c.absent,
        rate: tot > 0 ? Math.round((c.present / tot) * 100) : null,
      };
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
}
