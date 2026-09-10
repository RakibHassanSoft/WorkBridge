"use client";

import { Reveal, SectionHead } from "@/components/ui";
import { T } from "@/lib/i18n";

const POINTS = [
  {
    t: { en: "Will a business really pay an unproven student?", bn: "একটা ব্যবসা কি সত্যিই একজন অপরীক্ষিত ছাত্রকে টাকা দেবে?" },
    d: {
      en: "You cannot answer this with a survey or a landing page. You answer it by taking money — small money, real money — from a real business in Phase 0.",
      bn: "এটা কোনো সার্ভে বা ল্যান্ডিং পেজ দিয়ে যাচাই করা যায় না। ফেজ ০-তে একটা বাস্তব ব্যবসার কাছ থেকে ছোট হলেও বাস্তব টাকা নিয়েই এর উত্তর মেলে।",
    },
  },
  {
    t: { en: "Can the student reliably deliver?", bn: "ছাত্র কি নির্ভরযোগ্যভাবে ডেলিভার করতে পারবে?" },
    d: {
      en: "Teams, scaling, AI scoping — all of it is meaningless if this one belief fails at the first step. So we test the first step alone.",
      bn: "টিম, স্কেলিং, এআই স্কোপিং — এসবই অর্থহীন, যদি প্রথম ধাপেই এই বিশ্বাসটা ভেঙে যায়। তাই আমরা কেবল প্রথম ধাপটাই পরীক্ষা করি।",
    },
  },
  {
    t: { en: "Four-sided ecosystems die at launch", bn: "চার-পাক্ষিক ইকোসিস্টেম লঞ্চেই মরে" },
    d: {
      en: "Businesses, students, mentors and universities all at once is the standard failure pattern for marketplaces. You bootstrap one side first.",
      bn: "ব্যবসা, ছাত্র, মেন্টর ও ইউনিভার্সিটি একসাথে — এটাই মার্কেটপ্লেসের চেনা ব্যর্থতার প্যাটার্ন। একটা পক্ষ দিয়ে বুটস্ট্র্যাপ করতে হয়।",
    },
  },
  {
    t: { en: "Commits and PRs are not proof", bn: "কমিট আর পিআর কোনো প্রমাণ না" },
    d: {
      en: "Activity counts are trivially gamed and say nothing about who actually contributed what inside a team. Verification has to be human and specific.",
      bn: "অ্যাক্টিভিটি কাউন্ট সহজেই গেম করা যায় এবং টিমের ভেতরে কে আসলে কী করেছে তা বলে না। ভেরিফিকেশন মানুষকেই করতে হবে, নির্দিষ্টভাবে।",
    },
  },
  {
    t: { en: "Unpaid mentors evaporate", bn: "বিনা পারিশ্রমিকের মেন্টর হারিয়ে যান" },
    d: {
      en: "Multiple similar programmes have watched mentor supply dry up. Mentors get referral rights and hiring priority from day one, stipends once revenue exists.",
      bn: "একাধিক সমজাতীয় প্রোগ্রামে মেন্টর সাপ্লাই শুকিয়ে যেতে দেখা গেছে। মেন্টররা প্রথম দিন থেকেই রেফারেল ও হায়ারিং প্রায়োরিটি পান, রেভিনিউ এলে স্টাইপেন্ড।",
    },
  },
];

export default function TurningPoints() {
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              eyebrow={{ en: "Turning points", bn: "টার্নিং পয়েন্ট" }}
              title={{ en: "Five realisations that shrank the plan — on purpose", bn: "পাঁচটি উপলব্ধি, যা পরিকল্পনাটা ইচ্ছে করেই ছোট করেছে" }}
              desc={{
                en: "Version one of this project planned to launch everything at once: AI scoping, a matching engine, a proof-of-work passport, university dashboards. Then reality intervened.",
                bn: "এই প্রজেক্টের প্রথম ভার্সনে সব একসাথে লঞ্চের পরিকল্পনা ছিল — এআই স্কোপিং, ম্যাচিং ইঞ্জিন, প্রুফ-অফ-ওয়ার্ক পাসপোর্ট, ইউনিভার্সিটি ড্যাশবোর্ড। তারপর বাস্তবতা বাধ সাধল।",
              }}
            />
            <div className="mt-8 rounded-[16px] border border-line bg-canvas-2 p-5 text-[13.5px] leading-relaxed text-ink-2">
              <T
                v={{
                  en: "The result: go small, prove it with money, and grow only where the evidence allows.",
                  bn: "ফলাফল: ছোট থেকে শুরু, টাকা দিয়ে প্রমাণ, আর কেবল সেখানেই বড় হওয়া যেখানে প্রমাণ অনুমতি দেয়।",
                }}
              />
            </div>
          </Reveal>

          <ol className="space-y-3">
            {POINTS.map((p, i) => (
              <Reveal key={p.t.en} delay={i * 60}>
                <li className="group relative flex gap-5 rounded-[18px] border border-line bg-white p-6 transition-all duration-400 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(10,14,12,.05),0_20px_40px_-26px_rgba(10,14,12,.25)]">
                  <span
                    className="num shrink-0 text-[13px] font-semibold text-brand-300 transition-colors group-hover:text-brand-500"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    0{i + 1}
                  </span>
                  <span>
                    <h3 className="text-[16.5px] font-semibold tracking-[-0.02em] text-ink">
                      <T v={p.t} />
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-3">
                      <T v={p.d} />
                    </p>
                  </span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
