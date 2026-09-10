"use client";

import Link from "next/link";
import Logo from "./Logo";
import { T } from "@/lib/i18n";
import { LangToggle } from "./ui";

const COLS = [
  {
    title: { en: "Platform", bn: "প্ল্যাটফর্ম" },
    links: [
      { href: "/how-it-works", label: { en: "How it works", bn: "কীভাবে কাজ করে" } },
      { href: "/tasks", label: { en: "Task board", bn: "টাস্ক বোর্ড" } },
      { href: "/ai-engine", label: { en: "AI Engine", bn: "এআই ইঞ্জিন" } },
      { href: "/sectors", label: { en: "Sectors", bn: "সেক্টর" } },
      { href: "/pricing", label: { en: "Pricing", bn: "মূল্য" } },
    ],
  },
  {
    title: { en: "Demo", bn: "ডেমো" },
    links: [
      { href: "/app/client", label: { en: "Client workspace", bn: "ক্লায়েন্ট ওয়ার্কস্পেস" } },
      { href: "/app/student", label: { en: "Student workspace", bn: "শিক্ষার্থী ওয়ার্কস্পেস" } },
      { href: "/app/moderator", label: { en: "Moderator console", bn: "মডারেটর কনসোল" } },
      { href: "/passport/nusrat-jahan", label: { en: "Work passport", bn: "ওয়ার্ক পাসপোর্ট" } },
    ],
  },
  {
    title: { en: "Company", bn: "কোম্পানি" },
    links: [
      { href: "/about", label: { en: "About & roadmap", bn: "আমাদের কথা ও রোডম্যাপ" } },
      { href: "/about#risks", label: { en: "Risks & mitigations", bn: "ঝুঁকি ও সমাধান" } },
      { href: "/about#partners", label: { en: "Partners", bn: "পার্টনার" } },
      { href: "/about#contact", label: { en: "Contact", bn: "যোগাযোগ" } },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-line bg-canvas-2">
      <div className="shell py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-ink-3">
              <T
                v={{
                  en: "A verified-work layer for Bangladesh. Not another job board — proof that a graduate can actually do the work.",
                  bn: "বাংলাদেশের জন্য একটি ভেরিফায়েড-ওয়ার্ক লেয়ার। আরেকটা জব বোর্ড না — একজন গ্র্যাজুয়েট সত্যিই কাজটা পারে, তার প্রমাণ।",
                }}
              />
            </p>
            <div className="mt-6">
              <LangToggle className="w-[110px]" />
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title.en}>
              <div className="text-[12.5px] font-semibold tracking-wide text-ink">
                <T v={col.title} />
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13.5px] text-ink-3 transition-colors hover:text-brand-600">
                      <T v={l.label} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-7 text-[12.5px] text-ink-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WorkBridge. Dhaka, Bangladesh.</p>
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-brand-400" />
            <T
              v={{
                en: "Interactive prototype — all data on this site is demonstration data.",
                bn: "ইন্টার‌্যাক্টিভ প্রোটোটাইপ — এই সাইটের সব ডেটা ডেমো ডেটা।",
              }}
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
