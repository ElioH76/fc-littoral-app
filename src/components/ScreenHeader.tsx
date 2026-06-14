import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font } from "@/theme/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.vertDk, "#0D1F12"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.header, { paddingTop: insets.top + 16 }]}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
        <Text style={s.title}>{title}</Text>
      </View>
      {right}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sub: {
    fontFamily: font.bodyMed,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { fontFamily: font.condBlack, fontSize: 30, color: colors.blanc, marginTop: 2 },
});
