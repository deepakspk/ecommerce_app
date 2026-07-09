import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '@/api/auth';
import { clearToken, getToken, setToken as persistToken } from '@/utils/storage';
import { User } from '@/types/user';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signup: (input: SignupInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, code: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Mirrors the web app's AuthContext exactly (01-DOCUMENTATION.md §9): on mount,
 * rehydrate from a stored token via `GET /me`, falling back to a logged-out
 * state on any failure. `logout()` is client-only — there is no server-side
 * session to invalidate (01-DOCUMENTATION.md §2.1 — no refresh-token endpoint).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      setTokenState(stored);
      try {
        const { user: me } = await authApi.getMe();
        setUser(me);
      } catch {
        await clearToken();
        setTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applySession = useCallback(async (nextToken: string, nextUser: User) => {
    await persistToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser);
  }, []);

  const signup = useCallback(
    async (input: SignupInput) => {
      const { token: t, user: u } = await authApi.signup(input);
      await applySession(t, u);
    },
    [applySession],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u } = await authApi.login({ email, password });
      await applySession(t, u);
    },
    [applySession],
  );

  const loginWithOtp = useCallback(
    async (phone: string, code: string) => {
      const { token: t, user: u } = await authApi.verifyOtp({ phone, code });
      await applySession(t, u);
    },
    [applySession],
  );

  const loginWithToken = useCallback(async (nextToken: string) => {
    // The token must be persisted before `getMe()` fires, since the request
    // interceptor reads it from secure storage on every call.
    await persistToken(nextToken);
    setTokenState(nextToken);
    const { user: me } = await authApi.getMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const { user: me } = await authApi.getMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      signup,
      login,
      loginWithOtp,
      loginWithToken,
      logout,
      refreshMe,
    }),
    [user, token, loading, signup, login, loginWithOtp, loginWithToken, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
