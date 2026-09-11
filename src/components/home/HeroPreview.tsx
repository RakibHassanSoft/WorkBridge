"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Building2, Cpu, ShieldCheck, Timer } from "lucide-react";
import { T, useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { JOBS, tasksOfJob } from "@/data/work";
import { clientById } from "@/data/people";

const job = JOBS[0];
const tasks = tasksOfJob(job.id);

export default function HeroPreview() {
  const { t } = useLang();
  const client = clientById(job.clientId)!;
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0); // 0 idle, 1 scoping, 2+ tasks

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let i = 0;
        const tick = () => {
          i += 1;
          setStep(i);
          if (i < tasks.length + 2) timer = setTimeout(tick, i === 1 ? 900 : 260);
        };
        timer = setTimeout(tick, 400);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const revealed = Math.max(0, step - 1);

  return (
    <div ref={ref} className="relative mx-auto max-w-[1080px]">
      <div aria-hidden className="absolute inset-x-8 -bottom-6 h-24 rounded-full bg-brand-500/12 blur-3xl" />
      <div className="relative overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_1px_2px_rgba(10,14,12,.05),0_40px_80px_-40px_rgba(10,14,12,.30)]">
        {/* chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas-2/70 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white px-3 py-1 text-[11.5px] text-ink-4 ring-1 ring-line">
            <ShieldCheck className="size-3 text-brand-500" />
            bdfreshers.bd/app/client/{job.ref.toLowerCase()}
          </div>
          <span className="hidden text-[11px] text-ink-4 sm:block">{job.ref}</span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Left: the raw brief */}
          <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-[10px] bg-canvas-3 text-ink-2">
                <Building2 className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-ink">{t(client.name)}</div>
                <div className="truncate text-[11.5px] text-ink-4">
                  {t(client.industry)} · {t(client.size)}
                </div>
              </div>
            </div>

            <div className="eyebrow mt-6">
              <T v={{ en: "What the client wrote", bn: "ক্লায়েন্ট যা লিখেছেন" }} />
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
              &ldquo;{t(job.brief)}&rdquo;
            </p>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {job.ai.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-canvas-2 px-2 py-1 text-[11px] text-ink-3 ring-1 ring-line">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Right: AI output */}
          <div className="relative bg-canvas-2/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn("grid size-7 place-items-center rounded-lg bg-brand-600 text-white transition-all", step === 1 && "anim-pulse-ring")}>
                  <Cpu className="size-3.5" />
                </span>
                <span className="text-[13px] font-medium text-ink">
                  <T v={{ en: "AI scope", bn: "এআই স্কোপ" }} />
                </span>
                {step >= 2 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-brand-100 anim-fade">
                    {job.ai.confidence}% <T v={{ en: "confidence", bn: "কনফিডেন্স" }} />
                  </span>
                )}
              </div>
              <span className="hidden items-center gap-1.5 text-[11.5px] text-ink-4 sm:flex">
                <Timer className="size-3.5" />
                {job.ai.estHours}h · ৳{job.ai.suggestedFee.toLocaleString("en-US")}
              </span>
            </div>

            {step === 1 && (
              <div className="mt-4 space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-[58px] rounded-[12px]" />
                ))}
                <p className="pt-1 text-[12px] text-ink-4">
                  <T v={{ en: "Reading the brief, separating problems, pricing each piece…", bn: "ব্রিফ পড়ছে, সমস্যা আলাদা করছে, প্রতিটি অংশের দাম নির্ধারণ করছে…" }} />
                </p>
              </div>
            )}

            {step >= 2 && (
              <ol className="mt-4 space-y-2">
                {tasks.map((task, i) => {
                  const shown = i < revealed;
                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 rounded-[12px] border border-line bg-white p-3 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
                        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      )}
                    >
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                        {task.seq}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{t(task.title)}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-4">
                          <span className="num font-medium text-brand-700">৳{task.fee.toLocaleString("en-US")}</span>
                          <span>·</span>
                          <span>{task.hours}h</span>
                          <span>·</span>
                          <span className="capitalize">{task.level}</span>
                          {task.dependsOn && (
                            <>
                              <span>·</span>
                              <span>
                                <T v={{ en: "after", bn: "পরে" }} /> #{tasks.find((x) => x.id === task.dependsOn![0])?.seq}
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {step >= tasks.length + 2 && (
              <div className="anim-fade mt-4 flex items-start gap-2.5 rounded-[12px] border border-brand-100 bg-brand-50/70 p-3.5">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <p className="text-[12.5px] leading-relaxed text-brand-900">
                  <T
                    v={{
                      en: "Saved. Approve the AI's trial and the task goes live — the AI checks every applicant's files and sends 90%+ work to a coordinator.",
                      bn: "সংরক্ষিত। এআই-এর ট্রায়াল অনুমোদন করলেই টাস্ক লাইভ — এআই প্রতিটি আবেদনকারীর ফাইল যাচাই করে ৯০%+ কাজ কোঅর্ডিনেটরের কাছে পাঠায়।",
                    }}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
