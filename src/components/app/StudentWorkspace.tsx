"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Lock,
  Paperclip,
  Send,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard, StatusPill } from "./parts";
import { Avatar, Bar, Button } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { EVALUATIONS, TASKS, jobById, tasksOfJob } from "@/data/work";
import { STUDENTS, clientById, mentorById } from "@/data/people";
import { sectorById } from "@/data/sectors";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const ME = STUDENTS[0];
const MY_TASKS = TASKS.filter((t) => t.assignee === ME.id);
const OFFERS = TASKS.filter((t) => (t.status === "matching" || t.status === "open") && ME.sectorIds.includes(t.sectorId)).slice(0, 3);
const MY_EVALS = EVALUATIONS.filter((e) => e.studentId === ME.id);

const NAV: NavItem[] = [
  { key: "overview", label: { en: "Overview", bn: "ওভারভিউ" }, icon: LayoutDashboard },
  { key: "offers", label: { en: "Matched for you", bn: "আপনার জন্য ম্যাচ" }, icon: Inbox, badge: OFFERS.length },
  { key: "active", label: { en: "Active task", bn: "চলমান টাস্ক" }, icon: ClipboardList, badge: 1 },
  { key: "record", label: { en: "Verified record", bn: "ভেরিফায়েড রেকর্ড" }, icon: BadgeCheck },
  { key: "earnings", label: { en: "Earnings", bn: "আয়" }, icon: Banknote },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: { en: "Overview", bn: "ওভারভিউ" }, subtitle: { en: "Your work, your record, your money", bn: "আপনার কাজ, আপনার রেকর্ড, আপনার টাকা" } },
  offers: { title: { en: "Matched for you", bn: "আপনার জন্য ম্যাচ" }, subtitle: { en: "Why each one reached you is shown, not hidden", bn: "প্রতিটি কেন আপনার কাছে এসেছে তা লুকানো নয়, দেখানো" } },
  active: { title: { en: "Active task", bn: "চলমান টাস্ক" }, subtitle: { en: "One task at a time until Phase 3", bn: "ফেজ ৩ পর্যন্ত একবারে একটি টাস্ক" } },
  record: { title: { en: "Verified record", bn: "ভেরিফায়েড রেকর্ড" }, subtitle: { en: "Signed by a mentor and by the business that paid", bn: "মেন্টর ও টাকা দেওয়া ব্যবসা — দুজনেরই স্বাক্ষরিত" } },
  earnings: { title: { en: "Earnings", bn: "আয়" }, subtitle: { en: "Released on sign-off, never on submission", bn: "সাইন-অফে ছাড়া হয়, সাবমিশনে কখনো নয়" } },
};

export default function StudentWorkspace() {
  const [tab, setTab] = useState("overview");
  const { t } = useLang();

  return (
    <AppShell
      role="student"
      roleLabel={{ en: "Student workspace", bn: "শিক্ষার্থী ওয়ার্কস্পেস" }}
      userName={t(ME.name)}
      userMeta={ME.discipline}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
      actions={
        <Button size="sm" variant="secondary" href={`/passport/${ME.slug}`} className="hidden sm:inline-flex" icon={<ArrowUpRight className="size-3.5" />}>
          <T v={{ en: "Public passport", bn: "পাবলিক পাসপোর্ট" }} />
        </Button>
      }
    >
      {tab === "overview" && <Overview onGo={setTab} />}
      {tab === "offers" && <Offers />}
      {tab === "active" && <Active />}
      {tab === "record" && <Record />}
      {tab === "earnings" && <Earnings />}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({ onGo }: { onGo: (k: string) => void }) {
  const { t } = useLang();
  const n = useNum();
  const activeTask = MY_TASKS.find((x) => x.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BadgeCheck} label={{ en: "Verified tasks", bn: "ভেরিফায়েড টাস্ক" }} value={n(ME.verified)} hint={{ en: "dual sign-off on every one", bn: "প্রতিটিতেই দ্বৈত সাইন-অফ" }} tone="brand" />
        <StatCard icon={Star} label={{ en: "Rubric average", bn: "রুব্রিক গড়" }} value={n(ME.rating)} hint={{ en: "across five scored dimensions", bn: "পাঁচটি স্কোরড ডাইমেনশন জুড়ে" }} />
        <StatCard icon={Target} label={{ en: "On-time delivery", bn: "সময়মতো ডেলিভারি" }} value={`${n(ME.onTime)}%`} hint={{ en: "the metric clients ask about first", bn: "ক্লায়েন্টরা সবার আগে যেটা জিজ্ঞেস করেন" }} />
        <StatCard icon={Banknote} label={{ en: "Total earned", bn: "মোট আয়" }} value={`৳${n(ME.earned.toLocaleString("en-US"))}`} hint={{ en: "started at ৳1,500", bn: "শুরু ৳১,৫০০ দিয়ে" }} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {activeTask && (
          <Panel
            title={{ en: "What you are working on", bn: "আপনি যা নিয়ে কাজ করছেন" }}
            action={
              <Button size="sm" variant="secondary" onClick={() => onGo("active")} icon={<ArrowRight className="size-3.5" />}>
                <T v={{ en: "Open workspace", bn: "ওয়ার্কস্পেস খুলুন" }} />
              </Button>
            }
          >
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15.5px] font-medium leading-snug text-ink">{t(activeTask.title)}</h3>
                  <p className="mt-1.5 text-[12.5px] text-ink-4">
                    {t(clientById(jobById(activeTask.jobId)!.clientId)!.name)} · {jobById(activeTask.jobId)!.ref}
                  </p>
                </div>
                <StatusPill status={activeTask.status} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="text-ink-3">
                    <T v={{ en: "Progress you reported", bn: "আপনার জানানো অগ্রগতি" }} />
                  </span>
                  <span className="num font-medium text-ink">{n(activeTask.progress)}%</span>
                </div>
                <Bar value={activeTask.progress} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-[12.5px]">
                <span className="num font-semibold text-brand-700">৳{n(activeTask.fee.toLocaleString("en-US"))}</span>
                <span className="num text-ink-4">
                  {n(activeTask.hours)}h <T v={{ en: "estimated", bn: "আনুমানিক" }} />
                </span>
                <span className="flex items-center gap-1.5 text-ink-4">
                  <CalendarClock className="size-3.5" />
                  {t(activeTask.dueLabel)}
                </span>
              </div>
            </div>
          </Panel>
        )}

        <Panel title={{ en: "How the record grows", bn: "রেকর্ড যেভাবে বাড়ে" }} desc={{ en: "Nothing is self-claimed", bn: "কোনো কিছু self-claim নয়" }}>
          <div className="divide-y divide-line">
            {[
              { icon: Upload, t: { en: "You submit", bn: "আপনি জমা দেন" }, d: { en: "Against criteria agreed before you started", bn: "শুরুর আগেই সম্মত শর্তের বিপরীতে" } },
              { icon: ListChecks, t: { en: "A mentor scores five dimensions", bn: "মেন্টর পাঁচটি ডাইমেনশনে স্কোর দেন" }, d: { en: "Specific to your sector, not generic", bn: "আপনার সেক্টরের জন্য নির্দিষ্ট, সাধারণ নয়" } },
              { icon: ShieldCheck, t: { en: "The client signs off", bn: "ক্লায়েন্ট সাইন-অফ করেন" }, d: { en: "The business that actually paid for it", bn: "যে ব্যবসা সত্যিই টাকা দিয়েছে" } },
              { icon: BadgeCheck, t: { en: "It enters your passport", bn: "এটি আপনার পাসপোর্টে ঢোকে" }, d: { en: "Public, portable, and impossible to fake", bn: "পাবলিক, বহনযোগ্য, নকল করা অসম্ভব" } },
            ].map((s) => (
              <div key={s.t.en} className="flex items-start gap-3 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <s.icon className="size-3.5" />
                </span>
                <div>
                  <h4 className="text-[13px] font-medium text-ink">{t(s.t)}</h4>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-4">{t(s.d)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={{ en: "Your path so far", bn: "এ পর্যন্ত আপনার পথ" }} desc={{ en: "Micro-task → repeat → project → hire", bn: "মাইক্রো-টাস্ক → পুনরাবৃত্তি → প্রজেক্ট → চাকরি" }}>
        <div className="grid gap-px bg-line sm:grid-cols-4">
          {[
            { step: { en: "First micro-task", bn: "প্রথম মাইক্রো-টাস্ক" }, v: "৳1,500", d: { en: "Data cleanup, 4 hours", bn: "ডেটা ক্লিনআপ, ৪ ঘণ্টা" }, done: true },
            { step: { en: "Repeat work", bn: "পুনরাবৃত্ত কাজ" }, v: "6×", d: { en: "Same client came back", bn: "একই ক্লায়েন্ট ফিরে এসেছেন" }, done: true },
            { step: { en: "Full project", bn: "পূর্ণ প্রজেক্ট" }, v: "৳16,000", d: { en: "Five sequenced tasks", bn: "পাঁচটি ক্রমবদ্ধ টাস্ক" }, done: true },
            { step: { en: "Hiring pipeline", bn: "হায়ারিং পাইপলাইন" }, v: "—", d: { en: "Referral priority unlocked", bn: "রেফারেল প্রায়োরিটি চালু" }, done: false },
          ].map((s) => (
            <div key={s.step.en} className={cn("bg-white p-5", !s.done && "bg-canvas-2/40")}>
              <div className="flex items-center gap-2">
                {s.done ? <CheckCircle2 className="size-4 text-brand-500" /> : <Lock className="size-4 text-ink-4" />}
                <span className={cn("text-[12px] font-medium", s.done ? "text-ink" : "text-ink-4")}>{t(s.step)}</span>
              </div>
              <div className="num mt-3 text-[19px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                {s.v}
              </div>
              <p className="mt-1 text-[11.5px] text-ink-4">{t(s.d)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ── Offers ───────────────────────────────────────────────────── */

function Offers() {
  const { t, tl } = useLang();
  const n = useNum();
  const [taken, setTaken] = useState<string[]>([]);

  const reasons: L[][] = [
    [
      { en: "Your discipline matches this sector", bn: "আপনার ডিসিপ্লিন এই সেক্টরের সাথে মেলে" },
      { en: "You scored 5/5 on data accuracy last month", bn: "গত মাসে ডেটা নির্ভুলতায় আপনি ৫/৫ পেয়েছেন" },
    ],
    [
      { en: "Follows directly from a task you already delivered", bn: "আপনি ইতিমধ্যে ডেলিভার করেছেন এমন টাস্কের সরাসরি ধারাবাহিকতা" },
      { en: "Same client, 93% on-time record with them", bn: "একই ক্লায়েন্ট, তাদের সাথে ৯৩% সময়মতো রেকর্ড" },
    ],
    [
      { en: "Bangla writing is on your verified skill list", bn: "বাংলা লেখা আপনার ভেরিফায়েড স্কিল তালিকায় আছে" },
      { en: "Fits inside your stated 8 hours a week", bn: "আপনার বলা সপ্তাহে ৮ ঘণ্টার মধ্যেই হয়" },
    ],
  ];

  return (
    <div className="space-y-3">
      {OFFERS.map((task, i) => {
        const job = jobById(task.jobId)!;
        const client = clientById(job.clientId)!;
        const sector = sectorById(task.sectorId);
        const isTaken = taken.includes(task.id);

        return (
          <article key={task.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <div className="flex flex-wrap items-start gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: sector.accent }}>
                <SectorIcon name={sector.icon} className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{job.ref}</span>
                  <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium capitalize text-ink-3 ring-1 ring-line">{task.level}</span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-medium leading-snug text-ink">{t(task.title)}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(task.desc)}</p>

                <div className="mt-3.5 rounded-[12px] border border-brand-100 bg-brand-50/50 p-3.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                    <T v={{ en: "Why this reached you", bn: "কেন এটি আপনার কাছে এসেছে" }} />
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {reasons[i % reasons.length].map((r) => (
                      <li key={r.en} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-brand-900">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-500" />
                        {t(r)}
                      </li>
                    ))}
                  </ul>
                </div>

                <details className="mt-3.5 group">
                  <summary className="cursor-pointer list-none text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink">
                    <T v={{ en: "What counts as done", bn: "কী হলে সম্পন্ন ধরা হবে" }} />
                  </summary>
                  <ul className="mt-2.5 space-y-1.5">
                    {tl(task.acceptance).map((a) => (
                      <li key={a} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              <div className="w-full shrink-0 border-t border-line pt-4 sm:w-[190px] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <div className="num text-[24px] font-semibold tracking-[-0.035em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  ৳{n(task.fee.toLocaleString("en-US"))}
                </div>
                <p className="num mt-1 text-[12px] text-ink-4">
                  {n(task.hours)}h <T v={{ en: "estimated", bn: "আনুমানিক" }} /> · ৳{n(Math.round(task.fee / task.hours))}/h
                </p>
                <p className="mt-2 text-[12px] text-ink-4">{t(client.name)}</p>
                <div className="mt-4">
                  {isTaken ? (
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-brand-50 px-4 py-2.5 text-[13px] font-medium text-brand-700 ring-1 ring-brand-200">
                      <CheckCircle2 className="size-4" />
                      <T v={{ en: "Accepted", bn: "গৃহীত" }} />
                    </span>
                  ) : (
                    <Button full size="sm" onClick={() => setTaken((x) => [...x, task.id])}>
                      <T v={{ en: "Accept this task", bn: "এই টাস্ক নিন" }} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        <T
          v={{
            en: "You are never bidding against anyone. The fee is fixed before you see the task, and accepting is a decision about your own time — not a competition on price.",
            bn: "আপনি কখনো কারও বিরুদ্ধে বিড করছেন না। টাস্ক দেখার আগেই ফি নির্ধারিত, আর গ্রহণ করা মানে নিজের সময় নিয়ে সিদ্ধান্ত — দামের প্রতিযোগিতা নয়।",
          }}
        />
      </p>
    </div>
  );
}

/* ── Active ───────────────────────────────────────────────────── */

function Active() {
  const { t, tl } = useLang();
  const n = useNum();
  const task = MY_TASKS.find((x) => x.status === "in_progress")!;
  const job = jobById(task.jobId)!;
  const client = clientById(job.clientId)!;
  const [checked, setChecked] = useState<number[]>([0]);
  const [submitted, setSubmitted] = useState(false);
  const criteria = tl(task.acceptance);
  const pct = Math.round((checked.length / criteria.length) * 100);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel title={{ en: "Self-check before you submit", bn: "জমা দেওয়ার আগে নিজের যাচাই" }} desc={{ en: "The same criteria the mentor will score", bn: "মেন্টর যে শর্তেই স্কোর দেবেন, ঠিক সেটাই" }}>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between text-[12px]">
              <span className="text-ink-3">
                <T v={{ en: "Criteria met", bn: "শর্ত পূরণ" }} />
              </span>
              <span className="num font-medium text-ink">
                {n(checked.length)}/{n(criteria.length)}
              </span>
            </div>
            <Bar value={pct} />

            <ul className="mt-5 space-y-2">
              {criteria.map((c, i) => {
                const on = checked.includes(i);
                return (
                  <li key={c}>
                    <button
                      onClick={() => setChecked((x) => (on ? x.filter((y) => y !== i) : [...x, i]))}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[12px] border p-3.5 text-left transition-all",
                        on ? "border-brand-200 bg-brand-50/50" : "border-line bg-white hover:border-line-2"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-[5px] border transition-all",
                          on ? "border-brand-600 bg-brand-600 text-white" : "border-line-2"
                        )}
                        style={{ width: 18, height: 18 }}
                      >
                        {on && <CheckCircle2 className="size-3" />}
                      </span>
                      <span className={cn("text-[13px] leading-relaxed", on ? "text-brand-900" : "text-ink-2")}>{c}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>

        <Panel title={{ en: "Submit for review", bn: "রিভিউয়ের জন্য জমা দিন" }}>
          <div className="p-5">
            <div className="rounded-[12px] border border-dashed border-line-2 bg-canvas-2/40 p-8 text-center">
              <Upload className="mx-auto size-5 text-ink-4" />
              <p className="mt-3 text-[13px] font-medium text-ink">
                <T v={{ en: "Attach your deliverable", bn: "আপনার ডেলিভারেবল সংযুক্ত করুন" }} />
              </p>
              <p className="mt-1 text-[12px] text-ink-4">
                <T v={{ en: "Files, a link, or a short recorded walkthrough", bn: "ফাইল, লিংক, বা সংক্ষিপ্ত রেকর্ড করা ওয়াকথ্রু" }} />
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {["dashboard-v3.zip", "walkthrough.mp4", "handover-notes.md"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 rounded-lg bg-canvas-2 px-2.5 py-1.5 text-[11.5px] text-ink-3 ring-1 ring-line">
                  <Paperclip className="size-3" />
                  {f}
                </span>
              ))}
            </div>

            <textarea
              rows={3}
              readOnly
              defaultValue={t({
                en: "Dashboard loads in 2.1s on 4G. Numbers reconcile with the store export for the last four weeks. One open question in the notes about how returns should be counted.",
                bn: "ড্যাশবোর্ড ৪জি-তে ২.১ সেকেন্ডে লোড হয়। গত চার সপ্তাহের স্টোর এক্সপোর্টের সাথে সংখ্যা মেলে। রিটার্ন কীভাবে গণনা হবে, সে বিষয়ে নোটে একটি প্রশ্ন খোলা আছে।",
              })}
              className="mt-4 w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3.5 text-[13px] leading-relaxed text-ink-2 outline-none"
            />

            <div className="mt-4">
              {submitted ? (
                <div className="flex items-center gap-2.5 rounded-[12px] bg-brand-50 p-4 text-[13px] text-brand-900 ring-1 ring-brand-200">
                  <BadgeCheck className="size-4 shrink-0 text-brand-600" />
                  <T
                    v={{
                      en: "Submitted. The mentor scores it first, then the client signs off — payment is released only after both.",
                      bn: "জমা হয়েছে। প্রথমে মেন্টর স্কোর দেন, তারপর ক্লায়েন্ট সাইন-অফ করেন — দুটোর পরেই কেবল পেমেন্ট ছাড়া হয়।",
                    }}
                  />
                </div>
              ) : (
                <Button full onClick={() => setSubmitted(true)} icon={<Send className="size-4" />} disabled={checked.length < criteria.length}>
                  {checked.length < criteria.length ? (
                    <T v={{ en: "Tick every criterion first", bn: "আগে প্রতিটি শর্ত টিক করুন" }} />
                  ) : (
                    <T v={{ en: "Submit for mentor review", bn: "মেন্টর রিভিউয়ে জমা দিন" }} />
                  )}
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title={{ en: "The task", bn: "টাস্কটি" }}>
          <div className="p-5">
            <h3 className="text-[15px] font-medium leading-snug text-ink">{t(task.title)}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{t(task.desc)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[12.5px]">
              <div>
                <dt className="text-ink-4">
                  <T v={{ en: "Fee", bn: "ফি" }} />
                </dt>
                <dd className="num mt-0.5 font-semibold text-brand-700">৳{n(task.fee.toLocaleString("en-US"))}</dd>
              </div>
              <div>
                <dt className="text-ink-4">
                  <T v={{ en: "Estimate", bn: "আনুমানিক" }} />
                </dt>
                <dd className="num mt-0.5 font-medium text-ink">{n(task.hours)}h</dd>
              </div>
              <div>
                <dt className="text-ink-4">
                  <T v={{ en: "Client", bn: "ক্লায়েন্ট" }} />
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{t(client.name)}</dd>
              </div>
              <div>
                <dt className="text-ink-4">
                  <T v={{ en: "Due", bn: "শেষ সময়" }} />
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{t(task.dueLabel)}</dd>
              </div>
            </dl>
          </div>
        </Panel>

        <Panel title={{ en: "Your mentor on this task", bn: "এই টাস্কে আপনার মেন্টর" }}>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={mentorById("m1")!.name.en} size={38} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-ink">{t(mentorById("m1")!.name)}</div>
                <div className="truncate text-[12px] text-ink-4">{t(mentorById("m1")!.org)}</div>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
              <T
                v={{
                  en: "Typically reviews within 18 hours. Ask before you are stuck for a day — that is what the mentor layer is for, and it costs you nothing.",
                  bn: "সাধারণত ১৮ ঘণ্টার মধ্যে রিভিউ করেন। এক দিন আটকে থাকার আগেই জিজ্ঞেস করুন — মেন্টর লেয়ার এজন্যই, আর এতে আপনার কোনো খরচ নেই।",
                }}
              />
            </p>
            <Button size="sm" variant="secondary" full className="mt-4">
              <T v={{ en: "Ask a question", bn: "প্রশ্ন করুন" }} />
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── Record ───────────────────────────────────────────────────── */

function Record() {
  const { t } = useLang();
  const n = useNum();
  const approved = MY_TASKS.filter((x) => x.status === "approved");

  return (
    <div className="space-y-4">
      <Panel
        title={{ en: "Signed-off work", bn: "সাইন-অফ হওয়া কাজ" }}
        desc={{ en: "Every entry needs a mentor score and a client signature", bn: "প্রতিটি এন্ট্রিতে মেন্টর স্কোর ও ক্লায়েন্ট স্বাক্ষর লাগে" }}
        action={
          <Button size="sm" variant="secondary" href={`/passport/${ME.slug}`} icon={<ArrowUpRight className="size-3.5" />}>
            <T v={{ en: "Public view", bn: "পাবলিক ভিউ" }} />
          </Button>
        }
      >
        <div className="divide-y divide-line">
          {approved.map((task) => {
            const ev = MY_EVALS.find((e) => e.taskId === task.id);
            const job = jobById(task.jobId)!;
            const client = clientById(job.clientId)!;
            const total = ev ? ev.scores.reduce((a, s) => a + s.score, 0) : null;
            const max = ev ? ev.scores.reduce((a, s) => a + s.max, 0) : null;

            return (
              <div key={task.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14.5px] font-medium leading-snug text-ink">{t(task.title)}</h3>
                    <p className="mt-1 text-[12px] text-ink-4">
                      {t(client.name)} · {job.ref} · {t(task.dueLabel)}
                    </p>
                  </div>
                  {total !== null && (
                    <span className="num rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-100">
                      {n(total)}/{n(max!)}
                    </span>
                  )}
                </div>

                {ev && (
                  <>
                    <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {ev.scores.map((s) => (
                        <div key={s.dim.en} className="flex items-center gap-3">
                          <span className="flex-1 truncate text-[12px] text-ink-3">{t(s.dim)}</span>
                          <span className="flex gap-0.5">
                            {Array.from({ length: s.max }).map((_, i) => (
                              <span key={i} className={cn("size-1.5 rounded-full", i < s.score ? "bg-brand-500" : "bg-canvas-3")} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-[12px] border border-line bg-canvas-2/50 p-4">
                      <p className="text-[12.5px] leading-relaxed text-ink-2">&ldquo;{t(ev.mentorNote)}&rdquo;</p>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-4">
                        <BadgeCheck className="size-3.5 text-brand-600" />
                        {t(mentorById(ev.mentorId)!.name)}
                        {ev.clientSignoff && (
                          <>
                            <span>·</span>
                            <T v={{ en: "client signed off", bn: "ক্লায়েন্ট সাইন-অফ করেছেন" }} />
                          </>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ── Earnings ─────────────────────────────────────────────────── */

function Earnings() {
  const { t } = useLang();
  const n = useNum();

  const released = MY_TASKS.filter((x) => x.status === "approved").reduce((a, x) => a + x.fee, 0);
  const pending = MY_TASKS.filter((x) => x.status === "in_progress" || x.status === "in_review").reduce((a, x) => a + x.fee, 0);

  const history = [
    { m: { en: "Month 1", bn: "মাস ১" }, v: 4000 },
    { m: { en: "Month 2", bn: "মাস ২" }, v: 7500 },
    { m: { en: "Month 3", bn: "মাস ৩" }, v: 11200 },
    { m: { en: "Month 4", bn: "মাস ৪" }, v: 14200 },
    { m: { en: "Month 5", bn: "মাস ৫" }, v: 21500 },
  ];
  const peak = Math.max(...history.map((h) => h.v));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Banknote} label={{ en: "Released to you", bn: "আপনাকে ছাড়া হয়েছে" }} value={`৳${n(released.toLocaleString("en-US"))}`} hint={{ en: "after dual sign-off", bn: "দ্বৈত সাইন-অফের পর" }} tone="brand" />
        <StatCard icon={ShieldCheck} label={{ en: "In progress", bn: "চলমান" }} value={`৳${n(pending.toLocaleString("en-US"))}`} hint={{ en: "held by the platform, not spent", bn: "প্ল্যাটফর্মে আটকে, খরচ হয়নি" }} />
        <StatCard icon={Flame} label={{ en: "Delivery streak", bn: "ডেলিভারি স্ট্রিক" }} value={`${n(ME.streak)}×`} hint={{ en: "consecutive on-time deliveries", bn: "টানা সময়মতো ডেলিভারি" }} tone="ink" />
      </div>

      <Panel title={{ en: "Cumulative earnings", bn: "ক্রমসঞ্চিত আয়" }} desc={{ en: "Started with a ৳1,500 micro-task", bn: "শুরু ৳১,৫০০ টাকার মাইক্রো-টাস্ক দিয়ে" }}>
        <div className="p-5">
          <div className="flex items-end gap-3" style={{ height: 180 }}>
            {history.map((h) => (
              <div key={h.m.en} className="flex flex-1 flex-col items-center gap-2">
                <span className="num text-[11.5px] font-medium text-ink-3">৳{n(h.v.toLocaleString("en-US"))}</span>
                <div
                  className="w-full rounded-t-[6px] bg-brand-500 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ height: `${(h.v / peak) * 120}px` }}
                />
                <span className="text-[11px] text-ink-4">{t(h.m)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-2.5 border-t border-line pt-4">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-brand-500" />
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              <T
                v={{
                  en: "The amounts are small on purpose. The point of a first paid task is not the money — it is that a real business chose to pay you, and someone independent verified that you delivered.",
                  bn: "অঙ্কগুলো ইচ্ছে করেই ছোট। প্রথম পেইড টাস্কের উদ্দেশ্য টাকা নয় — উদ্দেশ্য হলো একটা বাস্তব ব্যবসা আপনাকে টাকা দিতে রাজি হয়েছে, আর একজন নিরপেক্ষ ব্যক্তি যাচাই করেছেন যে আপনি কাজটা করেছেন।",
                }}
              />
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
