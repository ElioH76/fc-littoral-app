import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";

import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchEvents, isEventDone, type AppEvent } from "@/lib/events";
import {
  fetchMyAttendance,
  setAttendance,
  type Presence,
} from "@/lib/attendance";
import { colors, font, radius } from "@/theme/theme";

export default function Calendrier() {
  const [events, setEvents] = useState<AppEvent[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Presence>>({});
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);
  const didScroll = useRef(false);
  const firstUpcomingY = useRef<number | null>(null);

  // Index du premier événement NON terminé (triés du + ancien au + récent).
  const firstUpcomingIndex = useMemo(
    () => (events ? events.findIndex((e) => !isEventDone(e)) : -1),
    [events],
  );

  const load = useCallback(() => {
    Promise.all([fetchEvents(), fetchMyAttendance()]).then(([ev, att]) => {
      setEvents(ev);
      setStatuses(att);
    });
  }, []);

  // À chaque fois que l'onglet reprend le focus : on RECHARGE (ex. convocations
  // ouvertes par le coach) + on recentre sur le premier événement à venir.
  useFocusEffect(
    useCallback(() => {
      didScroll.current = false;
      load();
      if (firstUpcomingY.current != null) {
        scrollRef.current?.scrollTo({ y: firstUpcomingY.current, animated: false });
      }
    }, [load]),
  );

  const respond = async (eventId: string, status: Presence) => {
    const previous = statuses[eventId];
    setStatuses((m) => ({ ...m, [eventId]: status })); // optimiste
    const ok = await setAttendance(eventId, status);
    if (!ok) {
      setStatuses((m) => {
        const next = { ...m };
        if (previous) next[eventId] = previous;
        else delete next[eventId];
        return next;
      });
    }
  };

  // Place la vue sur le premier événement à venir dès qu'il est mesuré.
  const onCardLayout = (index: number, e: LayoutChangeEvent) => {
    if (index !== firstUpcomingIndex) return;
    const y = Math.max(e.nativeEvent.layout.y - 12, 0);
    firstUpcomingY.current = y;
    if (didScroll.current) return;
    didScroll.current = true;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y, animated: false }),
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.gris1 }}>
      <ScreenHeader subtitle="Saison 2024/2025" title="Calendrier" />
      {events === null ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.vertLt} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Si tout est terminé, on montre le plus récent (en bas).
            if (!didScroll.current && firstUpcomingIndex === -1 && events.length) {
              didScroll.current = true;
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
          {events.map((e, i) => (
            <EventCard
              key={e.id}
              event={e}
              done={isEventDone(e)}
              status={statuses[e.id]}
              onRespond={respond}
              onOpen={() => router.push(`/evenement/${e.id}` as Href)}
              onLayout={(ev) => onCardLayout(i, ev)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EventCard({
  event,
  done,
  status,
  onRespond,
  onOpen,
  onLayout,
}: {
  event: AppEvent;
  done: boolean;
  status?: Presence;
  onRespond: (id: string, status: Presence) => void;
  onOpen: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const isMatch = event.type === "match";
  return (
    <View style={[s.card, done && s.cardDone]} onLayout={onLayout}>
      <Pressable style={s.row} onPress={onOpen}>
        <View style={[s.dateBlock, isMatch ? s.dateMatch : s.dateTraining]}>
          <Text style={s.weekday}>{event.weekday}</Text>
          <Text style={s.day}>{event.day}</Text>
          <Text style={s.month}>{event.month}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.tagRow}>
            <View style={[s.tag, isMatch ? s.tagMatch : s.tagTraining]}>
              <Text style={[s.tagTxt, { color: isMatch ? colors.or : colors.vertLt }]}>
                {isMatch ? "MATCH" : "ENTRAÎNEMENT"}
              </Text>
            </View>
            {done && (
              <View style={s.doneBadge}>
                <Text style={s.doneBadgeTxt}>TERMINÉ</Text>
              </View>
            )}
          </View>
          <Text style={s.title}>
            {isMatch ? `FC Littoral · ${event.opponent}` : event.title}
          </Text>
          <Text style={s.meta}>
            🕐 {event.time}   📍 {event.venue}
          </Text>
        </View>
      </Pressable>

      {done ? (
        <View style={s.doneFooter}>
          <Text style={s.doneFooterTxt}>● Terminé</Text>
          {status && (
            <Text style={s.doneFooterSub}>
              · Tu étais {status === "present" ? "présent" : "absent"}
            </Text>
          )}
        </View>
      ) : !event.convocationsOpen ? (
        <View style={s.pendingFooter}>
          <Text style={s.pendingTxt}>🔒 Convocations pas encore ouvertes</Text>
        </View>
      ) : (
        <View style={s.cta}>
          <Pressable
            onPress={() => onRespond(event.id, "present")}
            style={[s.btn, status === "present" ? s.presentOn : s.btnOff]}
          >
            <Text style={[s.btnTxt, status === "present" && { color: colors.blanc }]}>
              ✓ Présent
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onRespond(event.id, "absent")}
            style={[s.btn, status === "absent" ? s.absentOn : s.btnOff]}
          >
            <Text style={[s.btnTxt, status === "absent" && { color: colors.blanc }]}>
              ✕ Absent
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
  },
  cardDone: { opacity: 0.62 },
  row: { flexDirection: "row", gap: 14, alignItems: "center" },
  dateBlock: { width: 60, borderRadius: radius.md, paddingVertical: 8, alignItems: "center" },
  dateMatch: { backgroundColor: "rgba(201,162,39,0.12)", borderWidth: 1, borderColor: "rgba(201,162,39,0.3)" },
  dateTraining: { backgroundColor: "rgba(22,146,63,0.15)", borderWidth: 1, borderColor: "rgba(22,146,63,0.4)" },
  weekday: { fontFamily: font.condSemi, fontSize: 10, color: colors.txtDim, letterSpacing: 0.6 },
  day: { fontFamily: font.display, fontSize: 24, color: colors.blanc, lineHeight: 26 },
  month: { fontFamily: font.condSemi, fontSize: 9, color: colors.txtDim, letterSpacing: 0.6 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagMatch: { backgroundColor: "rgba(201,162,39,0.12)" },
  tagTraining: { backgroundColor: "rgba(22,146,63,0.18)" },
  tagTxt: { fontFamily: font.cond, fontSize: 9, letterSpacing: 0.8 },
  doneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  doneBadgeTxt: { fontFamily: font.cond, fontSize: 9, letterSpacing: 0.8, color: colors.txtDim },
  title: { fontFamily: font.cond, fontSize: 16, color: colors.blanc },
  meta: { fontSize: 11, color: colors.txtDim, marginTop: 3 },
  cta: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 9, alignItems: "center" },
  btnOff: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  presentOn: { backgroundColor: colors.vertLt },
  absentOn: { backgroundColor: colors.lose },
  btnTxt: { fontFamily: font.cond, fontSize: 13, color: colors.txtDim, letterSpacing: 0.4 },
  doneFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  doneFooterTxt: { fontFamily: font.cond, fontSize: 12, color: colors.txtDim, letterSpacing: 0.4, textTransform: "uppercase" },
  doneFooterSub: { fontFamily: font.bodyMed, fontSize: 12, color: colors.txtDim },
  pendingFooter: {
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  pendingTxt: { fontFamily: font.condSemi, fontSize: 12, color: colors.txtDim, letterSpacing: 0.3 },
});
