"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileText,
  Gavel,
  LifeBuoy,
  MessageSquare,
  Scale,
  Send,
  ShieldCheck,
  Timer,
  UserCheck,
} from "lucide-react";
import { Panel, StatCard } from "./parts";
import { Avatar, Bar, Button } from "@/components/ui";
import { PointChip } from "@/components/tasks/TrialPanel";
import { TRIAL_ROUNDS, attemptsForTask } from "@/data/trials";
import { DISPUTES, TICKETS } from "@/data/support";
import { anyTaskById } from "@/data/marketplace";
import { studentById } from "@/data/people";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/* ────────────────────────────────────────────────────────────────
   The three moderator screens the model cannot run without:

   1. Selecting the student from the AI's ranked trial round. The AI
      ranks; a human decides. That order is not negotiable.
   2. Disputes — the only place a released payment can be reversed.
   3. Support — the queue that catches everything the product did not
      anticipate.
   ──────────────────────────────────────────────────────────────── */

/* ── 1 · Select the student ───────────────────────────────────── */

export function SelectStudent() {
  const { t, tl } = useLang();
  const n = useNum();
  const [picked, setPicked] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[16px] border border-brand-100 bg-brand-50/60 p-5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <p className="text-[12.5px] leading-relaxed text-brand-900">
          <T
            v={{
              en: "The client approved each of these trials before it went out, the AI scored every attempt and ranked them. You put forward one person — not a shortlist — and the chat between them and the client opens the moment you do. Rank 1 is a recommendation, not an instruction; you can put forward anyone in the round as long as you say why.",
              bn: "প্রতিটি ট্রায়াল বাইরে যাওয়ার আগে ক্লায়েন্ট অনুমোদন করেছেন, আর এআই প্রতিটি চেষ্টা মূল্যায়ন করে ক্রম দিয়েছে। আপনি একজনকে সামনে আনেন — শর্টলিস্ট নয় — আর সেই মুহূর্তেই তাঁর ও ক্লায়েন্টের মধ্যে চ্যাট খুলে যায়। ১ নম্বর ক্রম সুপারিশ, নির্দেশ নয়; কারণ লিখলে রাউন্ডের যে কাউকেই আপনি সামনে আনতে পারেন।",
            }}
          />
        </p>
      </div>

      {TRIAL_ROUNDS.map(({ trial, attempts }) => {
        const task = anyTaskById(trial.taskId);
        if (!task) return null;
        const decided = picked[trial.taskId];
        const already = attempts.find((a) => a.outcome === "selected");

        return (
          <Panel
            key={trial.id}
            title={task.title}
            desc={{
              en: `${attempts.length} trial attempts · AI-ranked · ${trial.minutes} min trial`,
              bn: `${attempts.length}টি ট্রায়াল চেষ্টা · এআই ক্রম করেছে · ${trial.minutes} মিনিটের ট্রায়াল`,
            }}
            action={
              <span className="num flex items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
                <ClipboardCheck className="size-3" />
                ৳{n(task.fee.toLocaleString("en-US"))}
              </span>
            }
          >
            <div className="border-b border-line bg-canvas-2/40 p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                    <T v={{ en: "The trial the AI built", bn: "এআই যে ট্রায়াল বানিয়েছে" }} />
                  </h4>
                  <p className="mt-2 text-[13px] font-medium text-ink">{t(trial.title)}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(trial.brief)}</p>
                </div>
                <div>
                  <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                    <Cpu className="size-3 text-brand-500" />
                    <T v={{ en: "Why this is the right test", bn: "কেন এটাই সঠিক পরীক্ষা" }} />
                  </h4>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{t(trial.mirrors)}</p>
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
            </div>

            <div className="divide-y divide-line">
              {attempts.map((a) => {
                const st = studentById(a.studentId);
                if (!st) return null;
                const chosen = decided ? decided === a.studentId : already?.id === a.id;
                const settled = Boolean(decided) || Boolean(already);

                return (
                  <div key={a.id} className={cn("p-5", chosen && "bg-brand-50/40")}>
                    <div className="flex flex-wrap items-start gap-4">
                      <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-[12px] font-semibold text-white">
                        {n(a.rank)}
                      </span>
                      <Avatar name={st.name.en} size={38} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">{t(st.name)}</span>
                          {chosen && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                              <UserCheck className="size-3" />
                              <T v={{ en: "Suggested — chat open", bn: "সাজেস্ট করা — চ্যাট খোলা" }} />
                            </span>
                          )}
                          {settled && !chosen && <PointChip delta={1} />}
                          <span className="num rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium text-ink-3 ring-1 ring-line">
                            {n(st.verified)} <T v={{ en: "verified", bn: "ভেরিফায়েড" }} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">
                          {t(st.discipline)} · {t(st.university)}
                        </p>

                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">{t(a.summary)}</p>

                        <div className="mt-3 flex items-start gap-2 rounded-[12px] bg-canvas-2/70 p-3.5 ring-1 ring-line">
                          <Cpu className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                          <p className="text-[12.5px] leading-relaxed text-ink-2">{t(a.aiVerdict)}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                          {a.aiBreakdown.map((b) => (
                            <span key={b.dim.en} className="flex items-center gap-2 text-[11.5px] text-ink-4">
                              {t(b.dim)}
                              <span className="flex gap-0.5">
                                {Array.from({ length: b.max }).map((_, i) => (
                                  <span key={i} className={cn("size-1.5 rounded-full", i < b.score ? "bg-brand-500" : "bg-canvas-3")} />
                                ))}
                              </span>
                            </span>
                          ))}
                          <span className="num flex items-center gap-1.5 text-[11.5px] text-ink-4">
                            <Timer className="size-3" />
                            {n(a.minutesTaken)} <T v={{ en: "min", bn: "মিনিট" }} />
                          </span>
                        </div>

                        {!settled && (
                          <div className="mt-4">
                            <Button size="sm" icon={<UserCheck className="size-3.5" />} onClick={() => setPicked((p) => ({ ...p, [trial.taskId]: a.studentId }))}>
                              <T v={{ en: "Suggest this one to the client", bn: "ক্লায়েন্টকে এঁকেই সাজেস্ট করুন" }} />
                            </Button>
                          </div>
                        )}
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

            <div className="flex items-start gap-2.5 border-t border-line bg-canvas-2/60 px-5 py-4">
              <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
              <p className="text-[12px] leading-relaxed text-ink-3">
                <T
                  v={{
                    en: "The moment you decide, the client sees this one name and the chat between them opens. Everyone else who did the trial is credited +1. The person you put forward earns 0 for delivering — and −1 only if they take the main task and do not deliver it.",
                    bn: "আপনি সিদ্ধান্ত নেওয়ার মুহূর্তে ক্লায়েন্ট এই একটি নামই দেখেন আর তাঁদের মধ্যে চ্যাট খুলে যায়। ট্রায়াল করা বাকি সবাই +১ পান। যাঁকে সামনে আনলেন তিনি কাজ শেষ করলে পান ০ — আর −১ কেবল তখনই, যখন মূল কাজ নিয়েও শেষ করতে পারেন না।",
                  }}
                />
              </p>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ── 2 · Disputes ─────────────────────────────────────────────── */

const DISPUTE_TONE: Record<string, { label: L; cls: string }> = {
  open: { label: { en: "Needs a decision", bn: "সিদ্ধান্ত দরকার" }, cls: "bg-warn-bg text-warn ring-warn/15" },
  evidence: { label: { en: "Collecting evidence", bn: "প্রমাণ সংগ্রহ চলছে" }, cls: "bg-info-bg text-info ring-info/15" },
  resolved: { label: { en: "Resolved", bn: "নিষ্পত্তি হয়েছে" }, cls: "bg-brand-50 text-brand-700 ring-brand-100" },
};

export function Disputes() {
  const { t, tl } = useLang();
  const n = useNum();
  const [ruled, setRuled] = useState<Record<string, "client" | "student" | "split">>({});

  const held = DISPUTES.filter((d) => d.status !== "resolved").reduce((a, d) => a + d.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Scale} label={{ en: "Open disputes", bn: "খোলা ডিসপিউট" }} value={n(DISPUTES.filter((d) => d.status !== "resolved").length)} hint={{ en: "of every task ever run", bn: "এ পর্যন্ত চালানো সব টাস্কের মধ্যে" }} tone="ink" />
        <StatCard icon={ShieldCheck} label={{ en: "Money frozen", bn: "আটকে রাখা টাকা" }} value={`৳${n(held.toLocaleString("en-US"))}`} hint={{ en: "neither side can touch it", bn: "কোনো পক্ষই ছুঁতে পারে না" }} />
        <StatCard icon={Gavel} label={{ en: "Median time to rule", bn: "নিষ্পত্তির মধ্যক সময়" }} value={`${n(2)}d`} hint={{ en: "both sides heard first", bn: "আগে দুই পক্ষেরই কথা শোনা হয়" }} tone="brand" />
      </div>

      {DISPUTES.map((d) => {
        const task = anyTaskById(d.taskId);
        const tone = DISPUTE_TONE[d.status];
        const decision = ruled[d.id];

        return (
          <section key={d.id} className="overflow-hidden rounded-[16px] border border-line bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{d.ref}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1", tone.cls)}>{t(tone.label)}</span>
                </div>
                <h2 className="mt-1.5 text-[15.5px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                  {task ? t(task.title) : d.ref}
                </h2>
                <p className="mt-1 text-[12px] text-ink-4">
                  <T v={{ en: "Raised by", bn: "উত্থাপন করেছেন" }} /> {t(d.raisedByName)} · {t(d.openedLabel)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-ink-4">
                  <T v={{ en: "Amount in dispute", bn: "বিতর্কিত অঙ্ক" }} />
                </div>
                <div className="num text-[22px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  ৳{n(d.amount.toLocaleString("en-US"))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-canvas-2/40 p-4">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "What the client says", bn: "ক্লায়েন্ট যা বলছেন" }} />
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                  &ldquo;{t(d.raisedBy === "client" ? d.claim : d.counterClaim)}&rdquo;
                </p>
              </div>
              <div className="rounded-[12px] border border-line bg-canvas-2/40 p-4">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "What the student says", bn: "শিক্ষার্থী যা বলছেন" }} />
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                  &ldquo;{t(d.raisedBy === "student" ? d.claim : d.counterClaim)}&rdquo;
                </p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <h3 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <FileText className="size-3" />
                <T v={{ en: "Evidence on file", bn: "নথিভুক্ত প্রমাণ" }} />
              </h3>
              <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {tl(d.evidence).map((e) => (
                  <li key={e} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas-2/50 p-5">
              {d.status === "resolved" && d.outcome ? (
                <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  {t(d.outcome)}
                </p>
              ) : decision ? (
                <span className="inline-flex items-center gap-2 rounded-[10px] bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white">
                  <Gavel className="size-4" />
                  {decision === "client" && <T v={{ en: "Refunded to the client — recorded on both records", bn: "ক্লায়েন্টকে ফেরত — দুই রেকর্ডেই লেখা থাকল" }} />}
                  {decision === "student" && <T v={{ en: "Released to the student — recorded on both records", bn: "শিক্ষার্থীকে ছাড়া হলো — দুই রেকর্ডেই লেখা থাকল" }} />}
                  {decision === "split" && <T v={{ en: "Split for partial delivery — recorded on both records", bn: "আংশিক ডেলিভারিতে ভাগ — দুই রেকর্ডেই লেখা থাকল" }} />}
                </span>
              ) : (
                <>
                  <p className="mr-auto text-[12px] text-ink-4">
                    <T v={{ en: "Whatever you decide is written onto both records, with the reason.", bn: "আপনি যা-ই সিদ্ধান্ত নিন, কারণসহ তা দুই পক্ষের রেকর্ডেই লেখা হয়।" }} />
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setRuled((r) => ({ ...r, [d.id]: "client" }))}>
                    <T v={{ en: "Refund the client", bn: "ক্লায়েন্টকে ফেরত" }} />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setRuled((r) => ({ ...r, [d.id]: "split" }))}>
                    <T v={{ en: "Split it", bn: "ভাগ করুন" }} />
                  </Button>
                  <Button size="sm" icon={<Gavel className="size-3.5" />} onClick={() => setRuled((r) => ({ ...r, [d.id]: "student" }))}>
                    <T v={{ en: "Release to the student", bn: "শিক্ষার্থীকে ছাড়ুন" }} />
                  </Button>
                </>
              )}
            </div>
          </section>
        );
      })}

      <p className="flex items-start gap-2.5 px-1 text-[12px] leading-relaxed text-ink-4">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <T
          v={{
            en: "A dispute is the only route by which held money moves without a client sign-off. That is why it sits with a person and not with the AI, and why every ruling is written onto both records instead of quietly erased.",
            bn: "ক্লায়েন্টের সাইন-অফ ছাড়া আটকে থাকা টাকা নড়ার একমাত্র পথ হলো ডিসপিউট। এজন্যই এটা এআই নয়, একজন মানুষের হাতে — আর এজন্যই প্রতিটি রায় নীরবে মুছে না দিয়ে দুই পক্ষের রেকর্ডে লেখা হয়।",
          }}
        />
      </p>
    </div>
  );
}

/* ── 3 · Support ──────────────────────────────────────────────── */

export function Support() {
  const { t } = useLang();
  const n = useNum();
  const [open, setOpen] = useState<string | null>(TICKETS[0]?.id ?? null);
  const [replied, setReplied] = useState<string[]>([]);

  const roleLabel: Record<string, L> = {
    client: { en: "Client", bn: "ক্লায়েন্ট" },
    student: { en: "Student", bn: "শিক্ষার্থী" },
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <Panel
        title={{ en: "Queue", bn: "কিউ" }}
        desc={{ en: "Newest first, high priority pinned", bn: "নতুনগুলো আগে, জরুরিগুলো ওপরে" }}
      >
        <div className="divide-y divide-line">
          {TICKETS.map((s) => {
            const isOpen = open === s.id;
            const done = s.status !== "new" || replied.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setOpen(s.id)}
                className={cn("block w-full p-4 text-left transition-colors", isOpen ? "bg-brand-50/50" : "hover:bg-canvas-2/60")}
              >
                <div className="flex items-center gap-2">
                  <span className="num text-[11px] font-medium text-ink-4">{s.ref}</span>
                  <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10.5px] font-medium text-ink-3 ring-1 ring-line">
                    {t(roleLabel[s.fromRole])}
                  </span>
                  {s.priority === "high" && !done && (
                    <span className="rounded-full bg-warn-bg px-2 py-0.5 text-[10.5px] font-semibold text-warn ring-1 ring-warn/15">
                      <T v={{ en: "High", bn: "জরুরি" }} />
                    </span>
                  )}
                  {done && <CheckCircle2 className="ml-auto size-3.5 text-brand-500" />}
                </div>
                <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink">{t(s.subject)}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-4">
                  {t(s.fromName)} · {t(s.openedLabel)}
                </p>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="space-y-4">
        {TICKETS.filter((s) => s.id === open).map((s) => {
          const done = s.status !== "new" || replied.includes(s.id);
          return (
            <Panel
              key={s.id}
              title={s.subject}
              desc={{
                en: `${s.ref} · ${s.fromRole}`,
                bn: `${s.ref} · ${t(roleLabel[s.fromRole]).toString()}`,
              }}
              action={
                <span className="flex items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
                  <LifeBuoy className="size-3" />
                  {t(s.openedLabel)}
                </span>
              }
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={s.fromName.en} size={34} />
                  <div className="min-w-0 flex-1 rounded-[12px] border border-line bg-canvas-2/50 p-4">
                    <p className="text-[13px] leading-relaxed text-ink-2">{t(s.body)}</p>
                  </div>
                </div>

                {s.reply && (
                  <div className="mt-4 flex flex-row-reverse items-start gap-3">
                    <Avatar name="Sabbir Rahman" size={34} />
                    <div className="min-w-0 flex-1 rounded-[12px] bg-ink p-4">
                      <p className="text-[13px] leading-relaxed text-white">{t(s.reply)}</p>
                    </div>
                  </div>
                )}

                {!s.reply && (
                  <div className="mt-4">
                    {replied.includes(s.id) ? (
                      <div className="flex items-center gap-2.5 rounded-[12px] bg-brand-50 p-4 text-[13px] text-brand-900 ring-1 ring-brand-200">
                        <CheckCircle2 className="size-4 shrink-0 text-brand-600" />
                        <T v={{ en: "Answered. The thread stays attached to the task, so the next coordinator sees it.", bn: "উত্তর দেওয়া হয়েছে। থ্রেডটি টাস্কের সাথেই থাকে, যাতে পরের কোঅর্ডিনেটর দেখতে পান।" }} />
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <textarea
                          rows={3}
                          placeholder={t({ en: "Answer in the language they wrote in…", bn: "তাঁরা যে ভাষায় লিখেছেন সেই ভাষাতেই উত্তর দিন…" })}
                          className="min-w-0 flex-1 resize-none rounded-[12px] border border-line bg-canvas-2/50 p-3.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
                        />
                        <Button icon={<Send className="size-4" />} onClick={() => setReplied((r) => [...r, s.id])}>
                          <T v={{ en: "Reply", bn: "উত্তর" }} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <span className="text-[11.5px] text-ink-4">
                    <T v={{ en: "Escalate to", bn: "এসকেলেট করুন" }} />
                  </span>
                  <Button size="sm" variant="secondary" icon={<Scale className="size-3.5" />}>
                    <T v={{ en: "Open a dispute", bn: "ডিসপিউট খুলুন" }} />
                  </Button>
                  <Button size="sm" variant="secondary" icon={<MessageSquare className="size-3.5" />}>
                    <T v={{ en: "Bring the client in", bn: "ক্লায়েন্টকে যুক্ত করুন" }} />
                  </Button>
                  <span className="num ml-auto text-[11.5px] text-ink-4">
                    {n(TICKETS.filter((x) => x.status === "new").length)} <T v={{ en: "unanswered in the queue", bn: "কিউতে উত্তরহীন" }} />
                  </span>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/** Trial rounds still waiting on a moderator decision — used for the nav badge. */
export const ROUNDS_WAITING = TRIAL_ROUNDS.filter(({ trial }) =>
  attemptsForTask(trial.taskId).every((a) => a.outcome !== "selected")
).length;
