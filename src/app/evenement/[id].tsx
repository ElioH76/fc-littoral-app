import { useCallback, useState } from "react";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { fetchEvent, isEventDone, type AppEvent } from "@/lib/events";
import { fetchEventGoals, saveMatchResult, type Goal } from "@/lib/matches";
import { fetchMembers, type Member } from "@/lib/members";
import {
  fetchEventAttendance,
  setAttendance,
  setAttendanceFor,
  type Presence,
} from "@/lib/attendance";
import { fetchAccounts, type Account } from "@/lib/coach";
import { Chat } from "@/components/Chat";
import { colors, font, radius } from "@/theme/theme";

type TabKey = "infos" | "presences" | "forum";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function timeOf(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "admin";
  const meId = profile?.id;

  const [tab, setTab] = useState<TabKey>("infos");
  const [event, setEvent] = useState<AppEvent | null | undefined>(undefined);
  const [att, setAtt] = useState<Record<string, Presence>>({});
  const [players, setPlayers] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    fetchEvent(id).then(setEvent);
    fetchEventAttendance(id).then(setAtt);
    fetchAccounts().then((a) => setPlayers(a.filter((x) => x.role === "player")));
    fetchEventGoals(id).then(setGoals);
    if (isStaff) fetchMembers().then(setMembers);
  }, [id, isStaff]);
  useFocusEffect(useCallback(() => load(), [load]));

  if (event === undefined) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.vertLt} />
      </View>
    );
  }
  if (event === null) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <Text style={s.muted}>Événement introuvable.</Text>
      </View>
    );
  }

  const isMatch = event.type === "match";
  const done = isEventDone(event);
  const myStatus = meId ? att[meId] : undefined;
  const hasScore = event.scoreUs != null && event.scoreThem != null;

  const present = players.filter((p) => att[p.id] === "present");
  const absent = players.filter((p) => att[p.id] === "absent");
  const pending = players.filter((p) => !att[p.id]);

  const respond = async (status: Presence) => {
    await setAttendance(id, status);
    load();
  };
  const setFor = async (userId: string, status: Presence) => {
    await setAttendanceFor(id, userId, status);
    load();
  };
  const openMaps = () => {
    const q = encodeURIComponent(event.address || event.venue || "");
    if (!q) return;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${q}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url);
  };

  const meetT = timeOf(event.meetAt);
  const startT = timeOf(event.startsAt);
  const endT = timeOf(event.endsAt);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <Text style={s.headerDate}>
          {event.weekday} {event.day} {event.month}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Titre + ma réponse */}
      <View style={s.titleBlock}>
        <Text style={s.title}>
          {isMatch ? `FC Littoral · ${event.opponent}` : event.title}
        </Text>
        <View style={[s.myPill, statusStyle(myStatus)]}>
          <Text style={[s.myPillTxt, statusTxtStyle(myStatus)]}>
            {myStatus === "present"
              ? "Présent"
              : myStatus === "absent"
                ? "Absent"
                : "En attente"}
          </Text>
        </View>
      </View>

      {/* Onglets */}
      <View style={s.tabs}>
        {(
          [
            ["infos", "Infos"],
            ["presences", "Présences"],
            ["forum", "Forum"],
          ] as const
        ).map(([k, label]) => (
          <Pressable key={k} style={s.tab} onPress={() => setTab(k)}>
            <Text style={[s.tabTxt, tab === k && s.tabTxtOn]}>{label}</Text>
            {tab === k && <View style={s.tabBar} />}
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === "infos" && (
          <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 40 }}>
            {/* Ma réponse */}
            <View style={s.block}>
              <Text style={s.blockTitle}>Ma réponse</Text>
              {done ? (
                <Text style={s.muted}>Événement terminé.</Text>
              ) : !event.convocationsOpen ? (
                <Text style={s.muted}>🔒 Convocations pas encore ouvertes.</Text>
              ) : (
                <View style={s.respRow}>
                  <Pressable
                    style={[s.respBtn, myStatus === "present" ? s.respPresentOn : s.respOff]}
                    onPress={() => respond("present")}
                  >
                    <Text style={[s.respTxt, myStatus === "present" && { color: colors.blanc }]}>
                      ✓ Présent
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.respBtn, myStatus === "absent" ? s.respAbsentOn : s.respOff]}
                    onPress={() => respond("absent")}
                  >
                    <Text style={[s.respTxt, myStatus === "absent" && { color: colors.blanc }]}>
                      ✕ Absent
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Participants */}
            <View style={s.block}>
              <Text style={s.blockTitle}>Participants</Text>
              <View style={s.countsRow}>
                <Counter n={present.length} label="Présents" color={colors.greenBright} />
                <Counter n={pending.length} label="En attente" color={colors.txtDim} />
                <Counter n={absent.length} label="Absents" color={colors.lose} />
              </View>
            </View>

            {/* Rendez-vous */}
            {meetT && (
              <View style={s.block}>
                <Text style={s.blockTitle}>Rendez-vous</Text>
                <Text style={s.rdv}>{meetT}</Text>
              </View>
            )}

            {/* Détails événement */}
            <View style={s.block}>
              <Text style={s.blockTitle}>{isMatch ? "Match" : "Entraînement"}</Text>
              <Text style={s.detailLine}>
                Début à <Text style={s.detailStrong}>{startT}</Text>
                {endT ? (
                  <Text>
                    {"   "}Fin à <Text style={s.detailStrong}>{endT}</Text>
                  </Text>
                ) : null}
              </Text>
              {!!event.venue && <Text style={s.venue}>{event.venue}</Text>}
              {!!event.address && <Text style={s.address}>{event.address}</Text>}
              {(event.address || event.venue) && (
                <Pressable style={s.itinBtn} onPress={openMaps}>
                  <Text style={s.itinTxt}>📍 Itinéraire</Text>
                </Pressable>
              )}
            </View>

            {/* Résultat (match) */}
            {isMatch && (
              <View style={s.block}>
                <Text style={s.blockTitle}>Résultat</Text>
                {hasScore ? (
                  <>
                    <View style={s.scoreRow}>
                      <Text style={s.scoreTeam}>FCL</Text>
                      <Text style={s.score}>
                        {event.scoreUs} – {event.scoreThem}
                      </Text>
                      <Text style={s.scoreTeam} numberOfLines={1}>
                        {(event.opponent ?? "ADV").slice(0, 4).toUpperCase()}
                      </Text>
                    </View>
                    {goals.length > 0 && (
                      <View style={{ marginTop: 12, gap: 6 }}>
                        {goals.map((g, i) => (
                          <Text key={i} style={s.goalLine}>
                            ⚽ {g.scorerName ?? "?"}
                            {g.assistName ? (
                              <Text style={s.assist}>  (passe : {g.assistName})</Text>
                            ) : null}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={s.muted}>
                    {done ? "Résultat non encore saisi." : "Résultat à venir."}
                  </Text>
                )}
                {isStaff && (
                  <Pressable style={s.editResultBtn} onPress={() => setEditing(true)}>
                    <Text style={s.editResultTxt}>
                      {hasScore ? "✏️  Modifier le résultat" : "📊  Saisir le résultat"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {tab === "presences" && (
          <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }}>
            {isStaff && (
              <Text style={s.manageHint}>
                Coach : tape ✓ / ✕ sur un joueur pour gérer sa présence.
              </Text>
            )}
            <PresGroup title="Présents" rows={present} att={att} isStaff={isStaff} onSet={setFor} />
            <PresGroup title="En attente" rows={pending} att={att} isStaff={isStaff} onSet={setFor} />
            <PresGroup title="Absents" rows={absent} att={att} isStaff={isStaff} onSet={setFor} />
          </ScrollView>
        )}

        {tab === "forum" && <Chat eventId={id} bottomInset />}
      </View>

      {isMatch && (
        <ResultModal
          visible={editing}
          event={event}
          initialGoals={goals}
          members={members}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </View>
  );
}

function statusStyle(st?: Presence) {
  if (st === "present") return { backgroundColor: "rgba(43,208,107,0.14)", borderColor: "rgba(43,208,107,0.4)" };
  if (st === "absent") return { backgroundColor: "rgba(224,85,85,0.14)", borderColor: "rgba(224,85,85,0.4)" };
  return { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" };
}
function statusTxtStyle(st?: Presence) {
  if (st === "present") return { color: colors.greenBright };
  if (st === "absent") return { color: colors.lose };
  return { color: colors.txtDim };
}

function Counter({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={s.counter}>
      <Text style={s.counterN}>{n}</Text>
      <Text style={[s.counterLabel, { color }]}>{label}</Text>
    </View>
  );
}

function PresGroup({
  title,
  rows,
  att,
  isStaff,
  onSet,
}: {
  title: string;
  rows: Account[];
  att: Record<string, Presence>;
  isStaff: boolean;
  onSet: (userId: string, status: Presence) => void;
}) {
  return (
    <View>
      <Text style={s.groupTitle}>
        {title} ({rows.length})
      </Text>
      <View style={s.card}>
        {rows.length === 0 ? (
          <Text style={s.empty}>—</Text>
        ) : (
          rows.map((p, i) => {
            const st = att[p.id];
            return (
              <View key={p.id} style={[s.pRow, i < rows.length - 1 && s.divider]}>
                <View style={s.pAvatar}>
                  <Text style={s.pAvatarTxt}>{initialsOf(p.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pName}>{p.name}</Text>
                  {!!p.position && <Text style={s.pPos}>{p.position}</Text>}
                </View>
                {isStaff ? (
                  <View style={s.pCtrl}>
                    <Pressable
                      onPress={() => onSet(p.id, "present")}
                      style={[s.pBtn, st === "present" && s.pBtnPresent]}
                    >
                      <Text style={[s.pBtnTxt, st === "present" && { color: colors.ink2 }]}>✓</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onSet(p.id, "absent")}
                      style={[s.pBtn, st === "absent" && s.pBtnAbsent]}
                    >
                      <Text style={[s.pBtnTxt, st === "absent" && { color: colors.blanc }]}>✕</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text
                    style={[
                      s.pStatus,
                      {
                        color:
                          st === "present"
                            ? colors.greenBright
                            : st === "absent"
                              ? colors.lose
                              : colors.txtDim,
                      },
                    ]}
                  >
                    {st === "present" ? "✓" : st === "absent" ? "✕" : "•"}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

/* ───────────────────────── Modal résultat (match) ───────────────────────── */

function ResultModal({
  visible,
  event,
  initialGoals,
  members,
  onClose,
  onSaved,
}: {
  visible: boolean;
  event: AppEvent;
  initialGoals: Goal[];
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [us, setUs] = useState(String(event.scoreUs ?? ""));
  const [them, setThem] = useState(String(event.scoreThem ?? ""));
  const [goals, setGoals] = useState<{ scorerId: string | null; assistId: string | null }[]>(
    initialGoals.map((g) => ({ scorerId: g.scorerId, assistId: g.assistId })),
  );
  const [pickFor, setPickFor] = useState<{ index: number; field: "scorerId" | "assistId" } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (memberId: string | null) => {
    if (!memberId) return null;
    const m = members.find((x) => x.id === memberId);
    return m ? `${m.firstName} ${m.lastName}` : "?";
  };

  const submit = async () => {
    setError(null);
    const su = parseInt(us, 10);
    const st = parseInt(them, 10);
    if (isNaN(su) || isNaN(st)) return setError("Renseigne le score (chiffres).");
    setBusy(true);
    const { error } = await saveMatchResult(event.id, su, st, goals);
    setBusy(false);
    if (error) setError(error);
    else onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>Résultat du match</Text>
          <View style={s.scoreInputs}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>FC Littoral</Text>
              <TextInput value={us} onChangeText={setUs} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.txtDim} style={[s.input, s.scoreInput]} />
            </View>
            <Text style={s.scoreDash}>–</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel} numberOfLines={1}>{event.opponent ?? "Adversaire"}</Text>
              <TextInput value={them} onChangeText={setThem} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.txtDim} style={[s.input, s.scoreInput]} />
            </View>
          </View>

          <Text style={[s.fieldLabel, { marginTop: 18 }]}>Buteurs & passeurs</Text>
          <ScrollView style={{ maxHeight: 230 }} keyboardShouldPersistTaps="handled">
            {goals.map((g, i) => (
              <View key={i} style={s.goalRow}>
                <Pressable style={s.goalPick} onPress={() => setPickFor({ index: i, field: "scorerId" })}>
                  <Text style={s.goalPickLabel}>⚽ Buteur</Text>
                  <Text style={[s.goalPickVal, !g.scorerId && { color: colors.txtDim }]}>{nameOf(g.scorerId) ?? "Choisir"}</Text>
                </Pressable>
                <Pressable style={s.goalPick} onPress={() => setPickFor({ index: i, field: "assistId" })}>
                  <Text style={s.goalPickLabel}>🅰 Passeur</Text>
                  <Text style={[s.goalPickVal, !g.assistId && { color: colors.txtDim }]}>{nameOf(g.assistId) ?? "Aucun"}</Text>
                </Pressable>
                <Pressable onPress={() => setGoals((arr) => arr.filter((_, j) => j !== i))} hitSlop={8}>
                  <Text style={s.goalRemove}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Pressable style={s.addGoal} onPress={() => setGoals((arr) => [...arr, { scorerId: null, assistId: null }])}>
            <Text style={s.addGoalTxt}>＋ Ajouter un but</Text>
          </Pressable>

          {error && <Text style={s.error}>{error}</Text>}

          <View style={s.modalCta}>
            <Pressable style={[s.mBtn, s.mCancel]} onPress={onClose}>
              <Text style={s.mCancelTxt}>Annuler</Text>
            </Pressable>
            <Pressable style={[s.mBtn, s.mSave, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.ink2} /> : <Text style={s.mSaveTxt}>Enregistrer</Text>}
            </Pressable>
          </View>
        </View>
      </View>

      <Modal visible={pickFor !== null} animationType="fade" transparent>
        <Pressable style={s.pickWrap} onPress={() => setPickFor(null)}>
          <View style={s.pickCard}>
            <Text style={s.modalTitle}>{pickFor?.field === "assistId" ? "Passeur" : "Buteur"}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {pickFor?.field === "assistId" && (
                <Pressable
                  style={s.pickRow}
                  onPress={() => {
                    if (pickFor) setGoals((arr) => arr.map((g, j) => (j === pickFor.index ? { ...g, assistId: null } : g)));
                    setPickFor(null);
                  }}
                >
                  <Text style={s.pickName}>Aucun</Text>
                </Pressable>
              )}
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  style={s.pickRow}
                  onPress={() => {
                    if (pickFor) setGoals((arr) => arr.map((g, j) => (j === pickFor.index ? { ...g, [pickFor.field]: m.id } : g)));
                    setPickFor(null);
                  }}
                >
                  <Text style={s.pickNum}>{m.number}</Text>
                  <Text style={s.pickName}>{m.firstName} {m.lastName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: colors.txtDim, fontFamily: font.bodyMed, fontSize: 13 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: colors.ink2,
  },
  back: { fontFamily: font.condBlack, fontSize: 26, color: colors.or },
  headerDate: { fontFamily: font.condBlack, fontSize: 16, color: colors.blanc, textTransform: "uppercase" },

  titleBlock: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.ink2,
    gap: 10,
  },
  title: { fontFamily: font.condBlack, fontSize: 22, color: colors.blanc, textTransform: "uppercase" },
  myPill: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 5 },
  myPillTxt: { fontFamily: font.cond, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" },

  tabs: { flexDirection: "row", backgroundColor: colors.ink2, borderBottomWidth: 1, borderBottomColor: colors.gris3 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 13 },
  tabTxt: { fontFamily: font.cond, fontSize: 12, color: colors.txtDim, letterSpacing: 0.6, textTransform: "uppercase" },
  tabTxtOn: { color: colors.blanc },
  tabBar: { position: "absolute", bottom: 0, height: 2, width: "60%", backgroundColor: colors.or },

  block: { backgroundColor: colors.gris2, borderWidth: 1, borderColor: colors.gris3, borderRadius: radius.xl, padding: 16 },
  blockTitle: { fontFamily: font.condBlack, fontSize: 12, color: colors.txtDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 },

  respRow: { flexDirection: "row", gap: 10 },
  respBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
  respOff: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  respPresentOn: { backgroundColor: colors.vertLt },
  respAbsentOn: { backgroundColor: colors.lose },
  respTxt: { fontFamily: font.cond, fontSize: 14, color: colors.txtDim, letterSpacing: 0.4, textTransform: "uppercase" },

  countsRow: { flexDirection: "row" },
  counter: { flex: 1, alignItems: "center" },
  counterN: { fontFamily: font.display, fontSize: 30, color: colors.blanc },
  counterLabel: { fontFamily: font.condSemi, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 4 },

  rdv: { fontFamily: font.display, fontSize: 28, color: colors.greenBright },
  detailLine: { fontFamily: font.bodyMed, fontSize: 14, color: colors.txt },
  detailStrong: { fontFamily: font.cond, color: colors.blanc },
  venue: { fontFamily: font.condSemi, fontSize: 15, color: colors.blanc, marginTop: 12 },
  address: { fontFamily: font.bodyMed, fontSize: 13, color: colors.txtDim, marginTop: 3 },
  itinBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  itinTxt: { fontFamily: font.cond, fontSize: 13, color: colors.or, letterSpacing: 0.4, textTransform: "uppercase" },

  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  scoreTeam: { fontFamily: font.cond, fontSize: 15, color: colors.txt, width: 60, textAlign: "center" },
  score: { fontFamily: font.display, fontSize: 40, color: colors.orBright },
  goalLine: { fontFamily: font.bodyMed, fontSize: 14, color: colors.txt },
  assist: { color: colors.txtDim, fontSize: 13 },
  editResultBtn: { marginTop: 14, backgroundColor: colors.or, borderRadius: radius.md, paddingVertical: 11, alignItems: "center" },
  editResultTxt: { fontFamily: font.cond, fontSize: 13, color: colors.ink2, letterSpacing: 0.4, textTransform: "uppercase" },

  manageHint: { fontFamily: font.bodyMed, fontSize: 12, color: colors.txtDim, textAlign: "center" },
  groupTitle: { fontFamily: font.condBlack, fontSize: 13, color: colors.blanc, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 },
  card: { backgroundColor: colors.gris2, borderWidth: 1, borderColor: colors.gris3, borderRadius: radius.xl, paddingHorizontal: 14 },
  empty: { color: colors.txtDim, fontFamily: font.bodyMed, fontSize: 13, paddingVertical: 14, textAlign: "center" },
  pRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  divider: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  pAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.gris3, alignItems: "center", justifyContent: "center" },
  pAvatarTxt: { fontFamily: font.condBlack, fontSize: 13, color: colors.txt },
  pName: { fontFamily: font.condSemi, fontSize: 14, color: colors.blanc },
  pPos: { fontFamily: font.bodyMed, fontSize: 12, color: colors.txtDim, marginTop: 1 },
  pStatus: { fontFamily: font.condBlack, fontSize: 16, width: 24, textAlign: "center" },
  pCtrl: { flexDirection: "row", gap: 6 },
  pBtn: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  pBtnPresent: { backgroundColor: colors.vertLt, borderColor: colors.vertLt },
  pBtnAbsent: { backgroundColor: colors.lose, borderColor: colors.lose },
  pBtnTxt: { fontFamily: font.condBlack, fontSize: 14, color: colors.txtDim },

  // Modal résultat
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.ink2, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: colors.gris3, padding: 22, paddingBottom: 34 },
  modalTitle: { fontFamily: font.condBlack, fontSize: 20, color: colors.blanc, textTransform: "uppercase", marginBottom: 6 },
  scoreInputs: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 14, marginTop: 12 },
  scoreInput: { textAlign: "center", fontFamily: font.display, fontSize: 22 },
  scoreDash: { fontFamily: font.display, fontSize: 26, color: colors.txtDim, marginBottom: 10 },
  fieldLabel: { fontFamily: font.condSemi, fontSize: 10, color: colors.txtDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  input: { backgroundColor: colors.gris2, borderWidth: 1, borderColor: colors.gris3, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.bodyMed, fontSize: 15, color: colors.txt },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  goalPick: { flex: 1, backgroundColor: colors.gris2, borderWidth: 1, borderColor: colors.gris3, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  goalPickLabel: { fontFamily: font.condSemi, fontSize: 9, color: colors.txtDim, textTransform: "uppercase", letterSpacing: 0.6 },
  goalPickVal: { fontFamily: font.bodyMed, fontSize: 13, color: colors.txt, marginTop: 2 },
  goalRemove: { color: colors.lose, fontFamily: font.condBlack, fontSize: 16, paddingHorizontal: 4 },
  addGoal: { marginTop: 12, borderRadius: radius.md, paddingVertical: 10, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  addGoalTxt: { fontFamily: font.cond, fontSize: 13, color: colors.txt, letterSpacing: 0.4, textTransform: "uppercase" },
  error: { color: colors.lose, fontFamily: font.bodyMed, fontSize: 13, marginTop: 12 },
  modalCta: { flexDirection: "row", gap: 10, marginTop: 18 },
  mBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  mCancel: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  mCancelTxt: { fontFamily: font.cond, fontSize: 14, color: colors.txt, letterSpacing: 0.4, textTransform: "uppercase" },
  mSave: { backgroundColor: colors.or },
  mSaveTxt: { fontFamily: font.cond, fontSize: 14, color: colors.ink2, letterSpacing: 0.4, textTransform: "uppercase" },
  pickWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 28 },
  pickCard: { backgroundColor: colors.ink2, borderRadius: 20, borderWidth: 1, borderColor: colors.gris3, padding: 18 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  pickNum: { width: 26, textAlign: "center", fontFamily: font.display, fontSize: 14, color: colors.or },
  pickName: { fontFamily: font.condSemi, fontSize: 15, color: colors.txt },
});
