import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { fetchMyProfile, type MyProfile } from "@/lib/profile";

type AuthState = {
  session: Session | null;
  profile: MyProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

/** Domaine technique des comptes membres (identifiant = "prenom.nom"). */
const LOGIN_DOMAIN = "fclittoral.fr";

/** Accepte un pseudo "prenom.nom" (converti en email) ou un email complet. */
function toEmail(identifier: string): string {
  const id = identifier.trim().toLowerCase();
  return id.includes("@") ? id : `${id}@${LOGIN_DOMAIN}`;
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await fetchMyProfile().catch(() => null);
    setProfile(p);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Charge (ou efface) le profil à chaque changement de session.
  useEffect(() => {
    if (session) refreshProfile();
    else setProfile(null);
  }, [session, refreshProfile]);

  const signIn = async (identifier: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(identifier),
      password,
    });
    return { error: error?.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
