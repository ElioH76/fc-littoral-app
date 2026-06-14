import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/lib/auth";
import {
  fetchMyStats,
  fetchPlayerTable,
  fetchPresenceTable,
  fetchScorers,
  fetchTeamPresence,
  fetchTeamStats,
  type MyStats,
  type PlayerStatRow,
  type PresenceRow,
  type ScorerStat,
  type TeamStats,
} from "@/lib/stats";
import { colors, font, radius } from "@/theme/theme";

type Tab = "me" | "team" | "players" | "presence";

export default function Stats() {
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "admin";

  const [tab, setTab] = useState<Tab>("me");
  const [mine, setMine] = useState<MyStats | null>(null);
  const [scorers, setScorers] = useState<ScorerStat[]>([]);
  const [team, setTeam] = useState<TeamStats | null>(null);
  const [teamPres, setTeamPres] = useState<number | null>(null);
  const [playerTable, setPlayerTable] = useState<PlayerStatRow[]>([]);
  const [presence, setPresence] = useState<PresenceRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchMyStats(profile?.memberId ?? null).then(setMine);
      fetchScorers().then(setScorers);
      fetchTeamStats().then(setTeam);
      fetchPlayerTable().then(setPlayerTable);
      if (isStaff) {
        fetchTeamPresence().then((r) => setTeamPres(r.rate));
        fetchPresenceTable().then(setPresence);
      }
    }, [profile?.memberId, isStaff]),
  );

  const ranked = scorers.filter((p) => p.goals > 0);
  const passers = [...scorers]
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists);
  const topG = ranked[0]?.goals ?? 1;
  const topA = passers[0]?.assists ?? 1;
  const diff = team ? team.goalsFor - team.goalsAgainst : 0;

  const myTiles = [
    { value: String(mine?.goals ?? 0), label: "Buts", accent: true },
    { value: String(mine?.assists ?? 0), label: "Passes déc.", accent: false },
    {
      value: mine?.presenceRate != null ? `${mine.presenceRate}%` : "—",
      label: "Présence",
      accent: false,
    },
  ];

  const segs: { key: Tab; label: string }[] = [
    { key: "me", label: "Moi" },
    { key: "team", label: "Équipe" },
    { key: "players", label: "Joueurs" },
    ...(isStaff ? [{ key: "presence" as Tab, label: "Présence" }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.gris1 }}>
      <ScreenHeader subtitle="Saison 2024/2025" title="Statistiques" />

      <View style={s.seg}>
        {segs.map((sg) => (
          <Pressable
            key={sg.key}
            style={[s.segBtn, tab === sg.key && s.segBtnOn]}
            onPress={() => setTab(sg.key)}
          >
            <Text style={[s.segTxt, tab === sg.key && { color: colors.ink2 }]}>
              {sg.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "me" && (
          <View>
            <Text style={s.sectionTitle}>Mes performances</Text>
            <View style={s.statsRow}>
              {myTiles.map((st) => (
                <View key={st.label} style={s.statCard}>
                  <Text style={[s.statValue, st.accent && { color: colors.or }]}>
                    {st.value}
                  </Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
            {mine && mine.responded === 0 && (
              <Text style={s.hint}>
                Réponds aux convocations pour suivre ton taux de présence.
              </Text>
            )}
            {mine && mine.responded > 0 && (
              <Text style={s.hint}>
                {mine.present} présence{mine.present > 1 ? "s" : ""} sur{" "}
                {mine.responded} convocation{mine.responded > 1 ? "s" : ""}.
              </Text>
            )}
          </View>
        )}

        {tab === "team" && (
          <>
            <View>
              <Text style={s.sectionTitle}>Bilan des matchs</Text>
              <View style={s.card}>
                <View style={s.recordRow}>
                  <Rec value={team?.played ?? 0} label="Joués" />
                  <Rec value={team?.wins ?? 0} label="V" color={colors.greenBright} />
                  <Rec value={team?.draws ?? 0} label="N" color={colors.violetBright} />
                  <Rec value={team?.losses ?? 0} label="D" color={colors.lose} />
                </View>
                <View style={s.line}>
                  <Text style={s.lineTxt}>
                    ⚽ {team?.goalsFor ?? 0} marqués · {team?.goalsAgainst ?? 0}{" "}
                    encaissés ·{" "}
                    <Text style={{ color: diff >= 0 ? colors.greenBright : colors.lose }}>
                      {diff >= 0 ? `+${diff}` : diff}
                    </Text>
                  </Text>
                </View>
                {isStaff && (
                  <View style={[s.line, { borderTopWidth: 1, borderTopColor: colors.gris3 }]}>
                    <Text style={s.lineTxt}>
                      🫱 Présence équipe :{" "}
                      <Text style={{ color: colors.orBright }}>
                        {teamPres != null ? `${teamPres}%` : "—"}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View>
              <Text style={s.sectionTitle}>Meilleurs buteurs</Text>
              <View style={s.card}>
                {ranked.length === 0 ? (
                  <Text style={s.empty}>Aucun but enregistré pour l&apos;instant.</Text>
                ) : (
                  ranked.map((p, i) => (
                    <RankRow
                      key={p.memberId}
                      rank={i + 1}
                      name={p.name}
                      value={p.goals}
                      ratio={p.goals / topG}
                      last={i === ranked.length - 1}
                    />
                  ))
                )}
              </View>
            </View>

            <View>
              <Text style={s.sectionTitle}>Meilleurs passeurs</Text>
              <View style={s.card}>
                {passers.length === 0 ? (
                  <Text style={s.empty}>Aucune passe décisive enregistrée.</Text>
                ) : (
                  passers.map((p, i) => (
                    <RankRow
                      key={p.memberId}
                      rank={i + 1}
                      name={p.name}
                      value={p.assists}
                      ratio={p.assists / topA}
                      last={i === passers.length - 1}
                      color={colors.violetBright}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}

        {tab === "players" && (
          <View>
            <Text style={s.sectionTitle}>Statistiques joueurs</Text>
            <View style={s.card}>
              <View style={s.tHead}>
                <Text style={[s.th, { flex: 1 }]}>Joueur</Text>
                <Text style={[s.th, s.tNum]}>B</Text>
                <Text style={[s.th, s.tNum]}>P</Text>
              </View>
              {playerTable.map((p, i) => (
                <View key={p.memberId} style={[s.tRow, i < playerTable.length - 1 && s.divider]}>
                  <Text style={s.tName} numberOfLines={1}>
                    <Text style={s.tNumInline}>{p.number}  </Text>
                    {p.name}
                  </Text>
                  <Text style={[s.tVal, s.tNum, p.goals > 0 && { color: colors.or }]}>
                    {p.goals}
                  </Text>
                  <Text style={[s.tVal, s.tNum, p.assists > 0 && { color: colors.violetBright }]}>
                    {p.assists}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={s.hint}>B = buts · P = passes décisives</Text>
          </View>
        )}

        {tab === "presence" && (
          <View>
            <Text style={s.sectionTitle}>Bilan des présences</Text>
            <View style={s.card}>
              <View style={s.tHead}>
                <Text style={[s.th, { flex: 1 }]}>Joueur</Text>
                <Text style={[s.th, s.tNum, { color: colors.greenBright }]}>✓</Text>
                <Text style={[s.th, s.tNum, { color: colors.lose }]}>✕</Text>
                <Text style={[s.th, s.tRate]}>%</Text>
              </View>
              {presence.map((p, i) => (
                <View key={p.id} style={[s.tRow, i < presence.length - 1 && s.divider]}>
                  <Text style={s.tName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[s.tVal, s.tNum]}>{p.present}</Text>
                  <Text style={[s.tVal, s.tNum]}>{p.absent}</Text>
                  <Text
                    style={[
                      s.tVal,
                      s.tRate,
                      { color: p.rate == null ? colors.txtDim : p.rate >= 50 ? colors.greenBright : colors.lose },
                    ]}
                  >
                    {p.rate != null ? `${p.rate}%` : "—"}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={s.hint}>
              Présences / absences cumulées sur les convocations.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Rec({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={s.rec}>
      <Text style={[s.recVal, color && { color }]}>{value}</Text>
      <Text style={s.recLabel}>{label}</Text>
    </View>
  );
}

function RankRow({
  rank,
  name,
  value,
  ratio,
  last,
  color = colors.or,
}: {
  rank: number;
  name: string;
  value: number;
  ratio: number;
  last: boolean;
  color?: string;
}) {
  return (
    <View style={[s.scorer, !last && s.divider]}>
      <Text style={s.scorerRank}>{rank}</Text>
      <Text style={s.scorerName} numberOfLines={1}>
        {name}
      </Text>
      <View style={s.barWrap}>
        <View style={[s.bar, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.scorerGoals}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  seg: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.md,
    padding: 4,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: "center" },
  segBtnOn: { backgroundColor: colors.or },
  segTxt: {
    fontFamily: font.cond,
    fontSize: 12,
    color: colors.txtDim,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  sectionTitle: {
    fontFamily: font.condBlack,
    fontSize: 17,
    color: colors.blanc,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 13,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: { fontFamily: font.display, fontSize: 30, color: colors.blanc },
  statLabel: {
    fontSize: 10,
    color: colors.txtDim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 6,
    fontFamily: font.condSemi,
  },
  hint: { fontSize: 12, color: colors.txtDim, fontFamily: font.bodyMed, marginTop: 10 },

  card: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
  },
  recordRow: { flexDirection: "row", paddingVertical: 16 },
  rec: { flex: 1, alignItems: "center" },
  recVal: { fontFamily: font.display, fontSize: 28, color: colors.blanc },
  recLabel: { fontSize: 10, color: colors.txtDim, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4, fontFamily: font.condSemi },
  line: { paddingVertical: 12 },
  lineTxt: { fontFamily: font.bodyMed, fontSize: 13, color: colors.txt, textAlign: "center" },

  empty: { color: colors.txtDim, fontFamily: font.bodyMed, fontSize: 13, paddingVertical: 18, textAlign: "center" },
  scorer: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  divider: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  scorerRank: { width: 18, fontFamily: font.display, fontSize: 14, color: colors.txtDim, textAlign: "center" },
  scorerName: { width: 120, fontFamily: font.condSemi, fontSize: 13, color: colors.txt },
  barWrap: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.gris3, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 4, backgroundColor: colors.or },
  scorerGoals: { width: 24, textAlign: "right", fontFamily: font.display, fontSize: 16, color: colors.blanc },

  // Tableaux (joueurs / présences)
  tHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.gris3,
  },
  th: { fontFamily: font.cond, fontSize: 10, color: colors.txtDim, letterSpacing: 0.8, textTransform: "uppercase" },
  tNum: { width: 36, textAlign: "center" },
  tRate: { width: 48, textAlign: "center" },
  tRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  tName: { flex: 1, fontFamily: font.condSemi, fontSize: 13, color: colors.txt },
  tNumInline: { fontFamily: font.display, fontSize: 12, color: colors.txtDim },
  tVal: { fontFamily: font.display, fontSize: 15, color: colors.blanc },
});
