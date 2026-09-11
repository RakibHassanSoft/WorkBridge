"use client";

import { Check, Minus } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { T, useLang } from "@/lib/i18n";

const ROWS = [
  {
    name: "Bdjobs",
    good: { en: "Bangladesh's largest and oldest job portal — a huge CV database and thousands of postings a day.", bn: "বাংলাদেশের সবচেয়ে বড় ও পুরনো জব পোর্টাল — বিশাল সিভি ডেটাবেজ ও প্রতিদিন হাজারো পোস্টিং।" },
    gap: { en: "A listing board. No verified evidence of who can actually do the work — only CVs and certificates.", bn: "একটা লিস্টিং বোর্ড। কে আসলে কাজ পারে তার কোনো যাচাইকৃত প্রমাণ নেই — শুধু সিভি ও সার্টিফিকেট।" },
  },
  {
    name: "LinkedIn",
    good: { en: "Strong for professional networking and global reach.", bn: "প্রফেশনাল নেটওয়ার্কিং ও গ্লোবাল রিচে শক্তিশালী।" },
    gap: { en: "Thin usage among Bangladeshi SMEs, and a recommendation is social courtesy — not evidence of skill.", bn: "বাংলাদেশের এসএমই সেক্টরে ব্যবহার কম, আর রেকমেন্ডেশন সামাজিক সৌজন্য — দক্ষতার প্রমাণ নয়।" },
  },
  {
    name: "Kormo Jobs (Google)",
    good: { en: "Gave the informal sector a genuinely simple, mobile-first entry-level solution.", bn: "ইনফরমাল সেক্টরকে সত্যিকারের সহজ, মোবাইল-ফার্স্ট এন্ট্রি-লেভেল সমাধান দিয়েছিল।" },
    gap: { en: "Not built for skilled graduate-level work, and it creates no verified work experience.", bn: "স্কিলড গ্র্যাজুয়েট-লেভেল কাজের জন্য তৈরি নয়, আর কোনো ভেরিফায়েড ওয়ার্ক এক্সপেরিয়েন্স তৈরি করে না।" },
  },
  {
    name: "Upwork / Fiverr",
    good: { en: "Global freelance marketplaces with enormous opportunity.", bn: "গ্লোবাল ফ্রিল্যান্স মার্কেটপ্লেস, বিশাল সুযোগ।" },
    gap: { en: "Brutal for a fresh graduate — no rating history means no work, and payment trust with foreign buyers is harder still.", bn: "নতুন গ্র্যাজুয়েটের জন্য কঠিন — রেটিং হিস্ট্রি নেই মানে কাজ নেই, আর বিদেশি বায়ারের সাথে পেমেন্ট-ট্রাস্ট আরও কঠিন।" },
  },
  {
    name: "Kolorob-type programmes",
    good: { en: "Doing real work moving blue-collar and informal-sector youth into formal jobs.", bn: "ব্লু-কলার ও ইনফরমাল সেক্টরের তরুণদের ফরমাল চাকরিতে আনার বাস্তব কাজ করছে।" },
    gap: { en: "Not designed for skilled, graduate-level assignments.", bn: "স্কিলড, গ্র্যাজুয়েট-লেভেল কাজের জন্য ডিজাইন করা নয়।" },
  },
];

export default function Comparison() {
  const { t } = useLang();
  return (
    <section className="border-y border-line bg-canvas-2/60 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "Where we fit", bn: "আমরা কোথায়" }}
            title={{ en: "We are not competing with any of them. We are the layer none of them built.", bn: "আমরা এদের কারও প্রতিদ্বন্দ্বী নই। আমরা সেই লেয়ার, যা এদের কেউ বানায়নি।" }}
            desc={{
              en: "Every existing player does something well. Not one of them produces the thing an employer actually wants: evidence that this specific person can do the work.",
              bn: "বিদ্যমান প্রত্যেকেই কিছু একটা ভালো করছে। কিন্তু নিয়োগকর্তা আসলে যা চান — এই নির্দিষ্ট মানুষটি কাজটা পারে, তার প্রমাণ — সেটা কেউ তৈরি করছে না।",
            }}
          />
        </Reveal>

        <Reveal delay={80} className="mt-12 overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="hidden grid-cols-[220px_1fr_1fr] gap-6 border-b border-line bg-canvas-2/70 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4 lg:grid">
            <span>
              <T v={{ en: "Platform", bn: "প্ল্যাটফর্ম" }} />
            </span>
            <span>
              <T v={{ en: "What they do well", bn: "যা তারা ভালো করছে" }} />
            </span>
            <span>
              <T v={{ en: "What stays missing", bn: "যে ফাঁকটা থেকে যাচ্ছে" }} />
            </span>
          </div>

          {ROWS.map((r) => (
            <div key={r.name} className="grid gap-3 border-b border-line px-7 py-6 lg:grid-cols-[220px_1fr_1fr] lg:gap-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{r.name}</div>
              <div className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-3">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
                {t(r.good)}
              </div>
              <div className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-3">
                <Minus className="mt-0.5 size-4 shrink-0 text-ink-4" />
                {t(r.gap)}
              </div>
            </div>
          ))}

          <div className="grid gap-3 bg-ink px-7 py-7 text-white lg:grid-cols-[220px_1fr] lg:gap-6">
            <div className="text-[15px] font-semibold tracking-[-0.02em]">
              BDFreshers
              <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-brand-300">
                <T v={{ en: "A layer, not a rival", bn: "একটি লেয়ার, প্রতিদ্বন্দ্বী নয়" }} />
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-white/70">
              <T
                v={{
                  en: "A verified-work layer designed to plug into all of them. A “verified project completed” badge on a job-board profile. A real client sign-off instead of a courtesy recommendation. We are not building another list — we are building the proof.",
                  bn: "একটি ভেরিফায়েড-ওয়ার্ক লেয়ার, যা এদের সবার সাথে যুক্ত হয়ে কাজ করার জন্য তৈরি। জব বোর্ড প্রোফাইলে “ভেরিফায়েড প্রজেক্ট সম্পন্ন” ব্যাজ। সৌজন্যমূলক রেকমেন্ডেশনের বদলে real ক্লায়েন্টের সাইন-অফ। আমরা আরেকটা তালিকা বানাচ্ছি না — আমরা প্রমাণ বানাচ্ছি।",
                }}
              />
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
