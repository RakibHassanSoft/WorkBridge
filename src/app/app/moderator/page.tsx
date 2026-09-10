import type { Metadata } from "next";
import ModeratorWorkspace from "@/components/app/ModeratorWorkspace";
import RequireRole from "@/components/app/RequireRole";

export const metadata: Metadata = { title: "Moderator console" };

export default function ModeratorAppPage() {
  return (
    <RequireRole role="MODERATOR">
      <ModeratorWorkspace />
    </RequireRole>
  );
}
