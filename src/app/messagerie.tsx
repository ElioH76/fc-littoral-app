import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chat } from "@/components/Chat";
import { colors, font } from "@/theme/theme";

export default function Messagerie() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.back}>‹ Retour</Text>
        </Pressable>
        <Text style={s.title}>Messagerie</Text>
        <Text style={s.sub}>Canal de l&apos;équipe</Text>
      </View>
      <Chat eventId={null} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gris3,
    backgroundColor: colors.ink2,
  },
  back: { fontFamily: font.cond, fontSize: 15, color: colors.or, letterSpacing: 0.4 },
  title: { fontFamily: font.condBlack, fontSize: 24, color: colors.blanc, textTransform: "uppercase", marginTop: 6 },
  sub: { fontFamily: font.bodyMed, fontSize: 12, color: colors.txtDim, marginTop: 1 },
});
