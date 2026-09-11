"use client";

import type { Role } from "@/lib/api";
import { DemoWorkspaceProvider } from "@/lib/workspace";
import ClientWorkspace from "./ClientWorkspace";
import StudentWorkspace from "./StudentWorkspace";
import ModeratorWorkspace from "./ModeratorWorkspace";

/**
 * The public live demo of one role's workspace. It renders the same workspace
 * as /app/*, but wired to the in-browser demo backend and a demo account, on
 * its own URL — a real session is never read, changed or shown here.
 */
export default function StartDemo({ role }: { role: Role }) {
  return (
    <DemoWorkspaceProvider role={role}>
      {role === "CLIENT" ? <ClientWorkspace /> : role === "STUDENT" ? <StudentWorkspace /> : <ModeratorWorkspace />}
    </DemoWorkspaceProvider>
  );
}
