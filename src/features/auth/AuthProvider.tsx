import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { AuthContext, type AuthUser } from "./authContext";

type AuthProviderProps = {
  children: React.ReactNode;
};

const AUTH_EMAIL_DOMAINS = ["linkagelab.co.kr", "kakaocorp.com"];

function toAuthEmails(ldapId: string) {
  const normalizedId = ldapId.trim().toLowerCase();

  return AUTH_EMAIL_DOMAINS.map((domain) => `${normalizedId}@${domain}`);
}

function toLdapId(email: string) {
  return email.split("@")[0];
}

function toAuthUser(id: string, email: string | undefined): AuthUser | null {
  if (!email) {
    return null;
  }

  return { id, ldapId: toLdapId(email) };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setUser(toAuthUser(data.session?.user.id ?? "", data.session?.user.email));
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(toAuthUser(session?.user.id ?? "", session?.user.email));
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (ldapId: string, password: string) => {
    for (const email of toAuthEmails(ldapId)) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        return {};
      }
    }

    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signOut,
    }),
    [isLoading, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
