import type { Metadata } from "next";
import StudentWorkspace from "@/components/app/StudentWorkspace";
import RequireRole from "@/components/app/RequireRole";

export const metadata: Metadata = { title: "Student workspace" };

export default function StudentAppPage() {
  return (
    <RequireRole role="STUDENT">
      <StudentWorkspace />
    </RequireRole>
  );
}
