import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { colors, font, radius } from "@/theme/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Renseigne ton identifiant et ton mot de passe.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError("Identifiants incorrects ou compte introuvable.");
    // En cas de succès, la redirection est gérée par le layout racine.
  };

  return (
    <LinearGradient
      colors={["#0F2A18", colors.bg]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.container,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / titre */}
          <View style={s.badge}>
            <Text style={s.badgeEmoji}>🦅</Text>
          </View>
          <Text style={s.title}>FC Littoral</Text>
          <Text style={s.subtitle}>Espace membres de l&apos;équipe</Text>

          {/* Formulaire */}
          <View style={s.form}>
            <Text style={s.label}>Identifiant</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="prenom.nom"
              placeholderTextColor={colors.txtDim}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              style={s.input}
            />

            <Text style={[s.label, { marginTop: 16 }]}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.txtDim}
              secureTextEntry
              autoComplete="password"
              style={s.input}
            />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              style={[s.button, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.blanc} />
              ) : (
                <Text style={s.buttonTxt}>Se connecter</Text>
              )}
            </Pressable>

            <Text style={s.hint}>
              Pas encore de compte ? Demande à ton coach de t&apos;inviter.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28, alignItems: "center" },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.vert,
    borderWidth: 3,
    borderColor: colors.or,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: { fontSize: 40 },
  title: { fontFamily: font.condBlack, fontSize: 34, color: colors.blanc, marginTop: 18 },
  subtitle: { fontFamily: font.bodyMed, fontSize: 13, color: colors.txtDim, marginTop: 2 },
  form: { width: "100%", marginTop: 36 },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    color: colors.txtDim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: font.bodyMed,
    fontSize: 15,
    color: colors.txt,
  },
  error: {
    color: colors.lose,
    fontFamily: font.bodyMed,
    fontSize: 13,
    marginTop: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.vertLt,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  buttonTxt: {
    fontFamily: font.cond,
    fontSize: 17,
    color: colors.blanc,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hint: { textAlign: "center", fontSize: 12, color: colors.txtDim, marginTop: 20, lineHeight: 17 },
});
