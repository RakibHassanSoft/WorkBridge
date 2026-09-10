"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, roleHome } from "@/lib/auth";
import type { Role } from "@/lib/api";

/**
 * Gates a workspace: sends unauthenticated visitors to /login and users with
 * the wrong role to their own workspace. Renders children only for the matching
 * role. Works with static export (client-side redirect).
 */
export default function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${roleHome[role]}`);
    } else if (user.role !== role) {
      router.replace(roleHome[user.role]);
    }
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-ink-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand-600" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
