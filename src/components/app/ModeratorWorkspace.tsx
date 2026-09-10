"use client";

import { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileCheck2,
  FileWarning,
  Gauge,
  IdCard,
  LayoutDashboard,
  Lock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard } from "./parts";
import { Avatar, Bar, Button } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import {
  ACTIVITY,
  CLIENT_STATE,
  CONTROLS,
  KYC,
  PAYMENTS,
  SCOPE_REVIEWS,
  STUDENT_STATE,
  VERIFICATION_CHECKS,
  type AccountState,
  type KycStatus,
  type PayStatus,
} from "@/data/admin";
import { EVALUATIONS, JOBS, TASKS, jobById, tasksOfJob } from "@/data/work";
import { CLIENTS, STUDENTS, clientById, mentorById, studentById } from "@/data/people";
import { sectorById } from "@/data/sectors";
import { priceCheck } from "@/lib/engine";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const PENDING_KYC = KYC.filter((k) => k.status === "pending").length;
const OPEN_MONEY = PAYMENTS.filter((p) => p.status === "awaiting" || p.status === "held").length;

const NAV: NavItem[] = [
  { key: "overview", label: { en: "Overview", bn: "ওভারভিউ" }, icon: LayoutDashboard },
  { key: "scopes", label: { en: "AI scope review", bn: "এআই স্কোপ রিভিউ" }, icon: Cpu, badge: SCOPE_REVIEWS.length },
  { key: "verify", label: { en: "Verification audit", bn: "ভেরিফিকেশন অডিট" }, icon: ShieldCheck, badge: 1 },
  { key: "payments", label: { en: "Payments", bn: "পেমেন্ট" }, icon: Banknote, badge: OPEN_MONEY },
  { key: "accounts", label: { en: "Identity checks", bn: "পরিচয় যাচাই" }, icon: IdCard, badge: PENDING_KYC },
  { key: "directory", label: { en: "Clients & students", bn: "ক্লায়েন্ট ও শিক্ষার্থী" }, icon: Users },
  { key: "controls", label: { en: "Platform controls", bn: "প্ল্যাটফর্ম নিয়ন্ত্রণ" }, icon: SlidersHorizontal },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: {
    title: { en: "Overview", bn: "ওভারভিউ" },
    subtitle: { en: "The human gate the whole model rests on", bn: "পুরো মডেল যে মানবিক গেটের ওপর দাঁড়িয়ে" },
  },
  scopes: {
    title: { en: "AI scope review", bn: "এআই স্কোপ রিভিউ" },
    subtitle: { en: "Nothing the AI wrote reaches a student until you release it", bn: "আপনি না ছাড়া পর্যন্ত এআই-এর লেখা কিছুই শিক্ষার্থীর কাছে যায় না" },
  },
  verify: {
    title: { en: "Verification audit", bn: "ভেরিফিকেশন অডিট" },
    subtitle: { en: "Both signatures checked before a record becomes permanent", bn: "রেকর্ড স্থায়ী হওয়ার আগে দুটি স্বাক্ষরই যাচাই" },
  },
  payments: {
    title: { en: "Payments", bn: "পেমেন্ট" },
    subtitle: { en: "Money in, money held, money released — one screen", bn: "টাকা আসা, আটকে থাকা, ছাড়া — এক পর্দায়" },
  },
  accounts: {
    title: { en: "Identity checks", bn: "পরিচয় যাচাই" },
    subtitle: { en: "Businesses, students and mentors, before they can transact", bn: "লেনদেনের আগে ব্যবসা, শিক্ষার্থী ও মেন্টর" },
  },
  directory: {
    title: { en: "Clients & students", bn: "ক্লায়েন্ট ও শিক্ষার্থী" },
    subtitle: { en: "Every account, its status, and what you can do about it", bn: "প্রতিটি অ্যাকাউন্ট, তার অবস্থা, আর আপনি কী করতে পারেন" },
  },
  controls: {
    title: { en: "Platform controls", bn: "প্ল্যাটফর্ম নিয়ন্ত্রণ" },
    subtitle: { en: "Some of these are deliberately not yours to turn off", bn: "এর কিছু ইচ্ছাকৃতভাবেই আপনার বন্ধ করার নয়" },
  },
};

export default function ModeratorWorkspace() {
  const [tab, setTab] = useState("overview");
  const { t } = useLang();

  return (
    <AppShell
      role="moderator"
      roleLabel={{ en: "Moderator console", bn: "মডারেটর কনসোল" }}
      userName={t({ en: "Sabbir Rahman", bn: "সাব্বির রহমান" })}
      userMeta={{ en: "Platform coordinator", bn: "প্ল্যাটফর্ম কোঅর্ডিনেটর" }}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
    >
      {tab === "overview" && <Overview onGo={setTab} />}
      {tab === "scopes" && <Scopes />}
      {tab === "verify" && <VerifyAudit />}
      {tab === "payments" && <Payments />}
      {tab === "accounts" && <Accounts />}
      {tab === "directory" && <Directory />}
      {tab === "controls" && <Controls />}
    </AppShell>
  );
}

/* ── Shared pills ─────────────────────────────────────────────── */

const PAY_META: Record<PayStatus, { label: L; cls: string }> = {
  awaiting: { label: { en: "Awaiting funding", bn: "ফান্ডিংয়ের অপেক্ষায়" }, cls: "bg-info-bg text-info ring-info/15" },
  held: { label: { en: "Held in escrow", bn: "এসক্রোতে আটকে" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  released: { label: { en: "Released", bn: "ছাড়া হয়েছে" }, cls: "bg-brand-600 text-white ring-brand-600" },
  refunded: { label: { en: "Refunded", bn: "ফেরত" }, cls: "bg-canvas-2 text-ink-3 ring-line" },
  failed: { label: { en: "Failed", bn: "ব্যর্থ" }, cls: "bg-canvas-2 text-ink-4 ring-line" },
};

function PayPill({ status }: { status: PayStatus }) {
  const { t } = useLang();
  const m = PAY_META[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", m.cls)}>{t(m.label)}</span>;
}

const STATE_META: Record<AccountState, { label: L; cls: string }> = {
  active: { label: { en: "Active", bn: "সক্রিয়" }, cls: "bg-brand-50 text-brand-700 ring-brand-100" },
  review: { label: { en: "In review", bn: "রিভিউতে" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  restricted: { label: { en: "Restricted", bn: "সীমাবদ্ধ" }, cls: "bg-canvas-3 text-ink-2 ring-line-2" },
  new: { label: { en: "New", bn: "নতুন" }, cls: "bg-info-bg text-info ring-info/15" },
};

function StatePill({ state }: { state: AccountState }) {
  const { t } = useLang();
  const m = STATE_META[state];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", m.cls)}>{t(m.label)}</span>;
}

const KYC_META: Record<KycStatus, { label: L; cls: string }> = {
  pending: { label: { en: "Pending", bn: "অপেক্ষমাণ" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  verified: { label: { en: "Verified", bn: "যাচাইকৃত" }, cls: "bg-brand-600 text-white ring-brand-600" },
  rejected: { label: { en: "Rejected", bn: "বাতিল" }, cls: "bg-canvas-3 text-ink-2 ring-line-2" },
  resubmit: { label: { en: "Re-submission asked", bn: "পুনরায় জমা চাওয়া" }, cls: "bg-info-bg text-info ring-info/15" },
};

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({ onGo }: { onGo: (k: string) => void }) {
  const { t } = useLang();
  const n = useNum();

  const held = PAYMENTS.filter((p) => p.status === "held").reduce((a, p) => a + p.amount, 0);
  const released = PAYMENTS.filter((p) => p.status === "released").reduce((a, p) => a + p.amount, 0);
  const awaiting = PAYMENTS.filter((p) => p.status === "awaiting").reduce((a, p) => a + p.amount, 0);

  const queues = [
    {
      icon: Cpu,
      tone: "info" as const,
      go: "scopes",
      count: SCOPE_REVIEWS.length,
      title: { en: "AI scopes waiting for release", bn: "প্রকাশের অপেক্ষায় এআই স্কোপ" },
      body: {
        en: "Each one is a draft. Approve, re-split, re-price or reject — your edits are the training signal that improves the next scope.",
        bn: "প্রতিটিই খসড়া। অনুমোদন, পুনর্বিন্যাস, পুনর্মূল্যায়ন বা বাতিল করুন — আপনার সম্পাদনাই পরের স্কোপ উন্নত করার প্রশিক্ষণ সংকেত।",
      },
    },
    {
      icon: IdCard,
      tone: "warn" as const,
      go: "accounts",
      count: PENDING_KYC,
      title: { en: "Identity checks in the queue", bn: "কিউয়ে পরিচয় যাচাই" },
      body: {
        en: "Two students and one business. Nobody transacts, and no payout leaves the platform, until the documents match the account name.",
        bn: "দুইজন শিক্ষার্থী ও একটি ব্যবসা। ডকুমেন্ট অ্যাকাউন্টের নামের সাথে না মেলা পর্যন্ত কেউ লেনদেন করেন না, কোনো পেআউটও প্ল্যাটফর্ম ছাড়ে না।",
      },
    },
    {
      icon: Wallet,
      tone: "warn" as const,
      go: "payments",
      count: OPEN_MONEY,
      title: { en: "Payments needing a decision", bn: "সিদ্ধান্তের অপেক্ষায় পেমেন্ট" },
      body: {
        en: "One job awaiting funding, three sums held in escrow. Nothing is released until the client signs off on the work.",
        bn: "একটি জব ফান্ডিংয়ের অপেক্ষায়, তিনটি অঙ্ক এসক্রোতে আটকে। ক্লায়েন্ট কাজে সাইন-অফ না করা পর্যন্ত কিছুই ছাড়া হয় না।",
      },
    },
    {
      icon: AlertTriangle,
      tone: "warn" as const,
      go: "verify",
      count: 1,
      title: { en: "Verification entry flagged", bn: "চিহ্নিত ভেরিফিকেশন এন্ট্রি" },
      body: {
        en: "A mentor and a client on the same entry are linked to one business group. Not disqualifying — but it gets marked, so the relationship is visible on the passport.",
        bn: "একই এন্ট্রির মেন্টর ও ক্লায়েন্ট এক ব্যবসায়িক গ্রুপের সাথে যুক্ত। এতে বাতিল হয় না — তবে চিহ্নিত থাকে, যাতে সম্পর্কটি পাসপোর্টে দৃশ্যমান হয়।",
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gauge}
          label={{ en: "Open queues", bn: "খোলা কিউ" }}
          value={n(SCOPE_REVIEWS.length + PENDING_KYC + OPEN_MONEY + 1)}
          hint={{ en: "scopes, identity, money, audit", bn: "স্কোপ, পরিচয়, টাকা, অডিট" }}
          tone="brand"
        />
        <StatCard
          icon={ShieldCheck}
          label={{ en: "Held in escrow", bn: "এসক্রোতে আটকে" }}
          value={`৳${n(held.toLocaleString("en-US"))}`}
          hint={{ en: "not with the student, not spent", bn: "শিক্ষার্থীর কাছে নয়, খরচও নয়" }}
        />
        <StatCard
          icon={Banknote}
          label={{ en: "Released to date", bn: "এ পর্যন্ত ছাড়া" }}
          value={`৳${n(released.toLocaleString("en-US"))}`}
          hint={{ en: "after dual sign-off, every time", bn: "প্রতিবারই দ্বৈত সাইন-অফের পর" }}
        />
        <StatCard
          icon={Users}
          label={{ en: "Accounts on the platform", bn: "প্ল্যাটফর্মে অ্যাকাউন্ট" }}
          value={n(STUDENTS.length + CLIENTS.length + 4)}
          hint={{ en: "8 students · 3 businesses · 4 mentors", bn: "৮ শিক্ষার্থী · ৩ ব্যবসা · ৪ মেন্টর" }}
          tone="ink"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title={{ en: "What needs a decision", bn: "যেসবে সিদ্ধান্ত দরকার" }}
          desc={{ en: "In the order it should be cleared", bn: "যে ক্রমে নিষ্পত্তি হওয়া উচিত" }}
        >
          <div className="divide-y divide-line">
            {queues.map((q) => (
              <button
                key={q.title.en}
                onClick={() => onGo(q.go)}
                className="group flex w-full flex-wrap items-start gap-4 p-5 text-left transition-colors hover:bg-canvas-2/50"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-[10px] ring-1",
                    q.tone === "warn" ? "bg-warn-bg text-warn ring-warn/15" : "bg-info-bg text-info ring-info/15"
                  )}
                >
                  <q.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-ink">{t(q.title)}</span>
                    <span className="num rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-semibold text-white">{n(q.count)}</span>
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-3">{t(q.body)}</span>
                </span>
                <ArrowRight className="mt-2 size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={{ en: "Recent actions", bn: "সাম্প্রতিক কার্যক্রম" }} desc={{ en: "Every coordinator decision is logged", bn: "কোঅর্ডিনেটরের প্রতিটি সিদ্ধান্ত লগ হয়" }}>
          <div className="divide-y divide-line">
            {ACTIVITY.map((a) => {
              const Icon =
                a.kind === "payment" ? Banknote : a.kind === "scope" ? Cpu : a.kind === "verify" ? ShieldCheck : a.kind === "user" ? Users : SlidersHorizontal;
              return (
                <div key={a.id} className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-canvas-2 text-ink-3 ring-1 ring-line">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug text-ink-2">{t(a.action)}</p>
                    <p className="mt-1 text-[11px] text-ink-4">
                      {t(a.actor)} · {t(a.timeLabel)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel
        title={{ en: "Why a person sits in the middle", bn: "কেন মাঝখানে একজন মানুষ বসে" }}
        desc={{ en: "The constraint is in the roadmap, not in anyone's good intentions", bn: "সীমাটা রোডম্যাপে, কারও সদিচ্ছায় নয়" }}
      >
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              t: { en: "AI drafts, never decides", bn: "এআই খসড়া করে, সিদ্ধান্ত নেয় না" },
              d: {
                en: "Until 20–30 real completed projects exist as calibration data, confident nonsense is the default failure mode.",
                bn: "২০–৩০টি বাস্তব সম্পন্ন প্রজেক্ট ক্যালিব্রেশন ডেটা হিসেবে না থাকা পর্যন্ত আত্মবিশ্বাসী অর্থহীনতাই স্বাভাবিক ব্যর্থতা।",
              },
            },
            {
              icon: FileCheck2,
              t: { en: "Two signatures, or nothing", bn: "দুটি স্বাক্ষর, নাহলে কিছুই নয়" },
              d: {
                en: "A mentor score and a client sign-off. A self-claim never becomes a record, and a revision is logged beside the result.",
                bn: "মেন্টর স্কোর ও ক্লায়েন্ট সাইন-অফ। self-claim কখনো রেকর্ড হয় না, আর রিভিশন ফলাফলের পাশেই লগ থাকে।",
              },
            },
            {
              icon: Lock,
              t: { en: "Money moves last", bn: "টাকা সবার শেষে নড়ে" },
              d: {
                en: "Funds are held by the platform from approval to sign-off. Never advanced, never spent while work is in flight.",
                bn: "অনুমোদন থেকে সাইন-অফ পর্যন্ত টাকা প্ল্যাটফর্মে আটকে থাকে। আগাম দেওয়া হয় না, কাজ চলাকালীন খরচও হয় না।",
              },
            },
          ].map((x) => (
            <div key={x.t.en} className="bg-white p-5">
              <x.icon className="size-4 text-brand-500" />
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(x.t)}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-4">{t(x.d)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ── AI scope review ──────────────────────────────────────────── */

function Scopes() {
  const { t, tl } = useLang();
  const n = useNum();
  const [decided, setDecided] = useState<Record<string, "released" | "edited" | "rejected">>({});
  const [open, setOpen] = useState<string | null>(SCOPE_REVIEWS[0].id);

  return (
    <div className="space-y-3">
      {SCOPE_REVIEWS.map((review) => {
        const job = jobById(review.jobId)!;
        const client = clientById(job.clientId)!;
        const sector = sectorById(job.sectorId);
        const tasks = tasksOfJob(job.id);
        const total = tasks.reduce((a, x) => a + x.fee, 0);
        const hours = tasks.reduce((a, x) => a + x.hours, 0);
        const verdict = priceCheck(job.budget, hours, job.sectorId);
        const state = decided[review.id];
        const isOpen = open === review.id;

        return (
          <article key={review.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <button onClick={() => setOpen(isOpen ? null : review.id)} className="flex w-full items-start gap-4 p-5 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: sector.accent }}>
                <SectorIcon name={sector.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{job.ref}</span>
                  {review.priority === "high" && (
                    <span className="rounded-full bg-warn-bg px-2 py-0.5 text-[10.5px] font-semibold text-warn ring-1 ring-inset ring-warn/15">
                      <T v={{ en: "Priority", bn: "অগ্রাধিকার" }} />
                    </span>
                  )}
                  <span className="num rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium text-ink-3 ring-1 ring-line">
                    {n(job.ai.confidence)}% <T v={{ en: "confidence", bn: "কনফিডেন্স" }} />
                  </span>
                  {verdict.level !== "ok" && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
                        verdict.level === "blocked" ? "bg-warn-bg text-warn ring-warn/15" : "bg-canvas-3 text-ink-2 ring-line-2"
                      )}
                    >
                      <Scale className="size-3" />
                      {verdict.level === "blocked"
                        ? t({ en: "Underpriced", bn: "কম দাম" })
                        : t({ en: "Below floor", bn: "সীমার নিচে" })}
                    </span>
                  )}
                  {state && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
                        state === "released" ? "bg-brand-600 text-white ring-brand-600" : state === "edited" ? "bg-info-bg text-info ring-info/15" : "bg-canvas-3 text-ink-2 ring-line-2"
                      )}
                    >
                      {state === "released" ? t({ en: "Released", bn: "প্রকাশিত" }) : state === "edited" ? t({ en: "Sent back for edit", bn: "সম্পাদনার জন্য ফেরত" }) : t({ en: "Rejected", bn: "বাতিল" })}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-[15px] font-medium leading-snug text-ink">{t(job.title)}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-4">
                  <span>{t(client.name)}</span>
                  <span>·</span>
                  <span>{t(review.submittedLabel)}</span>
                  <span>·</span>
                  <span className="num">
                    {n(tasks.length)} <T v={{ en: "tasks", bn: "টাস্ক" }} /> · ৳{n(total.toLocaleString("en-US"))}
                  </span>
                </span>
              </span>
              <ChevronDown className={cn("mt-1 size-4 shrink-0 text-ink-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <div className="grid transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <div className="border-t border-line">
                  <div className="grid gap-6 bg-canvas-2/40 p-5 lg:grid-cols-2">
                    <div>
                      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "What the client wrote", bn: "ক্লায়েন্ট যা লিখেছেন" }} />
                      </h4>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{t(job.brief)}&rdquo;</p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <AlertTriangle className="size-3 text-warn" />
                        <T v={{ en: "What the system flagged", bn: "সিস্টেম যা চিহ্নিত করেছে" }} />
                      </h4>
                      <ul className="mt-2.5 space-y-1.5">
                        {review.aiFlags.map((f) => (
                          <li key={f.en} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-warn" />
                            {t(f)}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3.5 rounded-[12px] border border-line bg-white p-3.5">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                          <T v={{ en: "Coordinator note", bn: "কোঅর্ডিনেটর নোট" }} />
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{t(review.suggestion)}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "border-b border-line p-5",
                      verdict.level === "blocked" ? "bg-warn-bg/40" : verdict.level === "low" ? "bg-canvas-2/60" : "bg-brand-50/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <Scale className="size-3" />
                      <T v={{ en: "Fair-price check", bn: "ন্যায্য-দাম যাচাই" }} />
                    </div>
                    <p className="mt-2.5 max-w-[74ch] text-[13px] leading-relaxed text-ink-2">{t(verdict.message)}</p>
                    <div className="mt-4 grid gap-px overflow-hidden rounded-[12px] bg-line ring-1 ring-line sm:grid-cols-4">
                      <div className="bg-white p-3.5">
                        <div className="text-[10.5px] text-ink-4">
                          <T v={{ en: "Client budget", bn: "ক্লায়েন্ট বাজেট" }} />
                        </div>
                        <div className="num mt-1 text-[15px] font-semibold text-ink">৳{n(job.budget.toLocaleString("en-US"))}</div>
                      </div>
                      <div className="bg-white p-3.5">
                        <div className="text-[10.5px] text-ink-4">
                          <T v={{ en: "Effort scoped", bn: "স্কোপ করা পরিশ্রম" }} />
                        </div>
                        <div className="num mt-1 text-[15px] font-semibold text-ink">{n(hours)}h</div>
                      </div>
                      <div className="bg-white p-3.5">
                        <div className="text-[10.5px] text-ink-4">
                          <T v={{ en: "Effective rate", bn: "কার্যকর হার" }} />
                        </div>
                        <div className={cn("num mt-1 text-[15px] font-semibold", verdict.fair ? "text-brand-600" : "text-warn")}>
                          ৳{n(verdict.rate.toLocaleString("en-US"))}/h
                        </div>
                      </div>
                      <div className="bg-white p-3.5">
                        <div className="text-[10.5px] text-ink-4">
                          <T v={{ en: "Sector floor", bn: "সেক্টর সীমা" }} />
                        </div>
                        <div className="num mt-1 text-[15px] font-semibold text-ink">৳{n(verdict.floor.toLocaleString("en-US"))}/h</div>
                      </div>
                    </div>
                  </div>

                  <ul className="divide-y divide-line">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                        <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-canvas-2 text-[12px] font-semibold text-ink-3 ring-1 ring-line">
                          {n(task.seq)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</span>
                          <span className="num mt-0.5 block text-[11.5px] text-ink-4">
                            ৳{n(task.fee.toLocaleString("en-US"))} · {n(task.hours)}h · {task.level}
                          </span>
                        </span>
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-ink-3 transition-colors hover:border-brand-300 hover:text-brand-700">
                          <Pencil className="size-3" />
                          <T v={{ en: "Edit", bn: "সম্পাদনা" }} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas-2/50 p-5">
                    <p className="min-w-[200px] flex-1 text-[12px] leading-relaxed text-ink-4">
                      <T
                        v={{
                          en: "Whatever you decide is recorded against this scope and fed back as a training signal.",
                          bn: "আপনি যা-ই সিদ্ধান্ত নিন, এই স্কোপের বিপরীতে রেকর্ড হয় এবং প্রশিক্ষণ সংকেত হিসেবে ফিরে যায়।",
                        }}
                      />
                    </p>
                    {state ? (
                      <button
                        onClick={() => setDecided((d) => { const c = { ...d }; delete c[review.id]; return c; })}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
                      >
                        <Undo2 className="size-3.5" />
                        <T v={{ en: "Undo", bn: "ফিরিয়ে নিন" }} />
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" icon={<XCircle className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [review.id]: "rejected" }))}>
                          <T v={{ en: "Reject", bn: "বাতিল" }} />
                        </Button>
                        <Button size="sm" variant="secondary" icon={<RefreshCw className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [review.id]: "edited" }))}>
                          <T v={{ en: "Send back to re-scope", bn: "পুনরায় স্কোপে ফেরত" }} />
                        </Button>
                        <Button
                          size="sm"
                          disabled={verdict.level === "blocked"}
                          icon={<CheckCircle2 className="size-3.5" />}
                          onClick={() => setDecided((d) => ({ ...d, [review.id]: "released" }))}
                        >
                          {verdict.level === "blocked" ? (
                            <T v={{ en: "Blocked — underpriced", bn: "আটকানো — কম দাম" }} />
                          ) : (
                            <T v={{ en: "Approve and release", bn: "অনুমোদন ও প্রকাশ" }} />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── Verification audit ───────────────────────────────────────── */

function VerifyAudit() {
  const { t } = useLang();
  const n = useNum();

  return (
    <div className="space-y-3">
      {VERIFICATION_CHECKS.map((check) => {
        const ev = EVALUATIONS.find((e) => e.id === check.evaluationId)!;
        const task = TASKS.find((x) => x.id === check.taskId)!;
        const student = studentById(ev.studentId)!;
        const mentor = mentorById(ev.mentorId)!;
        const total = ev.scores.reduce((a, s) => a + s.score, 0);
        const max = ev.scores.reduce((a, s) => a + s.max, 0);

        return (
          <section
            key={check.id}
            className={cn("overflow-hidden rounded-[16px] border bg-white", check.state === "attention" ? "border-warn/25" : "border-line")}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{jobById(task.jobId)!.ref}</span>
                  {check.state === "attention" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-[10.5px] font-semibold text-warn ring-1 ring-inset ring-warn/15">
                      <FileWarning className="size-3" />
                      <T v={{ en: "Flagged", bn: "চিহ্নিত" }} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                      <BadgeCheck className="size-3" />
                      <T v={{ en: "Clean", bn: "পরিষ্কার" }} />
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 text-[15.5px] font-medium leading-snug text-ink">{t(task.title)}</h2>
                <p className="mt-1.5 text-[12px] text-ink-4">
                  {t(student.name)} · {t(mentor.name)}
                </p>
              </div>
              <span className="num rounded-full bg-canvas-2 px-3 py-1.5 text-[13px] font-semibold text-ink ring-1 ring-line">
                {n(total)}/{n(max)}
              </span>
            </div>

            <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
              {[
                { ok: check.mentorOk, label: { en: "Mentor score", bn: "মেন্টর স্কোর" }, who: mentor.name },
                { ok: check.clientOk, label: { en: "Client sign-off", bn: "ক্লায়েন্ট সাইন-অফ" }, who: clientById(jobById(task.jobId)!.clientId)!.name },
              ].map((sig) => (
                <div key={sig.label.en} className="flex items-center gap-3 bg-white p-4">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      sig.ok ? "bg-brand-50 text-brand-600 ring-1 ring-brand-100" : "bg-canvas-2 text-ink-4 ring-1 ring-line"
                    )}
                  >
                    {sig.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-ink">{t(sig.label)}</div>
                    <div className="truncate text-[11.5px] text-ink-4">{t(sig.who)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 border-t border-line bg-canvas-2/50 p-5">
              <ShieldCheck className={cn("mt-0.5 size-4 shrink-0", check.state === "attention" ? "text-warn" : "text-brand-600")} />
              <p className="text-[12.5px] leading-relaxed text-ink-2">{t(check.note)}</p>
            </div>
          </section>
        );
      })}

      <p className="px-1 text-[12px] leading-relaxed text-ink-4">
        <T
          v={{
            en: "The audit does not re-do the mentor's judgement. It checks that both signatures exist, that the scores are not wildly out of line with the mentor's own history, and that the two signers are independent of each other.",
            bn: "অডিট মেন্টরের বিচার নতুন করে করে না। এটি দেখে দুটি স্বাক্ষরই আছে কিনা, স্কোর মেন্টরের নিজের ইতিহাস থেকে অস্বাভাবিকভাবে আলাদা কিনা, আর দুই স্বাক্ষরকারী একে অন্যের থেকে স্বাধীন কিনা।",
          }}
        />
      </p>
    </div>
  );
}

/* ── Payments ─────────────────────────────────────────────────── */

function Payments() {
  const { t } = useLang();
  const n = useNum();
  const [acted, setActed] = useState<Record<string, "released" | "refunded" | "confirmed">>({});
  const [filter, setFilter] = useState<"all" | PayStatus>("all");

  const rows = useMemo(() => (filter === "all" ? PAYMENTS : PAYMENTS.filter((p) => p.status === filter)), [filter]);

  const held = PAYMENTS.filter((p) => p.status === "held").reduce((a, p) => a + p.amount, 0);
  const awaiting = PAYMENTS.filter((p) => p.status === "awaiting").reduce((a, p) => a + p.amount, 0);
  const released = PAYMENTS.filter((p) => p.status === "released").reduce((a, p) => a + p.amount, 0);

  const filters: { key: "all" | PayStatus; label: L }[] = [
    { key: "all", label: { en: "All", bn: "সব" } },
    { key: "awaiting", label: { en: "Awaiting funding", bn: "ফান্ডিংয়ের অপেক্ষায়" } },
    { key: "held", label: { en: "Held", bn: "আটকে" } },
    { key: "released", label: { en: "Released", bn: "ছাড়া" } },
    { key: "failed", label: { en: "Failed", bn: "ব্যর্থ" } },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Wallet} label={{ en: "Awaiting funding", bn: "ফান্ডিংয়ের অপেক্ষায়" }} value={`৳${n(awaiting.toLocaleString("en-US"))}`} hint={{ en: "no student starts until it clears", bn: "নিশ্চিত না হওয়া পর্যন্ত কেউ শুরু করেন না" }} />
        <StatCard icon={ShieldCheck} label={{ en: "Held in escrow", bn: "এসক্রোতে আটকে" }} value={`৳${n(held.toLocaleString("en-US"))}`} hint={{ en: "work delivered, sign-off pending", bn: "কাজ ডেলিভার, সাইন-অফ বাকি" }} tone="brand" />
        <StatCard icon={Banknote} label={{ en: "Released", bn: "ছাড়া হয়েছে" }} value={`৳${n(released.toLocaleString("en-US"))}`} hint={{ en: "after both signatures", bn: "দুটি স্বাক্ষরের পর" }} tone="ink" />
      </div>

      <Panel
        title={{ en: "Ledger", bn: "লেজার" }}
        desc={{ en: "Every taka in, held, and out", bn: "প্রতিটি টাকা — আসা, আটকে থাকা, বেরোনো" }}
        action={
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11.5px] transition-colors",
                  filter === f.key ? "bg-ink text-white" : "text-ink-3 hover:bg-canvas-2 hover:text-ink"
                )}
              >
                {t(f.label)}
              </button>
            ))}
          </div>
        }
      >
        <div className="divide-y divide-line">
          {rows.map((p) => {
            const client = clientById(p.clientId)!;
            const student = p.studentId ? studentById(p.studentId) : null;
            const job = jobById(p.jobId)!;
            const done = acted[p.id];

            return (
              <div key={p.id} className="flex flex-wrap items-start gap-4 p-5">
                <span className="num w-[86px] shrink-0 text-[11.5px] font-medium text-ink-4">{p.ref}</span>

                <div className="min-w-[180px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium text-ink">{t(client.name)}</span>
                    <PayPill status={p.status} />
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-4">
                    {job.ref} · {t(p.method)} · {t(p.dateLabel)}
                  </p>
                  {p.note && <p className="mt-1.5 max-w-[52ch] text-[12px] leading-relaxed text-ink-3">{t(p.note)}</p>}
                </div>

                {student && (
                  <div className="flex items-center gap-2">
                    <Avatar name={student.name.en} size={26} />
                    <span className="hidden text-[12px] text-ink-3 sm:block">{t(student.name)}</span>
                  </div>
                )}

                <div className="num w-[92px] shrink-0 text-right text-[15px] font-semibold text-ink">
                  ৳{n(p.amount.toLocaleString("en-US"))}
                </div>

                <div className="w-full shrink-0 sm:w-auto">
                  {done ? (
                    <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-brand-50 px-3 py-2 text-[12px] font-medium text-brand-700 ring-1 ring-brand-200">
                      <CheckCircle2 className="size-3.5" />
                      {done === "released"
                        ? t({ en: "Payout sent", bn: "পেআউট পাঠানো" })
                        : done === "refunded"
                        ? t({ en: "Refunded", bn: "ফেরত দেওয়া" })
                        : t({ en: "Funding confirmed", bn: "ফান্ডিং নিশ্চিত" })}
                    </span>
                  ) : p.status === "held" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setActed((a) => ({ ...a, [p.id]: "refunded" }))}>
                        <T v={{ en: "Refund", bn: "ফেরত" }} />
                      </Button>
                      <Button size="sm" onClick={() => setActed((a) => ({ ...a, [p.id]: "released" }))}>
                        <T v={{ en: "Release payout", bn: "পেআউট ছাড়ুন" }} />
                      </Button>
                    </div>
                  ) : p.status === "awaiting" ? (
                    <Button size="sm" variant="secondary" onClick={() => setActed((a) => ({ ...a, [p.id]: "confirmed" }))}>
                      <T v={{ en: "Confirm payment", bn: "পেমেন্ট নিশ্চিত করুন" }} />
                    </Button>
                  ) : (
                    <span className="text-[11.5px] text-ink-4">
                      <T v={{ en: "No action needed", bn: "কোনো পদক্ষেপ লাগবে না" }} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex items-start gap-3 rounded-[16px] border border-line bg-white p-5">
        <Lock className="mt-0.5 size-4 shrink-0 text-ink-4" />
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          <T
            v={{
              en: "Releasing a payout is only possible where the mentor has scored and the client has signed off. A held sum stays held during a revision — it is never refunded automatically, because the work was done and the dispute is about quality, not delivery.",
              bn: "মেন্টর স্কোর দিয়েছেন ও ক্লায়েন্ট সাইন-অফ করেছেন — কেবল সেখানেই পেআউট ছাড়া সম্ভব। রিভিশনের সময় আটকে থাকা টাকা আটকেই থাকে — স্বয়ংক্রিয়ভাবে ফেরত যায় না, কারণ কাজটি হয়েছে এবং বিরোধ ডেলিভারি নিয়ে নয়, মান নিয়ে।",
            }}
          />
        </p>
      </div>
    </div>
  );
}

/* ── Identity checks ──────────────────────────────────────────── */

function Accounts() {
  const { t } = useLang();
  const [decided, setDecided] = useState<Record<string, "verified" | "resubmit" | "rejected">>({});

  return (
    <div className="space-y-3">
      {KYC.map((k) => {
        const state = decided[k.id] ?? (k.status === "pending" ? null : k.status);
        const meta = KYC_META[(state ?? "pending") as KycStatus];
        const okCount = k.documents.filter((d) => d.ok).length;

        return (
          <section key={k.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-[11px] ring-1",
                    k.kind === "client" ? "bg-canvas-2 text-ink-2 ring-line" : k.kind === "mentor" ? "bg-brand-50 text-brand-700 ring-brand-100" : "bg-info-bg text-info ring-info/15"
                  )}
                >
                  {k.kind === "client" ? <Building2 className="size-[18px]" /> : k.kind === "mentor" ? <ShieldCheck className="size-[18px]" /> : <IdCard className="size-[18px]" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15.5px] font-medium text-ink">{t(k.name)}</span>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", meta.cls)}>{t(meta.label)}</span>
                    <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium capitalize text-ink-3 ring-1 ring-line">{k.kind}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-4">{t(k.context)}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">{t(k.submittedLabel)}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-ink-4">
                  <T v={{ en: "Documents clear", bn: "ডকুমেন্ট ঠিক" }} />
                </div>
                <div className="num text-[18px] font-semibold text-ink">
                  {okCount}/{k.documents.length}
                </div>
              </div>
            </div>

            <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
              {k.documents.map((d) => (
                <div key={d.label.en} className="flex items-start gap-3 bg-white p-4">
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                      d.ok ? "bg-brand-50 text-brand-600 ring-1 ring-brand-100" : "bg-warn-bg text-warn ring-1 ring-warn/15"
                    )}
                  >
                    {d.ok ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-ink">{t(d.label)}</div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-ink-4">{t(d.detail)}</div>
                  </div>
                </div>
              ))}
            </div>

            {k.flags.length > 0 && (
              <div className="space-y-2 border-t border-line bg-warn-bg/40 p-5">
                {k.flags.map((f) => (
                  <p key={f.en} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
                    {t(f)}
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas-2/50 p-5">
              <p className="min-w-[200px] flex-1 text-[12px] leading-relaxed text-ink-4">
                <T
                  v={{
                    en: "No payout leaves the platform until the payout account name matches the verified identity.",
                    bn: "পেআউট অ্যাকাউন্টের নাম যাচাইকৃত পরিচয়ের সাথে না মেলা পর্যন্ত কোনো পেআউট প্ল্যাটফর্ম ছাড়ে না।",
                  }}
                />
              </p>
              {state ? (
                <button
                  onClick={() => setDecided((d) => { const c = { ...d }; delete c[k.id]; return c; })}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3 py-2 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
                >
                  <Undo2 className="size-3.5" />
                  <T v={{ en: "Undo", bn: "ফিরিয়ে নিন" }} />
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" icon={<Ban className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [k.id]: "rejected" }))}>
                    <T v={{ en: "Reject", bn: "বাতিল" }} />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setDecided((d) => ({ ...d, [k.id]: "resubmit" }))}>
                    <T v={{ en: "Ask for a re-upload", bn: "আবার আপলোড চান" }} />
                  </Button>
                  <Button size="sm" icon={<BadgeCheck className="size-3.5" />} onClick={() => setDecided((d) => ({ ...d, [k.id]: "verified" }))}>
                    <T v={{ en: "Verify account", bn: "অ্যাকাউন্ট যাচাই করুন" }} />
                  </Button>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Directory ────────────────────────────────────────────────── */

function Directory() {
  const { t } = useLang();
  const n = useNum();
  const [side, setSide] = useState<"clients" | "students">("clients");
  const [suspended, setSuspended] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-[12px] border border-line bg-white p-1">
        {(
          [
            { key: "clients", label: { en: "Clients & buyers", bn: "ক্লায়েন্ট ও বায়ার" }, count: CLIENTS.length },
            { key: "students", label: { en: "Students", bn: "শিক্ষার্থী" }, count: STUDENTS.length },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setSide(s.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13.5px] transition-colors",
              side === s.key ? "bg-ink text-white" : "text-ink-3 hover:bg-canvas-2 hover:text-ink"
            )}
          >
            {t(s.label)}
            <span className={cn("num text-[11.5px]", side === s.key ? "text-white/50" : "text-ink-4")}>{n(s.count)}</span>
          </button>
        ))}
      </div>

      {side === "clients" ? (
        <Panel title={{ en: "Every business account", bn: "প্রতিটি ব্যবসায়িক অ্যাকাউন্ট" }} desc={{ en: "Spend, repeat rate, and what they are allowed to do", bn: "খরচ, পুনরাবৃত্তির হার, আর তারা কী করতে পারবেন" }}>
          <div className="divide-y divide-line">
            {CLIENTS.map((c) => {
              const st = CLIENT_STATE[c.id];
              const jobs = JOBS.filter((j) => j.clientId === c.id);
              const isSus = suspended.includes(c.id);
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-canvas-2 text-ink-2 ring-1 ring-line">
                    <Building2 className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium text-ink">{t(c.name)}</span>
                      <StatePill state={isSus ? "restricted" : st.state} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-4">
                      {t(c.industry)} · {t(c.size)} · {t(c.city)}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-3">{isSus ? t({ en: "Suspended by a coordinator", bn: "কোঅর্ডিনেটর কর্তৃক স্থগিত" }) : t(st.note)}</p>
                  </div>

                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="num text-[15px] font-semibold text-ink">{n(jobs.length)}</div>
                      <div className="text-[10.5px] text-ink-4">
                        <T v={{ en: "posts", bn: "পোস্ট" }} />
                      </div>
                    </div>
                    <div>
                      <div className="num text-[15px] font-semibold text-ink">৳{n(c.spend.toLocaleString("en-US"))}</div>
                      <div className="text-[10.5px] text-ink-4">
                        <T v={{ en: "spend", bn: "খরচ" }} />
                      </div>
                    </div>
                    <div>
                      <div className="num text-[15px] font-semibold text-ink">{n(c.repeat)}</div>
                      <div className="text-[10.5px] text-ink-4">
                        <T v={{ en: "repeat", bn: "পুনরায়" }} />
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isSus ? "secondary" : "ghost"}
                    onClick={() => setSuspended((s) => (isSus ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                  >
                    {isSus ? <T v={{ en: "Restore posting", bn: "পোস্টিং ফেরান" }} /> : <T v={{ en: "Block new posts", bn: "নতুন পোস্ট বন্ধ" }} />}
                  </Button>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : (
        <Panel title={{ en: "Every student account", bn: "প্রতিটি শিক্ষার্থী অ্যাকাউন্ট" }} desc={{ en: "Verified record, reliability, and standing", bn: "ভেরিফায়েড রেকর্ড, নির্ভরযোগ্যতা ও অবস্থান" }}>
          <div className="divide-y divide-line">
            {STUDENTS.map((s) => {
              const st = STUDENT_STATE[s.id];
              const isSus = suspended.includes(s.id);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-4 p-5">
                  <Avatar name={s.name.en} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium text-ink">{t(s.name)}</span>
                      <StatePill state={isSus ? "restricted" : st.state} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-4">
                      {t(s.discipline)} · {t(s.university)}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-3">{isSus ? t({ en: "Suspended by a coordinator", bn: "কোঅর্ডিনেটর কর্তৃক স্থগিত" }) : t(st.note)}</p>
                  </div>

                  <div className="w-[110px] shrink-0">
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-ink-4">
                        <T v={{ en: "on time", bn: "সময়মতো" }} />
                      </span>
                      <span className="num font-medium text-ink">{n(s.onTime)}%</span>
                    </div>
                    <Bar value={s.onTime} />
                  </div>

                  <div className="flex gap-5 text-center">
                    <div>
                      <div className="num text-[15px] font-semibold text-ink">{n(s.verified)}</div>
                      <div className="text-[10.5px] text-ink-4">
                        <T v={{ en: "verified", bn: "ভেরিফায়েড" }} />
                      </div>
                    </div>
                    <div>
                      <div className="num text-[15px] font-semibold text-ink">৳{n(s.earned.toLocaleString("en-US"))}</div>
                      <div className="text-[10.5px] text-ink-4">
                        <T v={{ en: "earned", bn: "আয়" }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" href={`/passport/${s.slug}`}>
                      <T v={{ en: "Passport", bn: "পাসপোর্ট" }} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSuspended((x) => (isSus ? x.filter((y) => y !== s.id) : [...x, s.id]))}
                    >
                      {isSus ? <T v={{ en: "Restore", bn: "ফেরান" }} /> : <T v={{ en: "Pause matching", bn: "ম্যাচিং থামান" }} />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Controls ─────────────────────────────────────────────────── */

function Controls() {
  const { t } = useLang();
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(CONTROLS.map((c) => [c.key, c.on])));

  return (
    <div className="space-y-4">
      <Panel
        title={{ en: "Platform rules", bn: "প্ল্যাটফর্ম নিয়ম" }}
        desc={{ en: "Two of these are locked on, and that is the point", bn: "এর দুটি স্থায়ীভাবে চালু, আর সেটাই উদ্দেশ্য" }}
      >
        <div className="divide-y divide-line">
          {CONTROLS.map((c) => {
            const on = state[c.key];
            const locked = !!c.locked;
            return (
              <div key={c.key} className="flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-ink">{t(c.label)}</span>
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-3 ring-1 ring-inset ring-line">
                        <Lock className="size-3" />
                        <T v={{ en: "Locked", bn: "লকড" }} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-ink-3">{t(c.desc)}</p>
                  {c.locked && <p className="mt-2 max-w-[62ch] text-[11.5px] leading-relaxed text-ink-4">{t(c.locked)}</p>}
                </div>

                <button
                  onClick={() => !locked && setState((s) => ({ ...s, [c.key]: !s[c.key] }))}
                  disabled={locked}
                  aria-pressed={on}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300",
                    on ? "bg-brand-600" : "bg-canvas-3",
                    locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                >
                  <span
                    className="absolute top-1 size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(10,14,12,.25)] transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{ left: on ? 26 : 4 }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex items-start gap-3 rounded-[16px] border border-line bg-ink p-5 text-white">
        <ActivityIcon className="mt-0.5 size-4 shrink-0 text-brand-400" />
        <p className="text-[12.5px] leading-relaxed text-white/70">
          <T
            v={{
              en: "A moderator can suspend an account, block a business from posting, refund a client, or reject an AI scope. A moderator cannot turn off the human gate or the dual sign-off requirement — those two are the product. Removing either would leave a job board with extra steps.",
              bn: "একজন মডারেটর অ্যাকাউন্ট স্থগিত করতে, কোনো ব্যবসার পোস্টিং বন্ধ করতে, ক্লায়েন্টকে টাকা ফেরত দিতে বা এআই স্কোপ বাতিল করতে পারেন। কিন্তু মানবিক গেট বা দ্বৈত সাইন-অফের শর্ত বন্ধ করতে পারেন না — ওই দুটিই আসল প্রোডাক্ট। যেকোনো একটি সরালে বাকি থাকে কেবল বাড়তি ধাপওয়ালা একটা জব বোর্ড।",
            }}
          />
        </p>
      </div>
    </div>
  );
}
