"use client";

import { Flag, Lock } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { PHASES } from "@/data/roadmap";
import { T, useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export default function Roadmap() {
  const { t, tl } = useLang();

  return (
    <section id="roadmap" className="py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "Roadmap", bn: "রোডম্যাপ" }}
            title={{ en: "Each phase has to earn the next one", bn: "প্রতিটি ফেজকে পরেরটি অর্জন করতে হয়" }}
            desc={{
              en: "This is not a build plan. It is a sequence of things that could disprove the idea, ordered so the cheapest disproof comes first.",
              bn: "এটা কোনো বিল্ড প্ল্যান নয়। এটা এমন কিছু বিষয়ের ক্রম, যেগুলো আইডিয়াটাকে ভুল প্রমাণ করতে পারে — সবচেয়ে সস্তা পরীক্ষাটা আগে রেখে সাজানো।",
            }}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {PHASES.map((p, i) => (
            <Reveal key={p.key} delay={i * 70}>
              <article
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-[20px] border p-7",
                  p.state === "live" ? "border-brand-300 bg-brand-50/40" : "border-line bg-white"
                )}
              >
                {p.state === "live" && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-500 to-brand-300" />
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
                        p.state === "live" ? "bg-brand-600 text-white" : "bg-canvas-3 text-ink-3"
                      )}
                    >
                      {t(p.label)}
                    </span>
                    <span className="num text-[12.5px] text-ink-4">{t(p.window)}</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11.5px] font-medium",
                      p.state === "live" ? "text-brand-700" : "text-ink-4"
                    )}
                  >
                    {p.state === "live" ? <Flag className="size-3.5" /> : <Lock className="size-3.5" />}
                    {p.state === "live" ? (
                      <T v={{ en: "Running now", bn: "এখন চলছে" }} />
                    ) : p.state === "next" ? (
                      <T v={{ en: "Next", bn: "পরবর্তী" }} />
                    ) : (
                      <T v={{ en: "Gated", bn: "শর্তাধীন" }} />
                    )}
                  </span>
                </div>

                <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.025em] text-ink">{t(p.title)}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-3">{t(p.desc)}</p>

                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {tl(p.ships).map((s) => (
                    <li key={s} className="rounded-lg bg-white px-2.5 py-1.5 text-[12px] text-ink-2 ring-1 ring-line">
                      {s}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-start gap-2.5 border-t border-line pt-5" style={{ marginTop: "1.75rem" }}>
                  <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                    <T v={{ en: "Gate", bn: "গেট" }} />
                  </span>
                  <p className="flex-1 text-[12.5px] leading-relaxed text-ink-2">{t(p.gate)}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
