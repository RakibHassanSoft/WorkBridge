"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/** The marketing chrome wraps the public pages, but not the product app, the
    live-demo launcher or the auth screen, which bring their own layouts. */
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bare = pathname.startsWith("/app") || pathname.startsWith("/demo") || pathname.startsWith("/login");

  if (bare) return <main id="main">{children}</main>;

  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
