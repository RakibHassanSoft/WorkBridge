"use client";

import { Check, X } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { T, useLang } from "@/lib/i18n";

const DOES = {
  en: [
    "Reads a brief written in Bangla or English by someone with no scoping vocabulary",
    "Separates genuinely different problems that arrived in one paragraph",
    "Orders tasks by dependency, so the diagnostic step is paid for before anything is built on it",
    "Prices each task against the history of completed, signed-off work",
    "Writes acceptance criteria specific enough to score against",
    "Produces a shortlist with its reasoning attached, and reserves a cold-start slot",
  ],
  bn: [
    "স্কোপিং শব্দভাণ্ডার নেই এমন কারও বাংলা বা ইংরেজিতে লেখা ব্রিফ পড়ে",
    "এক অনুচ্ছেদে আসা সত্যিকারের আলাদা সমস্যাগুলো পৃথক করে",
    "নির্ভরতা অনুযায়ী টাস্ক সাজায়, যাতে নির্ণয়ের ধাপের জন্য আগে অর্থ দেওয়া হয়",
    "সম্পন্ন ও সাইন-অফ হওয়া কাজের ইতিহাসের সাথে মিলিয়ে প্রতিটি টাস্কের দাম ঠিক করে",
    "মূল্যায়নযোগ্য হওয়ার মতো নির্দিষ্ট গ্রহণযোগ্যতার শর্ত লেখে",
    "যুক্তিসহ শর্টলিস্ট দেয়, আর একটি কোল্ড-স্টার্ট স্লট সংরক্ষণ করে",
  ],
};

const DOESNT = {
  en: [
    "Decide who gets the work — a coordinator approves every shortlist",
    "Release a scope to a client or a student without human approval",
    "Score delivered work, or contribute to a verification decision in any way",
    "Run at all before 20–30 real completed projects exist as calibration data",
    "Judge a student on activity metrics, commits, or anything that can be gamed",
    "Hide what it does not know — unknowns are surfaced as risks, not smoothed over",
  ],
  bn: [
    "কে কাজ পাবে তা ঠিক করে না — প্রতিটি শর্টলিস্ট কোঅর্ডিনেটর অনুমোদন করেন",
    "মানুষের অনুমোদন ছাড়া ক্লায়েন্ট বা শিক্ষার্থীর কাছে কোনো স্কোপ ছাড়ে না",
    "ডেলিভার করা কাজ মূল্যায়ন করে না, ভেরিফিকেশন সিদ্ধান্তে কোনোভাবেই অংশ নেয় না",
    "২০–৩০টি বাস্তব সম্পন্ন প্রজেক্ট ক্যালিব্রেশন ডেটা হিসেবে না থাকা পর্যন্ত চলে না",
    "অ্যাক্টিভিটি মেট্রিক, কমিট বা গেম করা যায় এমন কিছু দিয়ে শিক্ষার্থীকে বিচার করে না",
    "যা জানে না তা লুকায় না — অজানা বিষয় ঝুঁকি হিসেবে সামনে আনা হয়, ঢাকা হয় না",
  ],
};

export default function EngineExplainer() {
  const { tl } = useLang();
  return (
    <section className="border-y border-line bg-canvas-2/60 py-20 md:py-24">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "Boundaries", bn: "সীমারেখা" }}
            title={{ en: "What the engine does — and what it is never allowed to do", bn: "ইঞ্জিন যা করে — আর যা করার অনুমতি কখনোই নেই" }}
            desc={{
              en: "The single most common way a product like this fails is confident nonsense produced before there was any real data to calibrate against. So the constraint is written into the roadmap, not left to good intentions.",
              bn: "এ ধরনের প্রোডাক্ট সবচেয়ে বেশি যেভাবে ব্যর্থ হয় — ক্যালিব্রেট করার মতো বাস্তব ডেটা থাকার আগেই আত্মবিশ্বাসী অর্থহীনতা তৈরি করে। তাই সীমাটা সদিচ্ছার ওপর ছাড়া হয়নি, রোডম্যাপেই লেখা আছে।",
            }}
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[20px] border border-line bg-white p-8">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-[10px] bg-brand-600 text-white">
                  <Check className="size-4" />
                </span>
                <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                  <T v={{ en: "What it does", bn: "যা করে" }} />
                </h3>
              </div>
              <ul className="mt-6 space-y-3.5">
                {tl(DOES).map((d) => (
                  <li key={d} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-ink-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="h-full rounded-[20px] border border-ink bg-ink p-8 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-[10px] bg-white/10 text-white">
                  <X className="size-4" />
                </span>
                <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                  <T v={{ en: "What it never does", bn: "যা কখনোই করে না" }} />
                </h3>
              </div>
              <ul className="mt-6 space-y-3.5">
                {tl(DOESNT).map((d) => (
                  <li key={d} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-white/75">
                    <X className="mt-0.5 size-4 shrink-0 text-white/35" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
