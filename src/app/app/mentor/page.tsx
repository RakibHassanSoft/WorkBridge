"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The mentor role was merged into the coordinator/moderator role.
// This route now just redirects into the app.
export default function MentorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/moderator");
  }, [router]);
  return null;
}
