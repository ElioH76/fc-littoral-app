import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchMember, type Member } from "@/lib/members";
import { fetchMemberStats } from "@/lib/stats";
import { colors, font, radius } from "@/theme/theme";

export default function FicheJoueur() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<Member | null | undefined>(null);
  const [ms, setMs] = useState<{ goals: number; assists: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMember(String(id)).then((m) => setPlayer(m ?? undefined));
      fetchMemberStats(String(id)).then(setMs);
    }, [id]),
  );

  if (player === null) {
    return (
      <View style={[s.center, { backgroundColor: colors.gris1 }]}>
        <ActivityIndicator color={colors.vertLt} />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={[s.center, { backgroundColor: colors.gris1 }]}>
        <Text style={{ color: colors.txt }}>Joueur introuvable.</Text>
        <Link href="/effectif" style={s.backLink}>
          ← Retour à l&apos;effectif
        </Link>
      </View>
    );
  }

  const stats = [
    { value: String(ms?.goals ?? 0), label: "Buts", accent: true },
    { value: String(ms?.assists ?? 0), label: "Passes déc.", accent: false },
    { value: player.captain ? "Oui" : "—", label: "Capitaine", accent: false },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gris1 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.vertDk, "#0D1F12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 16 }]}
      >
        <Link href="/effectif" style={s.back}>
          ← Effectif
        </Link>

        <View style={s.identity}>
          <View style={s.numCircle}>
            <Text style={s.numTxt}>{player.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>
              {player.firstName} {player.lastName}
            </Text>
            <Text style={s.pos}>{player.position}</Text>
            {player.captain && (
              <View style={s.capPill}>
                <Text style={s.capTxt}>🅒 Capitaine</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={{ padding: 20, gap: 24 }}>
        <View style={s.statsRow}>
          {stats.map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statValue, st.accent && { color: colors.or }]}>
                {st.value}
              </Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.infoTitle}>Informations</Text>
          <InfoRow label="Poste" value={player.position} />
          <InfoRow label="Numéro" value={`#${player.number}`} divider />
          <InfoRow label="Catégorie" value={player.group} divider />
          <InfoRow label="Équipe" value="Seniors Après-Midi" divider />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[s.infoRow, divider && s.divider]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  backLink: { color: colors.vertLt, fontFamily: font.bodySemi },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  back: { color: "rgba(255,255,255,0.7)", fontFamily: font.bodySemi, fontSize: 13, marginBottom: 18 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  numCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: colors.or,
    alignItems: "center",
    justifyContent: "center",
  },
  numTxt: { fontFamily: font.condBlack, fontSize: 30, color: colors.or },
  name: { fontFamily: font.condBlack, fontSize: 26, color: colors.blanc },
  pos: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  capPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "rgba(245,200,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,200,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  capTxt: { fontFamily: font.bodySemi, fontSize: 11, color: colors.or },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: "center",
  },
  statValue: { fontFamily: font.condBlack, fontSize: 30, color: colors.blanc },
  statLabel: { fontSize: 10, color: colors.txtDim, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  card: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  infoTitle: {
    fontFamily: font.cond,
    fontSize: 15,
    color: colors.blanc,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingTop: 14,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  infoLabel: { fontSize: 13, color: colors.txtDim },
  infoValue: { fontFamily: font.bodySemi, fontSize: 13, color: colors.txt },
});
