"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Cpu, RotateCcw, Send, Timer } from "lucide-react";
import { Panel } from "./parts";
import { Button } from "@/components/ui";
import { TRIAL_CHECKS, trialForTask } from "@/data/trials";
import { anyTaskById } from "@/data/marketplace";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Decision = { kind: "approved" | "changes"; note?: string };

/**
 * The client's check on the AI's trial task.
 *
 * The AI writes a small copy of the real job so applicants can be judged
 * on the work rather than on a paragraph about themselves. But the AI is
 * guessing at what matters, and the client is the only one who actually
 * knows. So nothing posts until the client has looked at the two side by
 * side and said yes — and saying no is one button, not a support ticket.
 */
export default function TrialCheckTab() {
  const { t, tl } = useLang();
  const n = useNum();
  const [decided, setDecided] = useState<Record<string, Decision>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[16px] border border-brand-100 bg-brand-50/60 p-5">
        <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <p className="text-[12.5px] leading-relaxed text-brand-900">
          <T
            v={{
              en: "For every task you post, the AI writes a short trial — the same kind of work, cut down to under an hour — and everyone who applies does it. You see it first. Read the two side by side and tell us whether the trial really is a piece of your job. Nothing goes on the board until you say yes.",
              bn: "আপনার প্রতিটি টাস্কের জন্য এআই একটি ছোট ট্রায়াল লেখে — একই ধরনের কাজ, এক ঘণ্টার মধ্যে নামিয়ে আনা — আর যাঁরা আবেদন করেন সবাই সেটাই করেন। আপনি আগে দেখবেন। দুটো পাশাপাশি পড়ে বলুন, ট্রায়ালটা সত্যিই আপনার কাজেরই এক টুকরো কিনা। আপনি হ্যাঁ না বলা পর্যন্ত কিছুই বোর্ডে যায় না।",
            }}
          />
        </p>
      </div>

      {TRIAL_CHECKS.map((check) => {
        const task = anyTaskById(check.taskId);
        const trial = trialForTask(check.taskId);
        if (!task || !trial) return null;

        const local = decided[check.taskId];
        const status: "awaiting_client" | "approved" | "changes_asked" =
          local?.kind === "approved" ? "approved" : local?.kind === "changes" ? "changes_asked" : check.status;
        const open = status === "awaiting_client";

        const STATE: Record<string, { label: L; cls: string }> = {
          awaiting_client: { label: { en: "Needs your check", bn: "আপনার যাচাই দরকার" }, cls: "bg-warn-bg text-warn ring-warn/15" },
          approved: { label: { en: "You approved it", bn: "আপনি অনুমোদন করেছেন" }, cls: "bg-brand-50 text-brand-700 ring-brand-100" },
          changes_asked: { label: { en: "You asked for a change", bn: "আপনি বদলাতে বলেছেন" }, cls: "bg-canvas-2 text-ink-3 ring-line" },
        };
        const meta = STATE[status];

        return (
          <Panel
            key={check.taskId}
            title={task.title}
            desc={local?.kind ? { en: "Just now", bn: "এইমাত্র" } : check.decidedLabel ?? check.askedLabel}
            action={
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset", meta.cls)}>
                {t(meta.label)}
              </span>
            }
          >
            {/* the two, side by side */}
            <div className="grid gap-px bg-line lg:grid-cols-2">
              <div className="bg-white p-5">
                <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Your real task", bn: "আপনার আসল টাস্ক" }} />
                </h4>
                <p className="mt-2.5 text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(task.desc)}</p>
                <p className="num mt-3 text-[12px] text-ink-4">
                  ৳{n(task.fee.toLocaleString("en-US"))} · {n(task.hours)}h
                </p>
              </div>

              <div className="bg-brand-50/40 p-5">
                <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                  <Cpu className="size-3" />
                  <T v={{ en: "The trial the AI wrote", bn: "এআই যে ট্রায়াল লিখেছে" }} />
                </h4>
                <p className="mt-2.5 text-[13.5px] font-medium leading-snug text-ink">{t(trial.title)}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{t(trial.brief)}</p>
                <p className="num mt-3 flex items-center gap-1.5 text-[12px] text-ink-4">
                  <Timer className="size-3" />
                  {n(trial.minutes)} <T v={{ en: "minutes", bn: "মিনিট" }} />
                </p>
                <ul className="mt-3 space-y-1.5">
                  {tl(trial.acceptance).map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* why the AI chose this */}
            <div className="flex items-start gap-2.5 border-t border-line bg-canvas-2/50 px-5 py-4">
              <Cpu className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
              <p className="text-[12.5px] leading-relaxed text-ink-3">
                <strong className="font-medium text-ink">
                  <T v={{ en: "Why the AI picked this piece:", bn: "এআই কেন এই অংশটাই বেছেছে:" }} />
                </strong>{" "}
                {t(trial.mirrors)}
              </p>
            </div>

            {/* the decision */}
            <div className="border-t border-line p-5">
              {status === "approved" ? (
                <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-brand-900">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <T
                    v={{
                      en: "You confirmed this is a piece of your work, so the task went on the board with this trial attached.",
                      bn: "আপনি নিশ্চিত করেছেন এটা আপনার কাজেরই এক টুকরো, তাই এই ট্রায়ালসহ টাস্কটি বোর্ডে গেছে।",
                    }}
                  />
                </p>
              ) : status === "changes_asked" ? (
                <div>
                  <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                    <RotateCcw className="mt-0.5 size-4 shrink-0 text-ink-4" />
                    <T v={{ en: "You asked for a change. What you said:", bn: "আপনি বদলাতে বলেছেন। আপনি যা বলেছেন:" }} />
                  </p>
                  <p className="mt-2 rounded-[12px] border border-line bg-canvas-2/50 p-4 text-[12.5px] leading-relaxed text-ink-2">
                    &ldquo;{local?.note ?? (check.clientNote ? t(check.clientNote) : "")}&rdquo;
                  </p>
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-4">
                    <T
                      v={{
                        en: "The AI rewrites the trial from that and sends it back to you. It cannot post the task on its own.",
                        bn: "এআই সেটা থেকে ট্রায়াল নতুন করে লিখে আপনার কাছে ফেরত পাঠায়। নিজে থেকে টাস্ক পোস্ট করতে পারে না।",
                      }}
                    />
                  </p>
                </div>
              ) : drafting === check.taskId ? (
                <div>
                  <label className="text-[12.5px] font-medium text-ink">
                    <T v={{ en: "What should the trial test instead?", bn: "ট্রায়ালে বরং কী পরীক্ষা হওয়া উচিত?" }} />
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t({
                      en: "In your own words — the AI rewrites it from this.",
                      bn: "আপনার নিজের ভাষায় — এআই এটা থেকেই নতুন করে লিখবে।",
                    })}
                    className="mt-2 w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      icon={<Send className="size-3.5" />}
                      disabled={!note.trim()}
                      onClick={() => {
                        setDecided((d) => ({ ...d, [check.taskId]: { kind: "changes", note: note.trim() } }));
                        setDrafting(null);
                        setNote("");
                      }}
                    >
                      <T v={{ en: "Send it back", bn: "ফেরত পাঠান" }} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDrafting(null); setNote(""); }}>
                      <T v={{ en: "Cancel", bn: "বাতিল" }} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="mr-auto text-[13px] font-medium text-ink">
                    <T v={{ en: "Is this really a small piece of your job?", bn: "এটা কি সত্যিই আপনার কাজের ছোট একটা টুকরো?" }} />
                  </p>
                  <Button size="sm" variant="secondary" icon={<RotateCcw className="size-3.5" />} onClick={() => setDrafting(check.taskId)}>
                    <T v={{ en: "No — change it", bn: "না — বদলান" }} />
                  </Button>
                  <Button
                    size="sm"
                    icon={<CheckCircle2 className="size-3.5" />}
                    onClick={() => setDecided((d) => ({ ...d, [check.taskId]: { kind: "approved" } }))}
                  >
                    <T v={{ en: "Yes — post the task", bn: "হ্যাঁ — টাস্ক পোস্ট করুন" }} />
                  </Button>
                </div>
              )}
              {open && (
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
                  <T
                    v={{
                      en: "Until you decide, this task is not visible to anyone and nobody can apply.",
                      bn: "আপনি সিদ্ধান্ত না নেওয়া পর্যন্ত এই টাস্ক কেউ দেখতে পান না, কেউ আবেদনও করতে পারেন না।",
                    }}
                  />
                </p>
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
