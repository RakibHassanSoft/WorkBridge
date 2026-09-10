"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, ChevronDown, Menu, Search, X, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";
import { Avatar, LangToggle } from "@/components/ui";
import { T, useLang, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export type NavItem = { key: string; label: L; icon: LucideIcon; badge?: number };

const ROLES = [
  { href: "/app/client", label: { en: "Client", bn: "ক্লায়েন্ট" } },
  { href: "/app/student", label: { en: "Student", bn: "শিক্ষার্থী" } },
  { href: "/app/moderator", label: { en: "Moderator", bn: "মডারেটর" } },
];

export default function AppShell({
  role,
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
  role: string;
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
              <Avatar name={userName} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{userName}</span>
                <span className="block truncate text-[11px] text-ink-4">{t(userMeta)}</span>
              </span>
              <ChevronDown className={cn("size-3.5 shrink-0 text-ink-4 transition-transform", roleOpen && "rotate-180")} />
            </button>

            {roleOpen && (
              <div className="anim-fade absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-[12px] border border-line bg-white p-1 shadow-[0_1px_2px_rgba(10,14,12,.05),0_18px_36px_-20px_rgba(10,14,12,.28)]">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Switch workspace", bn: "ওয়ার্কস্পেস বদলান" }} />
                </div>
                {ROLES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                      r.href === `/app/${role}` ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-canvas-2"
                    )}
                  >
                    {t(r.label)}
                    {r.href === `/app/${role}` && <span className="size-1.5 rounded-full bg-brand-500" />}
                  </Link>
                ))}
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
            {actions}
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
            <div className="mb-6 flex items-center gap-2.5 rounded-[12px] border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-[12px] text-brand-900">
              <span className="size-1.5 shrink-0 rounded-full bg-brand-500 anim-pulse-ring" />
              <T
                v={{
                  en: "Interactive prototype — every project, person and number below is demonstration data.",
                  bn: "ইন্টার‌্যাক্টিভ প্রোটোটাইপ — নিচের প্রতিটি প্রজেক্ট, ব্যক্তি ও সংখ্যা ডেমো ডেটা।",
                }}
              />
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
