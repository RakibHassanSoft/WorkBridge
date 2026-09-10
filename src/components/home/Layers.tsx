"use client";

import { Banknote, Boxes, Lightbulb, LineChart, ShieldCheck, Zap } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { T, useLang } from "@/lib/i18n";

const LAYERS = [
  {
    tone: "brand",
    icon: Zap,
    tag: { en: "Entry ramp", bn: "প্রবেশের ধাপ" },
    title: { en: "The micro-task layer", bn: "মাইক্রো-টাস্ক লেয়ার" },
    price: { en: "৳500 – ৳2,000 · delivered in 24–72 hours", bn: "৳৫০০ – ৳২,০০০ · ২৪–৭২ ঘণ্টায় ডেলিভারি" },
    desc: {
      en: "For a business that has never paid a student before, the risk has to be almost zero. Small scope, fixed price, coordinator-checked — cheap enough that trying it once is an easy decision.",
      bn: "যে ব্যবসা আগে কখনো কোনো ছাত্রকে টাকা দিয়ে কাজ করায়নি, তার জন্য ঝুঁকি প্রায় শূন্য হতে হবে। ছোট স্কোপ, নির্দিষ্ট দাম, মেন্টর-সুপারভাইজড — এতটাই সাশ্রয়ী যে একবার চেষ্টা করা সহজ সিদ্ধান্ত।",
    },
    points: {
      en: [
        "A batch of social posts, basic bookkeeping, data entry, a set of product descriptions",
        "This is the funnel: micro-task → repeat micro-task → full project → long-term hire",
        "Cold-start slots reserved so a student with no history can still land a first task",
      ],
      bn: [
        "একগুচ্ছ সোশ্যাল পোস্ট, বেসিক বুককিপিং, ডেটা এন্ট্রি, প্রোডাক্ট ডেসক্রিপশনের সেট",
        "এটাই ফানেল: মাইক্রো-টাস্ক → রিপিট মাইক্রো-টাস্ক → পূর্ণ প্রজেক্ট → দীর্ঘমেয়াদি চাকরি",
        "কোল্ড-স্টার্ট স্লট সংরক্ষিত, যাতে ইতিহাসহীন শিক্ষার্থীও প্রথম টাস্ক পান",
      ],
    },
  },
  {
    tone: "ink",
    icon: Lightbulb,
    tag: { en: "Phase 3 layer", bn: "ফেজ ৩ লেয়ার" },
    title: { en: "The micro-entrepreneur layer", bn: "ক্ষুদ্র উদ্যোক্তা লেয়ার" },
    price: { en: "Idea in, scoped, student-built, investor-visible", bn: "আইডিয়া আসে, পরিধি ঠিক হয়, শিক্ষার্থী বানান, বিনিয়োগকারী দেখেন" },
    desc: {
      en: "Not every founder has a team or capital. Someone with an idea submits it, a coordinator scopes it into something realistic and measurable, and students build it at micro-task prices.",
      bn: "প্রত্যেক উদ্যোক্তার টিম বা পুঁজি থাকে না। কারও একটা আইডিয়া থাকলে তিনি জমা দেন, মেন্টর সেটাকে বাস্তবসম্মত ও পরিমাপযোগ্য করে স্কোপ করেন, আর শিক্ষার্থীরা মাইক্রো-টাস্ক দামে সুপারভিশনে সেটা বানান।",
    },
    points: {
      en: [
        "Coordinator-reviewed scope so the work is realistic and measurable",
        "Every completed milestone recorded as a verified track record",
        "Ideas that consistently deliver get introduced to partner companies and angel networks",
      ],
      bn: [
        "মেন্টর-রিভিউড স্কোপ, যাতে কাজটা বাস্তবসম্মত ও পরিমাপযোগ্য হয়",
        "সম্পন্ন প্রতিটি মাইলফলক ভেরিফায়েড ট্র্যাক রেকর্ড হিসেবে সংরক্ষিত",
        "যেসব আইডিয়া ধারাবাহিকভাবে ফল দেয়, তাদের পার্টনার কোম্পানি ও এঞ্জেল নেটওয়ার্কের সাথে পরিচয় করানো হয়",
      ],
    },
  },
];

const MICRO_ICONS = [Boxes, Banknote, LineChart, ShieldCheck];

export default function Layers() {
  const { t, tl } = useLang();
  return (
    <section className="border-y border-line bg-canvas-2/60 py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "Two entry points", bn: "দুটি প্রবেশপথ" }}
            title={{ en: "Lower the risk enough that the first 'yes' becomes easy", bn: "ঝুঁকি এত কমিয়ে আনুন যাতে প্রথম 'হ্যাঁ' বলা সহজ হয়" }}
            desc={{
              en: "A marketplace does not fail because the idea is wrong. It fails because the first transaction is too frightening for someone to make.",
              bn: "মার্কেটপ্লেস আইডিয়া ভুল বলে ব্যর্থ হয় না। ব্যর্থ হয় কারণ প্রথম লেনদেনটা করতে কারও সাহস হয় না।",
            }}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {LAYERS.map((layer, i) => {
            const dark = layer.tone === "ink";
            return (
              <Reveal key={layer.title.en} delay={i * 90}>
                <div
                  className={`flex h-full flex-col rounded-[20px] border p-8 ${
                    dark ? "border-ink bg-ink text-white" : "border-line bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid size-10 place-items-center rounded-[11px] ${dark ? "bg-white/10 text-brand-300" : "bg-brand-600 text-white"}`}>
                      <layer.icon className="size-[18px]" />
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
                        dark ? "bg-white/10 text-white/70" : "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                      }`}
                    >
                      {t(layer.tag)}
                    </span>
                  </div>

                  <h3 className={`mt-6 text-[24px] font-semibold tracking-[-0.028em] ${dark ? "text-white" : "text-ink"}`}>{t(layer.title)}</h3>
                  <p className={`num mt-2 text-[13.5px] font-medium ${dark ? "text-brand-300" : "text-brand-600"}`}>{t(layer.price)}</p>
                  <p className={`mt-4 text-[14.5px] leading-relaxed ${dark ? "text-white/65" : "text-ink-3"}`}>{t(layer.desc)}</p>

                  <ul className={`mt-7 space-y-3 border-t pt-6 ${dark ? "border-white/10" : "border-line"}`}>
                    {tl(layer.points).map((p, j) => {
                      const Icon = MICRO_ICONS[j % MICRO_ICONS.length];
                      return (
                        <li key={p} className={`flex items-start gap-3 text-[13.5px] leading-relaxed ${dark ? "text-white/75" : "text-ink-2"}`}>
                          <Icon className={`mt-0.5 size-4 shrink-0 ${dark ? "text-brand-400" : "text-brand-500"}`} />
                          {p}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
