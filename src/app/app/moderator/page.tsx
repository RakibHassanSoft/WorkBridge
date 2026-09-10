import type { Metadata } from "next";
import ModeratorWorkspace from "@/components/app/ModeratorWorkspace";

export const metadata: Metadata = { title: "Moderator console" };

export default function ModeratorAppPage() {
  return <ModeratorWorkspace />;
}
