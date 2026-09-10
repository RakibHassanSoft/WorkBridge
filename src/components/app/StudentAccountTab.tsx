"use client";

import { AlertTriangle, BadgeCheck, CheckCircle2, FileText, Lock, ShieldCheck, Upload } from "lucide-react";
import { Panel } from "./parts";
import { Button } from "@/components/ui";
import { STUDENT_ONBOARDING, kycForSubject } from "@/data/admin";
import { T, useLang, useNum } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * The student's account and, more importantly, their verification.
 *
 * The recommendation letter is the one document a stranger cannot fake
 * cheaply — a coordinator reads it and calls the number printed on it.
 * Until that call has happened the account exists but cannot do a trial,
 * because a verified public record is only worth anything if the person
 * on it is who they say they are.
 */
export default function StudentAccountTab({ studentId }: { studentId: string }) {
  const { t } = useLang();
  const n = useNum();
  const kyc = kycForSubject(studentId);
  const verified = kyc?.status === "verified";
  const okCount = kyc ? kyc.documents.filter((d) => d.ok).length : 0;

  return (
    <div className="space-y-4">
      {/* ── verification status ───────────────────────────────── */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-[16px] border p-5",
          verified ? "border-brand-200 bg-brand-50/60" : "border-warn/20 bg-warn-bg/50"
        )}
      >
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-[12px]", verified ? "bg-brand-600 text-white" : "bg-warn/15 text-warn")}>
          {verified ? <BadgeCheck className="size-5" /> : <Lock className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {verified ? (
              <T v={{ en: "Verified — you can apply for tasks", bn: "যাচাই সম্পন্ন — আপনি টাস্কে আবেদন করতে পারেন" }} />
            ) : (
              <T v={{ en: "Not verified yet — you cannot do a trial", bn: "এখনো যাচাই হয়নি — আপনি ট্রায়াল করতে পারবেন না" }} />
            )}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
            {verified ? (
              <T
                v={{
                  en: "A coordinator read your recommendation letter and confirmed it by phone. That check is what lets your name go onto a public record clients can trust.",
                  bn: "একজন কোঅর্ডিনেটর আপনার সুপারিশপত্র পড়ে ফোনে নিশ্চিত করেছেন। এই যাচাইটার জন্যই আপনার নাম এমন পাবলিক রেকর্ডে ওঠে, যা ক্লায়েন্টরা বিশ্বাস করতে পারেন।",
                }}
              />
            ) : (
              <T
                v={{
                  en: "You can browse the task board while you wait, but applying means doing a trial — and a trial needs a verified account.",
                  bn: "অপেক্ষা করার সময় আপনি টাস্ক বোর্ড দেখতে পারেন, তবে আবেদন মানে ট্রায়াল করা — আর ট্রায়ালের জন্য যাচাইকৃত অ্যাকাউন্ট লাগে।",
                }}
              />
            )}
          </p>
        </div>
        {kyc && (
          <div className="text-right">
            <div className="num text-[19px] font-semibold text-ink">
              {n(okCount)}/{n(kyc.documents.length)}
            </div>
            <div className="text-[11px] text-ink-4">
              <T v={{ en: "documents clear", bn: "ডকুমেন্ট ঠিক" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── the three steps ───────────────────────────────────── */}
      <Panel
        title={{ en: "Your account", bn: "আপনার অ্যাকাউন্ট" }}
        desc={{ en: "Three steps, done once", bn: "তিনটি ধাপ, একবারই" }}
      >
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {STUDENT_ONBOARDING.map((step, i) => {
            const done = verified || i < 2;
            return (
              <div key={step.key} className="bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className={cn("grid size-8 place-items-center rounded-[10px]", done ? "bg-brand-600 text-white" : "bg-canvas-2 text-ink-3 ring-1 ring-line")}>
                    {done ? <CheckCircle2 className="size-4" /> : <span className="num text-[12px] font-semibold">{n(i + 1)}</span>}
                  </span>
                  <span className="num text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                    <T v={{ en: "Step", bn: "ধাপ" }} /> {n(i + 1)}
                  </span>
                </div>
                <h4 className="mt-3 text-[14px] font-medium text-ink">{t(step.title)}</h4>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-4">{t(step.detail)}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── documents ─────────────────────────────────────────── */}
      {kyc && (
        <Panel
          title={{ en: "Your documents", bn: "আপনার ডকুমেন্ট" }}
          desc={kyc.submittedLabel}
          action={
            <Button size="sm" variant="secondary" icon={<Upload className="size-3.5" />}>
              <T v={{ en: "Replace a document", bn: "ডকুমেন্ট বদলান" }} />
            </Button>
          }
        >
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {kyc.documents.map((d) => (
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

          <div className="flex items-start gap-2.5 border-t border-line bg-canvas-2/50 p-5">
            <FileText className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
            <p className="text-[12px] leading-relaxed text-ink-3">
              <T
                v={{
                  en: "Your documents are seen by coordinators only. They are never shown to a client — a client sees your verified work, your rubric scores and your trial, and nothing else about you.",
                  bn: "আপনার ডকুমেন্ট কেবল কোঅর্ডিনেটররা দেখেন। ক্লায়েন্টকে কখনো দেখানো হয় না — ক্লায়েন্ট দেখেন আপনার ভেরিফায়েড কাজ, রুব্রিক স্কোর আর ট্রায়াল, আপনার সম্পর্কে আর কিছুই নয়।",
                }}
              />
            </p>
          </div>
        </Panel>
      )}

      {/* ── why the letter ────────────────────────────────────── */}
      <Panel title={{ en: "Why the recommendation letter", bn: "সুপারিশপত্র কেন" }}>
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: { en: "It has a person behind it", bn: "এর পেছনে একজন মানুষ আছেন" },
              d: { en: "A scanned ID proves a name. A letter with a signature, a seal and a phone number proves somebody will vouch for you out loud.", bn: "স্ক্যান করা আইডি একটা নাম প্রমাণ করে। স্বাক্ষর, সিল ও ফোন নম্বরসহ চিঠি প্রমাণ করে কেউ একজন আপনার হয়ে মুখ খুলবেন।" },
            },
            {
              icon: BadgeCheck,
              t: { en: "It protects your record", bn: "এটা আপনার রেকর্ড রক্ষা করে" },
              d: { en: "The passport is only worth something because nobody can open an account in someone else's name and build a history on it.", bn: "পাসপোর্টের মূল্য কেবল এই কারণেই যে কেউ অন্যের নামে অ্যাকাউন্ট খুলে ইতিহাস বানাতে পারে না।" },
            },
            {
              icon: Lock,
              t: { en: "It is checked once", bn: "একবারই যাচাই হয়" },
              d: { en: "You do it at the start and never again. It does not repeat per task, and it costs you nothing.", bn: "শুরুতে একবার করবেন, আর কখনো নয়। প্রতি টাস্কে এটা করতে হয় না, আর এতে আপনার কোনো খরচও নেই।" },
            },
          ].map((c) => (
            <div key={c.t.en} className="bg-white p-5">
              <span className="grid size-8 place-items-center rounded-[10px] bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <c.icon className="size-4" />
              </span>
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(c.t)}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-4">{t(c.d)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
