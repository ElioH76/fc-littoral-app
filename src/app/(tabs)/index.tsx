import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  convocation,
  me,
  news,
  nextMatch,
  results,
  standings as mockStandings,
} from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { fetchStandings, type FffStanding } from "@/lib/fff";
import { fetchMyStats, type MyStats } from "@/lib/stats";
import { colors, font, radius } from "@/theme/theme";

/** Bandeau tricolore diagonal façon maillot (signature DA). */
function KitStripe({ height = 5 }: { height?: number }) {
  return (
    <LinearGradient
      colors={[colors.or, colors.or, colors.vert, colors.vert, colors.violet, colors.violet]}
      locations={[0, 0.34, 0.34, 0.67, 0.67, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ height, width: "100%" }}
    />
  );
}

/** Petit liseré tricolore avant les titres de section. */
function TagStripe() {
  return (
    <LinearGradient
      colors={[colors.or, colors.or, colors.vert, colors.vert, colors.violet, colors.violet]}
      locations={[0, 0.4, 0.4, 0.74, 0.74, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={s.tagStripe}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.titleWrap}>
      <TagStripe />
      <Text style={s.sectionTitle}>{children}</Text>
    </View>
  );
}

const NEWS_THEMES = [
  { grad: ["#3a2f08", "#171307"] as const, pill: colors.or, pillTxt: colors.ink2 },
  { grad: ["#0f3a20", "#0b1c11"] as const, pill: colors.vert, pillTxt: colors.blanc },
  { grad: ["#2a1559", "#140a26"] as const, pill: colors.violet, pillTxt: colors.blanc },
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const router = useRouter();
  const u = profile ?? me;
  const [conv, setConv] = useState<"En attente" | "Présent" | "Absent">(
    convocation.status,
  );
  const [standings, setStandings] = useState<FffStanding[]>(
    mockStandings as FffStanding[],
  );
  const [mine, setMine] = useState<MyStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMyStats(profile?.memberId ?? null).then(setMine);
      fetchStandings().then((rows) => {
        if (rows.length > 0) setStandings(rows);
      });
    }, [profile?.memberId]),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <LinearGradient
        colors={[colors.vertDk, "#0B1E12", colors.bg]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Bonjour, {u.firstName}</Text>
            <Text style={s.headerName}>F.C. Littoral 🦅</Text>
          </View>
          <View style={s.headerActions}>
            <Pressable
              style={s.chatBtn}
              onPress={() => router.push("/messagerie" as Href)}
            >
              <Text style={s.chatIcon}>💬</Text>
            </Pressable>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{u.initials}</Text>
            </View>
          </View>
        </View>

        {/* Next match */}
        <View style={s.nextMatch}>
          <Text style={s.nextLabel}>● Prochain match · J13</Text>
          <View style={s.matchTeams}>
            <View style={s.teamSide}>
              <View style={[s.badge, s.badgeUs]}>
                <Text style={s.badgeUsTxt}>{nextMatch.homeShort}</Text>
              </View>
              <Text style={s.teamName}>{nextMatch.home}</Text>
            </View>
            <View style={s.vsBlock}>
              <Text style={s.vsTxt}>VS</Text>
              <Text style={s.matchDate}>{nextMatch.date}</Text>
            </View>
            <View style={s.teamSide}>
              <View style={[s.badge, s.badgeThem]}>
                <Text style={s.badgeThemTxt}>{nextMatch.awayShort}</Text>
              </View>
              <Text style={s.teamName}>{nextMatch.away}</Text>
            </View>
          </View>
          <View style={s.matchInfoRow}>
            <Text style={s.matchPill}>📍 {nextMatch.venue}</Text>
            <Text style={s.matchPill}>🕐 {nextMatch.time}</Text>
            <Text style={s.matchPill}>☀️ {nextMatch.day}</Text>
          </View>
        </View>
      </LinearGradient>
      <KitStripe />

      <View style={s.content}>
        {/* CONVOCATION */}
        <View>
          <View style={s.sectionHeader}>
            <SectionTitle>Ma Convocation</SectionTitle>
            <View style={s.statusBadge}>
              <Text style={s.statusBadgeTxt}>{conv}</Text>
            </View>
          </View>
          <LinearGradient
            colors={["#10331C", "#0C1E12"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.convCard}
          >
            <Text style={s.convLabel}>{convocation.team}</Text>
            <Text style={s.convMessage}>
              Seras-tu là pour le{" "}
              <Text style={{ color: colors.orBright }}>{convocation.highlight}</Text> ?
            </Text>
            <View style={s.convDetails}>
              <View style={s.convDetail}>
                <Text style={s.convIcon}>📍</Text>
                <View>
                  <Text style={s.convDetailTxt}>{convocation.venue}</Text>
                  <Text style={s.convDetailSub}>{convocation.meet}</Text>
                </View>
              </View>
              <View style={s.convDetail}>
                <Text style={s.convIcon}>👕</Text>
                <View>
                  <Text style={s.convDetailTxt}>{convocation.kit}</Text>
                  <Text style={s.convDetailSub}>{convocation.kitSub}</Text>
                </View>
              </View>
            </View>
            <View style={s.convCta}>
              <Pressable
                onPress={() => setConv("Présent")}
                style={[s.btn, conv === "Présent" ? s.btnPresentOn : s.btnPresent]}
              >
                <Text style={s.btnTxt}>✓ Présent</Text>
              </Pressable>
              <Pressable
                onPress={() => setConv("Absent")}
                style={[s.btn, conv === "Absent" ? s.btnAbsentOn : s.btnAbsent]}
              >
                <Text style={[s.btnTxt, conv !== "Absent" && { color: colors.txtDim }]}>
                  ✕ Absent
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* MA SAISON */}
        <View>
          <View style={s.sectionHeader}>
            <SectionTitle>Ma Saison</SectionTitle>
            <Link href="/stats" style={s.link}>
              Tout voir →
            </Link>
          </View>
          <View style={s.statsRow}>
            {[
              { value: String(mine?.goals ?? 0), label: "Buts", sub: "", accent: true },
              { value: String(mine?.assists ?? 0), label: "Passes", sub: "", accent: false },
              {
                value: mine?.presenceRate != null ? `${mine.presenceRate}%` : "—",
                label: "Présence",
                sub: mine && mine.responded > 0 ? `${mine.present}/${mine.responded}` : "",
                accent: false,
              },
            ].map((st) => (
              <View key={st.label} style={[s.statCard, st.accent && s.statCardAccent]}>
                {st.accent && <View style={s.statAccentBar} />}
                <Text style={[s.statValue, st.accent && { color: colors.orBright }]}>
                  {st.value}
                </Text>
                <Text style={s.statLabel}>{st.label}</Text>
                {st.sub ? <Text style={s.statSub}>{st.sub}</Text> : null}
              </View>
            ))}
          </View>
        </View>

        {/* CLASSEMENT (carte claire) */}
        <View>
          <View style={s.sectionHeader}>
            <SectionTitle>Classement</SectionTitle>
            <Link href="/stats" style={s.link}>
              Complet →
            </Link>
          </View>
          <View style={s.tableCard}>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: 24 }]}>#</Text>
              <Text style={[s.th, { flex: 1 }]}>Équipe</Text>
              <Text style={[s.th, s.thNum]}>J</Text>
              <Text style={[s.th, s.thNum]}>Diff</Text>
              <Text style={[s.th, s.thPts]}>Pts</Text>
            </View>
            {standings.map((r) => (
              <View key={r.rank} style={[s.tableRow, r.us && s.tableRowUs]}>
                <Text style={[s.rank, r.us && { color: colors.or }]}>{r.rank}</Text>
                <View style={s.teamInfo}>
                  <View style={[s.dot, { backgroundColor: r.color ?? colors.inkMute }]} />
                  <Text style={[s.teamLabel, r.us && s.teamLabelUs]} numberOfLines={1}>
                    {r.team}
                  </Text>
                </View>
                <Text style={s.tdNum}>{r.played}</Text>
                <Text style={s.tdNum}>{r.diff}</Text>
                <Text style={[s.pts, r.us && { color: colors.or }]}>{r.pts}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* RÉSULTATS */}
        <View>
          <View style={s.sectionHeader}>
            <SectionTitle>Derniers Résultats</SectionTitle>
            <Link href="/calendrier" style={s.link}>
              Historique →
            </Link>
          </View>
          <View style={{ gap: 8 }}>
            {results.map((r) => (
              <View key={r.id} style={s.resultRow}>
                <View
                  style={[
                    s.outcome,
                    r.outcome === "V" && s.win,
                    r.outcome === "D" && s.lose,
                    r.outcome === "N" && s.draw,
                  ]}
                >
                  <Text
                    style={[
                      s.outcomeTxt,
                      {
                        color:
                          r.outcome === "V"
                            ? colors.greenBright
                            : r.outcome === "D"
                              ? colors.lose
                              : colors.violetBright,
                      },
                    ]}
                  >
                    {r.outcome}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resultTeams}>{r.teams}</Text>
                  <Text style={s.resultMeta}>{r.meta}</Text>
                </View>
                <Text style={s.resultScore}>{r.score}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ACTUALITÉS */}
        <View>
          <View style={s.sectionHeader}>
            <SectionTitle>Actualités</SectionTitle>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          >
            {news.map((n, i) => {
              const t = NEWS_THEMES[i % NEWS_THEMES.length];
              return (
                <View key={n.id} style={s.newsCard}>
                  <LinearGradient
                    colors={t.grad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.newsImg}
                  >
                    <Text style={{ fontSize: 30 }}>{n.emoji}</Text>
                    <View style={[s.newsCat, { backgroundColor: t.pill }]}>
                      <Text style={[s.newsCatTxt, { color: t.pillTxt }]}>{n.cat}</Text>
                    </View>
                  </LinearGradient>
                  <View style={{ padding: 11 }}>
                    <Text style={s.newsDate}>{n.date}</Text>
                    <Text style={s.newsTitle}>{n.title}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tagStripe: { width: 28, height: 4, borderRadius: 2 },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 9 },

  header: { paddingHorizontal: 22, paddingBottom: 22 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontFamily: font.condSemi,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  headerName: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.blanc,
    marginTop: 4,
    textTransform: "uppercase",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.vert,
    borderWidth: 2,
    borderColor: colors.or,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontFamily: font.condBlack, fontSize: 15, color: colors.orBright },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatIcon: { fontSize: 18 },

  nextMatch: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.lg,
    padding: 16,
  },
  nextLabel: {
    fontFamily: font.condSemi,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.or,
    marginBottom: 12,
  },
  matchTeams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  teamSide: { flex: 1, alignItems: "center" },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  badgeUs: { backgroundColor: colors.vert, borderWidth: 2, borderColor: colors.or },
  badgeUsTxt: { fontFamily: font.condBlack, fontSize: 13, color: colors.orBright },
  badgeThem: { backgroundColor: "#1a201a", borderWidth: 2, borderColor: "#2c332b" },
  badgeThemTxt: { fontFamily: font.condBlack, fontSize: 13, color: colors.txt },
  teamName: {
    fontFamily: font.cond,
    fontSize: 12,
    color: colors.blanc,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  vsBlock: { alignItems: "center", paddingHorizontal: 8 },
  vsTxt: { fontFamily: font.condBlack, fontSize: 11, color: colors.txtDim, letterSpacing: 1 },
  matchDate: { fontFamily: font.display, fontSize: 22, color: colors.orBright, marginTop: 3 },
  matchInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  matchPill: { fontSize: 11, color: "rgba(255,255,255,0.6)" },

  content: { padding: 18, gap: 26 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontFamily: font.condBlack,
    fontSize: 17,
    color: colors.blanc,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  link: { fontFamily: font.cond, fontSize: 11, color: colors.or, letterSpacing: 0.6, textTransform: "uppercase" },
  statusBadge: {
    backgroundColor: "rgba(201,162,39,0.14)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.32)",
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusBadgeTxt: {
    fontSize: 10,
    color: colors.orBright,
    fontFamily: font.cond,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  convCard: {
    borderWidth: 1,
    borderColor: "rgba(43,208,107,0.28)",
    borderRadius: radius.xl,
    padding: 18,
  },
  convLabel: {
    fontFamily: font.cond,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.or,
    marginBottom: 10,
  },
  convMessage: {
    fontFamily: font.condBlack,
    fontSize: 21,
    color: colors.blanc,
    marginBottom: 15,
    lineHeight: 25,
  },
  convDetails: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  convDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  convIcon: { fontSize: 15 },
  convDetailTxt: { fontSize: 12, fontFamily: font.condSemi, color: "rgba(255,255,255,0.85)" },
  convDetailSub: { fontSize: 10, color: colors.txtDim, marginTop: 1 },
  convCta: { flexDirection: "row", gap: 9, marginTop: 15 },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
  btnPresent: { backgroundColor: colors.or },
  btnPresentOn: { backgroundColor: colors.or, borderWidth: 2, borderColor: colors.orBright },
  btnAbsent: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  btnAbsentOn: { backgroundColor: colors.lose },
  btnTxt: { fontFamily: font.cond, fontSize: 13, color: colors.ink2, letterSpacing: 0.8, textTransform: "uppercase" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  statCardAccent: { borderColor: "rgba(201,162,39,0.3)" },
  statAccentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.or,
  },
  statValue: { fontFamily: font.display, fontSize: 30, color: colors.blanc },
  statLabel: { fontSize: 10, color: colors.txtDim, textTransform: "uppercase", letterSpacing: 1, marginTop: 6, fontFamily: font.condSemi },
  statSub: { fontSize: 10, color: colors.greenBright, marginTop: 4, fontFamily: font.condSemi },

  tableCard: {
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.lineD,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineD,
  },
  th: { fontSize: 9, fontFamily: font.cond, color: colors.inkMute, letterSpacing: 1, textTransform: "uppercase" },
  thNum: { width: 38, textAlign: "center" },
  thPts: { width: 34, textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineD,
  },
  tableRowUs: {
    backgroundColor: "rgba(201,162,39,0.14)",
    borderLeftWidth: 3,
    borderLeftColor: colors.or,
    paddingLeft: 13,
  },
  rank: { width: 24, fontFamily: font.display, fontSize: 15, color: colors.inkMute },
  teamInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  teamLabel: { fontSize: 13, fontFamily: font.condSemi, color: "#13160F", flexShrink: 1 },
  teamLabelUs: { color: "#8a6d10" },
  tdNum: { width: 38, textAlign: "center", fontFamily: font.condSemi, fontSize: 13, color: colors.inkMute },
  pts: { width: 34, textAlign: "center", fontFamily: font.display, fontSize: 17, color: "#13160F" },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  outcome: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  win: { backgroundColor: "rgba(22,146,63,0.22)" },
  lose: { backgroundColor: "rgba(220,50,50,0.2)" },
  draw: { backgroundColor: "rgba(126,63,242,0.18)" },
  outcomeTxt: { fontFamily: font.display, fontSize: 15 },
  resultTeams: { fontFamily: font.cond, fontSize: 13.5, color: colors.blanc },
  resultMeta: { fontSize: 11, color: colors.txtDim, marginTop: 2 },
  resultScore: { fontFamily: font.display, fontSize: 20, color: colors.orBright },

  newsCard: {
    width: 182,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  newsImg: {
    height: 94,
    alignItems: "center",
    justifyContent: "center",
  },
  newsCat: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newsCatTxt: { fontSize: 9, fontFamily: font.cond, letterSpacing: 0.6, textTransform: "uppercase" },
  newsDate: { fontSize: 10, color: colors.or, marginBottom: 5, fontFamily: font.condSemi, textTransform: "uppercase", letterSpacing: 0.4 },
  newsTitle: { fontFamily: font.cond, fontSize: 13, color: colors.blanc, lineHeight: 16 },
});
