import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StartDemo from "@/components/app/StartDemo";
import type { Role } from "@/lib/api";

const ROLES: Record<string, Role> = { client: "CLIENT", student: "STUDENT", moderator: "MODERATOR" };

export function generateStaticParams() {
  return Object.keys(ROLES).map((role) => ({ role }));
}

export const metadata: Metadata = { title: "Live demo" };

/** /demo/client, /demo/student, /demo/moderator — open a workspace with demo data, no sign-in. */
export default async function DemoPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const r = ROLES[role];
  if (!r) notFound();
  return <StartDemo role={r} />;
}
