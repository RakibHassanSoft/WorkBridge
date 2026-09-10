import type { Metadata } from "next";
import MentorWorkspace from "@/components/app/MentorWorkspace";

export const metadata: Metadata = { title: "Mentor console" };

export default function MentorAppPage() {
  return <MentorWorkspace />;
}
