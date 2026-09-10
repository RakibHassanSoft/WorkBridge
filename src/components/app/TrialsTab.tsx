"use client";

import { BadgeCheck, ClipboardCheck, Cpu, Minus, Plus, Timer, TrendingDown } from "lucide-react";
import { Bar } from "@/components/ui";
import { Panel, StatCard } from "./parts";
import SectorIcon from "@/components/SectorIcon";
import { PointChip } from "@/components/tasks/TrialPanel";
import { ATTEMPTS, POINTS, pointTotal, trialForTask } from "@/data/trials";
import { anyTaskById } from "@/data/marketplace";
import { sectorById } from "@/data/sectors";
import { STUDENTS } from "@/data/people";
import { TRIAL_RULES } from "@/lib/engine";
import { T, useLang, useNum } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const ME = STUDENTS[0];

/** Every trial this student has done, the AI's verdict, and the points ledger. */
export default function TrialsTab() {
  const { t } = useLang();
  const n = useNum();

  // In the demo the signed-in student's own attempts sit alongside the ones
  // shown publicly, so the tab is populated whichever demo account is used.
  const mine = ATTEMPTS.slice(0, 3);
  const ledger = POINTS.filter((p) => p.studentId === ME.id);
  const total = pointTotal(ME.id);
  const wins = ledger.filter((p) => p.delta > 0).length;
  const losses = ledger.filter((p) => p.delta < 0).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Plus}
          label={{ en: "Points balance", bn: "পয়েন্ট ব্যালান্স" }}
          value={n(total)}
          hint={{ en: "effort counted, failures subtracted", bn: "চেষ্টা যোগ, ব্যর্থতা বিয়োগ" }}
          tone="brand"
        />
        <StatCard icon={ClipboardCheck} label={{ en: "Trials done", bn: "ট্রায়াল করেছেন" }} value={n(ledger.length)} hint={{ en: "across all sectors", bn: "সব সেক্টর মিলিয়ে" }} />
        <StatCard icon={BadgeCheck} label={{ en: "Points earned", bn: "পয়েন্ট পেয়েছেন" }} value={`+${n(wins)}`} hint={{ en: "trials done without being selected", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি" }} />
        <StatCard icon={TrendingDown} label={{ en: "Points lost", bn: "পয়েন্ট হারিয়েছেন" }} value={n(losses)} hint={{ en: "main tasks not delivered", bn: "মূল কাজ শেষ করতে পারেননি" }} tone="ink" />
      </div>

      <Panel
        title={{ en: "How points work", bn: "পয়েন্ট কীভাবে কাজ করে" }}
        desc={{ en: "Three rules, no exceptions", bn: "তিনটি নিয়ম, কোনো ব্যতিক্রম নেই" }}
      >
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            {
              icon: Plus,
              v: "+১",
              t: { en: "Did the trial, not selected", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি" },
              d: { en: "You gave your time and showed you could do it. That counts even when someone else got the task.", bn: "আপনি সময় দিয়েছেন আর করে দেখিয়েছেন। কাজটা অন্য কেউ পেলেও সেটা গণনা হয়।" },
              tone: "up",
            },
            {
              icon: Minus,
              v: "০",
              t: { en: "Selected and delivered", bn: "নির্বাচিত হয়ে কাজ শেষ" },
              d: { en: "The pay and the verified record are the reward. Points are for the people who did not get the task.", bn: "পুরস্কার হলো টাকা ও ভেরিফায়েড রেকর্ড। পয়েন্ট তাদের জন্য, যারা কাজটা পাননি।" },
              tone: "flat",
            },
            {
              icon: TrendingDown,
              v: "−১",
              t: { en: "Selected and failed", bn: "নির্বাচিত হয়ে ব্যর্থ" },
              d: { en: "The only way to lose a point is to be handed the main task and not deliver it. Trying never costs you anything.", bn: "পয়েন্ট হারানোর একমাত্র উপায় — মূল কাজ হাতে পেয়ে শেষ না করা। চেষ্টা করায় কখনো কিছু হারায় না।" },
              tone: "down",
            },
          ].map((r) => (
            <div key={r.v} className="bg-white p-5">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-[10px] ring-1",
                    r.tone === "up" && "bg-brand-50 text-brand-700 ring-brand-100",
                    r.tone === "flat" && "bg-canvas-2 text-ink-3 ring-line",
                    r.tone === "down" && "bg-warn-bg text-warn ring-warn/15"
                  )}
                >
                  <r.icon className="size-4" />
                </span>
                <span className="num text-[20px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  {r.v}
                </span>
              </div>
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(r.t)}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-4">{t(r.d)}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={{ en: "Your trial attempts", bn: "আপনার ট্রায়াল চেষ্টা" }}
        desc={{ en: "Every one scored by the AI, with private coaching", bn: "প্রতিটিই এআই মূল্যায়ন করেছে, সাথে ব্যক্তিগত পরামর্শ" }}
      >
        <div className="divide-y divide-line">
          {mine.map((a) => {
            const task = anyTaskById(a.taskId);
            const trial = trialForTask(a.taskId);
            const sector = task ? sectorById(task.sectorId) : null;
            if (!task || !trial || !sector) return null;

            return (
              <div key={a.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: sector.accent }}>
                    <SectorIcon name={sector.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-medium text-ink">{t(trial.title)}</span>
                      <PointChip delta={a.points} />
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-ink-4">
                      <T v={{ en: "for", bn: "যে টাস্কের জন্য" }} />: {t(task.title)}
                    </p>
                    <p className="num mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-4">
                      <Timer className="size-3" />
                      {n(a.minutesTaken)} <T v={{ en: "min", bn: "মিনিট" }} /> · <T v={{ en: "rank", bn: "র‍্যাংক" }} /> {n(a.rank)}
                    </p>

                    <div className="mt-3 rounded-[12px] border border-brand-100 bg-brand-50/50 p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                        <Cpu className="size-3" />
                        <T v={{ en: "Private coaching from the AI", bn: "এআই-এর ব্যক্তিগত পরামর্শ" }} />
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-900">{t(a.aiCoaching)}</p>
                    </div>
                  </div>

                  <div className="w-[90px] shrink-0">
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-4">
                        <T v={{ en: "score", bn: "স্কোর" }} />
                      </span>
                      <span className="num text-[14px] font-semibold text-ink">{n(a.aiScore)}</span>
                    </div>
                    <Bar value={a.aiScore} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={{ en: "Points ledger", bn: "পয়েন্ট লেজার" }}>
          <div className="divide-y divide-line">
            {ledger.map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-4">
                <PointChip delta={p.delta} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-ink-2">{t(p.reason)}</p>
                  <p className="mt-0.5 text-[11px] text-ink-4">{t(p.dateLabel)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={{ en: "How a trial is built", bn: "ট্রায়াল কীভাবে বানানো হয়" }} desc={{ en: "Four rules the AI follows", bn: "এআই যে চারটি নিয়ম মানে" }}>
          <div className="divide-y divide-line">
            {TRIAL_RULES.map((r) => (
              <div key={r.label.en} className="p-4">
                <h4 className="text-[12.5px] font-medium text-ink">{t(r.label)}</h4>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-4">{t(r.detail)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
