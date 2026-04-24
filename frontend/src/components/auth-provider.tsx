"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/domain";

const STORAGE_KEY = "rentora-session";

interface SessionData {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginAsDemoUser: (userId: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as SessionData;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const persist = useCallback((session: SessionData | null) => {
    if (typeof window === "undefined") return;
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const refreshMe = useCallback(async () => {
    const session = readSession();
    if (!session?.token) return;
    const response = await api.get<User>("/api/users/me", session.token);
    setUser(response.data);
    setToken(session.token);
    persist({ token: session.token, user: response.data });
  }, [persist]);

  const resetSessionScopedQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["requests"] });
    queryClient.removeQueries({ queryKey: ["conversations"] });
    queryClient.removeQueries({ queryKey: ["my-listings"] });
    queryClient.removeQueries({ queryKey: ["listing-requests"] });
    queryClient.removeQueries({ queryKey: ["item-requests"] });
    queryClient.removeQueries({ queryKey: ["lender-open-requests"] });
  }, [queryClient]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const session = readSession();
        if (!session?.token) return;
        setToken(session.token);
        const response = await api.get<User>("/api/users/me", session.token);
        setUser(response.data);
      } catch {
        persist(null);
        setUser(null);
        setToken(null);
        resetSessionScopedQueries();
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [persist, resetSessionScopedQueries]);

  const loginAsDemoUser = useCallback(
    async (userId: string) => {
      resetSessionScopedQueries();
      const response = await api.post<{ token: string; user: User }>("/api/auth/mock-login", {
        userId,
      });
      setUser(response.data.user);
      setToken(response.data.token);
      persist({ token: response.data.token, user: response.data.user });
      await refreshMe();
    },
    [persist, refreshMe, resetSessionScopedQueries],
  );

  const logout = useCallback(() => {
    resetSessionScopedQueries();
    setUser(null);
    setToken(null);
    persist(null);
  }, [persist, resetSessionScopedQueries]);

  const value = useMemo(
    () => ({ user, token, loading, loginAsDemoUser, logout, refreshMe }),
    [user, token, loading, loginAsDemoUser, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
