"use client";

import { FileWarning, ScanSearch, ShieldQuestion } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { T } from "@/lib/i18n";

const NUMBERS = [
  {
    v: "~700k",
    l: { en: "graduates a year", bn: "গ্র্যাজুয়েট প্রতি বছর" },
    s: { en: "entering the Bangladeshi job market", bn: "বাংলাদেশের চাকরির বাজারে প্রবেশ করছেন" },
  },
  {
    v: "~300k",
    l: { en: "jobs created", bn: "চাকরি তৈরি হচ্ছে" },
    s: { en: "leaving a gap of roughly 400,000 every year", bn: "প্রতি বছর প্রায় ৪ লাখের ফারাক থেকে যাচ্ছে" },
  },
  {
    v: "14%",
    l: { en: "private-university unemployment", bn: "বেসরকারি বিশ্ববিদ্যালয়ে বেকারত্ব" },
    s: { en: "among graduates", bn: "গ্র্যাজুয়েটদের মধ্যে" },
  },
  {
    v: "29–35%",
    l: { en: "public & national university", bn: "পাবলিক ও ন্যাশনাল ইউনিভার্সিটি" },
    s: { en: "graduate unemployment", bn: "গ্র্যাজুয়েট বেকারত্ব" },
  },
];

const FAILURES = [
  {
    icon: FileWarning,
    t: { en: "Certificates, not evidence", bn: "সার্টিফিকেট আছে, প্রমাণ নেই" },
    d: {
      en: "Employers say the same thing over and over: the degree is there, the practical skill and work history are not. Nobody can tell whether a graduate can actually deliver.",
      bn: "নিয়োগকর্তারা বারবার একই কথা বলেন — ডিগ্রি আছে, প্র্যাকটিক্যাল স্কিল আর কাজের ইতিহাস নেই। একজন গ্র্যাজুয়েট আসলে কাজ ডেলিভার করতে পারবেন কিনা, কেউ বলতে পারে না।",
    },
  },
  {
    icon: ScanSearch,
    t: { en: "Curriculum drifting from the market", bn: "কারিকুলাম বাজার থেকে দূরে" },
    d: {
      en: "This is not a talent problem. It is a disconnect between what universities teach and what the market is actually buying — and no feedback loop between the two.",
      bn: "এটা মেধার সমস্যা না। এটা বিশ্ববিদ্যালয় যা শেখায় আর বাজার যা কেনে — তার মধ্যে সংযোগহীনতা, আর দুইয়ের মাঝে কোনো ফিডব্যাক লুপ নেই।",
    },
  },
  {
    icon: ShieldQuestion,
    t: { en: "Nobody verifies anything", bn: "কেউ কিছু যাচাই করে না" },
    d: {
      en: "Skills programmes train. Career offices advise. Job boards list. Not one of them checks whether a graduate has ever completed real, paid work for a real client.",
      bn: "স্কিল প্রোগ্রাম ট্রেনিং দেয়। ক্যারিয়ার অফিস পরামর্শ দেয়। জব বোর্ড তালিকা করে। কিন্তু কেউ যাচাই করে না, একজন গ্র্যাজুয়েট কখনো real ক্লায়েন্টের বাস্তব, পেইড কাজ শেষ করেছেন কিনা।",
    },
  },
];

export default function Problem() {
  return (
    <section className="border-y border-line bg-canvas-2/60 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "The gap", bn: "যে ফাঁকটা" }}
            title={{ en: "The problem isn't talent. It's that nobody can prove it.", bn: "সমস্যাটা মেধার না। সমস্যাটা হলো, কেউ সেটা প্রমাণ করতে পারে না।" }}
            desc={{
              en: "Every year the arithmetic gets worse, and every year the reason employers give stays exactly the same.",
              bn: "প্রতি বছর হিসাবটা আরও খারাপ হয়, আর প্রতি বছর নিয়োগকর্তাদের কারণটা হুবহু একই থাকে।",
            }}
          />
        </Reveal>

        <Reveal delay={80} className="mt-14 grid gap-8 rounded-[20px] border border-line bg-white p-8 sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
          {NUMBERS.map((n) => (
            <div key={n.v}>
              <div className="num text-[34px] font-semibold leading-none tracking-[-0.04em] text-brand-600" style={{ fontFamily: "var(--font-display)" }}>
                {n.v}
              </div>
              <div className="mt-2.5 text-[14px] font-medium text-ink">
                <T v={n.l} />
              </div>
              <div className="mt-1 text-[12.5px] leading-relaxed text-ink-4">
                <T v={n.s} />
              </div>
            </div>
          ))}
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {FAILURES.map((f, i) => (
            <Reveal key={f.t.en} delay={100 + i * 70}>
              <div className="h-full rounded-[18px] border border-line bg-white p-6">
                <span className="grid size-10 place-items-center rounded-[11px] bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <f.icon className="size-[18px]" />
                </span>
                <h3 className="mt-5 text-[16.5px] font-semibold tracking-[-0.02em] text-ink">
                  <T v={f.t} />
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-3">
                  <T v={f.d} />
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
