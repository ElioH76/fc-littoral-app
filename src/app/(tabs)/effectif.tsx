import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { fetchMembers, type Member } from "@/lib/members";
import { colors, font, radius } from "@/theme/theme";

const GROUPS: Member["group"][] = [
  "Gardiens",
  "Défenseurs",
  "Milieux",
  "Attaquants",
];

export default function Effectif() {
  const [members, setMembers] = useState<Member[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMembers().then(setMembers);
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.gris1 }}>
      <ScreenHeader subtitle="Seniors Après-Midi" title="Effectif" />

      {members === null ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.vertLt} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {GROUPS.map((g) => {
            const list = members.filter((p) => p.group === g);
            if (list.length === 0) return null;
            return (
              <View key={g}>
                <View style={s.groupHead}>
                  <View style={s.rule} />
                  <Text style={s.groupTitle}>{g}</Text>
                  <Text style={s.count}>{list.length}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {list.map((p) => (
                    <Link key={p.id} href={`/joueur/${p.id}`} asChild>
                      <Pressable style={s.row}>
                        <View style={s.num}>
                          <Text style={s.numTxt}>{p.number}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.name}>
                            {p.firstName} {p.lastName}
                            {p.captain ? "  🅒" : ""}
                          </Text>
                          <Text style={s.pos}>{p.position}</Text>
                        </View>
                        {p.goals > 0 && (
                          <View style={s.goals}>
                            <Text style={s.goalsTxt}>{p.goals} ⚽</Text>
                          </View>
                        )}
                        <Text style={s.chevron}>›</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  rule: { width: 22, height: 3, borderRadius: 2, backgroundColor: colors.or },
  groupTitle: {
    fontFamily: font.cond,
    fontSize: 16,
    color: colors.blanc,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  count: { fontFamily: font.bodySemi, fontSize: 12, color: colors.txtDim },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  num: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.gris3,
    alignItems: "center",
    justifyContent: "center",
  },
  numTxt: { fontFamily: font.condBlack, fontSize: 15, color: colors.or },
  name: { fontFamily: font.cond, fontSize: 15, color: colors.blanc },
  pos: { fontSize: 11, color: colors.txtDim, marginTop: 1 },
  goals: {
    backgroundColor: "rgba(245,200,0,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  goalsTxt: { fontFamily: font.bodySemi, fontSize: 11, color: colors.or },
  chevron: { fontFamily: font.cond, fontSize: 22, color: colors.txtDim },
});
