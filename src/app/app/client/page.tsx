import type { Metadata } from "next";
import ClientWorkspace from "@/components/app/ClientWorkspace";
import RequireRole from "@/components/app/RequireRole";

export const metadata: Metadata = { title: "Client workspace" };

export default function ClientAppPage() {
  return (
    <RequireRole role="CLIENT">
      <ClientWorkspace />
    </RequireRole>
  );
}
