import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";


export type AuthUser = {
  id: string;
  email?: string | null;
};

export type AuthSession = {
  access_token: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: "Not initialized" }),
  signUp: async () => ({ error: "Not initialized" }),
  signOut: async () => undefined,
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const readSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession({ access_token: data.session.access_token });
        setUser(
          data.session.user
            ? { id: data.session.user.id, email: data.session.user.email }
            : null,
        );
      }
      setLoading(false);
    };

    readSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        setSession(null);
        setUser(null);
        return;
      }

      setSession({ access_token: nextSession.access_token });
      setUser(
        nextSession.user
          ? { id: nextSession.user.id, email: nextSession.user.email }
          : null,
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signIn: async (email: string, password: string) => {
        if (!isSupabaseConfigured || !supabase) {
          return { error: "Supabase client is not configured" };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error.message };
        }
        return {};
      },
      signUp: async (email: string, password: string) => {
        if (!isSupabaseConfigured || !supabase) {
          return { error: "Supabase client is not configured" };
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          return { error: error.message };
        }
        return {};
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }
        await supabase.auth.signOut();
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  return useContext(AuthContext);
}
