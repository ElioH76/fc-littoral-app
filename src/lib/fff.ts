/**
 * Données FFF (API DOFA publique) — réutilise les endpoints décodés pour le site.
 * Classement d'une poule de F.C. du Littoral (cl_no DOFA 100405).
 *
 * ⚠️ Pointé sur la poule Seniors/Vétérans réelle (cp 440940 / phase 1 / poule 11)
 *    en attendant que l'équipe « Seniors Après-Midi » soit engagée à la FFF.
 *    Les lignes de notre club sont renommées « FC Littoral ».
 */

const BASE = "https://api-dofa.fff.fr/api";
const HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
  Referer: "https://www.fff.fr/",
};

const OUR_CLUB_CL_NO = 100405;
const POULE = { cp: 440940, phase: 1, poule: 11 };

export type FffStanding = {
  rank: number;
  team: string;
  played: number;
  diff: string;
  pts: number;
  us: boolean;
  color: string;
};

type Row = {
  rank: number;
  cj_no?: number;
  point_count?: number;
  total_games_count?: number;
  goals_for_count?: number;
  goals_against_count?: number;
  equipe?: { short_name?: string; club?: { cl_no?: number } };
};

/** Classement réel de la poule (vide si l'API échoue → le dashboard garde la démo). */
export async function fetchStandings(): Promise<FffStanding[]> {
  try {
    const res = await fetch(
      `${BASE}/compets/${POULE.cp}/phases/${POULE.phase}/poules/${POULE.poule}/classement_journees`,
      { headers: HEADERS },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Row[];
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const maxCj = Math.max(...rows.map((r) => r.cj_no ?? 0));
    return rows
      .filter((r) => (r.cj_no ?? 0) === maxCj)
      .sort((a, b) => a.rank - b.rank)
      .map((r) => {
        const us = r.equipe?.club?.cl_no === OUR_CLUB_CL_NO;
        const gd = (r.goals_for_count ?? 0) - (r.goals_against_count ?? 0);
        return {
          rank: r.rank,
          team: us ? "FC Littoral" : (r.equipe?.short_name ?? "—"),
          played: r.total_games_count ?? 0,
          diff: gd > 0 ? `+${gd}` : `${gd}`,
          pts: r.point_count ?? 0,
          us,
          color: us ? "#F5C800" : "#888888",
        };
      });
  } catch {
    return [];
  }
}
