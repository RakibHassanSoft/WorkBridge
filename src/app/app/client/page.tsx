import type { Metadata } from "next";
import ClientWorkspace from "@/components/app/ClientWorkspace";

export const metadata: Metadata = { title: "Client workspace" };

export default function ClientAppPage() {
  return <ClientWorkspace />;
}
