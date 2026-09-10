"use client";

import type { LucideIcon } from "lucide-react";
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
