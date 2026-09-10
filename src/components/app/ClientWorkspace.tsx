"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Cpu,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Money, Panel, StatCard, StatusPill } from "./parts";
import { Avatar, Bar, Button } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { JOBS, TASKS, EVALUATIONS, tasksOfJob, evaluationOfTask } from "@/data/work";
import { CLIENTS, STUDENTS, MENTORS, studentById, mentorById } from "@/data/people";
import { sectorById } from "@/data/sectors";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const CLIENT = CLIENTS[0];
const MY_JOBS = JOBS.filter((j) => j.clientId === CLIENT.id);
const MY_TASKS = TASKS.filter((t) => MY_JOBS.some((j) => j.id === t.jobId));

const NAV: NavItem[] = [
  { key: "overview", label: { en: "Overview", bn: "ওভারভিউ" }, icon: LayoutDashboard },
  { key: "jobs", label: { en: "My problems", bn: "আমার সমস্যা" }, icon: Briefcase, badge: MY_JOBS.length },
  { key: "review", label: { en: "Awaiting sign-off", bn: "সাইন-অফের অপেক্ষায়" }, icon: ClipboardList, badge: 2 },
  { key: "talent", label: { en: "Talent & connections", bn: "ট্যালেন্ট ও সংযোগ" }, icon: Users },
  { key: "billing", label: { en: "Spend", bn: "খরচ" }, icon: Receipt },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: {
    title: { en: "Overview", bn: "ওভারভিউ" },
    subtitle: { en: "Everything that needs you, and nothing that doesn't", bn: "যা আপনার দরকার সব, যা দরকার নেই কিছুই নয়" },
  },
  jobs: {
    title: { en: "My problems", bn: "আমার সমস্যা" },
    subtitle: { en: "Written in your words, scoped into priced tasks", bn: "আপনার ভাষায় লেখা, নির্ধারিত দামের টাস্কে ভাগ করা" },
  },
  review: {
    title: { en: "Awaiting your sign-off", bn: "আপনার সাইন-অফের অপেক্ষায়" },
    subtitle: { en: "The mentor has scored it. Nothing counts until you agree.", bn: "মেন্টর স্কোর দিয়েছেন। আপনি সম্মত না হওয়া পর্যন্ত কিছুই গণনা হয় না।" },
  },
  talent: {
    title: { en: "Talent & connections", bn: "ট্যালেন্ট ও সংযোগ" },
    subtitle: { en: "People who have already done real work for you", bn: "যারা ইতিমধ্যে আপনার জন্য বাস্তব কাজ করেছেন" },
  },
  billing: {
    title: { en: "Spend", bn: "খরচ" },
    subtitle: { en: "Per task, agreed before the work started", bn: "প্রতি টাস্কে, কাজ শুরুর আগেই সম্মত" },
  },
};

export default function ClientWorkspace() {
  const [tab, setTab] = useState("overview");
  const { t } = useLang();

  return (
    <AppShell
      role="client"
      roleLabel={{ en: "Client workspace", bn: "ক্লায়েন্ট ওয়ার্কস্পেস" }}
      userName={t(CLIENT.name)}
      userMeta={CLIENT.industry}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
      actions={
        <Button size="sm" icon={<Plus className="size-3.5" />} href="/ai-engine#intake" className="hidden sm:inline-flex">
          <T v={{ en: "Post a problem", bn: "সমস্যা পোস্ট" }} />
        </Button>
      }
    >
      {tab === "overview" && <Overview onGo={setTab} />}
      {tab === "jobs" && <Jobs />}
      {tab === "review" && <Review />}
      {tab === "talent" && <Talent />}
      {tab === "billing" && <Billing />}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({ onGo }: { onGo: (k: string) => void }) {
  const { t } = useLang();
  const n = useNum();

  const active = MY_JOBS.filter((j) => j.status === "active" || j.status === "matching").length;
  const approved = MY_TASKS.filter((x) => x.status === "approved").length;
  const spend = MY_TASKS.filter((x) => x.status === "approved").reduce((a, x) => a + x.fee, 0);

  const attention = [
    {
      icon: ClipboardList,
      tone: "warn" as const,
      title: { en: "2 deliverables need your sign-off", bn: "২টি ডেলিভারেবলে আপনার সাইন-অফ দরকার" },
      body: {
        en: "A mentor has scored both against the sector rubric. The student is not paid until you agree the work is done.",
        bn: "মেন্টর দুটোই সেক্টর রুব্রিকে মূল্যায়ন করেছেন। কাজ হয়েছে বলে আপনি সম্মত না হওয়া পর্যন্ত শিক্ষার্থী টাকা পান না।",
      },
      cta: { en: "Review now", bn: "এখনই রিভিউ করুন" },
      go: "review",
    },
    {
      icon: Cpu,
      tone: "info" as const,
      title: { en: "WB-2549 has an AI scope waiting for a coordinator", bn: "WB-2549-এর একটি এআই স্কোপ কোঅর্ডিনেটরের অপেক্ষায়" },
      body: {
        en: "The stockroom problem has been broken into three tasks. A human reviews it before it reaches any student — usually within a working day.",
        bn: "স্টকরুমের সমস্যাটি তিনটি টাস্কে ভাগ হয়েছে। কোনো শিক্ষার্থীর কাছে যাওয়ার আগে একজন মানুষ এটি রিভিউ করেন — সাধারণত এক কর্মদিবসের মধ্যে।",
      },
      cta: { en: "See the breakdown", bn: "ভাগটি দেখুন" },
      go: "jobs",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label={{ en: "Active problems", bn: "সক্রিয় সমস্যা" }} value={n(active)} hint={{ en: "of 4 posted in total", bn: "মোট ৪টি পোস্টের মধ্যে" }} />
        <StatCard icon={BadgeCheck} label={{ en: "Tasks signed off", bn: "সাইন-অফ হওয়া টাস্ক" }} value={n(approved)} hint={{ en: "mentor and client, both", bn: "মেন্টর ও ক্লায়েন্ট, দুজনেই" }} />
        <StatCard icon={Wallet} label={{ en: "Paid to date", bn: "এ পর্যন্ত পরিশোধ" }} value={`৳${n(spend.toLocaleString("en-US"))}`} hint={{ en: "released on sign-off only", bn: "কেবল সাইন-অফেই ছাড়া হয়" }} tone="brand" />
        <StatCard icon={Handshake} label={{ en: "Repeat hires", bn: "পুনরায় নিয়োগ" }} value={n(CLIENT.repeat)} hint={{ en: "started as micro-tasks", bn: "শুরু হয়েছিল মাইক্রো-টাস্ক হিসেবে" }} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title={{ en: "Needs your attention", bn: "আপনার মনোযোগ দরকার" }} desc={{ en: "Two things only. Everything else is running.", bn: "কেবল দুটি বিষয়। বাকি সব চলছে।" }}>
          <div className="divide-y divide-line">
            {attention.map((a) => (
              <div key={a.title.en} className="flex flex-wrap items-start gap-4 p-5">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-[10px] ring-1",
                    a.tone === "warn" ? "bg-warn-bg text-warn ring-warn/15" : "bg-info-bg text-info ring-info/15"
                  )}
                >
                  <a.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-medium text-ink">{t(a.title)}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{t(a.body)}</p>
                  <button
                    onClick={() => onGo(a.go)}
                    className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600"
                  >
                    {t(a.cta)}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={{ en: "Live work", bn: "চলমান কাজ" }} desc={{ en: "Task-level, not project-level", bn: "প্রজেক্ট নয়, টাস্ক পর্যায়ে" }}>
          <div className="divide-y divide-line">
            {MY_TASKS.filter((x) => x.status === "in_progress" || x.status === "in_review" || x.status === "matching")
              .slice(0, 5)
              .map((task) => {
                const student = task.assignee ? studentById(task.assignee) : null;
                return (
                  <div key={task.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</p>
                      <StatusPill status={task.status} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2.5">
                      {student ? (
                        <>
                          <Avatar name={student.name.en} size={22} />
                          <span className="text-[12px] text-ink-3">{t(student.name)}</span>
                        </>
                      ) : (
                        <span className="text-[12px] text-ink-4">
                          <T v={{ en: "Matching candidates…", bn: "প্রার্থী ম্যাচিং চলছে…" }} />
                        </span>
                      )}
                      <span className="num ml-auto text-[12px] text-ink-4">{t(task.dueLabel)}</span>
                    </div>
                    {task.progress > 0 && task.progress < 100 && (
                      <div className="mt-3">
                        <Bar value={task.progress} />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>

      <Panel
        title={{ en: "What happens to your money", bn: "আপনার টাকার কী হয়" }}
        desc={{ en: "Nothing is released on submission — only on your sign-off", bn: "সাবমিশনে কিছুই ছাড়া হয় না — কেবল আপনার সাইন-অফে" }}
      >
        <div className="grid gap-px bg-line sm:grid-cols-4">
          {[
            { icon: FileText, t: { en: "You approve the task", bn: "আপনি টাস্ক অনুমোদন করেন" }, d: { en: "Fee fixed before anyone starts", bn: "কেউ শুরুর আগেই ফি নির্ধারিত" } },
            { icon: ShieldCheck, t: { en: "Funds held", bn: "টাকা আটকে রাখা" }, d: { en: "Not with the student, not spent", bn: "শিক্ষার্থীর কাছে নয়, খরচও নয়" } },
            { icon: CheckCircle2, t: { en: "Mentor scores it", bn: "মেন্টর স্কোর দেন" }, d: { en: "Against the sector rubric", bn: "সেক্টর রুব্রিকের বিপরীতে" } },
            { icon: BadgeCheck, t: { en: "You sign off", bn: "আপনি সাইন-অফ করেন" }, d: { en: "Only then is it released", bn: "কেবল তখনই ছাড়া হয়" } },
          ].map((s) => (
            <div key={s.t.en} className="bg-white p-5">
              <s.icon className="size-4 text-brand-500" />
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(s.t)}</h4>
              <p className="mt-1 text-[12px] leading-snug text-ink-4">{t(s.d)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ── Jobs ─────────────────────────────────────────────────────── */

function Jobs() {
  const { t, tl } = useLang();
  const n = useNum();
  const [open, setOpen] = useState<string | null>(MY_JOBS[0].id);

  return (
    <div className="space-y-3">
      {MY_JOBS.map((job) => {
        const sector = sectorById(job.sectorId);
        const tasks = tasksOfJob(job.id);
        const isOpen = open === job.id;
        const spent = tasks.filter((x) => x.status === "approved").reduce((a, x) => a + x.fee, 0);
        const total = tasks.reduce((a, x) => a + x.fee, 0);

        return (
          <article key={job.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <button onClick={() => setOpen(isOpen ? null : job.id)} className="flex w-full items-start gap-4 p-5 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: sector.accent }}>
                <SectorIcon name={sector.icon} className="size-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{job.ref}</span>
                  <StatusPill status={job.status} kind="job" />
                </span>
                <span className="mt-1.5 block text-[15px] font-medium leading-snug text-ink">{t(job.title)}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-4">
                  <span>{t(job.postedLabel)}</span>
                  <span>·</span>
                  <span className="num">
                    {n(tasks.length)} <T v={{ en: "tasks", bn: "টাস্ক" }} />
                  </span>
                  <span>·</span>
                  <span className="num">
                    ৳{n(spent.toLocaleString("en-US"))} / ৳{n(total.toLocaleString("en-US"))}
                  </span>
                </span>
              </span>

              <ChevronDown className={cn("mt-1 size-4 shrink-0 text-ink-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <div className="grid transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <div className="border-t border-line">
                  {/* brief */}
                  <div className="grid gap-6 border-b border-line bg-canvas-2/40 p-5 lg:grid-cols-2">
                    <div>
                      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "What you wrote", bn: "আপনি যা লিখেছেন" }} />
                      </h4>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{t(job.brief)}&rdquo;</p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <Sparkles className="size-3 text-brand-500" />
                        <T v={{ en: "How the AI read it", bn: "এআই যেভাবে পড়েছে" }} />
                        <span className="num rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{n(job.ai.confidence)}%</span>
                      </h4>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">{t(job.ai.summary)}</p>
                      <ul className="mt-3 space-y-1.5">
                        {tl(job.ai.risks).map((r) => (
                          <li key={r} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-4">
                            <span className="mt-[6px] size-1 shrink-0 rounded-full bg-warn" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* tasks */}
                  <ul className="divide-y divide-line">
                    {tasks.map((task) => {
                      const student = task.assignee ? studentById(task.assignee) : null;
                      return (
                        <li key={task.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                          <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-canvas-2 text-[12px] font-semibold text-ink-3 ring-1 ring-line">
                            {n(task.seq)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-4">
                              <span className="num font-semibold text-brand-700">৳{n(task.fee.toLocaleString("en-US"))}</span>
                              <span>·</span>
                              <span className="num">{n(task.hours)}h</span>
                              {task.dependsOn && (
                                <>
                                  <span>·</span>
                                  <span>
                                    <T v={{ en: "after", bn: "পরে" }} /> #{n(tasks.find((x) => x.id === task.dependsOn![0])?.seq ?? 1)}
                                  </span>
                                </>
                              )}
                            </span>
                          </span>
                          {student && (
                            <span className="flex items-center gap-2">
                              <Avatar name={student.name.en} size={24} />
                              <span className="hidden text-[12px] text-ink-3 sm:block">{t(student.name)}</span>
                            </span>
                          )}
                          <StatusPill status={task.status} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── Review ───────────────────────────────────────────────────── */

function Review() {
  const { t, tl } = useLang();
  const n = useNum();
  const [decided, setDecided] = useState<Record<string, "approved" | "revision">>({});

  const pending = [EVALUATIONS[0], EVALUATIONS[2]];

  return (
    <div className="space-y-4">
      {pending.map((ev) => {
        const task = TASKS.find((x) => x.id === ev.taskId)!;
        const student = studentById(ev.studentId)!;
        const mentor = mentorById(ev.mentorId)!;
        const total = ev.scores.reduce((a, s) => a + s.score, 0);
        const max = ev.scores.reduce((a, s) => a + s.max, 0);
        const state = decided[ev.id];

        return (
          <section key={ev.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{TASKS.find((x) => x.id === ev.taskId)?.jobId.toUpperCase()}</span>
                  <StatusPill status="in_review" />
                </div>
                <h2 className="mt-1.5 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(task.title)}</h2>
                <p className="mt-1.5 text-[12.5px] text-ink-4">
                  {t(task.desc)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-ink-4">
                  <T v={{ en: "Rubric score", bn: "রুব্রিক স্কোর" }} />
                </div>
                <div className="num text-[24px] font-semibold tracking-[-0.03em] text-brand-600" style={{ fontFamily: "var(--font-display)" }}>
                  {n(total)}/{n(max)}
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Mentor scoring", bn: "মেন্টর স্কোরিং" }} />
                </h3>
                <div className="mt-3 space-y-2.5">
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
              </div>

              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Acceptance criteria agreed up front", bn: "শুরুতেই সম্মত গ্রহণযোগ্যতার শর্ত" }} />
                </h3>
                <ul className="mt-3 space-y-2">
                  {tl(task.acceptance).map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                      {a}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-[12px] border border-line bg-canvas-2/50 p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mentor.name.en} size={26} />
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-medium text-ink">{t(mentor.name)}</div>
                      <div className="truncate text-[11px] text-ink-4">
                        {t(mentor.role)} · {t(mentor.org)}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">&ldquo;{t(ev.mentorNote)}&rdquo;</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas-2/50 p-5">
              <div className="flex items-center gap-2.5">
                <Avatar name={student.name.en} size={30} />
                <div>
                  <div className="text-[13px] font-medium text-ink">{t(student.name)}</div>
                  <div className="text-[11.5px] text-ink-4">
                    {t(student.discipline)} · <Money value={task.fee} />
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {state === "approved" ? (
                  <span className="inline-flex items-center gap-2 rounded-[10px] bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white">
                    <BadgeCheck className="size-4" />
                    <T v={{ en: "Signed off — payment released, record created", bn: "সাইন-অফ সম্পন্ন — পেমেন্ট ছাড়া, রেকর্ড তৈরি" }} />
                  </span>
                ) : state === "revision" ? (
                  <span className="inline-flex items-center gap-2 rounded-[10px] bg-warn-bg px-4 py-2.5 text-[13px] font-medium text-warn ring-1 ring-warn/15">
                    <RotateCcw className="size-4" />
                    <T v={{ en: "Revision requested — recorded, not erased", bn: "রিভিশন চাওয়া হয়েছে — মুছে নয়, রেকর্ড করা" }} />
                  </span>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" icon={<RotateCcw className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [ev.id]: "revision" }))}>
                      <T v={{ en: "Request a revision", bn: "রিভিশন চান" }} />
                    </Button>
                    <Button size="sm" icon={<BadgeCheck className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [ev.id]: "approved" }))}>
                      <T v={{ en: "Sign off and release payment", bn: "সাইন-অফ ও পেমেন্ট ছাড়ুন" }} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        <T
          v={{
            en: "Your sign-off is half of the verification. The mentor's score is the other half. Neither alone puts anything on a graduate's permanent record — and a revision is recorded alongside the final result rather than quietly replacing it.",
            bn: "আপনার সাইন-অফ ভেরিফিকেশনের অর্ধেক। মেন্টরের স্কোর বাকি অর্ধেক। একা কোনোটিই গ্র্যাজুয়েটের স্থায়ী রেকর্ডে কিছু বসায় না — আর রিভিশন নীরবে ফলাফল বদলে না দিয়ে তার পাশেই রেকর্ড থাকে।",
          }}
        />
      </p>
    </div>
  );
}

/* ── Talent ───────────────────────────────────────────────────── */

function Talent() {
  const { t } = useLang();
  const n = useNum();
  const worked = [STUDENTS[0], STUDENTS[2], STUDENTS[1]];

  return (
    <div className="space-y-4">
      <Panel
        title={{ en: "People who have delivered for you", bn: "যারা আপনার জন্য কাজ ডেলিভার করেছেন" }}
        desc={{ en: "Try before you hire — this is the interview", bn: "নিয়োগের আগে যাচাই — এটাই ইন্টারভিউ" }}
      >
        <div className="divide-y divide-line">
          {worked.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 p-5">
              <Avatar name={s.name.en} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-medium text-ink">{t(s.name)}</span>
                  <BadgeCheck className="size-4 text-brand-600" />
                  {i === 0 && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-brand-100">
                      <T v={{ en: "Hiring priority", bn: "হায়ারিং প্রায়োরিটি" }} />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-ink-4">
                  {t(s.discipline)} · {t(s.university)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.skills.slice(0, 4).map((sk) => (
                    <span key={sk} className="rounded-md bg-canvas-2 px-2 py-0.5 text-[11px] text-ink-3 ring-1 ring-line">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <div className="num text-[16px] font-semibold text-ink">{n(s.verified)}</div>
                  <div className="text-[10.5px] text-ink-4">
                    <T v={{ en: "verified", bn: "ভেরিফায়েড" }} />
                  </div>
                </div>
                <div>
                  <div className="num text-[16px] font-semibold text-ink">{n(s.onTime)}%</div>
                  <div className="text-[10.5px] text-ink-4">
                    <T v={{ en: "on time", bn: "সময়মতো" }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" href={`/passport/${s.slug}`}>
                  <T v={{ en: "Passport", bn: "পাসপোর্ট" }} />
                </Button>
                <Button size="sm" icon={<MessageSquare className="size-3.5" />}>
                  <T v={{ en: "Connect directly", bn: "সরাসরি যোগাযোগ" }} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={{ en: "After the hire", bn: "নিয়োগের পরে" }}
        desc={{ en: "Success is 'still there and doing well', not 'got placed'", bn: "সাফল্য মানে 'টিকে আছে ও ভালো করছে', 'প্লেসড হয়েছে' নয়" }}
      >
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            { d: "30", t: { en: "First check-in", bn: "প্রথম চেক-ইন" }, s: { en: "Is the work what both sides expected?", bn: "কাজটা কি দুই পক্ষের প্রত্যাশা মতো?" } },
            { d: "60", t: { en: "Second check-in", bn: "দ্বিতীয় চেক-ইন" }, s: { en: "Honest salary and workload information", bn: "বেতন ও কাজের চাপ নিয়ে সৎ তথ্য" } },
            { d: "90", t: { en: "Retention review", bn: "রিটেনশন রিভিউ" }, s: { en: "If someone leaves, the real reason feeds matching", bn: "কেউ ছাড়লে আসল কারণ ম্যাচিংয়ে যুক্ত হয়" } },
          ].map((c) => (
            <div key={c.d} className="bg-white p-5">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-brand-500" />
                <span className="num text-[19px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  {n(c.d)}
                </span>
                <span className="text-[12px] text-ink-4">
                  <T v={{ en: "days", bn: "দিন" }} />
                </span>
              </div>
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(c.t)}</h4>
              <p className="mt-1 text-[12px] leading-snug text-ink-4">{t(c.s)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ── Billing ──────────────────────────────────────────────────── */

function Billing() {
  const { t } = useLang();
  const n = useNum();

  const rows = useMemo(
    () =>
      MY_JOBS.map((job) => {
        const tasks = tasksOfJob(job.id);
        return {
          job,
          tasks,
          paid: tasks.filter((x) => x.status === "approved").reduce((a, x) => a + x.fee, 0),
          held: tasks.filter((x) => x.status === "in_review" || x.status === "revision").reduce((a, x) => a + x.fee, 0),
          upcoming: tasks.filter((x) => x.status === "matching" || x.status === "open" || x.status === "in_progress").reduce((a, x) => a + x.fee, 0),
        };
      }),
    []
  );

  const paid = rows.reduce((a, r) => a + r.paid, 0);
  const held = rows.reduce((a, r) => a + r.held, 0);
  const upcoming = rows.reduce((a, r) => a + r.upcoming, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={BadgeCheck} label={{ en: "Released", bn: "ছাড়া হয়েছে" }} value={`৳${n(paid.toLocaleString("en-US"))}`} hint={{ en: "after your sign-off", bn: "আপনার সাইন-অফের পর" }} tone="brand" />
        <StatCard icon={ShieldCheck} label={{ en: "Held pending sign-off", bn: "সাইন-অফের অপেক্ষায় আটকে" }} value={`৳${n(held.toLocaleString("en-US"))}`} hint={{ en: "not yet paid to anyone", bn: "এখনো কাউকে দেওয়া হয়নি" }} />
        <StatCard icon={CalendarClock} label={{ en: "Scheduled ahead", bn: "সামনে নির্ধারিত" }} value={`৳${n(upcoming.toLocaleString("en-US"))}`} hint={{ en: "you can cancel any unstarted task", bn: "শুরু না হওয়া যেকোনো টাস্ক বাতিল করতে পারেন" }} />
      </div>

      <Panel title={{ en: "By problem", bn: "সমস্যা অনুযায়ী" }} desc={{ en: "Task-level pricing, no surprises at the end", bn: "টাস্কভিত্তিক দাম, শেষে কোনো চমক নেই" }}>
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.job.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{r.job.ref}</span>
                  <StatusPill status={r.job.status} kind="job" />
                </div>
                <p className="mt-1 text-[13.5px] font-medium text-ink">{t(r.job.title)}</p>
                <p className="num mt-0.5 text-[11.5px] text-ink-4">
                  {n(r.tasks.length)} <T v={{ en: "tasks", bn: "টাস্ক" }} /> · <T v={{ en: "budget", bn: "বাজেট" }} /> ৳{n(r.job.budget.toLocaleString("en-US"))}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-5 text-right">
                <div>
                  <div className="num text-[14px] font-semibold text-brand-600">৳{n(r.paid.toLocaleString("en-US"))}</div>
                  <div className="text-[10.5px] text-ink-4">
                    <T v={{ en: "released", bn: "ছাড়া" }} />
                  </div>
                </div>
                <div>
                  <div className="num text-[14px] font-semibold text-ink">৳{n(r.held.toLocaleString("en-US"))}</div>
                  <div className="text-[10.5px] text-ink-4">
                    <T v={{ en: "held", bn: "আটকে" }} />
                  </div>
                </div>
                <div>
                  <div className="num text-[14px] font-semibold text-ink-4">৳{n(r.upcoming.toLocaleString("en-US"))}</div>
                  <div className="text-[10.5px] text-ink-4">
                    <T v={{ en: "ahead", bn: "সামনে" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex items-start gap-3 rounded-[16px] border border-line bg-white p-5">
        <Building2 className="mt-0.5 size-4 shrink-0 text-ink-4" />
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          <T
            v={{
              en: "During Phase 0 the platform takes nothing at all — fees go to the student and, once revenue exists, a mentor stipend. The point of that phase is to find out whether a business will pay for student work at all, and a platform cut would contaminate the answer.",
              bn: "ফেজ ০-তে প্ল্যাটফর্ম কিছুই নেয় না — ফি যায় শিক্ষার্থীর কাছে, আর রেভিনিউ এলে মেন্টর স্টাইপেন্ডে। সেই ফেজের উদ্দেশ্য জানা, একটা ব্যবসা আদৌ শিক্ষার্থীর কাজের জন্য টাকা দেবে কিনা — আর প্ল্যাটফর্মের কাটতি সেই উত্তরকে দূষিত করত।",
            }}
          />
        </p>
      </div>
    </div>
  );
}
