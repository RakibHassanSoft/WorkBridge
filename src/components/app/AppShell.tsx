"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, LogOut, Menu, RotateCcw, Search, Sparkles, X, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";
import { Avatar, LangToggle } from "@/components/ui";
import { T, useLang, type L } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";
import { DEMO_ROLES, demoHome } from "@/lib/demo/session";
import { useDemo, useWorkspaceUser } from "@/lib/workspace";
import { cn } from "@/lib/cn";

export type NavItem = { key: string; label: L; icon: LucideIcon; badge?: number };

const ROLE_NAME: Record<Role, L> = {
  CLIENT: { en: "Client", bn: "ক্লায়েন্ট" },
  STUDENT: { en: "Student", bn: "শিক্ষার্থী" },
  MODERATOR: { en: "Moderator", bn: "মডারেটর" },
};

export default function AppShell({
  roleLabel,
  userName,
  userMeta,
  nav,
  active,
  onSelect,
  title,
  subtitle,
  actions,
  chatMode = false,
  children,
}: {
  roleLabel: L;
  userName: string;
  userMeta: L;
  nav: NavItem[];
  active: string;
  onSelect: (k: string) => void;
  title: L;
  subtitle?: L;
  actions?: React.ReactNode;
  /** Chat lays out like a messaging app: nav moves to a top bar and the
      whole area below it belongs to the conversation list and thread. */
  chatMode?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const { logout } = useAuth();
  // Only set on the public /demo/* routes — a real workspace never shows demo controls.
  const demo = useDemo();
  const wsUser = useWorkspaceUser();
  const router = useRouter();

  const signOut = () => {
    if (demo) {
      // Leaving the demo never touches a real session.
      router.push("/");
      return;
    }
    logout();
    router.replace("/login");
  };
  const switchDemo = (r: Role) => router.push(demoHome[r]);
  const resetDemo = async () => {
    const { resetDemoData } = await import("@/lib/demo/server");
    resetDemoData();
    window.location.reload();
  };
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-canvas-2/60">
      {/* Sidebar */}
      <aside
        aria-hidden={!open && chatMode}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-line bg-white transition-transform duration-300",
          !chatMode && "lg:translate-x-0 lg:visible lg:pointer-events-auto",
          // An off-canvas rail must not stay clickable or tabbable.
          open ? "translate-x-0" : "-translate-x-full invisible pointer-events-none"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/">
            <Logo />
          </Link>
          <button className="text-ink-4 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-4.5" />
          </button>
        </div>

        <div className="border-b border-line p-4">
          <div className="relative">
            <button
              onClick={() => setRoleOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-[12px] border border-line bg-canvas-2/60 p-2.5 text-left transition-colors hover:bg-canvas-2"
            >
              <Avatar name={userName} src={wsUser?.avatarUrl} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{userName}</span>
                <span className="block truncate text-[11px] text-ink-4">{t(userMeta)}</span>
              </span>
              <ChevronDown className={cn("size-3.5 shrink-0 text-ink-4 transition-transform", roleOpen && "rotate-180")} />
            </button>

            {roleOpen && (
              <div className="anim-fade absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-[12px] border border-line bg-white p-1 shadow-[0_1px_2px_rgba(10,14,12,.05),0_18px_36px_-20px_rgba(10,14,12,.28)]">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Account", bn: "অ্যাকাউন্ট" }} />
                </div>
                {demo &&
                  DEMO_ROLES.filter((r) => r !== demo).map((r) => (
                    <button
                      key={r}
                      onClick={() => switchDemo(r)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-canvas-2"
                    >
                      <Sparkles className="size-4 text-ink-4" />
                      <T v={{ en: `Try the ${ROLE_NAME[r].en.toLowerCase()} demo`, bn: `${ROLE_NAME[r].bn} ডেমো দেখুন` }} />
                    </button>
                  ))}
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-canvas-2"
                >
                  <LogOut className="size-4 text-ink-4" />
                  {demo ? <T v={{ en: "Exit demo", bn: "ডেমো থেকে বের হন" }} /> : <T v={{ en: "Sign out", bn: "সাইন আউট" }} />}
                </button>
              </div>
            )}
          </div>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white">
            {t(roleLabel)}
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => {
            const on = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelect(item.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-all duration-200",
                  on ? "bg-ink text-white" : "text-ink-2 hover:bg-canvas-2"
                )}
              >
                <item.icon className={cn("size-4 shrink-0", on ? "text-brand-300" : "text-ink-4")} />
                <span className="flex-1 truncate">{t(item.label)}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      "num grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-semibold",
                      on ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <Link href="/" className="flex items-center gap-2 text-[12.5px] text-ink-3 transition-colors hover:text-ink">
            <ArrowLeft className="size-3.5" />
            <T v={{ en: "Back to the site", bn: "সাইটে ফিরুন" }} />
          </Link>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className={cn(!chatMode ? "lg:pl-[252px]" : "flex h-dvh flex-col overflow-hidden")}>
        {demo && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-ink px-5 py-2.5 text-[12.5px] text-white/75 lg:px-8">
            <span className="flex items-center gap-2 font-medium text-white">
              <Sparkles className="size-3.5 text-brand-300" />
              <T v={{ en: "Live demo", bn: "লাইভ ডেমো" }} />
            </span>
            <span className="hidden md:inline">
              <T v={{ en: "Sample data — everything you do stays in this browser tab.", bn: "নমুনা ডেটা — আপনি যা করবেন তা এই ব্রাউজার ট্যাবেই থাকবে।" }} />
            </span>
            <div className="flex items-center gap-1" role="group" aria-label={t({ en: "Demo role", bn: "ডেমো রোল" })}>
              {DEMO_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => r !== demo && switchDemo(r)}
                  aria-pressed={r === demo}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] transition-colors",
                    r === demo ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {t(ROLE_NAME[r])}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={resetDemo} className="flex items-center gap-1.5 text-white/75 transition-colors hover:text-white">
                <RotateCcw className="size-3.5" />
                <T v={{ en: "Reset", bn: "রিসেট" }} />
              </button>
              <button onClick={signOut} className="flex items-center gap-1.5 text-white/75 transition-colors hover:text-white">
                <LogOut className="size-3.5" />
                <T v={{ en: "Exit demo", bn: "ডেমো থেকে বের হন" }} />
              </button>
            </div>
          </div>
        )}
        <header className={cn("z-30 border-b border-line bg-white/85 backdrop-blur-md", chatMode ? "shrink-0" : "sticky top-0")}>
          <div className="flex h-16 items-center gap-4 px-5 lg:px-8">
            <button
              className={cn("grid size-9 place-items-center rounded-[10px] border border-line", !chatMode && "lg:hidden")}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4.5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">{t(title)}</h1>
              {subtitle && <p className="truncate text-[12px] text-ink-4">{t(subtitle)}</p>}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-9 w-[190px] items-center gap-2 rounded-[10px] border border-line bg-canvas-2/60 px-3 text-[12.5px] text-ink-4">
                <Search className="size-3.5" />
                <T v={{ en: "Search…", bn: "খুঁজুন…" }} />
              </div>
              <button className="relative grid size-9 place-items-center rounded-[10px] border border-line text-ink-3" aria-label="Notifications">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-500" />
              </button>
            </div>

            <LangToggle className="w-[100px]" />
            {actions && <div className="hidden sm:block">{actions}</div>}
          </div>
        </header>

        {chatMode && (
          <nav className="sticky z-20 flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:flex-wrap lg:overflow-x-visible">
            {nav.map((item) => {
              const on = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] transition-colors",
                    on ? "bg-ink text-white" : "text-ink-3 hover:bg-canvas-2 hover:text-ink"
                  )}
                >
                  <item.icon className={cn("size-3.5 shrink-0", on ? "text-brand-300" : "text-ink-4")} />
                  <span className="whitespace-nowrap">{t(item.label)}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        "num grid h-4.5 min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold",
                        on ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700"
                      )}
                      style={{ height: 18 }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        )}

        {chatMode ? (
          <div className="min-h-0 flex-1 bg-white">{children}</div>
        ) : (
          <div className="mx-auto max-w-[1180px] px-5 py-7 lg:px-8 lg:py-9">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
