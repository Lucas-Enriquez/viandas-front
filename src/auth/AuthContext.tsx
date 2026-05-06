import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authApi } from "../api/auth";
import { meApi } from "../api/me";
import { clearAuthSession, getAuthSession, setAuthSession } from "../storage";
import type { AuthResponse, AuthSession } from "../types";

type AuthContextValue = {
  isLoading: boolean;
  refreshContext: () => Promise<void>;
  session: AuthSession | null;
  setAuthenticatedSession: (auth: AuthResponse) => Promise<AuthSession>;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then(setSession)
      .finally(() => setIsLoading(false));
  }, []);

  const setAuthenticatedSession = useCallback(async (auth: AuthResponse) => {
    const nextSession = await buildSessionWithContext(auth);
    await setAuthSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const refreshContext = useCallback(async () => {
    const currentSession = await getAuthSession();
    if (!currentSession) {
      return;
    }

    const context = await meApi.context();
    const latestSession = (await getAuthSession()) ?? currentSession;
    const nextSession = { ...latestSession, context };
    await setAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login(email, password);
    return setAuthenticatedSession(auth);
  }, [setAuthenticatedSession]);

  const signOut = useCallback(async () => {
    const currentSession = await getAuthSession();

    if (currentSession?.refreshToken) {
      try {
        await authApi.logout(currentSession.refreshToken);
      } catch {
        // Local logout must still happen if the backend rejects an expired token.
      }
    }

    await clearAuthSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      refreshContext,
      session,
      setAuthenticatedSession,
      signIn,
      signOut,
    }),
    [isLoading, refreshContext, session, setAuthenticatedSession, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function restoreSession() {
  const storedSession = await getAuthSession();
  if (!storedSession) {
    return null;
  }

  try {
    const context = await meApi.context();
    const latestSession = (await getAuthSession()) ?? storedSession;
    const nextSession = { ...latestSession, context };
    await setAuthSession(nextSession);
    return nextSession;
  } catch {
    return storedSession;
  }
}

async function buildSessionWithContext(auth: AuthResponse): Promise<AuthSession> {
  const baseSession: AuthSession = { ...auth };
  await setAuthSession(baseSession);

  try {
    const context = await meApi.context();
    const latestSession = (await getAuthSession()) ?? baseSession;
    return { ...latestSession, context };
  } catch {
    return baseSession;
  }
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return value;
}
