import { supabase } from "@/lib/supabase";

export type Goal = {
  scorerId: string | null;
  assistId: string | null;
  scorerName?: string;
  assistName?: string;
};

type GoalRow = {
  scorer_id: string | null;
  assist_id: string | null;
  scorer: { first_name: string; last_name: string } | null;
  assist: { first_name: string; last_name: string } | null;
};

/** Buts d'un événement, avec noms du buteur / passeur (jointure members). */
export async function fetchEventGoals(eventId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(
      "scorer_id, assist_id, scorer:members!scorer_id(first_name,last_name), assist:members!assist_id(first_name,last_name)",
    )
    .eq("event_id", eventId)
    .order("created_at");
  if (error || !data) return [];
  return (data as unknown as GoalRow[]).map((r) => ({
    scorerId: r.scorer_id,
    assistId: r.assist_id,
    scorerName: r.scorer ? `${r.scorer.first_name} ${r.scorer.last_name}` : undefined,
    assistName: r.assist ? `${r.assist.first_name} ${r.assist.last_name}` : undefined,
  }));
}

/**
 * Enregistre le résultat d'un match (réservé staff) :
 * score + remplacement complet de la liste des buts.
 */
export async function saveMatchResult(
  eventId: string,
  scoreUs: number,
  scoreThem: number,
  goals: { scorerId: string | null; assistId: string | null }[],
): Promise<{ error?: string }> {
  const up = await supabase
    .from("events")
    .update({ score_us: scoreUs, score_them: scoreThem })
    .eq("id", eventId);
  if (up.error) return { error: up.error.message };

  const del = await supabase.from("goals").delete().eq("event_id", eventId);
  if (del.error) return { error: del.error.message };

  const rows = goals
    .filter((g) => g.scorerId)
    .map((g) => ({ event_id: eventId, scorer_id: g.scorerId, assist_id: g.assistId }));
  if (rows.length > 0) {
    const ins = await supabase.from("goals").insert(rows);
    if (ins.error) return { error: ins.error.message };
  }
  return {};
}
