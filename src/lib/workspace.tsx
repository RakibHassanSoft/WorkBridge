"use client";

import { createContext, useContext, useMemo } from "react";
import { api as realApi, createApi, type Api, type AuthUser, type Role } from "./api";
import { useAuth } from "./auth";
import { DEMO_USERS } from "./demo/session";

/**
 * What a workspace runs against. On /app/* this is the real API and the signed
 * in user (the default). On /demo/* the DemoWorkspace provider swaps in the
 * in-browser demo backend and a demo account — so demo and real can never mix.
 */
type Ctx = { api: Api; demo: Role | null };

const WorkspaceCtx = createContext<Ctx>({ api: realApi, demo: null });

export function DemoWorkspaceProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({
      demo: role,
      api: createApi(async (method, path, body) => {
        const { demoRequest } = await import("./demo/server");
        return demoRequest(method, path, body, role, DEMO_USERS[role].id);
      }),
    }),
    [role]
  );
  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

/** The API this workspace should call (real, or the demo backend on /demo/*). */
export function useApi(): Api {
  return useContext(WorkspaceCtx).api;
}

/** The demo role on /demo/* routes; null in the real workspaces. */
export function useDemo(): Role | null {
  return useContext(WorkspaceCtx).demo;
}

/** The person using this workspace: the demo account on /demo/*, otherwise the signed-in user. */
export function useWorkspaceUser(): AuthUser | null {
  const demo = useDemo();
  const { user } = useAuth();
  return demo ? DEMO_USERS[demo] : user;
}
