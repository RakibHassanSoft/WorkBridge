"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, GraduationCap, Star } from "lucide-react";
import { Reveal, Bar } from "@/components/ui";
import { T, useLang, useNum } from "@/lib/i18n";
import { STUDENTS } from "@/data/people";
import { EVALUATIONS } from "@/data/work";

const student = STUDENTS[0];
const ev = EVALUATIONS[0];

export default function PassportShowcase() {
  const { t } = useLang();
  const n = useNum();
  const total = ev.scores.reduce((a, s) => a + s.score, 0);
  const max = ev.scores.reduce((a, s) => a + s.max, 0);

  return (
    <section className="py-20 md:py-28">
      <div className="shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="eyebrow mb-3.5 flex items-center gap-2.5">
            <span className="h-px w-6 bg-brand-300" />
            <T v={{ en: "Proof of Work", bn: "প্রুফ অফ ওয়ার্ক" }} />
          </div>
          <h2 className="display-2 text-ink">
            <T v={{ en: "Writing “I can” is easy. “I did, and the client signed it” is not.", bn: "“আমি পারি” লেখা সহজ। “আমি করেছি, আর ক্লায়েন্ট সাইন করেছেন” — সেটা নয়।" }} />
          </h2>
          <p className="mt-5 text-[16.5px] leading-relaxed text-ink-3">
            <T
              v={{
                en: "Every signed-off task becomes a line on a public record the graduate owns — the sector rubric it was scored against, the mentor who checked it, and the business that paid for it. It travels: a verified badge on a job board profile, a real client sign-off instead of a courtesy recommendation.",
                bn: "সাইন-অফ হওয়া প্রতিটি টাস্ক একটি পাবলিক রেকর্ডে যুক্ত হয়, যার মালিক গ্র্যাজুয়েট নিজে — কোন সেক্টর রুব্রিকে মূল্যায়ন হয়েছে, কোন মেন্টর যাচাই করেছেন, আর কোন ব্যবসা টাকা দিয়েছে। এটা সাথে যায়: জব বোর্ড প্রোফাইলে ভেরিফায়েড ব্যাজ, সৌজন্যমূলক রেকমেন্ডেশনের বদলে real ক্লায়েন্টের সাইন-অফ।",
              }}
            />
          </p>
          <div className="mt-8">
            <Link
              href={`/passport/${student.slug}`}
              className="group inline-flex items-center gap-2 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-px hover:bg-ink-2"
            >
              <T v={{ en: "Open a live passport", bn: "একটি লাইভ পাসপোর্ট দেখুন" }} />
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative">
            <div aria-hidden className="absolute -inset-3 -z-10 rounded-[28px] bg-brand-100/40 blur-2xl" />
            <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(10,14,12,.05),0_30px_60px_-32px_rgba(10,14,12,.28)]">
              <div className="flex items-start justify-between gap-4 border-b border-line bg-canvas-2/60 p-6">
                <div className="flex items-center gap-3.5">
                  <span className="grid size-12 place-items-center rounded-full bg-brand-600 text-[15px] font-semibold text-white">NJ</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15.5px] font-semibold text-ink">{t(student.name)}</span>
                      <BadgeCheck className="size-4 text-brand-600" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-4">
                      <GraduationCap className="size-3.5" />
                      {t(student.university)}
                    </div>
                  </div>
                </div>
                <span className="num flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-ink ring-1 ring-line">
                  <Star className="size-3.5 fill-brand-500 text-brand-500" />
                  {n(student.rating)}
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
                {[
                  { v: n(student.verified), l: { en: "verified tasks", bn: "ভেরিফায়েড টাস্ক" } },
                  { v: `${n(student.onTime)}%`, l: { en: "on time", bn: "সময়মতো" } },
                  { v: `৳${n(student.earned.toLocaleString("en-US"))}`, l: { en: "earned", bn: "আয়" } },
                ].map((s) => (
                  <div key={s.l.en} className="p-4 text-center">
                    <div className="num text-[19px] font-semibold text-ink">{s.v}</div>
                    <div className="mt-0.5 text-[11px] text-ink-4">
                      <T v={s.l} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <T v={{ en: "Latest verified entry", bn: "সর্বশেষ ভেরিফায়েড এন্ট্রি" }} />
                  </span>
                  <span className="num rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 ring-1 ring-brand-100">
                    {n(total)}/{n(max)}
                  </span>
                </div>

                <h3 className="mt-3 text-[15.5px] font-semibold leading-snug text-ink">
                  <T v={{ en: "Fix the payment callback and add error messaging", bn: "পেমেন্ট কলব্যাক ঠিক করা ও এরর মেসেজ যোগ করা" }} />
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-4">
                  <Building2 className="size-3.5" />
                  <T v={{ en: "Nokshi Threads · Boutique retail, Dhaka", bn: "নকশী থ্রেডস · বুটিক রিটেইল, ঢাকা" }} />
                </p>

                <div className="mt-5 space-y-2.5">
                  {ev.scores.map((s) => (
                    <div key={s.dim.en}>
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-ink-3">{t(s.dim)}</span>
                        <span className="num font-medium text-ink">
                          {n(s.score)}/{n(s.max)}
                        </span>
                      </div>
                      <Bar value={(s.score / s.max) * 100} />
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[12px] border border-line bg-canvas-2/70 p-4">
                  <p className="text-[12.5px] leading-relaxed text-ink-2">&ldquo;{t(ev.clientNote!)}&rdquo;</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-4">
                    <BadgeCheck className="size-3.5 text-brand-600" />
                    <T v={{ en: "Client sign-off + mentor review complete", bn: "ক্লায়েন্ট সাইন-অফ ও মেন্টর রিভিউ সম্পন্ন" }} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
