"use client";

import { ArrowRight, Check, Info } from "lucide-react";
import { Button, Reveal, SectionHead } from "@/components/ui";
import { T, useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const TIERS = [
  {
    key: "micro",
    name: { en: "Micro-task", bn: "মাইক্রো-টাস্ক" },
    price: "৳500 – ৳2,000",
    unit: { en: "per task · delivered in 24–72 hours", bn: "প্রতি টাস্ক · ২৪–৭২ ঘণ্টায় ডেলিভারি" },
    line: { en: "For a business that has never paid a student before.", bn: "যে ব্যবসা আগে কখনো কোনো ছাত্রকে টাকা দেয়নি, তার জন্য।" },
    features: {
      en: [
        "Single, tightly-scoped deliverable",
        "Mentor-supervised, rubric-checked",
        "Fixed price known before you commit",
        "No account, no subscription, no minimum",
      ],
      bn: [
        "একটি মাত্র, নির্দিষ্ট স্কোপের ডেলিভারেবল",
        "মেন্টর-সুপারভাইজড, রুব্রিক-যাচাইকৃত",
        "কমিট করার আগেই নির্ধারিত দাম জানা",
        "কোনো অ্যাকাউন্ট, সাবস্ক্রিপশন বা ন্যূনতম নেই",
      ],
    },
    featured: false,
  },
  {
    key: "project",
    name: { en: "Project", bn: "প্রজেক্ট" },
    price: "৳3,000 – ৳25,000",
    unit: { en: "per project · split into priced tasks", bn: "প্রতি প্রজেক্ট · নির্ধারিত দামের টাস্কে ভাগ" },
    line: { en: "A real problem, decomposed and sequenced by the AI layer.", bn: "একটি বাস্তব সমস্যা, এআই লেয়ার দিয়ে ভাগ ও ক্রমে সাজানো।" },
    features: {
      en: [
        "AI scope reviewed by a human coordinator",
        "Task-by-task pricing, approve what you want",
        "Dedicated mentor sign-off on every milestone",
        "Direct connection to the graduate afterwards",
        "Revisions recorded, not quietly redone",
      ],
      bn: [
        "human coordinator-রিভিউড এআই স্কোপ",
        "টাস্কভিত্তিক দাম, যা চান তাই অনুমোদন করুন",
        "প্রতিটি মাইলফলকে নির্ধারিত মেন্টরের সাইন-অফ",
        "পরে গ্র্যাজুয়েটের সাথে সরাসরি সংযোগ",
        "রিভিশন নীরবে নয়, রেকর্ড করে করা হয়",
      ],
    },
    featured: true,
  },
  {
    key: "founder",
    name: { en: "Entrepreneur track", bn: "উদ্যোক্তা ট্র্যাক" },
    price: { en: "Phase 3", bn: "ফেজ ৩" },
    unit: { en: "milestone-based · pilot inside the micro-task layer", bn: "মাইলফলকভিত্তিক · মাইক্রো-টাস্ক লেয়ারের ভেতরে পাইলট" },
    line: { en: "For someone with an idea but no team and no capital.", bn: "যার আইডিয়া আছে কিন্তু টিম বা পুঁজি নেই, তার জন্য।" },
    features: {
      en: [
        "Mentor reviews and scopes the idea into measurable work",
        "Students build it at micro-task prices under supervision",
        "Every completed milestone recorded as a verified track record",
        "Consistent performers introduced to partner companies and angel networks",
      ],
      bn: [
        "মেন্টর আইডিয়া রিভিউ করে পরিমাপযোগ্য কাজে স্কোপ করেন",
        "শিক্ষার্থীরা সুপারভিশনে মাইক্রো-টাস্ক দামে সেটা বানান",
        "সম্পন্ন প্রতিটি মাইলফলক ভেরিফায়েড ট্র্যাক রেকর্ড হিসেবে সংরক্ষিত",
        "ধারাবাহিক ভালো ফলদাতাদের পার্টনার কোম্পানি ও এঞ্জেল নেটওয়ার্কের সাথে পরিচয়",
      ],
    },
    featured: false,
  },
];

const SPLIT = [
  { who: { en: "The student", bn: "শিক্ষার্থী" }, share: 75, note: { en: "Paid on client sign-off, not on submission", bn: "সাবমিশনে নয়, ক্লায়েন্ট সাইন-অফে পরিশোধ" } },
  { who: { en: "Mentor stipend", bn: "মেন্টর স্টাইপেন্ড" }, share: 10, note: { en: "Starts once revenue exists — promised up front", bn: "রেভিনিউ এলে শুরু — শুরুতেই প্রতিশ্রুত" } },
  { who: { en: "Platform & payments", bn: "প্ল্যাটফর্ম ও পেমেন্ট" }, share: 15, note: { en: "Coordination, verification, dispute handling", bn: "কোঅর্ডিনেশন, ভেরিফিকেশন, বিরোধ নিষ্পত্তি" } },
];

export default function Pricing() {
  const { t, tl } = useLang();

  return (
    <>
      <section className="py-16 md:py-20">
        <div className="shell grid items-stretch gap-5 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.key} delay={i * 70} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[20px] border p-8",
                  tier.featured ? "border-ink bg-ink text-white" : "border-line bg-white"
                )}
              >
                {tier.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-brand-500 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white">
                    <T v={{ en: "Most used", bn: "সবচেয়ে ব্যবহৃত" }} />
                  </span>
                )}
                <h3 className={cn("text-[15px] font-semibold tracking-[-0.02em]", tier.featured ? "text-white" : "text-ink")}>{t(tier.name)}</h3>
                <div
                  className={cn("num mt-4 text-[30px] font-semibold leading-none tracking-[-0.035em]", tier.featured ? "text-white" : "text-ink")}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {typeof tier.price === "string" ? tier.price : t(tier.price)}
                </div>
                <p className={cn("mt-2.5 text-[12.5px]", tier.featured ? "text-white/50" : "text-ink-4")}>{t(tier.unit)}</p>
                <p className={cn("mt-5 text-[14px] leading-relaxed", tier.featured ? "text-white/70" : "text-ink-3")}>{t(tier.line)}</p>

                <ul className={cn("mt-7 flex-1 space-y-3 border-t pt-6", tier.featured ? "border-white/10" : "border-line")}>
                  {tl(tier.features).map((f) => (
                    <li key={f} className={cn("flex items-start gap-2.5 text-[13.5px] leading-relaxed", tier.featured ? "text-white/80" : "text-ink-2")}>
                      <Check className={cn("mt-0.5 size-4 shrink-0", tier.featured ? "text-brand-400" : "text-brand-500")} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button
                    href="/app/client"
                    full
                    variant={tier.featured ? "primary" : "secondary"}
                    icon={<ArrowRight className="size-4" />}
                  >
                    <T v={{ en: "Post a problem", bn: "সমস্যা পোস্ট করুন" }} />
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-canvas-2/60 py-20 md:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal>
            <SectionHead
              eyebrow={{ en: "Where the money goes", bn: "টাকাটা কোথায় যায়" }}
              title={{ en: "Published, not buried in a terms page", bn: "প্রকাশিত, কোনো টার্মস পেজে লুকানো নয়" }}
              desc={{
                en: "A student who cannot see how a fee is split has no reason to trust the platform holding it. Neither does a mentor being asked to work for goodwill.",
                bn: "যে শিক্ষার্থী ফি কীভাবে ভাগ হয় দেখতে পান না, তার প্ল্যাটফর্মকে বিশ্বাস করার কারণ নেই। সদিচ্ছার বিনিময়ে কাজ করতে বলা মেন্টরেরও নেই।",
              }}
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-[20px] border border-line bg-white">
              {SPLIT.map((s) => (
                <div key={s.who.en} className="border-b border-line p-6 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] font-medium text-ink">{t(s.who)}</span>
                    <span className="num text-[22px] font-semibold tracking-[-0.03em] text-brand-600" style={{ fontFamily: "var(--font-display)" }}>
                      {s.share}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas-3">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${s.share}%` }} />
                  </div>
                  <p className="mt-2.5 text-[12.5px] text-ink-4">{t(s.note)}</p>
                </div>
              ))}
              <div className="flex items-start gap-2.5 bg-canvas-2/70 p-5">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-4" />
                <p className="text-[12.5px] leading-relaxed text-ink-3">
                  <T
                    v={{
                      en: "Indicative split for the demo. During Phase 0 the platform takes nothing — the whole point of that phase is to find out whether a business will pay at all.",
                      bn: "ডেমোর জন্য নির্দেশক ভাগ। ফেজ ০-তে প্ল্যাটফর্ম কিছুই নেয় না — সেই ফেজের পুরো উদ্দেশ্যই হলো জানা, একটা ব্যবসা আদৌ টাকা দেবে কিনা।",
                    }}
                  />
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
