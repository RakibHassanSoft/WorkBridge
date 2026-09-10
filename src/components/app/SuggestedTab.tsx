"use client";

import { BadgeCheck, ClipboardCheck, Cpu, Lock, MessageSquare, ShieldCheck, Timer, UserCheck } from "lucide-react";
import { Avatar, Bar, Button } from "@/components/ui";
import { Panel } from "./parts";
import { ATTEMPTS, SUGGESTIONS, attemptsForTask, suggestionForTask, trialForTask } from "@/data/trials";
import { anyTaskById } from "@/data/marketplace";
import { studentById } from "@/data/people";
import { T, useLang, useNum } from "@/lib/i18n";


/** Tasks whose trial round is finished, in the order the client cares about. */
const SHOW = ["x3", "x1"];

/**
 * One suggestion, not a shortlist.
 *
 * The moderator puts forward a single person and says why. The client is
 * not asked to compare five strangers on a screen — that is how the least
 * connected person loses every time — and the chat only opens once that
 * one name exists, so nobody is negotiating with an applicant pool.
 */
export default function SuggestedTab({ onGo }: { onGo?: (k: string) => void }) {
  const { t } = useLang();
  const n = useNum();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[16px] border border-brand-100 bg-brand-50/60 p-5">
        <UserCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <p className="text-[12.5px] leading-relaxed text-brand-900">
          <T
            v={{
              en: "Everyone who applied did the trial you approved. The AI scored them, and a coordinator puts forward one person with a reason. Once that name is here, you can talk to them directly.",
              bn: "যাঁরা আবেদন করেছেন, প্রত্যেকে আপনার অনুমোদন করা ট্রায়ালটাই করেছেন। এআই তাঁদের নম্বর দিয়েছে, আর একজন কোঅর্ডিনেটর কারণসহ একজনকে সামনে আনেন। নামটা এখানে এলেই আপনি তাঁর সাথে সরাসরি কথা বলতে পারবেন।",
            }}
          />
        </p>
      </div>

      {SHOW.map((taskId) => {
        const task = anyTaskById(taskId);
        const trial = trialForTask(taskId);
        const sug = suggestionForTask(taskId);
        if (!task || !trial) return null;

        /* ── nobody suggested yet ─────────────────────────────── */
        if (!sug) {
          const tried = attemptsForTask(taskId).length;
          return (
            <Panel
              key={taskId}
              title={task.title}
              desc={{ en: "Trial round still open", bn: "ট্রায়াল রাউন্ড এখনো চলছে" }}
              action={
                <span className="flex items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
                  <ClipboardCheck className="size-3" />
                  {t(trial.title)}
                </span>
              }
            >
              <div className="flex items-start gap-3 p-5">
                <Lock className="mt-0.5 size-4 shrink-0 text-ink-4" />
                <div>
                  <p className="num text-[13px] font-medium text-ink">
                    {n(tried)} <T v={{ en: "people have done the trial so far", bn: "জন এ পর্যন্ত ট্রায়াল করেছেন" }} />
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-4">
                    <T
                      v={{
                        en: "A coordinator is going through the attempts and will put one person forward. The chat opens then — usually within a working day.",
                        bn: "একজন কোঅর্ডিনেটর চেষ্টাগুলো দেখছেন এবং একজনকে সামনে আনবেন। তখনই চ্যাট খুলবে — সাধারণত এক কর্মদিবসের মধ্যে।",
                      }}
                    />
                  </p>
                </div>
              </div>
            </Panel>
          );
        }

        /* ── the one person ───────────────────────────────────── */
        const st = studentById(sug.studentId);
        const attempt = ATTEMPTS.find((a) => a.id === sug.attemptId);
        if (!st || !attempt) return null;

        return (
          <div key={taskId} className="space-y-4">
            <Panel
              title={task.title}
              desc={sug.suggestedLabel}
              action={
                <span className="flex items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
                  <ClipboardCheck className="size-3" />
                  {t(trial.title)}
                </span>
              }
            >
              <div className="flex flex-wrap items-start gap-5 p-5">
                <Avatar name={st.name.en} size={56} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{t(st.name)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                      <BadgeCheck className="size-3" />
                      <T v={{ en: "Suggested for this task", bn: "এই টাস্কের জন্য সাজেস্ট করা" }} />
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-4">
                    {t(st.discipline)} · {t(st.university)} ·{" "}
                    <span className="num">
                      {n(st.verified)} <T v={{ en: "verified tasks", bn: "ভেরিফায়েড টাস্ক" }} />
                    </span>
                  </p>

                  <div className="mt-4 rounded-[12px] border border-line bg-white p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <T v={{ en: "What they did in your trial", bn: "আপনার ট্রায়ালে তিনি যা করেছেন" }} />
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{t(attempt.summary)}</p>
                    <p className="num mt-2 flex items-center gap-1.5 text-[11px] text-ink-4">
                      <Timer className="size-3" />
                      {n(attempt.minutesTaken)} <T v={{ en: "minutes", bn: "মিনিট" }} />
                    </p>
                  </div>

                  <div className="mt-3 flex items-start gap-2.5 rounded-[12px] border border-brand-100 bg-brand-50/50 p-4">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                    <p className="text-[12.5px] leading-relaxed text-brand-900">
                      <strong className="font-medium">
                        <T v={{ en: "Why the coordinator chose them:", bn: "কোঅর্ডিনেটর কেন তাঁকে বেছেছেন:" }} />
                      </strong>{" "}
                      {t(sug.reason)}
                    </p>
                  </div>
                </div>

                <div className="w-[110px] shrink-0">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-4">
                      <T v={{ en: "trial score", bn: "ট্রায়াল স্কোর" }} />
                    </span>
                    <span className="num text-[17px] font-semibold text-ink">{n(attempt.aiScore)}</span>
                  </div>
                  <Bar value={attempt.aiScore} />
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-ink-4">
                    <Cpu className="mt-0.5 size-3 shrink-0" />
                    <T v={{ en: "scored by the AI", bn: "এআই নম্বর দিয়েছে" }} />
                  </p>
                </div>
              </div>

              <p className="num border-t border-line bg-canvas-2/50 px-5 py-3.5 text-[12px] text-ink-4">
                {n(sug.triedCount)}{" "}
                <T v={{ en: "people did this trial. Everyone who was not chosen earned +1 point for the attempt — nobody worked for nothing.", bn: "জন এই ট্রায়ালটি করেছেন। যাঁরা নির্বাচিত হননি, প্রত্যেকে চেষ্টার জন্য +১ পয়েন্ট পেয়েছেন — কারও শ্রম বৃথা যায়নি।" }} />
              </p>
            </Panel>

            <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line bg-white p-5">
              <MessageSquare className="size-4 shrink-0 text-brand-600" />
              <p className="text-[12.5px] leading-relaxed text-ink-3">
                <T
                  v={{
                    en: "The chat with them is open — it opened the moment this name was put forward.",
                    bn: "তাঁর সাথে চ্যাট খোলা — এই নামটি সামনে আসার মুহূর্তেই সেটি খুলেছে।",
                  }}
                />
              </p>
              <Button size="sm" className="ml-auto" onClick={() => onGo?.("messages")} icon={<MessageSquare className="size-3.5" />}>
                <T v={{ en: "Open the chat", bn: "চ্যাট খুলুন" }} />
              </Button>
            </div>
          </div>
        );
      })}

      {SUGGESTIONS.length === 0 && (
        <p className="px-1 text-[12px] text-ink-4">
          <T v={{ en: "No suggestions yet.", bn: "এখনো কোনো সাজেশন নেই।" }} />
        </p>
      )}
    </div>
  );
}
