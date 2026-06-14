import { Tabs, type Href } from "expo-router";
import { Text, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { colors, font } from "@/theme/theme";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 46,
        height: 32,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? colors.vert : "transparent",
        borderWidth: focused ? 1 : 0,
        borderColor: colors.or,
      }}
    >
      <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.7 }}>{emoji}</Text>
    </View>
  );
}

const makeIcon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <TabIcon emoji={emoji} focused={focused} />
  );

export default function TabsLayout() {
  const { profile } = useAuth();
  const isStaff = profile?.role === "coach" || profile?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orBright,
        tabBarInactiveTintColor: colors.txtDim,
        tabBarStyle: {
          backgroundColor: colors.ink2,
          borderTopColor: colors.line,
          height: 86,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontFamily: font.condSemi,
          fontSize: 9.5,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarIcon: makeIcon("🏠") }}
      />
      <Tabs.Screen
        name="calendrier"
        options={{ title: "Calendrier", tabBarIcon: makeIcon("📅") }}
      />
      <Tabs.Screen
        name="effectif"
        options={{ title: "Effectif", tabBarIcon: makeIcon("👥") }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: "Stats", tabBarIcon: makeIcon("📊") }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: makeIcon("⚙️") }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: makeIcon("🧢"),
          // Onglet réservé au staff : masqué pour les joueurs.
          href: isStaff ? ("/coach" as Href) : null,
        }}
      />
    </Tabs>
  );
}
