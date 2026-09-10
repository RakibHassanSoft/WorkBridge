"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/** The marketing chrome is hidden inside the product demo, which brings its own. */
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isApp = pathname.startsWith("/app");

  if (isApp) return <main id="main">{children}</main>;

  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
