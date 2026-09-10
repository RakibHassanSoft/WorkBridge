import type { Metadata } from "next";
import StudentWorkspace from "@/components/app/StudentWorkspace";

export const metadata: Metadata = { title: "Student workspace" };

export default function StudentAppPage() {
  return <StudentWorkspace />;
}
