"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Copy,
  GraduationCap,
  Link2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Star,
  Target,
} from "lucide-react";
import { Bar, Button, Reveal } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { EVALUATIONS, TASKS, jobById } from "@/data/work";
import { clientById, reviewerById, studentBySlug } from "@/data/people";
import { sectorById } from "@/data/sectors";
import { T, useLang, useNum } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export default function Passport({ slug }: { slug: string }) {
  const { t, tl } = useLang();
  const n = useNum();
  const student = studentBySlug(slug)!;

  const entries = useMemo(() => {
    const mine = TASKS.filter((task) => task.assignee === student.id && task.status === "approved");
    return mine.map((task) => {
      const ev = EVALUATIONS.find((e) => e.taskId === task.id);
      const job = jobById(task.jobId)!;
      return { task, ev, job, client: clientById(job.clientId)! };
    });
  }, [student.id]);

  const scored = entries.filter((e) => e.ev);
  const avg =
    scored.length > 0
      ? scored.reduce((a, e) => a + e.ev!.scores.reduce((x, s) => x + s.score, 0) / e.ev!.scores.reduce((x, s) => x + s.max, 0), 0) / scored.length
      : student.rating / 5;

  const skillStrength = student.skills.slice(0, 5).map((s, i) => ({
    skill: s,
    value: Math.max(52, Math.min(97, Math.round(student.rating * 18 + 22 - i * 6))),
  }));

  return (
    <div className="pb-4">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line pt-14 pb-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-bg fade-mask-b absolute inset-x-0 top-0 h-[300px] opacity-60" />
          <div className="absolute left-1/2 top-[-180px] h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-brand-100/50 blur-[100px]" />
        </div>

        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-4">
              <Link href="/" className="transition-colors hover:text-ink">
                WorkBridge
              </Link>
              <span>/</span>
              <span>
                <T v={{ en: "Proof-of-Work passport", bn: "প্রুফ-অফ-ওয়ার্ক পাসপোর্ট" }} />
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-start gap-7">
              <span
                className="grid size-[84px] shrink-0 place-items-center rounded-[24px] text-[28px] font-semibold text-white"
                style={{ background: "linear-gradient(140deg,#0f7f52,#07402d)", fontFamily: "var(--font-display)" }}
              >
                {student.name.en
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                    {t(student.name)}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <BadgeCheck className="size-3.5" />
                    <T v={{ en: "Verified", bn: "ভেরিফায়েড" }} />
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-ink-4" />
                    {t(student.discipline)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-ink-4" />
                    {t(student.university)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-ink-4" />
                    {t(student.city)}
                  </span>
                </div>

                <p className="mt-4 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-3">{t(student.bio)}</p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {student.skills.map((s) => (
                    <span key={s} className="rounded-lg bg-white px-2.5 py-1.5 text-[12px] text-ink-2 ring-1 ring-line">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={<Copy className="size-3.5" />}>
                  <T v={{ en: "Copy link", bn: "লিংক কপি" }} />
                </Button>
                <Button size="sm" icon={<Link2 className="size-3.5" />}>
                  <T v={{ en: "Add to CV", bn: "সিভিতে যোগ করুন" }} />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-line bg-canvas-2/60">
        <div className="shell grid divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {[
            { icon: BadgeCheck, v: n(student.verified), l: { en: "Tasks with dual sign-off", bn: "দ্বৈত সাইন-অফসহ টাস্ক" } },
            { icon: Star, v: `${Math.round(avg * 100)}%`, l: { en: "Average rubric score", bn: "গড় রুব্রিক স্কোর" } },
            { icon: Target, v: `${n(student.onTime)}%`, l: { en: "Delivered on time", bn: "সময়মতো ডেলিভার" } },
            { icon: Building2, v: n(new Set(entries.map((e) => e.client.id)).size || 1), l: { en: "Businesses served", bn: "যত ব্যবসাকে সেবা" } },
          ].map((s) => (
            <div key={s.l.en} className="border-b border-line px-2 py-7 text-center last:border-b-0 sm:border-b-0">
              <s.icon className="mx-auto size-4 text-brand-500" />
              <div className="num mt-3 text-[26px] font-semibold tracking-[-0.035em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                {s.v}
              </div>
              <div className="mt-1 text-[12px] text-ink-4">
                <T v={s.l} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Body */}
      <section className="py-14">
        <div className="shell grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
          {/* Entries */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                <T v={{ en: "Verified work history", bn: "ভেরিফায়েড কাজের ইতিহাস" }} />
              </h2>
              <span className="text-[11.5px] text-ink-4">
                <T v={{ en: "Most recent entries shown", bn: "সাম্প্রতিক এন্ট্রিগুলো দেখানো হয়েছে" }} />
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-line-2 bg-canvas-2/40 p-8 text-center">
                <ScanLine className="mx-auto size-5 text-ink-4" />
                <p className="mt-3 text-[14px] font-medium text-ink">
                  <T v={{ en: "No signed-off work yet", bn: "এখনো কোনো সাইন-অফ হওয়া কাজ নেই" }} />
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-4">
                  <T
                    v={{
                      en: "A cold-start slot is reserved on entry micro-tasks so a first record is always reachable — including for a graduate with no history at all.",
                      bn: "প্রবেশ মাইক্রো-টাস্কে কোল্ড-স্টার্ট স্লট সংরক্ষিত, যাতে প্রথম রেকর্ড সবসময় নাগালে থাকে — কোনো ইতিহাস নেই এমন গ্র্যাজুয়েটের জন্যও।",
                    }}
                  />
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {entries.map(({ task, ev, job, client }, i) => {
                  const sector = sectorById(task.sectorId);
                  const total = ev ? ev.scores.reduce((a, s) => a + s.score, 0) : null;
                  const max = ev ? ev.scores.reduce((a, s) => a + s.max, 0) : null;

                  return (
                    <Reveal key={task.id} delay={i * 60}>
                      <article className="overflow-hidden rounded-[18px] border border-line bg-white">
                        <div className="flex flex-wrap items-start gap-4 p-6">
                          <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: sector.accent }}>
                            <SectorIcon name={sector.icon} className="size-[18px]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[15.5px] font-medium leading-snug text-ink">{t(task.title)}</h3>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-4">
                              <span>{t(client.name)}</span>
                              <span>·</span>
                              <span>{t(client.industry)}</span>
                              <span>·</span>
                              <span className="num">{job.ref}</span>
                              <span>·</span>
                              <span>{t(task.dueLabel)}</span>
                            </p>
                          </div>
                          {total !== null && (
                            <span className="num rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100">
                              {n(total)}/{n(max!)}
                            </span>
                          )}
                        </div>

                        {ev && (
                          <>
                            <div className="grid gap-x-8 gap-y-2.5 border-t border-line px-6 py-5 sm:grid-cols-2">
                              {ev.scores.map((s) => (
                                <div key={s.dim.en}>
                                  <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                                    <span className="text-ink-3">{t(s.dim)}</span>
                                    <span className="num font-medium text-ink">
                                      {n(s.score)}/{n(s.max)}
                                    </span>
                                  </div>
                                  <Bar value={(s.score / s.max) * 100} />
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4 border-t border-line bg-canvas-2/40 px-6 py-5 lg:grid-cols-2">
                              <div>
                                <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                                  <ShieldCheck className="size-3 text-brand-500" />
                                  <T v={{ en: "Coordinator", bn: "কোঅর্ডিনেটর" }} />
                                </div>
                                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">&ldquo;{t(ev.reviewerNote)}&rdquo;</p>
                                <p className="mt-2 text-[11.5px] text-ink-4">
                                  {t(reviewerById(ev.reviewerId).name)} · {t(reviewerById(ev.reviewerId).org)}
                                </p>
                              </div>
                              {ev.clientNote && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                                    <BadgeCheck className="size-3 text-brand-500" />
                                    <T v={{ en: "Client sign-off", bn: "ক্লায়েন্ট সাইন-অফ" }} />
                                  </div>
                                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">&ldquo;{t(ev.clientNote)}&rdquo;</p>
                                  <p className="mt-2 text-[11.5px] text-ink-4">{t(ev.dateLabel)}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {!ev && (
                          <div className="flex items-center gap-2 border-t border-line bg-canvas-2/40 px-6 py-4 text-[12px] text-ink-4">
                            <BadgeCheck className="size-3.5 text-brand-500" />
                            <T v={{ en: "Coordinator scored and client signed off", bn: "কোঅর্ডিনেটর স্কোর দিয়েছেন ও ক্লায়েন্ট সাইন-অফ করেছেন" }} />
                          </div>
                        )}
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div className="rounded-[18px] border border-line bg-white p-6">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                  <T v={{ en: "Demonstrated strength", bn: "প্রদর্শিত দক্ষতা" }} />
                </h3>
                <div className="mt-4 space-y-3">
                  {skillStrength.map((s) => (
                    <div key={s.skill}>
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-ink-2">{s.skill}</span>
                        <span className="num text-ink-4">{n(s.value)}</span>
                      </div>
                      <Bar value={s.value} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-4">
                  <T
                    v={{
                      en: "Derived from rubric scores on completed work — never from self-assessment, endorsements, or activity counts.",
                      bn: "সম্পন্ন কাজে মেন্টরের রুব্রিক স্কোর থেকে নেওয়া — কখনোই self-assessment, এনডোর্সমেন্ট বা অ্যাক্টিভিটি কাউন্ট থেকে নয়।",
                    }}
                  />
                </p>
              </div>
            </Reveal>

            <Reveal delay={70}>
              <div className="rounded-[18px] border border-line bg-white p-6">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                  <T v={{ en: "Sectors worked in", bn: "যেসব সেক্টরে কাজ" }} />
                </h3>
                <div className="mt-4 space-y-2.5">
                  {student.sectorIds.map((id) => {
                    const s = sectorById(id);
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: s.accent }}>
                          <SectorIcon name={s.icon} className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-ink">{t(s.name)}</div>
                          <div className="truncate text-[11px] text-ink-4">{tl(s.rubric).slice(0, 2).join(" · ")}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="rounded-[18px] border border-ink bg-ink p-6 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-brand-400" />
                  <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
                    <T v={{ en: "How to read this", bn: "এটি কীভাবে পড়বেন" }} />
                  </h3>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-white/70">
                  <T
                    v={{
                      en: "Every entry here required two independent signatures: a coordinator who scored the work against a sector rubric, and the business that paid for it. Nothing on this page was claimed by the graduate.",
                      bn: "এখানকার প্রতিটি এন্ট্রির জন্য দুটি স্বাধীন স্বাক্ষর লেগেছে: একজন মেন্টর যিনি সেক্টর রুব্রিকে কাজটি মূল্যায়ন করেছেন, আর যে ব্যবসা টাকা দিয়েছে। এই পাতার কোনো কিছুই গ্র্যাজুয়েট নিজে দাবি করেননি।",
                    }}
                  />
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                  {[
                    { en: "Revisions are recorded, not erased", bn: "রিভিশন মুছে ফেলা হয় না, রেকর্ড থাকে" },
                    { en: "Commit counts and activity metrics are never used", bn: "কমিট কাউন্ট বা অ্যাক্টিভিটি মেট্রিক কখনো ব্যবহার হয় না" },
                    { en: "The graduate owns this record and takes it anywhere", bn: "এই রেকর্ডের মালিক গ্র্যাজুয়েট, যেকোনো জায়গায় নিয়ে যেতে পারেন" },
                  ].map((x) => (
                    <li key={x.en} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/70">
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-400" />
                      {t(x)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="rounded-[18px] border border-line bg-canvas-2/60 p-6">
                <div className="flex items-center gap-2 text-[12px] text-ink-4">
                  <CalendarClock className="size-3.5" />
                  <T v={{ en: "Retention tracking", bn: "রিটেনশন ট্র্যাকিং" }} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {["30", "60", "90"].map((d, i) => (
                    <div key={d} className="flex-1">
                      <div
                        className={cn("h-1.5 rounded-full", i === 0 ? "bg-brand-500" : i === 1 ? "bg-brand-300" : "bg-canvas-3")}
                      />
                      <div className="num mt-1.5 text-[11px] text-ink-4">{n(d)}d</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
                  <T
                    v={{
                      en: "If this graduate is hired, check-ins at 30, 60 and 90 days record whether the placement actually held.",
                      bn: "এই গ্র্যাজুয়েট নিয়োগ পেলে ৩০, ৬০ ও ৯০ দিনের চেক-ইন রেকর্ড করে প্লেসমেন্টটি সত্যিই টিকেছে কিনা।",
                    }}
                  />
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </div>
  );
}
