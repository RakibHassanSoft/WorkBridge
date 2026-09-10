"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Avatar, Bar, Button, Reveal } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { StatusPill } from "@/components/app/parts";
import TrialPanel from "./TrialPanel";
import Thread from "@/components/chat/Thread";
import { BOARD_TASKS, anyJobById, anyTaskById, applicantsOf, metaOf, submissionsOf } from "@/data/marketplace";
import { clientById, studentById, STUDENTS } from "@/data/people";
import { sectorById } from "@/data/sectors";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const ME = STUDENTS[0];

export default function TaskDetail({ id }: { id: string }) {
  const { t, tl } = useLang();
  const n = useNum();

  const task = anyTaskById(id)!;
  const meta = metaOf(id);
  const job = anyJobById(task.jobId);
  const client = job ? clientById(job.clientId) : undefined;
  const sector = sectorById(task.sectorId);
  const applicants = applicantsOf(id);
  const submissions = submissionsOf(id);
  const cancelled = task.status === "cancelled";
  const closed = task.status === "approved" || cancelled;

  const related = useMemo(
    () => BOARD_TASKS.filter((x) => x.sectorId === task.sectorId && x.id !== task.id).slice(0, 3),
    [task.sectorId, task.id]
  );

  const timeline: { label: L; done: boolean; note?: L }[] = [
    { label: { en: "Client posted the brief", bn: "ক্লায়েন্ট ব্রিফ পোস্ট করেছেন" }, done: true, note: meta?.postedLabel },
    { label: { en: "AI scoped and priced it", bn: "এআই স্কোপ ও দাম নির্ধারণ করেছে" }, done: true },
    { label: { en: "Coordinator approved the scope", bn: "কোঅর্ডিনেটর স্কোপ অনুমোদন করেছেন" }, done: !cancelled },
    { label: { en: "Matched to a student", bn: "শিক্ষার্থীর সাথে ম্যাচ" }, done: ["in_progress", "in_review", "revision", "approved"].includes(task.status) },
    { label: { en: "A coordinator scored the work", bn: "কোঅর্ডিনেটর কাজ মূল্যায়ন করেছেন" }, done: ["in_review", "approved"].includes(task.status) },
    { label: { en: "Client signed off", bn: "ক্লায়েন্ট সাইন-অফ করেছেন" }, done: task.status === "approved" },
  ];

  return (
    <div className="pb-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line pt-10 pb-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-bg fade-mask-b absolute inset-x-0 top-0 h-[260px] opacity-60" />
          <div className="absolute left-1/2 top-[-170px] h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-brand-100/45 blur-[100px]" />
        </div>

        <div className="shell">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-4">
              <Link href="/tasks" className="transition-colors hover:text-ink">
                <T v={{ en: "Task board", bn: "টাস্ক বোর্ড" }} />
              </Link>
              <ChevronRight className="size-3" />
              <Link href={`/tasks?sector=${sector.id}`} className="transition-colors hover:text-ink">
                {t(sector.name)}
              </Link>
              <ChevronRight className="size-3" />
              <span className="num">{job?.ref}</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-start gap-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-[16px] text-white" style={{ background: sector.accent }}>
                <SectorIcon name={sector.icon} className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={task.status} />
                  <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium capitalize text-ink-3 ring-1 ring-line">{task.level}</span>
                  {meta && (
                    <span className="flex items-center gap-1 text-[11.5px] text-ink-4">
                      <Clock3 className="size-3" />
                      {t(meta.postedLabel)}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-[-0.028em] text-ink sm:text-[32px]" style={{ fontFamily: "var(--font-display)" }}>
                  {t(task.title)}
                </h1>
                {client && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-ink-3">
                    <Building2 className="size-3.5 text-ink-4" />
                    {t(client.name)}
                    <span className="text-ink-4">·</span>
                    {t(client.industry)}
                    <span className="text-ink-4">·</span>
                    {t(client.city)}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stat strip ──────────────────────────────────────── */}
      <section className="border-b border-line bg-canvas-2/60">
        <div className="shell grid divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {[
            { icon: Wallet, v: `৳${n(task.fee.toLocaleString("en-US"))}`, l: { en: "Fixed fee", bn: "নির্ধারিত ফি" } },
            { icon: Timer, v: `${n(task.hours)}h`, l: { en: "Estimated effort", bn: "আনুমানিক পরিশ্রম" } },
            { icon: TrendingUp, v: `৳${n(Math.round(task.fee / task.hours))}`, l: { en: "Per hour", bn: "প্রতি ঘণ্টায়" } },
            { icon: Users, v: n(meta?.applicants ?? 0), l: { en: "People applied", bn: "আবেদন করেছেন" } },
          ].map((s) => (
            <div key={s.l.en} className="border-b border-line px-2 py-6 text-center last:border-b-0 sm:border-b-0">
              <s.icon className="mx-auto size-4 text-brand-500" />
              <div className="num mt-2.5 text-[22px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                {s.v}
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-4">
                <T v={s.l} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="shell grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
          <div className="space-y-8">
            {cancelled && meta?.cancelReason && (
              <Reveal>
                <div className="rounded-[18px] border border-line bg-canvas-2/60 p-6">
                  <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <TriangleAlert className="size-3.5" />
                    <T v={{ en: "Why this was cancelled", bn: "কেন এটি বাতিল হয়েছে" }} />
                  </div>
                  <blockquote className="mt-4 border-l-2 border-line-2 pl-4 text-[14.5px] leading-relaxed text-ink-2">
                    {t(meta.cancelReason)}
                  </blockquote>
                  {meta.cancelledLabel && <p className="mt-3 text-[12px] text-ink-4">{t(meta.cancelledLabel)}</p>}
                  <p className="mt-4 border-t border-line pt-4 text-[12.5px] leading-relaxed text-ink-4">
                    <T
                      v={{
                        en: "A cancellation has to carry a written reason from the client. It stays on the record so students can see that the work disappeared for a reason, not because of anything they did.",
                        bn: "বাতিল করলে ক্লায়েন্টকে লিখিত কারণ দিতে হয়। সেটি রেকর্ডে থেকে যায়, যাতে শিক্ষার্থীরা দেখতে পান কাজটি একটি কারণে হারিয়েছে — তাদের কোনো ভুলে নয়।",
                      }}
                    />
                  </p>
                </div>
              </Reveal>
            )}

            {/* client words */}
            {meta && (
              <Reveal>
                <div>
                  <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <Quote className="size-3.5" />
                    <T v={{ en: "The brief, exactly as the client wrote it", bn: "ক্লায়েন্ট যেভাবে লিখেছেন ঠিক সেভাবেই ব্রিফ" }} />
                  </div>
                  <blockquote className="mt-4 rounded-[18px] border border-line bg-white p-6 text-[16px] leading-relaxed text-ink-2">
                    {t(meta.clientWords)}
                  </blockquote>
                </div>
              </Reveal>
            )}

            {/* AI layer */}
            {meta && (
              <Reveal delay={60}>
                <div className="overflow-hidden rounded-[18px] border border-brand-100 bg-brand-50/50">
                  <div className="flex items-center gap-2.5 border-b border-brand-100 px-6 py-4">
                    <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white">
                      <Cpu className="size-3.5" />
                    </span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                      <T v={{ en: "AI: what this actually asks for", bn: "এআই: আসলে যা চাওয়া হচ্ছে" }} />
                    </span>
                  </div>

                  <div className="p-6">
                    <p className="text-[15px] leading-relaxed text-brand-900">{t(meta.aiSimple)}</p>

                    <div className="mt-6">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                        <Lightbulb className="size-3" />
                        <T v={{ en: "A route through the work", bn: "কাজটি করার একটি পথ" }} />
                      </div>
                      <ol className="mt-3 space-y-2.5">
                        {tl(meta.aiSteps).map((s, i) => (
                          <li key={s} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-brand-900">
                            <span className="num mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-white text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
                              {n(i + 1)}
                            </span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {meta.aiWatchOut && (
                      <div className="mt-6 flex items-start gap-2.5 rounded-[12px] bg-white p-4 ring-1 ring-brand-100">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        <p className="text-[13px] leading-relaxed text-brand-900">{t(meta.aiWatchOut)}</p>
                      </div>
                    )}

                    <p className="mt-5 border-t border-brand-200/60 pt-4 text-[11.5px] leading-relaxed text-brand-700/75">
                      <T
                        v={{
                          en: "This section is written by the AI layer to make the brief easier to act on. It is not the requirement — the client's words above are. Where the two disagree, the client wins.",
                          bn: "এই অংশটি এআই লেয়ার লিখেছে, ব্রিফটি কাজে লাগানো সহজ করতে। এটি শর্ত নয় — ওপরে ক্লায়েন্টের কথাই শর্ত। দুটোর মধ্যে অমিল হলে ক্লায়েন্টের কথাই চলবে।",
                        }}
                      />
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {/* full description + acceptance */}
            <Reveal delay={90}>
              <div className="rounded-[18px] border border-line bg-white p-6">
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                  <T v={{ en: "Scope of work", bn: "কাজের পরিধি" }} />
                </h2>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{t(task.desc)}</p>

                <div className="mt-7 border-t border-line pt-6">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <CheckCircle2 className="size-3.5" />
                    <T v={{ en: "What counts as done", bn: "কী হলে সম্পন্ন ধরা হবে" }} />
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {tl(task.acceptance).map((a) => (
                      <li key={a} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-ink-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[12px] leading-relaxed text-ink-4">
                    <T
                      v={{
                        en: "These are agreed before anyone starts, and they are what the work is scored against. Nothing outside this list can be used to reject the work.",
                        bn: "কেউ শুরুর আগেই এগুলো সম্মত হয়, আর মেন্টর এগুলোর বিপরীতেই স্কোর দেন। এই তালিকার বাইরের কিছু দিয়ে কাজ বাতিল করা যায় না।",
                      }}
                    />
                  </p>
                </div>

                <div className="mt-7 border-t border-line pt-6">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <T v={{ en: "Skills", bn: "স্কিল" }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {task.skills.map((s) => {
                      const mine = ME.skills.includes(s);
                      return (
                        <span
                          key={s}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-[12.5px] ring-1",
                            mine ? "bg-brand-50 text-brand-700 ring-brand-100" : "bg-canvas-2 text-ink-2 ring-line"
                          )}
                        >
                          {s}
                          {mine && <span className="ml-1.5 text-[10px] uppercase tracking-wide">{t({ en: "yours", bn: "আপনার" })}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* trial task — applying means doing this */}
            <TrialPanel taskId={id} closed={closed} />

            {/* live thread on a task in progress */}
            {task.status === "in_progress" && (
              <Reveal delay={130}>
                <div className="overflow-hidden rounded-[18px] border border-line bg-white">
                  <div className="flex items-center gap-2 border-b border-line bg-canvas-2/60 px-6 py-4">
                    <MessageSquare className="size-3.5 text-brand-600" />
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                      <T v={{ en: "Client and student, on this task", bn: "এই টাস্কে ক্লায়েন্ট ও শিক্ষার্থী" }} />
                    </span>
                  </div>
                  <Thread taskId={id} me="student" />
                </div>
              </Reveal>
            )}

            {/* applicants */}
            {applicants.length > 0 && (
              <Reveal delay={120}>
                <div className="overflow-hidden rounded-[18px] border border-line bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                    <h2 className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                      <Users className="size-3.5" />
                      <T v={{ en: "Who applied", bn: "কারা আবেদন করেছেন" }} />
                    </h2>
                    <span className="num text-[12px] text-ink-4">
                      {n(applicants.length)} <T v={{ en: "of", bn: "জন, মোট" }} /> {n(meta?.applicants ?? 0)}
                    </span>
                  </div>

                  <div className="divide-y divide-line">
                    {applicants.map((a) => {
                      const st = studentById(a.studentId);
                      if (!st) return null;
                      return (
                        <div key={a.studentId} className="p-6">
                          <div className="flex flex-wrap items-start gap-4">
                            <Avatar name={st.name.en} size={38} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[14px] font-medium text-ink">{t(st.name)}</span>
                                {a.outcome === "selected" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                                    <BadgeCheck className="size-3" />
                                    <T v={{ en: "Selected", bn: "নির্বাচিত" }} />
                                  </span>
                                )}
                                {a.outcome === "not_selected" && (
                                  <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-3 ring-1 ring-inset ring-line">
                                    <T v={{ en: "Not selected", bn: "নির্বাচিত হননি" }} />
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11.5px] text-ink-4">
                                {t(st.discipline)} · {t(a.appliedLabel)}
                              </p>
                              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{t(a.pitch)}&rdquo;</p>
                              {a.reason && (
                                <div className="mt-3 rounded-[12px] bg-canvas-2/60 p-3.5 ring-1 ring-line">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                                    <T v={{ en: "Why not selected", bn: "কেন নির্বাচিত হননি" }} />
                                  </div>
                                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(a.reason)}</p>
                                </div>
                              )}
                            </div>
                            <div className="w-[92px] shrink-0">
                              <div className="mb-1.5 flex items-baseline justify-between">
                                <span className="text-[10px] uppercase tracking-[0.1em] text-ink-4">
                                  <T v={{ en: "match", bn: "ম্যাচ" }} />
                                </span>
                                <span className="num text-[13px] font-semibold text-ink">{n(a.matchScore)}</span>
                              </div>
                              <Bar value={a.matchScore} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            )}

            {/* learn from the outcome */}
            {submissions.length > 0 && <LearnFromOutcome taskId={id} />}
          </div>

          {/* ── Sidebar ────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div className="rounded-[18px] border border-line bg-white p-6">
                {task.status === "open" ? (
                  <>
                    <div className="num text-[28px] font-semibold tracking-[-0.035em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                      ৳{n(task.fee.toLocaleString("en-US"))}
                    </div>
                    <p className="num mt-1 text-[12.5px] text-ink-4">
                      {n(task.hours)}h <T v={{ en: "estimated", bn: "আনুমানিক" }} /> · ৳{n(Math.round(task.fee / task.hours))}/h
                    </p>
                    <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
                      <T
                        v={{
                          en: "No pitch, no bidding. Applying means doing a short AI-built copy of this task — the AI scores it, and a moderator picks from the ranking.",
                          bn: "কোনো পিচ নয়, কোনো বিড নয়। আবেদন মানে এই টাস্কেরই এআই-বানানো একটি ছোট কপি করে দেখানো — এআই নম্বর দেয়, আর র‍্যাংকিং থেকে মডারেটর বেছে নেন।",
                        }}
                      />
                    </p>
                    <Button full size="lg" className="mt-5" icon={<Sparkles className="size-4" />}>
                      <T v={{ en: "Do the trial task to apply", bn: "আবেদন করতে ট্রায়াল টাস্ক করুন" }} />
                    </Button>
                    <p className="mt-3 text-center text-[11.5px] text-ink-4">{t(task.dueLabel)}</p>
                  </>
                ) : (
                  <div className="text-center">
                    <StatusPill status={task.status} />
                    <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
                      {cancelled ? (
                        <T v={{ en: "This task was withdrawn by the client and is kept here for the record.", bn: "ক্লায়েন্ট এই টাস্কটি প্রত্যাহার করেছেন; রেকর্ডের জন্য এটি এখানে রাখা আছে।" }} />
                      ) : task.status === "approved" ? (
                        <T v={{ en: "Delivered, scored and signed off. The section below shows what separated the accepted work from the rest.", bn: "ডেলিভার, স্কোর ও সাইন-অফ সম্পন্ন। নিচের অংশে দেখুন গৃহীত কাজটিকে বাকিদের থেকে কী আলাদা করেছে।" }} />
                      ) : (
                        <T v={{ en: "Someone is already working on this one.", bn: "এটি নিয়ে ইতিমধ্যে কেউ কাজ করছেন।" }} />
                      )}
                    </p>
                    <Button href="/tasks" variant="secondary" full size="md" className="mt-5" icon={<ArrowRight className="size-4" />}>
                      <T v={{ en: "See open tasks", bn: "খোলা টাস্ক দেখুন" }} />
                    </Button>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="rounded-[18px] border border-line bg-white p-6">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                  <T v={{ en: "Where this task is", bn: "টাস্কটি কোন ধাপে" }} />
                </h3>
                <ol className="mt-4 space-y-0">
                  {timeline.map((step, i) => (
                    <li key={step.label.en} className="relative flex gap-3.5 pb-4 last:pb-0">
                      {i < timeline.length - 1 && (
                        <span aria-hidden className={cn("absolute left-[9px] top-5 h-full w-px", step.done ? "bg-brand-300" : "bg-line")} />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2",
                          step.done ? "border-brand-500 bg-brand-500" : "border-line bg-white"
                        )}
                      >
                        {step.done && <CheckCircle2 className="size-2.5 text-white" />}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-[12.5px] leading-snug", step.done ? "font-medium text-ink" : "text-ink-4")}>{t(step.label)}</span>
                        {step.note && <span className="mt-0.5 block text-[11px] text-ink-4">{t(step.note)}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            {client && (
              <Reveal delay={100}>
                <div className="rounded-[18px] border border-line bg-white p-6">
                  <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <T v={{ en: "The business", bn: "ব্যবসাটি" }} />
                  </h3>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-canvas-2 text-ink-2 ring-1 ring-line">
                      <Building2 className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium text-ink">{t(client.name)}</div>
                      <div className="truncate text-[11.5px] text-ink-4">
                        {t(client.size)} · {t(client.city)}
                      </div>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[12.5px]">
                    <div>
                      <dt className="text-ink-4">
                        <T v={{ en: "On the platform since", bn: "প্ল্যাটফর্মে যোগ" }} />
                      </dt>
                      <dd className="mt-0.5 font-medium text-ink">{client.since}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-4">
                        <T v={{ en: "Repeat hires", bn: "পুনরায় নিয়োগ" }} />
                      </dt>
                      <dd className="num mt-0.5 font-medium text-ink">{n(client.repeat)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-4">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                    <T
                      v={{
                        en: "The fee for this task is already deposited and held by the platform, not by the client. That deposit — not a scanned licence — is what the platform checks about a business.",
                        bn: "এই টাস্কের ফি ইতিমধ্যে জমা দেওয়া, আর সেটা ক্লায়েন্টের কাছে নয়, প্ল্যাটফর্মে আটকে আছে। স্ক্যান করা লাইসেন্স নয় — এই জমাটাই ব্যবসা সম্পর্কে প্ল্যাটফর্ম যা যাচাই করে।",
                      }}
                    />
                  </p>
                </div>
              </Reveal>
            )}

            {related.length > 0 && (
              <Reveal delay={140}>
                <div className="rounded-[18px] border border-line bg-white p-6">
                  <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    <T v={{ en: "More in this sector", bn: "এই সেক্টরে আরও" }} />
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {related.map((r) => (
                      <Link key={r.id} href={`/tasks/${r.id}`} className="group flex items-start gap-3 rounded-[12px] border border-line p-3 transition-colors hover:border-brand-200">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium leading-snug text-ink">{t(r.title)}</span>
                          <span className="num mt-1 block text-[11px] text-ink-4">
                            ৳{n(r.fee.toLocaleString("en-US"))} · {n(metaOf(r.id)?.applicants ?? 0)} <T v={{ en: "applied", bn: "আবেদন" }} />
                          </span>
                        </span>
                        <ArrowRight className="mt-1 size-3.5 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                  <Link href={`/tasks?sector=${sector.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600">
                    <T v={{ en: "All", bn: "সব" }} /> {t(sector.name)}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      <div className="shell">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="size-4" />
          <T v={{ en: "Back to the task board", bn: "টাস্ক বোর্ডে ফিরুন" }} />
        </Link>
      </div>
    </div>
  );
}

/* ── Learn from the outcome ───────────────────────────────────── */

function LearnFromOutcome({ taskId }: { taskId: string }) {
  const { t, tl } = useLang();
  const n = useNum();
  const submissions = submissionsOf(taskId);
  const accepted = submissions.find((s) => s.outcome === "accepted");
  const others = submissions.filter((s) => s.outcome !== "accepted");
  const [viewing, setViewing] = useState(others[0]?.id ?? submissions[0]?.id);

  const current = submissions.find((s) => s.id === viewing);
  if (!accepted || !current) return null;

  return (
    <Reveal delay={140}>
      <div className="overflow-hidden rounded-[18px] border border-ink bg-ink text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-300">
            <GraduationCap className="size-3.5" />
            <T v={{ en: "Learn from the outcome", bn: "ফলাফল থেকে শিখুন" }} />
          </div>
          <h2 className="mt-3 text-[20px] font-semibold leading-snug tracking-[-0.025em]">
            <T v={{ en: "What separated the work that was taken from the work that wasn't", bn: "যে কাজটি নেওয়া হয়েছে আর যেগুলো হয়নি — পার্থক্য কোথায়" }} />
          </h2>
          <p className="mt-3 max-w-[64ch] text-[13.5px] leading-relaxed text-white/60">
            <T
              v={{
                en: "Once a task closes, every applicant can see the accepted approach beside their own. Nothing is anonymous to the people who competed for it, and nothing is hidden — the point is that the next application is better.",
                bn: "কোনো টাস্ক শেষ হলে প্রত্যেক আবেদনকারী নিজের পাশে গৃহীত পদ্ধতিটি দেখতে পান। যারা প্রতিযোগিতা করেছেন তাদের কাছে কিছুই বেনামি নয়, কিছুই লুকানো নয় — উদ্দেশ্য একটাই, পরের আবেদনটি যেন ভালো হয়।",
              }}
            />
          </p>
        </div>

        {/* accepted */}
        <div className="border-b border-white/10 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-1 text-[10.5px] font-semibold text-white">
              <BadgeCheck className="size-3" />
              <T v={{ en: "Accepted", bn: "গৃহীত" }} />
            </span>
            <span className="text-[13px] font-medium">{t(studentById(accepted.studentId)!.name)}</span>
            {accepted.score && (
              <span className="num rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                {n(accepted.score)}/{n(accepted.maxScore ?? 25)}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-[15.5px] font-medium leading-snug">{t(accepted.headline)}</h3>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/65">{t(accepted.approach)}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {tl(accepted.strengths).map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/75">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* others */}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/45">
              <T v={{ en: "Not selected", bn: "নির্বাচিত হয়নি" }} />
            </span>
            <div className="flex flex-wrap gap-1.5">
              {others.map((o) => {
                const st = studentById(o.studentId)!;
                return (
                  <button
                    key={o.id}
                    onClick={() => setViewing(o.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[12px] transition-colors",
                      viewing === o.id ? "bg-white text-ink" : "bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    {t(st.name)}
                  </button>
                );
              })}
            </div>
          </div>

          {current.outcome === "not_selected" && (
            <div key={current.id} className="anim-fade mt-5">
              <h3 className="text-[15px] font-medium leading-snug">{t(current.headline)}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/65">{t(current.approach)}</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-300">
                    <T v={{ en: "What worked", bn: "যা কাজ করেছে" }} />
                  </div>
                  <ul className="mt-2.5 space-y-2">
                    {tl(current.strengths).map((s) => (
                      <li key={s} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/75">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    <T v={{ en: "What was missing", bn: "যা ছিল না" }} />
                  </div>
                  <ul className="mt-2.5 space-y-2">
                    {tl(current.gaps).map((s) => (
                      <li key={s} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/75">
                        <XCircle className="mt-0.5 size-3.5 shrink-0 text-white/35" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-[14px] border border-brand-400/25 bg-brand-400/10 p-5">
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-300">
                  <Cpu className="size-3" />
                  <T v={{ en: "AI feedback for next time", bn: "পরেরবারের জন্য এআই ফিডব্যাক" }} />
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/85">{t(current.aiFeedback)}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                  <T
                    v={{
                      en: "Written from the brief, the accepted approach and your own application. Only you see the feedback on your submission.",
                      bn: "ব্রিফ, গৃহীত পদ্ধতি ও আপনার নিজের আবেদন থেকে লেখা। আপনার সাবমিশনের ফিডব্যাক কেবল আপনিই দেখেন।",
                    }}
                  />
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
