import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import Chrome from "@/components/Chrome";

/* Self-hosted variable fonts — no external requests, no FOUT. */
const inter = localFont({
  src: "../fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
});
const display = localFont({
  src: "../fonts/inter-tight-var.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
const bengali = localFont({
  src: "../fonts/noto-bengali-var.woff2",
  variable: "--font-bn",
  display: "swap",
  weight: "100 900",
  fallback: ["Nirmala UI", "Vrinda", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "BDFreshers — Proof of work for every graduate",
    template: "%s · BDFreshers",
  },
  description:
    "BDFreshers turns Bangladesh's graduates into verified professionals. A business posts a real problem, the AI prices it and writes a short trial, students apply by doing that trial, and the finished work is signed off by a coordinator and the client — proof that follows the graduate for life.",
  keywords: ["BDFreshers", "Bangladesh", "graduate employment", "verified work experience", "SME", "micro-tasks"],
  openGraph: {
    title: "BDFreshers — Proof of work for every graduate",
    description: "A verified-work layer for Bangladesh's graduate-to-employment gap.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${bengali.variable}`}>
      <body className="min-h-dvh bg-canvas antialiased">
        <LangProvider>
          <AuthProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
            >
              Skip to content
            </a>
            <Chrome>{children}</Chrome>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
