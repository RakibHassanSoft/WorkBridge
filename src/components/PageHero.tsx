"use client";

import { Reveal } from "./ui";
import { T, type L } from "@/lib/i18n";

export default function PageHero({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: L;
  title: L;
  desc: L;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line pt-16 pb-16 md:pt-24 md:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-bg fade-mask-b absolute inset-x-0 top-0 h-[380px] opacity-60" />
        <div className="absolute left-1/2 top-[-160px] h-[340px] w-[760px] -translate-x-1/2 rounded-full bg-brand-100/45 blur-[100px]" />
      </div>
      <div className="shell">
        <Reveal className="max-w-[820px]">
          <div className="eyebrow mb-4 flex items-center gap-2.5">
            <span className="h-px w-6 bg-brand-300" />
            <T v={eyebrow} />
          </div>
          <h1 className="display-1 text-ink" style={{ fontSize: "clamp(2.2rem,4.6vw,3.6rem)" }}>
            <T v={title} />
          </h1>
          <p className="mt-6 max-w-[660px] text-[17px] leading-relaxed text-ink-3">
            <T v={desc} />
          </p>
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
