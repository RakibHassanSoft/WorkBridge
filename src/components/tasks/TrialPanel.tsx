"use client";

import { useState } from "react";
import { BadgeCheck, CheckCircle2, ClipboardCheck, Cpu, Minus, Plus, Timer, TrendingDown, Upload, Users } from "lucide-react";
import { Avatar, Bar, Button, Reveal } from "@/components/ui";
import { attemptsForTask, checkForTask, trialForTask } from "@/data/trials";
import { studentById } from "@/data/people";
import { T, useLang, useNum } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * Applying for a task means doing a small AI-built copy of it.
 * This panel shows that trial, and — once the round is judged — every
 * attempt with the AI's score and reasoning.
 */
export default function TrialPanel({ taskId, closed }: { taskId: string; closed?: boolean }) {
  const { t, tl } = useLang();
  const n = useNum();
  const trial = trialForTask(taskId);
  const check = checkForTask(taskId);
  const attempts = attemptsForTask(taskId);
  const [started, setStarted] = useState(false);

  if (!trial) return null;

  return (
    <Reveal delay={100}>
      <div className="overflow-hidden rounded-[18px] border border-line bg-white">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas-2/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white">
              <ClipboardCheck className="size-3.5" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              <T v={{ en: "Applying means doing the trial task", bn: "আবেদন মানে ট্রায়াল টাস্ক করা" }} />
            </span>
          </div>
          <span className="flex flex-wrap items-center gap-3">
            {check?.status === "approved" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-brand-100">
                <BadgeCheck className="size-3" />
                <T v={{ en: "Approved by the client", bn: "ক্লায়েন্ট অনুমোদন করেছেন" }} />
              </span>
            )}
            <span className="num flex items-center gap-1.5 text-[12px] text-ink-4">
              <Timer className="size-3.5" />
              {n(trial.minutes)} <T v={{ en: "minutes", bn: "মিনিট" }} />
            </span>
          </span>
        </div>

        <div className="p-6">
          <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(trial.title)}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{t(trial.brief)}</p>

          <div className="mt-5 rounded-[14px] border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
              <Cpu className="size-3" />
              <T v={{ en: "Why the AI chose this as the test", bn: "এআই কেন এটাকেই পরীক্ষা হিসেবে বেছেছে" }} />
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-brand-900">{t(trial.mirrors)}</p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-brand-900/85">{t(trial.aiNote)}</p>
          </div>

          <div className="mt-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "What the AI will score", bn: "এআই যা দেখে নম্বর দেবে" }} />
            </div>
            <ul className="mt-2.5 space-y-2">
              {tl(trial.acceptance).map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {!closed && (
            <div className="mt-6">
              {started ? (
                <div className="rounded-[14px] border border-brand-200 bg-brand-50 p-5">
                  <div className="flex items-center gap-2 text-[13.5px] font-medium text-brand-800">
                    <Upload className="size-4" />
                    <T v={{ en: "Trial started — submit before the round closes", bn: "ট্রায়াল শুরু — রাউন্ড বন্ধ হওয়ার আগে জমা দিন" }} />
                  </div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-brand-900">
                    <T
                      v={{
                        en: "The AI scores your submission and ranks it against everyone else's. The ranking then goes to a moderator, who makes the final choice.",
                        bn: "এআই আপনার জমা দেওয়া কাজ নম্বর দেবে আর বাকি সবার সাথে র‍্যাংক করবে। সেই র‍্যাংকিং যাবে মডারেটরের কাছে, চূড়ান্ত সিদ্ধান্ত তিনিই নেবেন।",
                      }}
                    />
                  </p>
                </div>
              ) : (
                <>
                  <Button size="lg" onClick={() => setStarted(true)} icon={<ClipboardCheck className="size-4" />}>
                    <T v={{ en: "Start the trial task", bn: "ট্রায়াল টাস্ক শুরু করুন" }} />
                  </Button>
                  <p className="mt-3 text-[12px] leading-relaxed text-ink-4">
                    <T
                      v={{
                        en: "The trial is unpaid and is never delivered to the client. Doing it and not being selected earns you +1 point — effort is never punished here.",
                        bn: "ট্রায়ালে কোনো পারিশ্রমিক নেই এবং এটি কখনো ক্লায়েন্টকে দেওয়া হয় না। ট্রায়াল করে নির্বাচিত না হলে আপনি +১ পয়েন্ট পাবেন — এখানে চেষ্টা কখনো শাস্তি পায় না।",
                      }}
                    />
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* results */}
        {attempts.length > 0 && (
          <div className="border-t border-line">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-2/50 px-6 py-4">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                <Users className="size-3" />
                <T v={{ en: "AI evaluation of every attempt", bn: "প্রতিটি চেষ্টার এআই মূল্যায়ন" }} />
              </div>
              <span className="num text-[12px] text-ink-4">
                {n(attempts.length)} <T v={{ en: "attempts scored", bn: "টি চেষ্টা মূল্যায়িত" }} />
              </span>
            </div>

            <div className="divide-y divide-line">
              {attempts.map((a) => {
                const st = studentById(a.studentId);
                if (!st) return null;
                const chosen = a.outcome === "selected";
                return (
                  <div key={a.id} className={cn("p-6", chosen && "bg-brand-50/40")}>
                    <div className="flex flex-wrap items-start gap-4">
                      <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-[12px] font-semibold text-white">
                        {n(a.rank)}
                      </span>
                      <Avatar name={st.name.en} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">{t(st.name)}</span>
                          {chosen && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                              <BadgeCheck className="size-3" />
                              <T v={{ en: "Moderator selected", bn: "মডারেটর নির্বাচিত" }} />
                            </span>
                          )}
                          {a.outcome === "shortlisted" && (
                            <span className="rounded-full bg-info-bg px-2 py-0.5 text-[10.5px] font-semibold text-info ring-1 ring-inset ring-info/15">
                              <T v={{ en: "Sent to moderator", bn: "মডারেটরের কাছে পাঠানো" }} />
                            </span>
                          )}
                          <PointChip delta={a.points} />
                        </div>
                        <p className="num mt-0.5 text-[11.5px] text-ink-4">
                          {t(a.submittedLabel)} · {n(a.minutesTaken)} <T v={{ en: "min", bn: "মিনিট" }} />
                        </p>
                        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">{t(a.summary)}</p>

                        <div className="mt-3.5 rounded-[12px] border border-line bg-white p-3.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                            <Cpu className="size-3 text-brand-500" />
                            <T v={{ en: "AI verdict", bn: "এআই রায়" }} />
                          </div>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{t(a.aiVerdict)}</p>
                        </div>

                        <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                          {a.aiBreakdown.map((d) => (
                            <div key={d.dim.en} className="flex items-center gap-3">
                              <span className="flex-1 truncate text-[11.5px] text-ink-3">{t(d.dim)}</span>
                              <span className="flex gap-0.5">
                                {Array.from({ length: d.max }).map((_, i) => (
                                  <span key={i} className={cn("size-1.5 rounded-full", i < d.score ? "bg-brand-500" : "bg-canvas-3")} />
                                ))}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">{t(a.pointsReason)}</p>
                      </div>

                      <div className="w-[96px] shrink-0">
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[10px] uppercase tracking-[0.1em] text-ink-4">
                            <T v={{ en: "AI score", bn: "এআই স্কোর" }} />
                          </span>
                          <span className="num text-[15px] font-semibold text-ink">{n(a.aiScore)}</span>
                        </div>
                        <Bar value={a.aiScore} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2.5 border-t border-line bg-canvas-2/60 px-6 py-5">
              <Cpu className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                <T
                  v={{
                    en: "The AI scores and ranks. It does not choose. The ranking goes to a moderator with the reasoning attached, and the moderator picks the person — because a score cannot see that someone lives near the site, or is already carrying two tasks.",
                    bn: "এআই নম্বর দেয় ও র‍্যাংক করে। বেছে নেয় না। যুক্তিসহ র‍্যাংকিং যায় মডারেটরের কাছে, আর মানুষটিকে বেছে নেন মডারেটর — কারণ কোনো স্কোর দেখতে পায় না যে কেউ সাইটের কাছে থাকেন, বা ইতিমধ্যে দুটি টাস্ক নিয়ে ব্যস্ত।",
                  }}
                />
              </p>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}

export function PointChip({ delta }: { delta: number }) {
  const { t } = useLang();
  const n = useNum();
  const up = delta > 0;
  const down = delta < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
        up && "bg-brand-50 text-brand-700 ring-brand-100",
        down && "bg-warn-bg text-warn ring-warn/15",
        !up && !down && "bg-canvas-2 text-ink-3 ring-line"
      )}
    >
      {up ? <Plus className="size-2.5" /> : down ? <TrendingDown className="size-2.5" /> : <Minus className="size-2.5" />}
      {n(Math.abs(delta))} {t({ en: "point", bn: "পয়েন্ট" })}
    </span>
  );
}
