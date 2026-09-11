/**
 * Who you are in the public live demo. The demo only ever runs on its own
 * routes (/demo/client, /demo/student, /demo/moderator); it never touches a
 * real sign-in or the real /app workspaces.
 */
import type { AuthUser, Role } from "../api";

export const DEMO_USERS: Record<Role, AuthUser> = {
  CLIENT: { id: "c1", email: "nokshi@demo.wb", role: "CLIENT", name: "Nokshi Threads" },
  STUDENT: { id: "s1", email: "nusrat@demo.wb", role: "STUDENT", name: "Nusrat Jahan" },
  MODERATOR: { id: "m1", email: "mod@demo.wb", role: "MODERATOR", name: "Sabbir Rahman" },
};

export const DEMO_ROLES: Role[] = ["CLIENT", "STUDENT", "MODERATOR"];

/** The public URL of each role's demo workspace. */
export const demoHome: Record<Role, string> = {
  CLIENT: "/demo/client",
  STUDENT: "/demo/student",
  MODERATOR: "/demo/moderator",
};
