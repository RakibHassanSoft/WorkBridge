"use client";

import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { T } from "@/lib/i18n";
import HeroPreview from "./HeroPreview";

const LOGOS = ["BASIS", "DCCI", "ICAB", "IEB", "e-CAB", "FBCCI"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 md:pb-28">
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-bg fade-mask-b absolute inset-x-0 top-0 h-[560px] opacity-70" />
        <div className="absolute left-1/2 top-[-140px] h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/50 blur-[110px]" />
        <div className="absolute right-[8%] top-[220px] h-[260px] w-[260px] rounded-full bg-brand-200/40 blur-[90px]" />
      </div>

      <div className="shell">
        <Reveal className="mx-auto max-w-[860px] text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1.5 pl-1.5 pr-4 text-[12.5px] text-ink-2 shadow-[0_1px_2px_rgba(10,14,12,.05)]">
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">
              <span className="size-1.5 rounded-full bg-brand-200 anim-pulse-ring" />
              <T v={{ en: "Phase 0", bn: "ফেজ ০" }} />
            </span>
            <T v={{ en: "Manual pilot running in Dhaka — 5 SMEs, real money", bn: "ঢাকায় ম্যানুয়াল পাইলট চলছে — ৫টি এসএমই, বাস্তব অর্থ" }} />
          </div>

          <h1 className="display-1 text-ink">
            <T v={{ en: "A degree says you studied.", bn: "ডিগ্রি বলে আপনি পড়েছেন।" }} />
            <br />
            <span className="text-brand-600">
              <T v={{ en: "BDFreshers proves you can ", bn: "BDFreshers প্রমাণ করে আপনি " }} />
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">
                  <T v={{ en: "work.", bn: "কাজ পারেন।" }} />
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 180 12"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 -bottom-1.5 h-2.5 w-full text-brand-300"
                >
                  <path d="M3 8C48 3 120 2 177 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[640px] text-[17px] leading-relaxed text-ink-3 sm:text-[18.5px]">
            <T
              v={{
                en: "A business posts a real problem. Our AI prices it and writes a short trial of the same work. Students apply by doing that trial, a coordinator picks one, and the finished job is signed off by a coordinator and the client — a record no CV can fake.",
                bn: "একটি ব্যবসা বাস্তব সমস্যা পোস্ট করে। আমাদের এআই তার দাম ঠিক করে আর একই কাজের একটি ছোট ট্রায়াল লেখে। শিক্ষার্থীরা সেই ট্রায়াল করেই আবেদন করেন, একজন কোঅর্ডিনেটর একজনকে বেছে নেন, আর শেষ হওয়া কাজে মেন্টর ও ক্লায়েন্ট দুজনেই সাইন-অফ করেন — এমন এক রেকর্ড, যা কোনো সিভি নকল করতে পারে না।",
              }}
            />
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/ai-engine" size="lg" icon={<ArrowRight className="size-4" />}>
              <T v={{ en: "See the AI scope a real job", bn: "এআই কীভাবে স্কোপ করে দেখুন" }} />
            </Button>
            <Button href="/how-it-works" size="lg" variant="secondary">
              <T v={{ en: "How it works", bn: "কীভাবে কাজ করে" }} />
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-4">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-brand-500" />
              <T v={{ en: "Dual sign-off on every task", bn: "প্রতিটি টাস্কে দ্বৈত সাইন-অফ" }} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-brand-500" />
              <T v={{ en: "AI scopes, humans approve", bn: "এআই স্কোপ করে, মানুষ অনুমোদন দেয়" }} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-brand-400" />
              <T v={{ en: "Every discipline, every sector", bn: "সব ডিসিপ্লিন, সব সেক্টর" }} />
            </span>
          </div>
        </Reveal>

        <Reveal delay={140} className="mt-16">
          <HeroPreview />
        </Reveal>

        <Reveal delay={220} className="mt-14">
          <p className="text-center text-[11.5px] font-medium uppercase tracking-[0.16em] text-ink-4">
            <T v={{ en: "Designed to plug into the bodies businesses already trust", bn: "ব্যবসাগুলো যেসব সংগঠনকে ইতিমধ্যে বিশ্বাস করে, তাদের সাথে যুক্ত হওয়ার জন্য তৈরি" }} />
          </p>
          <div className="fade-mask-r relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
            <div className="marquee-track flex w-max items-center gap-14">
              {[...LOGOS, ...LOGOS, ...LOGOS].map((l, i) => (
                <span key={i} className="text-[19px] font-semibold tracking-tight text-ink-4/70" style={{ fontFamily: "var(--font-display)" }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
