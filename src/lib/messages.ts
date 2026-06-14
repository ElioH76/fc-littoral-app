import { supabase } from "@/lib/supabase";

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  eventId: string | null;
};

type Row = {
  id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
  event_id: string | null;
};

function map(r: Row): Message {
  return {
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    body: r.body,
    createdAt: r.created_at,
    eventId: r.event_id ?? null,
  };
}

/**
 * Messages d'un canal : `eventId` null = canal d'équipe global,
 * sinon = forum de l'événement.
 */
export async function fetchMessages(
  eventId: string | null = null,
  limit = 100,
): Promise<Message[]> {
  let q = supabase
    .from("messages")
    .select("id, sender_id, sender_name, body, created_at, event_id");
  q = eventId ? q.eq("event_id", eventId) : q.is("event_id", null);
  const { data, error } = await q
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return (data as Row[]).map(map);
}

/** Envoie un message (canal d'équipe ou forum d'un événement). */
export async function sendMessage(
  senderName: string,
  body: string,
  eventId: string | null = null,
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };
  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    sender_name: senderName,
    body: body.trim(),
    event_id: eventId,
  });
  return { error: error?.message };
}

/** Abonnement temps réel filtré sur le canal voulu. Renvoie le désabonnement. */
export function subscribeMessages(
  onInsert: (m: Message) => void,
  eventId: string | null = null,
): () => void {
  const channel = supabase
    .channel(`messages-${eventId ?? "team"}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const m = map(payload.new as Row);
        if ((m.eventId ?? null) === (eventId ?? null)) onInsert(m);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
