"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { SECTORS } from "@/data/sectors";
import { T, useLang, useNum } from "@/lib/i18n";

export default function Sectors() {
  const { t } = useLang();
  const n = useNum();

  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHead
              eyebrow={{ en: "Every discipline", bn: "সব ডিসিপ্লিন" }}
              title={{ en: "Nine sectors. One structure underneath all of them.", bn: "নয়টি সেক্টর। সবগুলোর নিচে একটাই কাঠামো।" }}
              desc={{
                en: "The pilot starts in one vertical to keep validation honest — but the rubric, profile and matching logic were built vertical-agnostic from day one, so expansion is a rollout, not a rebuild.",
                bn: "যাচাই সৎ রাখতে পাইলট শুরু একটি ভার্টিকাল দিয়ে — কিন্তু রুব্রিক, প্রোফাইল ও ম্যাচিং লজিক প্রথম দিন থেকেই vertical-agnostic, তাই সম্প্রসারণ মানে নতুন করে বানানো নয়, কেবল চালু করা।",
              }}
            />
          </Reveal>
          <Reveal delay={80}>
            <Link href="/sectors" className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-600">
              <T v={{ en: "Sector rubrics & sample work", bn: "সেক্টর রুব্রিক ও নমুনা কাজ" }} />
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 60}>
              <Link
                href={`/tasks?sector=${s.id}`}
                className="group flex h-full flex-col rounded-[18px] border border-line bg-white p-6 transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(10,14,12,.05),0_22px_44px_-24px_rgba(10,14,12,.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-[11px] text-white transition-transform duration-400 group-hover:scale-105"
                    style={{ background: s.accent }}
                  >
                    <SectorIcon name={s.icon} className="size-[18px]" />
                  </span>
                  <span className="num rounded-full bg-canvas-2 px-2.5 py-1 text-[11px] font-medium text-ink-3 ring-1 ring-line">
                    {n(s.openTasks)} <T v={{ en: "open", bn: "খোলা" }} />
                  </span>
                </div>

                <h3 className="mt-5 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(s.name)}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-3">{t(s.tagline)}</p>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[12px] text-ink-4">
                  <span className="truncate pr-3">{t(s.disciplines)}</span>
                  <span className="num shrink-0 font-medium text-brand-600">{s.avgFee}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
