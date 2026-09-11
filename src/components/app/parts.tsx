"use client";

import { useCallback, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { TaskStatus, JobStatus } from "@/data/types";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: L;
  value: string;
  hint?: L;
  tone?: "default" | "brand" | "ink";
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border p-5",
        tone === "ink" ? "border-ink bg-ink text-white" : tone === "brand" ? "border-brand-200 bg-brand-50/60" : "border-line bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", tone === "ink" ? "text-brand-400" : "text-ink-4")} />
        <span className={cn("text-[11.5px] font-medium", tone === "ink" ? "text-white/60" : "text-ink-4")}>
          <T v={label} />
        </span>
      </div>
      <div
        className={cn("num mt-3 text-[26px] font-semibold leading-none tracking-[-0.035em]", tone === "ink" ? "text-white" : "text-ink")}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint && (
        <div className={cn("mt-2 text-[11.5px] leading-snug", tone === "ink" ? "text-white/45" : "text-ink-4")}>
          <T v={hint} />
        </div>
      )}
    </div>
  );
}

const TASK_STATUS: Record<TaskStatus, { label: L; cls: string }> = {
  open: { label: { en: "Open", bn: "খোলা" }, cls: "bg-canvas-2 text-ink-3 ring-line" },
  matching: { label: { en: "Matching", bn: "ম্যাচিং" }, cls: "bg-info-bg text-info ring-info/15" },
  in_progress: { label: { en: "In progress", bn: "চলছে" }, cls: "bg-brand-50 text-brand-700 ring-brand-100" },
  in_review: { label: { en: "In review", bn: "রিভিউতে" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  revision: { label: { en: "Revision", bn: "রিভিশন" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  approved: { label: { en: "Approved", bn: "অনুমোদিত" }, cls: "bg-brand-600 text-white ring-brand-600" },
  cancelled: { label: { en: "Cancelled", bn: "বাতিল" }, cls: "bg-canvas-3 text-ink-3 ring-line-2" },
};

const JOB_STATUS: Record<JobStatus, { label: L; cls: string }> = {
  draft: { label: { en: "Draft", bn: "খসড়া" }, cls: "bg-canvas-2 text-ink-3 ring-line" },
  scoping: { label: { en: "AI scoping", bn: "এআই স্কোপিং" }, cls: "bg-info-bg text-info ring-info/15" },
  matching: { label: { en: "Matching", bn: "ম্যাচিং" }, cls: "bg-info-bg text-info ring-info/15" },
  active: { label: { en: "Active", bn: "সক্রিয়" }, cls: "bg-brand-50 text-brand-700 ring-brand-100" },
  review: { label: { en: "Needs review", bn: "রিভিউ দরকার" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  delivered: { label: { en: "Delivered", bn: "ডেলিভার্ড" }, cls: "bg-brand-600 text-white ring-brand-600" },
};

export function StatusPill({ status, kind = "task" }: { status: string; kind?: "task" | "job" }) {
  const { t } = useLang();
  const map = kind === "job" ? JOB_STATUS : TASK_STATUS;
  const s = (map as Record<string, { label: L; cls: string }>)[status];
  if (!s) return null;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", s.cls)}>{t(s.label)}</span>
  );
}

export function Panel({
  title,
  desc,
  action,
  children,
  className,
}: {
  title: L;
  desc?: L;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <section className={cn("overflow-hidden rounded-[16px] border border-line bg-white", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[14px] font-semibold tracking-[-0.015em] text-ink">{t(title)}</h2>
          {desc && <p className="mt-0.5 text-[12px] text-ink-4">{t(desc)}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Money({ value }: { value: number }) {
  const n = useNum();
  return <span className="num">৳{n(value.toLocaleString("en-US"))}</span>;
}

/* ── Shared building blocks for the live (API-backed) workspaces ── */

type Tone = "neutral" | "info" | "brand" | "solid" | "warn" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-canvas-2 text-ink-3 ring-line",
  info: "bg-info-bg text-info ring-info/15",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  solid: "bg-brand-600 text-white ring-brand-600",
  warn: "bg-warn-bg text-warn ring-warn/15",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

/** Every status the API returns, in plain words, with a colour that means the same thing everywhere. */
const API_STATUS: Record<string, { label: L; tone: Tone }> = {
  // task / job
  DRAFT: { label: { en: "Draft", bn: "খসড়া" }, tone: "neutral" },
  SCOPING: { label: { en: "Scope in review", bn: "স্কোপ রিভিউতে" }, tone: "info" },
  OPEN: { label: { en: "Open", bn: "খোলা" }, tone: "neutral" },
  MATCHING: { label: { en: "Taking trials", bn: "ট্রায়াল চলছে" }, tone: "info" },
  ACTIVE: { label: { en: "In progress", bn: "চলছে" }, tone: "brand" },
  IN_PROGRESS: { label: { en: "In progress", bn: "চলছে" }, tone: "brand" },
  REVIEW: { label: { en: "In review", bn: "রিভিউতে" }, tone: "warn" },
  IN_REVIEW: { label: { en: "In review", bn: "রিভিউতে" }, tone: "warn" },
  REVISION: { label: { en: "Revision asked", bn: "রিভিশন চাওয়া হয়েছে" }, tone: "warn" },
  APPROVED: { label: { en: "Approved", bn: "অনুমোদিত" }, tone: "solid" },
  DELIVERED: { label: { en: "Delivered", bn: "ডেলিভার্ড" }, tone: "solid" },
  CANCELLED: { label: { en: "Cancelled", bn: "বাতিল" }, tone: "neutral" },
  // payment
  AWAITING: { label: { en: "Awaiting deposit", bn: "জমার অপেক্ষায়" }, tone: "warn" },
  HELD: { label: { en: "Held in escrow", bn: "এসক্রোতে জমা" }, tone: "info" },
  RELEASED: { label: { en: "Released", bn: "পরিশোধিত" }, tone: "solid" },
  REFUNDED: { label: { en: "Refunded", bn: "ফেরত" }, tone: "neutral" },
  FAILED: { label: { en: "Failed", bn: "ব্যর্থ" }, tone: "danger" },
  // trial check
  AWAITING_CLIENT: { label: { en: "Trial to check", bn: "ট্রায়াল যাচাই বাকি" }, tone: "warn" },
  CHANGES_ASKED: { label: { en: "Changes asked", bn: "পরিবর্তন চাওয়া হয়েছে" }, tone: "warn" },
  // trial attempt
  PENDING: { label: { en: "Pending", bn: "অপেক্ষমাণ" }, tone: "warn" },
  SHORTLISTED: { label: { en: "Shortlisted", bn: "শর্টলিস্টেড" }, tone: "info" },
  NOT_SHORTLISTED: { label: { en: "Not selected (+1)", bn: "নির্বাচিত হয়নি (+১)" }, tone: "neutral" },
  SELECTED: { label: { en: "Selected", bn: "নির্বাচিত" }, tone: "solid" },
  // verification
  VERIFIED: { label: { en: "Verified", bn: "ভেরিফায়েড" }, tone: "solid" },
  REJECTED: { label: { en: "Rejected", bn: "প্রত্যাখ্যাত" }, tone: "danger" },
  RESUBMIT: { label: { en: "Resubmit", bn: "আবার জমা দিন" }, tone: "warn" },
  // dispute / ticket
  EVIDENCE: { label: { en: "Collecting evidence", bn: "প্রমাণ সংগ্রহ" }, tone: "warn" },
  RESOLVED: { label: { en: "Resolved", bn: "নিষ্পত্তি" }, tone: "solid" },
  NEW: { label: { en: "New", bn: "নতুন" }, tone: "warn" },
  ANSWERED: { label: { en: "Answered", bn: "উত্তর দেওয়া হয়েছে" }, tone: "brand" },
  CLOSED: { label: { en: "Closed", bn: "বন্ধ" }, tone: "neutral" },
  HIGH: { label: { en: "High priority", bn: "জরুরি" }, tone: "danger" },
  NORMAL: { label: { en: "Normal", bn: "সাধারণ" }, tone: "neutral" },
  // roles
  CLIENT: { label: { en: "Client", bn: "ক্লায়েন্ট" }, tone: "info" },
  STUDENT: { label: { en: "Student", bn: "শিক্ষার্থী" }, tone: "brand" },
  MODERATOR: { label: { en: "Moderator", bn: "মডারেটর" }, tone: "neutral" },
};

/** A status from the API as a readable, colour-coded badge. Unknown values fall back to a neutral label. */
export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const { t } = useLang();
  if (!status) return null;
  const s = API_STATUS[status] ?? { label: { en: status.replace(/_/g, " ").toLowerCase(), bn: status }, tone: "neutral" as Tone };
  return (
    <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", TONES[s.tone], className)}>
      {t(s.label)}
    </span>
  );
}

/** An empty list, said helpfully. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[16px] border border-dashed border-line-2 bg-white px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-[12px] bg-canvas-2 text-ink-4">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-[14px] font-medium text-ink">{title}</p>
      {text && <p className="mx-auto mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-4">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Loading placeholder for a workspace section. */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-[88px] rounded-[16px]" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

/** A short inline message: an error, a warning or a success. */
export function Notice({ tone = "warn", children, className }: { tone?: "warn" | "error" | "success" | "info"; children: React.ReactNode; className?: string }) {
  const cls = {
    warn: "border-warn/20 bg-warn-bg text-warn",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-brand-200 bg-brand-50 text-brand-800",
    info: "border-info/15 bg-info-bg text-info",
  }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[12px] border px-4 py-3 text-[13px] leading-relaxed", cls, className)}>{children}</div>;
}

/** A labelled figure inside a card. */
export function Fact({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[12px] border border-line bg-canvas-2/40 px-3.5 py-3", className)}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">{label}</p>
      <div className="num mt-1 text-[15px] font-semibold text-ink">{value}</div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-all placeholder:text-ink-4 hover:border-line-2 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(26,155,102,.12)]";

/** Run one API action with a busy flag and an error message; calls onDone after success. */
export function useAction(onDone?: () => void) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setErr(null);
      try {
        await fn();
        onDone?.();
        return true;
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Something went wrong — please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [onDone]
  );
  return { busy, err, run, setErr };
}

/** "3 days ago" style date for API timestamps. */
export function when(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

/** The greeting card at the top of each workspace overview. */
export function WelcomeBanner({
  name,
  eyebrow,
  headline,
  children,
  action,
}: {
  name: string;
  eyebrow: string;
  headline: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-ink via-brand-950 to-brand-800 p-6 text-white sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand-500/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-1/3 size-56 rounded-full bg-brand-300/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-[62ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">{eyebrow}</p>
          <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.025em] sm:text-[26px]">
            {greet}, {name.split(" ")[0]}. {headline}
          </h2>
          {children && <div className="mt-2 text-[13.5px] leading-relaxed text-white/70">{children}</div>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </div>
    </section>
  );
}
