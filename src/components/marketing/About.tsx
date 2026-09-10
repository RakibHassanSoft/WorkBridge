"use client";

import { AlertTriangle, ArrowRight, Building2, GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { NEXT_STEPS, RISKS } from "@/data/roadmap";
import { T, useLang, useNum } from "@/lib/i18n";

const IMPACT = [
  {
    icon: GraduationCap,
    t: { en: "A data layer universities can actually use", bn: "ইউনিভার্সিটিগুলো সত্যিই ব্যবহার করতে পারে এমন ডেটা লেয়ার" },
    d: {
      en: "Which department at which university produces graduates who do well at which kind of work, and which skills the market is actually paying for — the feedback loop that curriculum reform has never had.",
      bn: "কোন বিশ্ববিদ্যালয়ের কোন বিভাগের গ্র্যাজুয়েট কোন ধরনের কাজে ভালো করছেন, আর বাজার আসলে কোন স্কিলের জন্য টাকা দিচ্ছে — কারিকুলাম সংস্কারে যে ফিডব্যাক লুপটা কখনো ছিল না।",
    },
  },
  {
    icon: Building2,
    t: { en: "A staffing channel SMEs do not currently have", bn: "এসএমই-দের জন্য এমন একটি স্টাফিং চ্যানেল যা এখন নেই" },
    d: {
      en: "Large companies can afford a recruitment process. A nine-person boutique cannot. Affordable staffing augmentation for small businesses barely exists in Bangladesh today.",
      bn: "বড় কোম্পানির রিক্রুটমেন্ট প্রক্রিয়া চালানোর সামর্থ্য আছে। নয় জনের একটা বুটিকের নেই। ছোট ব্যবসার জন্য সাশ্রয়ী staffing augmentation বাংলাদেশে আজ কার্যত নেই।",
    },
  },
  {
    icon: ShieldCheck,
    t: { en: "Success measured after the hire, not at it", bn: "সাফল্যের মাপ নিয়োগের সময় নয়, তার পরে" },
    d: {
      en: "Almost every platform stops at placement. Getting hired and staying hired are different problems in Bangladesh — so 30, 60 and 90-day check-ins, real salary information and honest exit reasons feed back into future matching.",
      bn: "প্রায় সব প্ল্যাটফর্ম প্লেসমেন্টেই থেমে যায়। বাংলাদেশে চাকরি পাওয়া আর চাকরিতে টিকে থাকা আলাদা সমস্যা — তাই ৩০, ৬০ ও ৯০ দিনের চেক-ইন, বাস্তব বেতন তথ্য আর সৎ exit কারণ ভবিষ্যতের ম্যাচিংয়ে ফিরে আসে।",
    },
  },
];

const PARTNERS = [
  { name: "BASIS", note: { en: "IT & software", bn: "আইটি ও সফটওয়্যার" } },
  { name: "DCCI", note: { en: "Business & commerce", bn: "বিজনেস ও কমার্স" } },
  { name: "FBCCI", note: { en: "Industry federation", bn: "ইন্ডাস্ট্রি ফেডারেশন" } },
  { name: "ICAB", note: { en: "Accounting", bn: "অ্যাকাউন্টিং" } },
  { name: "IEB", note: { en: "Engineering", bn: "ইঞ্জিনিয়ারিং" } },
  { name: "e-CAB", note: { en: "E-commerce", bn: "ই-কমার্স" } },
];

export default function About() {
  const { t } = useLang();
  const n = useNum();

  return (
    <>
      {/* Impact */}
      <section className="py-20 md:py-24">
        <div className="shell">
          <Reveal>
            <SectionHead
              eyebrow={{ en: "Long term", bn: "দীর্ঘমেয়াদে" }}
              title={{ en: "What this changes if it works", bn: "কাজ করলে এটা যা বদলে দেবে" }}
              desc={{
                en: "In the long run WorkBridge is less a marketplace than a data layer — a record of who can actually do what, and what the market is really buying.",
                bn: "দীর্ঘমেয়াদে WorkBridge মার্কেটপ্লেসের চেয়ে বেশি একটা ডেটা লেয়ার — কে আসলে কী পারে, আর বাজার সত্যিই কী কিনছে, তার রেকর্ড।",
              }}
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {IMPACT.map((x, i) => (
              <Reveal key={x.t.en} delay={i * 70}>
                <div className="h-full rounded-[18px] border border-line bg-white p-7">
                  <span className="grid size-10 place-items-center rounded-[11px] bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <x.icon className="size-[18px]" />
                  </span>
                  <h3 className="mt-5 text-[16.5px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(x.t)}</h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">{t(x.d)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Risks */}
      <section id="risks" className="scroll-mt-24 border-y border-line bg-canvas-2/60 py-20 md:py-24">
        <div className="shell">
          <Reveal>
            <SectionHead
              eyebrow={{ en: "Risks", bn: "ঝুঁকি" }}
              title={{ en: "The five ways this fails, and what we do about each", bn: "যে পাঁচভাবে এটা ব্যর্থ হতে পারে, আর প্রতিটির জন্য যা করা হচ্ছে" }}
            />
          </Reveal>

          <Reveal delay={80} className="mt-12 overflow-hidden rounded-[20px] border border-line bg-white">
            <div className="hidden grid-cols-[1fr_1.3fr] gap-8 border-b border-line bg-canvas-2/70 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4 md:grid">
              <span>
                <T v={{ en: "Risk", bn: "ঝুঁকি" }} />
              </span>
              <span>
                <T v={{ en: "Mitigation", bn: "সমাধান" }} />
              </span>
            </div>
            {RISKS.map((r) => (
              <div key={r.risk.en} className="grid gap-3 border-b border-line px-7 py-6 last:border-b-0 md:grid-cols-[1fr_1.3fr] md:gap-8">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                  <span className="text-[14px] font-medium leading-snug text-ink">{t(r.risk)}</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink-3 md:pl-0">{t(r.fix)}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Next steps + partners */}
      <section id="partners" className="scroll-mt-24 py-20 md:py-24">
        <div className="shell grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHead eyebrow={{ en: "Next steps", bn: "পরের ধাপ" }} title={{ en: "What happens before anything is built", bn: "কিছু বানানোর আগে যা হবে" }} />
            <ol className="mt-8 space-y-3">
              {NEXT_STEPS.map((s, i) => (
                <li key={s.en} className="flex items-start gap-4 rounded-[14px] border border-line bg-white p-5">
                  <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-100">
                    {n(i + 1)}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-ink-2">{t(s)}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={80}>
            <SectionHead
              eyebrow={{ en: "Partners", bn: "পার্টনার" }}
              title={{ en: "Trust is borrowed before it is earned", bn: "বিশ্বাস অর্জনের আগে ধার করতে হয়" }}
              desc={{
                en: "A business will pay an unknown platform far more readily when a body it already knows vouches for it. That is the cheapest trust available to a new project.",
                bn: "একটা ব্যবসা অপরিচিত প্ল্যাটফর্মে অনেক সহজে টাকা দেয়, যখন তার চেনা কোনো সংগঠন সেটার জন্য দাঁড়ায়। নতুন প্রজেক্টের জন্য এটাই সবচেয়ে সস্তা বিশ্বাস।",
              }}
            />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PARTNERS.map((p) => (
                <div key={p.name} className="rounded-[14px] border border-line bg-white px-4 py-5 text-center">
                  <div className="text-[16px] font-semibold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                    {p.name}
                  </div>
                  <div className="mt-1 text-[11.5px] text-ink-4">{t(p.note)}</div>
                </div>
              ))}
            </div>

            <div id="contact" className="mt-8 scroll-mt-24 rounded-[18px] border border-line bg-ink p-7 text-white">
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-brand-400" />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  <T v={{ en: "Get involved", bn: "যুক্ত হোন" }} />
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-white/75">
                <T
                  v={{
                    en: "Phase 0 needs one partner university department and fifteen to twenty target SMEs. If you can open either of those doors, that is the single most useful thing anyone can do right now.",
                    bn: "ফেজ ০-র জন্য দরকার একটি পার্টনার বিশ্ববিদ্যালয়ের বিভাগ আর পনেরো থেকে বিশটি টার্গেট এসএমই। এই দুটোর যেকোনো একটার দরজা খুলে দিতে পারলে, এই মুহূর্তে সেটাই সবচেয়ে কাজের সাহায্য।",
                  }}
                />
              </p>
              <a
                href="mailto:hello@workbridge.bd"
                className="group mt-6 inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-3 text-[14px] font-medium text-ink transition-all hover:-translate-y-px"
              >
                hello@workbridge.bd
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
