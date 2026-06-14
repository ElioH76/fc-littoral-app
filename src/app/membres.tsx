import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { fetchAccounts, setRole, type Account } from "@/lib/coach";
import type { Role } from "@/lib/profile";
import { colors, font, radius } from "@/theme/theme";

const ROLE_LABEL: Record<Role, string> = {
  player: "Joueur",
  coach: "Coach",
  admin: "Admin",
};
const ROLES: Role[] = ["player", "coach", "admin"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Membres() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "admin";

  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [picking, setPicking] = useState<Account | null>(null);

  const load = useCallback(() => {
    if (isStaff) fetchAccounts().then(setAccounts);
  }, [isStaff]);
  useFocusEffect(useCallback(() => load(), [load]));

  const changeRole = async (acc: Account, role: Role) => {
    setPicking(null);
    if (role === acc.role) return;
    if (acc.id === profile?.id && role === "player") {
      Alert.alert("Action bloquée", "Tu ne peux pas retirer ton propre accès staff.");
      return;
    }
    const { error } = await setRole(acc.id, role);
    if (error) Alert.alert("Erreur", error);
    else load();
  };

  const staff = accounts?.filter((a) => a.role !== "player") ?? [];
  const players = accounts?.filter((a) => a.role === "player") ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Retour</Text>
        </Pressable>
        <Text style={s.title}>Membres</Text>
      </View>

      {!isStaff ? (
        <View style={s.center}>
          <Text style={s.muted}>Réservé aux coachs et à l&apos;administration.</Text>
        </View>
      ) : accounts === null ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.vertLt} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.group}>Staff · {staff.length}</Text>
          {staff.map((a) => (
            <Row key={a.id} acc={a} onPress={() => setPicking(a)} />
          ))}

          <Text style={[s.group, { marginTop: 18 }]}>Joueurs · {players.length}</Text>
          {players.map((a) => (
            <Row key={a.id} acc={a} onPress={() => setPicking(a)} />
          ))}

          <Text style={s.hint}>
            Touche un membre pour changer son rôle (Joueur · Coach · Admin).
          </Text>
        </ScrollView>
      )}

      {/* Sélecteur de rôle */}
      <Modal visible={picking !== null} transparent animationType="fade">
        <Pressable style={s.pickWrap} onPress={() => setPicking(null)}>
          <View style={s.pickCard}>
            <Text style={s.pickTitle}>{picking?.name}</Text>
            {ROLES.map((r) => {
              const active = picking?.role === r;
              return (
                <Pressable
                  key={r}
                  style={s.pickRow}
                  onPress={() => picking && changeRole(picking, r)}
                >
                  <Text style={[s.pickName, active && { color: colors.orBright }]}>
                    {ROLE_LABEL[r]}
                  </Text>
                  {active && <Text style={s.check}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Row({ acc, onPress }: { acc: Account; onPress: () => void }) {
  const isStaffRole = acc.role !== "player";
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={[s.avatar, isStaffRole && s.avatarStaff]}>
        <Text style={[s.avatarTxt, isStaffRole && { color: colors.orBright }]}>
          {initialsOf(acc.name)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{acc.name}</Text>
        <Text style={s.sub}>{acc.position ?? acc.login}</Text>
      </View>
      <View style={[s.roleBadge, isStaffRole && s.roleBadgeStaff]}>
        <Text style={[s.roleTxt, isStaffRole && { color: colors.orBright }]}>
          {ROLE_LABEL[acc.role]}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  back: { fontFamily: font.cond, fontSize: 15, color: colors.or, letterSpacing: 0.4 },
  title: { fontFamily: font.condBlack, fontSize: 26, color: colors.blanc, textTransform: "uppercase", marginTop: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: colors.txtDim, fontFamily: font.bodyMed, textAlign: "center" },

  group: {
    fontFamily: font.condBlack,
    fontSize: 13,
    color: colors.txtDim,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    padding: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.gris3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarStaff: { backgroundColor: colors.vert, borderWidth: 1, borderColor: colors.or },
  avatarTxt: { fontFamily: font.condBlack, fontSize: 14, color: colors.txt },
  name: { fontFamily: font.condSemi, fontSize: 15, color: colors.blanc },
  sub: { fontFamily: font.bodyMed, fontSize: 12, color: colors.txtDim, marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  roleBadgeStaff: { backgroundColor: "rgba(201,162,39,0.14)", borderColor: "rgba(201,162,39,0.3)" },
  roleTxt: { fontFamily: font.cond, fontSize: 10, color: colors.txtDim, letterSpacing: 0.6, textTransform: "uppercase" },
  hint: { fontSize: 12, color: colors.txtDim, fontFamily: font.bodyMed, marginTop: 14, textAlign: "center" },

  pickWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 28 },
  pickCard: { backgroundColor: colors.ink2, borderRadius: 20, borderWidth: 1, borderColor: colors.gris3, padding: 18 },
  pickTitle: { fontFamily: font.condBlack, fontSize: 18, color: colors.blanc, textTransform: "uppercase", marginBottom: 10 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  pickName: { fontFamily: font.condSemi, fontSize: 16, color: colors.txt },
  check: { color: colors.orBright, fontFamily: font.condBlack, fontSize: 15 },
});
