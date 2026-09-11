"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { Button, LangToggle } from "./ui";
import { T, useLang, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const NAV: { href: string; label: L }[] = [
  { href: "/how-it-works", label: { en: "How it works", bn: "কীভাবে কাজ করে" } },
  { href: "/tasks", label: { en: "Tasks", bn: "টাস্ক" } },
  { href: "/ai-engine", label: { en: "AI Engine", bn: "এআই ইঞ্জিন" } },
  { href: "/sectors", label: { en: "Sectors", bn: "সেক্টর" } },
  { href: "/pricing", label: { en: "Pricing", bn: "মূল্য" } },
];

const DEMOS: { href: string; label: L; desc: L }[] = [
  {
    href: "/demo/client",
    label: { en: "Client workspace", bn: "ক্লায়েন্ট ওয়ার্কস্পেস" },
    desc: { en: "Post a problem, review deliverables, sign off", bn: "সমস্যা পোস্ট করুন, ডেলিভারি রিভিউ ও সাইন-অফ" },
  },
  {
    href: "/demo/student",
    label: { en: "Student workspace", bn: "শিক্ষার্থী ওয়ার্কস্পেস" },
    desc: { en: "Matched tasks, submissions, earnings", bn: "ম্যাচ করা টাস্ক, সাবমিশন, আয়" },
  },
  {
    href: "/demo/moderator",
    label: { en: "Moderator console", bn: "মডারেটর কনসোল" },
    desc: { en: "AI shortlists, payments, verification, controls", bn: "এআই শর্টলিস্ট, পেমেন্ট, যাচাই, নিয়ন্ত্রণ" },
  },
  {
    href: "/passport/nusrat-jahan",
    label: { en: "Proof-of-Work passport", bn: "প্রুফ-অফ-ওয়ার্ক পাসপোর্ট" },
    desc: { en: "A graduate's verified public record", bn: "একজন গ্র্যাজুয়েটের যাচাইকৃত রেকর্ড" },
  },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setDemoOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-line" : "bg-canvas border-b border-transparent"
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="WorkBridge home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[14px] transition-colors",
                  active ? "text-ink" : "text-ink-3 hover:text-ink"
                )}
              >
                <T v={n.label} />
                {active && <span className="absolute inset-x-3 -bottom-px h-px bg-brand-500" />}
              </Link>
            );
          })}

          <div className="relative" onMouseLeave={() => setDemoOpen(false)}>
            <button
              onMouseEnter={() => setDemoOpen(true)}
              onClick={() => setDemoOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] transition-colors",
                pathname?.startsWith("/app") || pathname?.startsWith("/passport") ? "text-ink" : "text-ink-3 hover:text-ink"
              )}
            >
              <T v={{ en: "Live demo", bn: "লাইভ ডেমো" }} />
              <ChevronDown className={cn("size-3.5 transition-transform duration-300", demoOpen && "rotate-180")} />
            </button>
            <div
              className={cn(
                "absolute left-0 top-full w-[340px] pt-3 transition-all duration-250",
                demoOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 -translate-y-1"
              )}
            >
              <div className="overflow-hidden rounded-[16px] border border-line bg-white p-1.5 shadow-[0_1px_2px_rgba(10,14,12,.05),0_24px_48px_-24px_rgba(10,14,12,.25)]">
                {DEMOS.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    className="group flex items-start gap-3 rounded-[11px] px-3 py-2.5 transition-colors hover:bg-canvas-2"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
                        <T v={d.label} />
                        <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60" />
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-4">
                        <T v={d.desc} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2.5">
          <LangToggle className="w-[104px]" />
          <Button href="/login" size="sm" className="hidden sm:inline-flex" icon={<ArrowRight className="size-3.5" />}>
            <T v={{ en: "Sign in", bn: "সাইন ইন" }} />
          </Button>
          <button
            className="grid size-9 place-items-center rounded-[10px] border border-line text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={t({ en: "Menu", bn: "মেনু" })}
            aria-expanded={open}
          >
            {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 origin-top bg-white transition-all duration-300 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div className="shell flex h-full flex-col gap-1 overflow-y-auto py-6">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              className="border-b border-line py-4 text-[19px] font-medium tracking-tight text-ink"
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <T v={n.label} />
            </Link>
          ))}
          <div className="eyebrow mt-7 mb-1">
            <T v={{ en: "Live demo", bn: "লাইভ ডেমো" }} />
          </div>
          {DEMOS.map((d) => (
            <Link key={d.href} href={d.href} className="flex items-center justify-between border-b border-line py-3.5 text-[15px] text-ink-2">
              <T v={d.label} />
              <ArrowRight className="size-4 text-ink-4" />
            </Link>
          ))}
          <Button href="/login" size="lg" className="mt-7" full icon={<ArrowRight className="size-4" />}>
            <T v={{ en: "Sign in", bn: "সাইন ইন" }} />
          </Button>
        </div>
      </div>
    </header>
  );
}
