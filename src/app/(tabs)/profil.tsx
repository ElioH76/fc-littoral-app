import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import { me } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { colors, font, radius } from "@/theme/theme";

export default function Profil() {
  const insets = useSafeAreaInsets();
  const { session, signOut, profile } = useAuth();
  const u = profile ?? me;
  const isCoach = profile?.role === "coach";
  const [notifs, setNotifs] = useState(true);
  const [convocNotif, setConvocNotif] = useState(true);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gris1 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* En-tête profil */}
      <LinearGradient
        colors={[colors.vertDk, "#0D1F12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{u.initials}</Text>
        </View>
        <Text style={s.name}>
          {u.firstName} {u.lastName}
        </Text>
        <Text style={s.role}>
          {isCoach ? "Coach" : `#${u.number} · ${u.position}`}
        </Text>
        {session?.user?.email ? (
          <Text style={s.email}>{session.user.email}</Text>
        ) : null}
        <View style={s.teamPill}>
          <Text style={s.teamPillTxt}>{u.team}</Text>
        </View>
      </LinearGradient>

      <View style={{ padding: 20, gap: 24 }}>
        {/* Notifications */}
        <View>
          <Text style={s.sectionTitle}>Notifications</Text>
          <View style={s.card}>
            <Row label="Notifications push" sub="Annonces, résultats…">
              <Switch
                value={notifs}
                onValueChange={setNotifs}
                trackColor={{ true: colors.vert, false: colors.gris4 }}
                thumbColor={colors.blanc}
              />
            </Row>
            <Row label="Rappels de convocation" sub="Avant chaque match" divider>
              <Switch
                value={convocNotif}
                onValueChange={setConvocNotif}
                trackColor={{ true: colors.vert, false: colors.gris4 }}
                thumbColor={colors.blanc}
              />
            </Row>
          </View>
        </View>

        {/* Compte */}
        <View>
          <Text style={s.sectionTitle}>Compte</Text>
          <View style={s.card}>
            <Link label="Modifier mon profil" icon="👤" />
            <Link label="Confidentialité" icon="🔒" divider />
            <Link label="Aide & contact" icon="💬" divider />
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={[s.card, { alignItems: "center", paddingVertical: 14 }]}
        >
          <Text style={s.logout}>Se déconnecter</Text>
        </Pressable>

        <Text style={s.version}>FC Littoral · App v0.1</Text>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  sub,
  divider,
  children,
}: {
  label: string;
  sub?: string;
  divider?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[s.row, divider && s.divider]}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Link({ label, icon, divider }: { label: string; icon: string; divider?: boolean }) {
  return (
    <View style={[s.row, divider && s.divider]}>
      <Text style={{ fontSize: 16, marginRight: 10 }}>{icon}</Text>
      <Text style={[s.rowLabel, { flex: 1 }]}>{label}</Text>
      <Text style={s.chevron}>›</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.vert,
    borderWidth: 3,
    borderColor: colors.or,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontFamily: font.condBlack, fontSize: 28, color: colors.or },
  name: { fontFamily: font.condBlack, fontSize: 26, color: colors.blanc, marginTop: 12 },
  role: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  email: { fontFamily: font.bodyMed, fontSize: 12, color: colors.or, marginTop: 4 },
  teamPill: {
    marginTop: 12,
    backgroundColor: "rgba(245,200,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,200,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  teamPillTxt: { fontFamily: font.bodySemi, fontSize: 12, color: colors.or },

  sectionTitle: {
    fontFamily: font.cond,
    fontSize: 16,
    color: colors.blanc,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  rowLabel: { fontFamily: font.bodySemi, fontSize: 14, color: colors.txt },
  rowSub: { fontSize: 11, color: colors.txtDim, marginTop: 2 },
  chevron: { fontFamily: font.cond, fontSize: 22, color: colors.txtDim },
  logout: { fontFamily: font.cond, fontSize: 15, color: colors.lose, letterSpacing: 0.4 },
  version: { textAlign: "center", fontSize: 11, color: colors.txtDim },
});
