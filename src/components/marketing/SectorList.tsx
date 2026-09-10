"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { SECTORS } from "@/data/sectors";
import { T, useLang, useNum } from "@/lib/i18n";

export default function SectorList() {
  const { t, tl } = useLang();
  const n = useNum();

  return (
    <section className="py-16 md:py-20">
      <div className="shell space-y-4">
        {SECTORS.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 50}>
            <article id={s.id} className="scroll-mt-24 overflow-hidden rounded-[20px] border border-line bg-white">
              <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 lg:p-10">
                <div>
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-[13px] text-white" style={{ background: s.accent }}>
                      <SectorIcon name={s.icon} className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.025em] text-ink">{t(s.name)}</h2>
                      <p className="mt-1 text-[13.5px] text-ink-3">{t(s.tagline)}</p>
                    </div>
                  </div>

                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-[13px]">
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "Who it's for", bn: "কাদের জন্য" }} />
                      </dt>
                      <dd className="mt-1.5 text-ink-2">{t(s.disciplines)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "Partner bodies", bn: "পার্টনার সংগঠন" }} />
                      </dt>
                      <dd className="mt-1.5 text-ink-2">{s.partners.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "Open tasks", bn: "খোলা টাস্ক" }} />
                      </dt>
                      <dd className="num mt-1.5 font-medium text-ink">{n(s.openTasks)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "Average fee", bn: "গড় ফি" }} />
                      </dt>
                      <dd className="num mt-1.5 font-medium text-brand-600">{s.avgFee}</dd>
                    </div>
                  </dl>

                  <Link
                    href={`/tasks?sector=${s.id}`}
                    className="group mt-6 inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-3.5 py-2.5 text-[13px] font-medium text-white transition-all hover:-translate-y-px hover:bg-ink-2"
                  >
                    <T v={{ en: "See open tasks in this sector", bn: "এই সেক্টরের খোলা টাস্ক দেখুন" }} />
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <T v={{ en: "Verification rubric", bn: "ভেরিফিকেশন রুব্রিক" }} />
                    </h3>
                    <ol className="mt-3 space-y-2">
                      {tl(s.rubric).map((r, j) => (
                        <li key={r} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                          <span className="num mt-px w-4 shrink-0 text-[11px] font-semibold text-brand-400">{n(j + 1)}</span>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <T v={{ en: "Typical work", bn: "সাধারণ কাজ" }} />
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {tl(s.sampleWork).map((w) => (
                        <li key={w} className="rounded-lg bg-canvas-2 px-3 py-2 text-[12.5px] leading-snug text-ink-2 ring-1 ring-line">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
