import { events as mockEvents } from "@/data/mock";
import { supabase } from "@/lib/supabase";

const WD = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MO = [
  "JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN",
  "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC",
];

export type AppEvent = {
  id: string;
  type: "match" | "training";
  title: string;
  opponent?: string;
  startsAt: string;
  weekday: string;
  day: string;
  month: string;
  time: string;
  venue: string;
  convocationsOpen: boolean;
  scoreUs: number | null;
  scoreThem: number | null;
  meetAt: string | null;
  endsAt: string | null;
  address: string;
};

/** Un événement est « terminé » quand sa date de début est passée. */
export function isEventDone(e: AppEvent): boolean {
  return new Date(e.startsAt).getTime() < Date.now();
}

function byDateAsc(a: AppEvent, b: AppEvent): number {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

function fromDate(iso: string) {
  const d = new Date(iso);
  return {
    weekday: WD[d.getDay()],
    day: String(d.getDate()),
    month: MO[d.getMonth()],
    time: `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

type Row = {
  id: string;
  type: "match" | "training";
  title: string;
  opponent: string | null;
  starts_at: string;
  venue: string | null;
  convocations_open: boolean | null;
  score_us: number | null;
  score_them: number | null;
  meet_at: string | null;
  ends_at: string | null;
  address: string | null;
};

function fallback(): AppEvent[] {
  return mockEvents
    .map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      opponent: e.opponent,
      startsAt: e.date,
      weekday: e.weekday,
      day: e.day,
      month: e.month,
      time: e.time,
      venue: e.venue,
      convocationsOpen: false,
      scoreUs: null,
      scoreThem: null,
      meetAt: null,
      endsAt: null,
      address: "",
    }))
    .sort(byDateAsc);
}

export async function fetchEvents(): Promise<AppEvent[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error || !data || data.length === 0) return fallback();
    return (data as Row[])
      .map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        opponent: r.opponent ?? undefined,
        startsAt: r.starts_at,
        venue: r.venue ?? "",
        convocationsOpen: r.convocations_open ?? false,
        scoreUs: r.score_us,
        scoreThem: r.score_them,
        meetAt: r.meet_at,
        endsAt: r.ends_at,
        address: r.address ?? "",
        ...fromDate(r.starts_at),
      }))
      .sort(byDateAsc);
  } catch {
    return fallback();
  }
}

/** Un événement précis (pour la page de détail). */
export async function fetchEvent(id: string): Promise<AppEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const r = data as Row;
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    opponent: r.opponent ?? undefined,
    startsAt: r.starts_at,
    venue: r.venue ?? "",
    convocationsOpen: r.convocations_open ?? false,
    scoreUs: r.score_us,
    scoreThem: r.score_them,
    meetAt: r.meet_at,
    endsAt: r.ends_at,
    address: r.address ?? "",
    ...fromDate(r.starts_at),
  };
}

/* ───────────────── Écriture (réservé coach/admin via RLS) ───────────────── */

export type EventInput = {
  type: "match" | "training";
  title: string;
  opponent?: string | null;
  startsAt: string; // ISO
  venue?: string | null;
  meetAt?: string | null;
  endsAt?: string | null;
  address?: string | null;
};

function toRow(input: EventInput) {
  return {
    type: input.type,
    title: input.title.trim(),
    opponent: input.opponent?.trim() || null,
    starts_at: input.startsAt,
    venue: input.venue?.trim() || null,
    meet_at: input.meetAt ?? null,
    ends_at: input.endsAt ?? null,
    address: input.address?.trim() || null,
  };
}

export async function createEvent(input: EventInput): Promise<{ error?: string }> {
  const { error } = await supabase.from("events").insert(toRow(input));
  return { error: error?.message };
}

/** Création en lot (récurrence : un événement par date). */
export async function createEvents(
  inputs: EventInput[],
): Promise<{ error?: string; count: number }> {
  if (inputs.length === 0) return { count: 0 };
  const { error } = await supabase.from("events").insert(inputs.map(toRow));
  return { error: error?.message, count: inputs.length };
}

/** Ouvre / ferme les convocations d'un événement (action coach). */
export async function setConvocationsOpen(
  id: string,
  open: boolean,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("events")
    .update({ convocations_open: open })
    .eq("id", id);
  return { error: error?.message };
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("events").update(toRow(input)).eq("id", id);
  return { error: error?.message };
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  return { error: error?.message };
}
