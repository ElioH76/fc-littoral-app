import { supabase } from "@/lib/supabase";

export type Presence = "present" | "absent";

/** Récupère les réponses de présence du membre connecté (event_id → statut). */
export async function fetchMyAttendance(): Promise<Record<string, Presence>> {
  const map: Record<string, Presence> = {};
  const { data, error } = await supabase
    .from("attendance")
    .select("event_id,status");
  if (!error && data) {
    for (const r of data as { event_id: string; status: Presence }[]) {
      map[r.event_id] = r.status;
    }
  }
  return map;
}

/**
 * Toutes les présences, par événement puis par utilisateur (réservé staff via RLS).
 * Renvoie `{ [eventId]: { [userId]: status } }`.
 */
export async function fetchAllAttendance(): Promise<
  Record<string, Record<string, Presence>>
> {
  const map: Record<string, Record<string, Presence>> = {};
  const { data, error } = await supabase
    .from("attendance")
    .select("event_id,user_id,status");
  if (!error && data) {
    for (const r of data as {
      event_id: string;
      user_id: string;
      status: Presence;
    }[]) {
      (map[r.event_id] ??= {})[r.user_id] = r.status;
    }
  }
  return map;
}

/** Présences d'un événement : { userId: statut } (lisible par tous). */
export async function fetchEventAttendance(
  eventId: string,
): Promise<Record<string, Presence>> {
  const map: Record<string, Presence> = {};
  const { data, error } = await supabase
    .from("attendance")
    .select("user_id,status")
    .eq("event_id", eventId);
  if (!error && data) {
    for (const r of data as { user_id: string; status: Presence }[]) {
      map[r.user_id] = r.status;
    }
  }
  return map;
}

/** Définit la présence d'un membre donné (réservé staff via RLS). */
export async function setAttendanceFor(
  eventId: string,
  userId: string,
  status: Presence,
): Promise<boolean> {
  const { error } = await supabase
    .from("attendance")
    .upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: "event_id,user_id" },
    );
  return !error;
}

/** Enregistre (ou met à jour) la présence du membre pour un événement. */
export async function setAttendance(
  eventId: string,
  status: Presence,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("attendance")
    .upsert(
      { event_id: eventId, user_id: user.id, status },
      { onConflict: "event_id,user_id" },
    );
  return !error;
}
