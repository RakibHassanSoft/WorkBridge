"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, tokenStore, AuthUser, Role } from "./api";

interface AuthCtx {
  user: AuthUser | null;
  ready: boolean; // finished restoring from storage
  loading: boolean; // a login/register request in flight
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (body: Record<string, unknown>) => Promise<AuthUser>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore session on mount, then confirm the token is still valid.
  useEffect(() => {
    const cached = tokenStore.getUser();
    if (cached) setUser(cached);
    const token = tokenStore.get();
    if (token) {
      api
        .me()
        .then((u) => {
          setUser(u);
          tokenStore.setUser(u);
        })
        .catch(() => {
          tokenStore.clear();
          setUser(null);
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const finish = useCallback((res: { user: AuthUser; token: string }) => {
    tokenStore.set(res.token);
    tokenStore.setUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        return finish(await api.login(email, password));
      } finally {
        setLoading(false);
      }
    },
    [finish]
  );

  const register = useCallback(
    async (body: Record<string, unknown>) => {
      setLoading(true);
      try {
        return finish(await api.register(body));
      } finally {
        setLoading(false);
      }
    },
    [finish]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, ready, loading, login, register, logout }),
    [user, ready, loading, login, register, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Where each role's workspace lives. */
export const roleHome: Record<Role, string> = {
  CLIENT: "/app/client",
  STUDENT: "/app/student",
  MODERATOR: "/app/moderator",
};
