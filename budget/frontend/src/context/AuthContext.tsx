import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiGet, apiPost, apiPostNoContent } from "../api/client";

export type AuthUser = { id: string; username: string; role: string };

type MeResponse = { user: AuthUser | null };

type Ctx = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<MeResponse>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signup = useCallback(async (username: string, password: string) => {
    const res = await apiPost<{ user: AuthUser }>("/api/auth/signup", {
      username,
      password,
    });
    setUser(res.user);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiPost<{ user: AuthUser }>("/api/auth/login", {
      username,
      password,
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiPostNoContent("/api/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, signup, login, logout }),
    [user, loading, refresh, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth requires AuthProvider");
  return c;
}
