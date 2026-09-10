"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cpu,
  Lightbulb,
  Quote,
  Sparkles,
  Timer,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Bar, Button } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { StatusPill } from "@/components/app/parts";
import { Avatar } from "@/components/ui";
import { anyJobById, applicantsOf, metaOf } from "@/data/marketplace";
import { clientById, studentById } from "@/data/people";
import { sectorById } from "@/data/sectors";
import type { Task } from "@/data/types";
import { T, useLang, useNum } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export default function TaskDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [task, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-ink/25 backdrop-blur-[2px] transition-opacity duration-300",
          task ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!task}
        className={cn(
          "fixed inset-y-0 right-0 z-[61] w-full max-w-[520px] overflow-y-auto border-l border-line bg-white shadow-[-24px_0_60px_-30px_rgba(10,14,12,.35)] transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)]",
          task ? "translate-x-0" : "translate-x-full"
        )}
      >
        {task && <DrawerBody task={task} onClose={onClose} />}
      </aside>
    </>
  );
}

function DrawerBody({ task, onClose }: { task: Task; onClose: () => void }) {
  const { t, tl } = useLang();
  const n = useNum();
  const meta = metaOf(task.id);
  const job = anyJobById(task.jobId);
  const client = job ? clientById(job.clientId) : undefined;
  const sector = sectorById(task.sectorId);
  const applicants = applicantsOf(task.id);
  const cancelled = task.status === "cancelled";

  return (
    <div>
      {/* header */}
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-line bg-white/90 px-6 py-4 backdrop-blur-md">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: sector.accent }}>
          <SectorIcon name={sector.icon} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-[11px] font-medium text-ink-4">{job?.ref}</span>
            <StatusPill status={task.status} />
          </div>
          <p className="mt-0.5 truncate text-[12px] text-ink-4">{t(sector.name)}</p>
        </div>
        <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-line text-ink-3 transition-colors hover:text-ink" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.025em] text-ink">{t(task.title)}</h2>

        {client && (
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-ink-4">
            <Building2 className="size-3.5" />
            {t(client.name)}
            <span>·</span>
            {t(client.industry)}
            <span>·</span>
            {t(client.city)}
          </p>
        )}

        {/* money row */}
        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-[14px] bg-line ring-1 ring-line">
          <div className="bg-white p-3.5">
            <div className="flex items-center gap-1 text-[10.5px] text-ink-4">
              <Wallet className="size-3" />
              <T v={{ en: "Fee", bn: "ফি" }} />
            </div>
            <div className="num mt-1 text-[17px] font-semibold text-ink">৳{n(task.fee.toLocaleString("en-US"))}</div>
          </div>
          <div className="bg-white p-3.5">
            <div className="flex items-center gap-1 text-[10.5px] text-ink-4">
              <Timer className="size-3" />
              <T v={{ en: "Estimate", bn: "আনুমানিক" }} />
            </div>
            <div className="num mt-1 text-[17px] font-semibold text-ink">{n(task.hours)}h</div>
          </div>
          <div className="bg-white p-3.5">
            <div className="flex items-center gap-1 text-[10.5px] text-ink-4">
              <Users className="size-3" />
              <T v={{ en: "Applied", bn: "আবেদন" }} />
            </div>
            <div className="num mt-1 text-[17px] font-semibold text-ink">{n(meta?.applicants ?? 0)}</div>
          </div>
        </div>

        {cancelled && meta?.cancelReason && (
          <div className="mt-5 rounded-[14px] border border-line bg-canvas-2/60 p-4">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <TriangleAlert className="size-3" />
              <T v={{ en: "Why the client cancelled", bn: "ক্লায়েন্ট কেন বাতিল করেছেন" }} />
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{t(meta.cancelReason)}&rdquo;</p>
            {meta.cancelledLabel && <p className="mt-2 text-[11.5px] text-ink-4">{t(meta.cancelledLabel)}</p>}
          </div>
        )}

        {/* client's own words */}
        {meta && (
          <section className="mt-6">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <Quote className="size-3" />
              <T v={{ en: "In the client's own words", bn: "ক্লায়েন্টের নিজের ভাষায়" }} />
            </div>
            <blockquote className="mt-2.5 border-l-2 border-brand-300 pl-4 text-[14px] leading-relaxed text-ink-2">
              {t(meta.clientWords)}
            </blockquote>
          </section>
        )}

        {/* AI simplification */}
        {meta && (
          <section className="mt-6 rounded-[16px] border border-brand-100 bg-brand-50/50 p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-lg bg-brand-600 text-white">
                <Cpu className="size-3" />
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                <T v={{ en: "What this actually asks for", bn: "আসলে যা চাওয়া হচ্ছে" }} />
              </span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-brand-900">{t(meta.aiSimple)}</p>

            <div className="mt-4 border-t border-brand-200/60 pt-4">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                <Lightbulb className="size-3" />
                <T v={{ en: "A route through it", bn: "কাজটি করার একটি পথ" }} />
              </div>
              <ol className="mt-2.5 space-y-1.5">
                {tl(meta.aiSteps).map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-brand-900">
                    <span className="num mt-px w-3.5 shrink-0 text-[11px] font-semibold text-brand-500">{n(i + 1)}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            {meta.aiWatchOut && (
              <p className="mt-4 flex items-start gap-2 border-t border-brand-200/60 pt-4 text-[12.5px] leading-relaxed text-brand-900">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                {t(meta.aiWatchOut)}
              </p>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-brand-700/70">
              <T
                v={{
                  en: "Written by the AI layer to make the brief easier to act on. The client's words above are the actual requirement.",
                  bn: "ব্রিফটি কাজে লাগানো সহজ করতে এআই লেয়ারের লেখা। ওপরে ক্লায়েন্টের কথাই আসল শর্ত।",
                }}
              />
            </p>
          </section>
        )}

        {/* acceptance */}
        <section className="mt-6">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
            <CheckCircle2 className="size-3" />
            <T v={{ en: "What counts as done", bn: "কী হলে সম্পন্ন ধরা হবে" }} />
          </div>
          <ul className="mt-2.5 space-y-2">
            {tl(task.acceptance).map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-400" />
                {a}
              </li>
            ))}
          </ul>
        </section>

        {/* skills */}
        <section className="mt-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
            <T v={{ en: "Skills", bn: "স্কিল" }} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {task.skills.map((s) => (
              <span key={s} className="rounded-lg bg-canvas-2 px-2.5 py-1.5 text-[12px] text-ink-2 ring-1 ring-line">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* applicants */}
        {applicants.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <Users className="size-3" />
                <T v={{ en: "Who applied", bn: "কারা আবেদন করেছেন" }} />
              </div>
              <span className="num text-[11.5px] text-ink-4">
                {n(applicants.length)} <T v={{ en: "shown", bn: "দেখানো" }} /> · {n(meta?.applicants ?? 0)} <T v={{ en: "total", bn: "মোট" }} />
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {applicants.map((a) => {
                const st = studentById(a.studentId);
                if (!st) return null;
                return (
                  <div key={a.studentId} className="flex items-center gap-3 rounded-[12px] border border-line p-3">
                    <Avatar name={st.name.en} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-ink">{t(st.name)}</span>
                        {a.outcome === "selected" && <BadgeCheck className="size-3.5 shrink-0 text-brand-600" />}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-ink-4">{t(a.appliedLabel)}</p>
                    </div>
                    <div className="w-[62px] shrink-0">
                      <div className="mb-1 text-right">
                        <span className="num text-[11.5px] font-medium text-ink">{n(a.matchScore)}</span>
                      </div>
                      <Bar value={a.matchScore} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* timing */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[12px] text-ink-4">
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {meta && t(meta.postedLabel)}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" />
            {t(task.dueLabel)}
          </span>
          <span className="capitalize">{task.level}</span>
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {task.status === "open" ? (
            <Button size="md" className="flex-1" icon={<Sparkles className="size-4" />}>
              <T v={{ en: "Apply for this task", bn: "এই টাস্কে আবেদন" }} />
            </Button>
          ) : (
            <span className="flex-1 rounded-[12px] bg-canvas-2 px-4 py-3 text-center text-[13px] text-ink-4 ring-1 ring-line">
              <T v={{ en: "Not accepting applications", bn: "আবেদন নেওয়া হচ্ছে না" }} />
            </span>
          )}
          <Link
            href={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-line px-4 py-3 text-[13px] font-medium text-ink transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            <T v={{ en: "Full details", bn: "পূর্ণ বিবরণ" }} />
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
