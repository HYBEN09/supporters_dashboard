import { createContext } from "react";

export type AuthUser = {
  id: string;
  ldapId: string;
};

export type SignInResult = { error?: string };

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (ldapId: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
