import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/lib/auth";
import {
  createEvent,
  createEvents,
  deleteEvent,
  fetchEvents,
  isEventDone,
  setConvocationsOpen,
  updateEvent,
  type AppEvent,
  type EventInput,
} from "@/lib/events";
import { fetchAllAttendance } from "@/lib/attendance";
import { fetchPlayers, type PlayerAccount } from "@/lib/coach";
import { colors, font, radius } from "@/theme/theme";

type AttMap = Record<string, Record<string, "present" | "absent">>;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDate(d: Date) {
  return `${JOURS[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function defaultWhen() {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  return d;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
function trainingTitle(d: Date) {
  return `Entraînement du ${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

// Jours pour la récurrence (dow = valeur de Date.getDay()).
const DOW = [
  { label: "Lu", dow: 1 },
  { label: "Ma", dow: 2 },
  { label: "Me", dow: 3 },
  { label: "Je", dow: 4 },
  { label: "Ve", dow: 5 },
  { label: "Sa", dow: 6 },
  { label: "Di", dow: 0 },
];

export default function Coach() {
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "admin";
  const router = useRouter();

  const [events, setEvents] = useState<AppEvent[] | null>(null);
  const [players, setPlayers] = useState<PlayerAccount[]>([]);
  const [att, setAtt] = useState<AttMap>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppEvent | null>(null);

  const load = useCallback(() => {
    Promise.all([fetchEvents(), fetchPlayers(), fetchAllAttendance()]).then(
      ([ev, pl, at]) => {
        setEvents(ev);
        setPlayers(pl);
        setAtt(at);
      },
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isStaff) load();
    }, [isStaff, load]),
  );

  if (!isStaff) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.gris1 }}>
        <ScreenHeader subtitle="Accès" title="Espace Coach" />
        <View style={s.center}>
          <Text style={s.muted}>Réservé aux coachs et à l&apos;administration.</Text>
        </View>
      </View>
    );
  }

  const onDelete = (ev: AppEvent) => {
    Alert.alert("Supprimer l'événement", `« ${ev.title} » sera supprimé.`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteEvent(ev.id);
          if (error) Alert.alert("Erreur", error);
          else load();
        },
      },
    ]);
  };

  const onToggleConv = async (ev: AppEvent) => {
    const { error } = await setConvocationsOpen(ev.id, !ev.convocationsOpen);
    if (error) Alert.alert("Erreur", error);
    else load();
  };

  const upcoming = events?.filter((e) => !isEventDone(e)) ?? [];
  const past = (events?.filter((e) => isEventDone(e)) ?? []).reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.gris1 }}>
      <ScreenHeader subtitle="Gestion de l'équipe" title="Espace Coach" />

      {events === null ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.vertLt} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={s.newBtn}
            onPress={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Text style={s.newBtnTxt}>＋  Nouvel événement</Text>
          </Pressable>

          <Pressable
            style={s.membersBtn}
            onPress={() => router.push("/membres" as Href)}
          >
            <Text style={s.membersBtnTxt}>👥  Gérer les membres & rôles</Text>
          </Pressable>

          {upcoming.length > 0 && <Text style={s.sectionLabel}>À venir</Text>}
          {upcoming.map((e) => (
            <CoachCard
              key={e.id}
              event={e}
              players={players}
              att={att[e.id] ?? {}}
              onOpen={() => router.push(`/evenement/${e.id}` as Href)}
              onToggleConv={() => onToggleConv(e)}
              onEdit={() => {
                setEditing(e);
                setFormOpen(true);
              }}
              onDelete={() => onDelete(e)}
            />
          ))}

          {past.length > 0 && <Text style={s.sectionLabel}>Terminés</Text>}
          {past.map((e) => (
            <CoachCard
              key={e.id}
              event={e}
              players={players}
              att={att[e.id] ?? {}}
              onOpen={() => router.push(`/evenement/${e.id}` as Href)}
              onToggleConv={() => onToggleConv(e)}
              done
              onEdit={() => {
                setEditing(e);
                setFormOpen(true);
              }}
              onDelete={() => onDelete(e)}
            />
          ))}
        </ScrollView>
      )}

      <EventFormModal
        key={(formOpen ? "open-" : "closed-") + (editing?.id ?? "new")}
        visible={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </View>
  );
}

function CoachCard({
  event,
  players,
  att,
  done,
  onEdit,
  onDelete,
  onOpen,
  onToggleConv,
}: {
  event: AppEvent;
  players: PlayerAccount[];
  att: Record<string, "present" | "absent">;
  done?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onToggleConv: () => void;
}) {
  const isMatch = event.type === "match";

  const present = players.filter((p) => att[p.id] === "present");
  const absent = players.filter((p) => att[p.id] === "absent");
  const pending = players.filter((p) => !att[p.id]);

  return (
    <View style={[s.card, done && { opacity: 0.7 }]}>
      <Pressable style={s.cardTop} onPress={onOpen}>
        <View style={[s.dateBlock, isMatch ? s.dateMatch : s.dateTraining]}>
          <Text style={s.weekday}>{event.weekday}</Text>
          <Text style={s.day}>{event.day}</Text>
          <Text style={s.month}>{event.month}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[s.tag, isMatch ? s.tagMatch : s.tagTraining]}>
            <Text style={[s.tagTxt, { color: isMatch ? colors.or : colors.vertLt }]}>
              {isMatch ? "MATCH" : "ENTRAÎNEMENT"}
            </Text>
          </View>
          <Text style={s.title}>
            {isMatch ? `FC Littoral · ${event.opponent}` : event.title}
          </Text>
          <Text style={s.meta}>
            🕐 {event.time}   📍 {event.venue}
          </Text>
          {/* Compteurs de présences */}
          <View style={s.counts}>
            <Count n={present.length} color={colors.greenBright} label="✓" />
            <Count n={absent.length} color={colors.lose} label="✕" />
            <Count n={pending.length} color={colors.txtDim} label="?" />
          </View>
        </View>
      </Pressable>

      <Pressable
        style={[
          s.convBtn,
          event.convocationsOpen ? s.convBtnOpen : s.convBtnClosed,
        ]}
        onPress={onToggleConv}
      >
        <Text
          style={[
            s.convBtnTxt,
            { color: event.convocationsOpen ? colors.txt : colors.ink2 },
          ]}
        >
          {event.convocationsOpen
            ? "✓ Convocations ouvertes · clôturer"
            : "📣 Lancer les convocations"}
        </Text>
      </Pressable>

      <View style={s.actions}>
        <Pressable style={s.actionBtn} onPress={onEdit}>
          <Text style={s.actionTxt}>✏️  Éditer</Text>
        </Pressable>
        <Pressable style={s.actionBtn} onPress={onDelete}>
          <Text style={[s.actionTxt, { color: colors.lose }]}>🗑  Supprimer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Count({ n, color, label }: { n: number; color: string; label: string }) {
  return (
    <View style={s.count}>
      <Text style={[s.countLabel, { color }]}>{label}</Text>
      <Text style={s.countN}>{n}</Text>
    </View>
  );
}

function EventFormModal({
  visible,
  editing,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing: AppEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"match" | "training">(editing?.type ?? "training");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [opponent, setOpponent] = useState(editing?.opponent ?? "");
  const [when, setWhen] = useState<Date>(
    editing ? new Date(editing.startsAt) : defaultWhen(),
  );
  const [venue, setVenue] = useState(editing?.venue ?? "Stade François Maillot");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [meet, setMeet] = useState<Date | null>(
    editing?.meetAt ? new Date(editing.meetAt) : null,
  );
  const [endT, setEndT] = useState<Date | null>(
    editing?.endsAt ? new Date(editing.endsAt) : null,
  );
  const [recurring, setRecurring] = useState(false);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set());
  const [until, setUntil] = useState<Date | null>(null);
  const [picker, setPicker] = useState<
    null | "date" | "time" | "until" | "meet" | "end"
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (_e: unknown, sel?: Date) => {
    if (Platform.OS !== "ios") setPicker(null);
    if (!sel) return;
    if (picker === "until") {
      setUntil(sel);
    } else if (picker === "time") {
      const n = new Date(when);
      n.setHours(sel.getHours(), sel.getMinutes(), 0, 0);
      setWhen(n);
    } else if (picker === "date") {
      const n = new Date(when);
      n.setFullYear(sel.getFullYear(), sel.getMonth(), sel.getDate());
      setWhen(n);
    } else if (picker === "meet") {
      const n = new Date(when);
      n.setHours(sel.getHours(), sel.getMinutes(), 0, 0);
      setMeet(n);
    } else if (picker === "end") {
      const n = new Date(when);
      n.setHours(sel.getHours(), sel.getMinutes(), 0, 0);
      setEndT(n);
    }
  };

  const toggleDow = (dow: number) =>
    setWeekdays((s) => {
      const n = new Set(s);
      if (n.has(dow)) n.delete(dow);
      else n.add(dow);
      return n;
    });

  // Titre effectif d'une occurrence (auto pour les entraînements sans titre).
  const resolveTitle = (d: Date) =>
    type === "match"
      ? title.trim() || `Match · ${opponent.trim()}`
      : title.trim() || trainingTitle(d);

  const submit = async () => {
    setError(null);
    if (type === "match" && !opponent.trim()) return setError("Indique l'adversaire.");

    const withTime = (base: Date, t: Date | null): string | null => {
      if (!t) return null;
      const n = new Date(base);
      n.setHours(t.getHours(), t.getMinutes(), 0, 0);
      return n.toISOString();
    };

    setBusy(true);

    // Récurrence : un événement par date correspondante (création seulement).
    if (!editing && recurring) {
      if (weekdays.size === 0) {
        setBusy(false);
        return setError("Choisis au moins un jour de répétition.");
      }
      if (!until) {
        setBusy(false);
        return setError("Choisis une date de fin.");
      }
      const end = new Date(until);
      end.setHours(23, 59, 59, 0);
      if (end < when) {
        setBusy(false);
        return setError("La date de fin doit être après le début.");
      }
      const dates: Date[] = [];
      const d = new Date(when);
      while (d <= end && dates.length < 120) {
        if (weekdays.has(d.getDay())) dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      if (dates.length === 0) {
        setBusy(false);
        return setError("Aucune date ne correspond aux jours choisis.");
      }
      const inputs: EventInput[] = dates.map((dd) => ({
        type,
        title: resolveTitle(dd),
        opponent: type === "match" ? opponent : null,
        startsAt: dd.toISOString(),
        venue,
        meetAt: withTime(dd, meet),
        endsAt: withTime(dd, endT),
        address,
      }));
      const { error } = await createEvents(inputs);
      setBusy(false);
      if (error) setError(error);
      else onSaved();
      return;
    }

    // Événement unique (création ou édition).
    const input: EventInput = {
      type,
      title: resolveTitle(when),
      opponent: type === "match" ? opponent : null,
      startsAt: when.toISOString(),
      venue,
      meetAt: withTime(when, meet),
      endsAt: withTime(when, endT),
      address,
    };
    const { error } = editing
      ? await updateEvent(editing.id, input)
      : await createEvent(input);
    setBusy(false);
    if (error) setError(error);
    else onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>
            {editing ? "Modifier l'événement" : "Nouvel événement"}
          </Text>

          {/* Type */}
          <View style={s.typeRow}>
            {(["training", "match"] as const).map((t) => (
              <Pressable
                key={t}
                style={[s.typeBtn, type === t && s.typeBtnOn]}
                onPress={() => setType(t)}
              >
                <Text style={[s.typeTxt, type === t && { color: colors.ink2 }]}>
                  {t === "training" ? "Entraînement" : "Match"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label={type === "match" ? "Titre (optionnel)" : "Titre (auto si vide)"}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={type === "match" ? "Championnat · J13" : "Entraînement"}
              placeholderTextColor={colors.txtDim}
              style={s.input}
            />
          </Field>

          {type === "match" && (
            <Field label="Adversaire">
              <TextInput
                value={opponent}
                onChangeText={setOpponent}
                placeholder="Olympique Vallée"
                placeholderTextColor={colors.txtDim}
                style={s.input}
              />
            </Field>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Field label={recurring ? "Début" : "Date"} style={{ flex: 1 }}>
              <Pressable style={s.input} onPress={() => setPicker("date")}>
                <Text style={s.pickerTxt}>{fmtDate(when)}</Text>
              </Pressable>
            </Field>
            <Field label="Heure" style={{ width: 110 }}>
              <Pressable style={s.input} onPress={() => setPicker("time")}>
                <Text style={s.pickerTxt}>{fmtTime(when)}</Text>
              </Pressable>
            </Field>
          </View>

          {/* Récurrence (création uniquement) */}
          {!editing && (
            <View style={{ marginTop: 14 }}>
              <Pressable style={s.recToggle} onPress={() => setRecurring((v) => !v)}>
                <View style={[s.checkbox, recurring && s.checkboxOn]}>
                  {recurring && <Text style={s.checkTxt}>✓</Text>}
                </View>
                <Text style={s.recLabel}>Répéter (récurrence)</Text>
              </Pressable>
              {recurring && (
                <View style={{ marginTop: 12, gap: 10 }}>
                  <Text style={s.fieldLabel}>Jours de répétition</Text>
                  <View style={s.dowRow}>
                    {DOW.map((d) => {
                      const on = weekdays.has(d.dow);
                      return (
                        <Pressable
                          key={d.dow}
                          style={[s.dowBtn, on && s.dowOn]}
                          onPress={() => toggleDow(d.dow)}
                        >
                          <Text style={[s.dowTxt, on && { color: colors.ink2 }]}>
                            {d.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Field label="Jusqu'au">
                    <Pressable style={s.input} onPress={() => setPicker("until")}>
                      <Text style={[s.pickerTxt, !until && { color: colors.txtDim }]}>
                        {until ? fmtDate(until) : "Choisir une date"}
                      </Text>
                    </Pressable>
                  </Field>
                </View>
              )}
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Field label="Rendez-vous" style={{ flex: 1 }}>
              <Pressable style={s.input} onPress={() => setPicker("meet")}>
                <Text style={[s.pickerTxt, !meet && { color: colors.txtDim }]}>
                  {meet ? fmtTime(meet) : "— optionnel"}
                </Text>
              </Pressable>
            </Field>
            <Field label="Fin" style={{ flex: 1 }}>
              <Pressable style={s.input} onPress={() => setPicker("end")}>
                <Text style={[s.pickerTxt, !endT && { color: colors.txtDim }]}>
                  {endT ? fmtTime(endT) : "— optionnel"}
                </Text>
              </Pressable>
            </Field>
          </View>

          <Field label="Lieu">
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder="Stade François Maillot"
              placeholderTextColor={colors.txtDim}
              style={s.input}
            />
          </Field>

          <Field label="Adresse (optionnel)">
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="165 Rue de Saint-Gilles, 76280 Heuqueville"
              placeholderTextColor={colors.txtDim}
              style={s.input}
            />
          </Field>

          {error && <Text style={s.error}>{error}</Text>}

          <View style={s.modalCta}>
            <Pressable style={[s.mBtn, s.mCancel]} onPress={onClose}>
              <Text style={s.mCancelTxt}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[s.mBtn, s.mSave, busy && { opacity: 0.6 }]}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.ink2} />
              ) : (
                <Text style={s.mSaveTxt}>{editing ? "Enregistrer" : "Créer"}</Text>
              )}
            </Pressable>
          </View>

          {picker && (
            <DateTimePicker
              value={
                picker === "until"
                  ? until ?? when
                  : picker === "meet"
                    ? meet ?? when
                    : picker === "end"
                      ? endT ?? when
                      : when
              }
              mode={
                picker === "time" || picker === "meet" || picker === "end"
                  ? "time"
                  : "date"
              }
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onPick}
              themeVariant="dark"
            />
          )}
          {picker && Platform.OS === "ios" && (
            <Pressable
              style={[s.mBtn, s.mSave, { marginTop: 8 }]}
              onPress={() => setPicker(null)}
            >
              <Text style={s.mSaveTxt}>OK</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ marginTop: 12 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: colors.txtDim, fontFamily: font.bodyMed, textAlign: "center" },

  newBtn: {
    backgroundColor: colors.or,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  newBtnTxt: { fontFamily: font.cond, fontSize: 15, color: colors.ink2, letterSpacing: 0.4, textTransform: "uppercase" },
  membersBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: "center",
  },
  membersBtnTxt: { fontFamily: font.cond, fontSize: 14, color: colors.txt, letterSpacing: 0.4, textTransform: "uppercase" },

  sectionLabel: {
    fontFamily: font.condBlack,
    fontSize: 13,
    color: colors.txtDim,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 6,
  },

  card: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.xl,
    padding: 14,
  },
  cardTop: { flexDirection: "row", gap: 14, alignItems: "center" },
  dateBlock: { width: 60, borderRadius: radius.md, paddingVertical: 8, alignItems: "center" },
  dateMatch: { backgroundColor: "rgba(201,162,39,0.12)", borderWidth: 1, borderColor: "rgba(201,162,39,0.3)" },
  dateTraining: { backgroundColor: "rgba(22,146,63,0.15)", borderWidth: 1, borderColor: "rgba(22,146,63,0.4)" },
  weekday: { fontFamily: font.condSemi, fontSize: 10, color: colors.txtDim, letterSpacing: 0.6 },
  day: { fontFamily: font.display, fontSize: 24, color: colors.blanc, lineHeight: 26 },
  month: { fontFamily: font.condSemi, fontSize: 9, color: colors.txtDim, letterSpacing: 0.6 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  tagMatch: { backgroundColor: "rgba(201,162,39,0.12)" },
  tagTraining: { backgroundColor: "rgba(22,146,63,0.18)" },
  tagTxt: { fontFamily: font.cond, fontSize: 9, letterSpacing: 0.8 },
  title: { fontFamily: font.cond, fontSize: 16, color: colors.blanc },
  meta: { fontSize: 11, color: colors.txtDim, marginTop: 3 },

  counts: { flexDirection: "row", gap: 14, marginTop: 8 },
  count: { flexDirection: "row", alignItems: "center", gap: 4 },
  countLabel: { fontFamily: font.condBlack, fontSize: 13 },
  countN: { fontFamily: font.display, fontSize: 15, color: colors.blanc },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gris3,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.md,
    paddingVertical: 9,
    alignItems: "center",
  },
  actionTxt: { fontFamily: font.cond, fontSize: 12, color: colors.txt, letterSpacing: 0.4 },

  convBtn: {
    marginTop: 12,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  convBtnClosed: { backgroundColor: colors.or },
  convBtnOpen: {
    backgroundColor: "rgba(43,208,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(43,208,107,0.4)",
  },
  convBtnTxt: { fontFamily: font.cond, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" },

  recToggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.gris4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.or, borderColor: colors.or },
  checkTxt: { color: colors.ink2, fontFamily: font.condBlack, fontSize: 13 },
  recLabel: { fontFamily: font.condSemi, fontSize: 14, color: colors.txt },
  dowRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dowBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dowOn: { backgroundColor: colors.or, borderColor: colors.or },
  dowTxt: { fontFamily: font.cond, fontSize: 13, color: colors.txtDim },

  // Modal
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.ink2,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.gris3,
    padding: 22,
    paddingBottom: 34,
  },
  modalTitle: { fontFamily: font.condBlack, fontSize: 20, color: colors.blanc, textTransform: "uppercase", marginBottom: 6 },
  typeRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  typeBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeBtnOn: { backgroundColor: colors.or, borderColor: colors.or },
  typeTxt: { fontFamily: font.cond, fontSize: 13, color: colors.txtDim, letterSpacing: 0.4, textTransform: "uppercase" },
  fieldLabel: {
    fontFamily: font.condSemi,
    fontSize: 10,
    color: colors.txtDim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.bodyMed,
    fontSize: 15,
    color: colors.txt,
  },
  pickerTxt: { fontFamily: font.bodyMed, fontSize: 15, color: colors.txt },
  error: { color: colors.lose, fontFamily: font.bodyMed, fontSize: 13, marginTop: 12 },
  modalCta: { flexDirection: "row", gap: 10, marginTop: 20 },
  mBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: "center" },
  mCancel: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  mCancelTxt: { fontFamily: font.cond, fontSize: 14, color: colors.txt, letterSpacing: 0.4, textTransform: "uppercase" },
  mSave: { backgroundColor: colors.or },
  mSaveTxt: { fontFamily: font.cond, fontSize: 14, color: colors.ink2, letterSpacing: 0.4, textTransform: "uppercase" },
});
