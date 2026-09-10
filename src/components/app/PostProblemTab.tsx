"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { Panel } from "./parts";
import { Button, Bar } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { scopeOne, type SingleScope } from "@/lib/engine";
import { sectorById } from "@/data/sectors";
import { methodsOfClient } from "@/data/admin";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/* A few real-sounding starters, because a blank box is the hardest
   thing to hand someone who has never written a brief. */
const EXAMPLES: { label: L; text: L }[] = [
  {
    label: { en: "Orders keep failing", bn: "অর্ডার বারবার ফেল করছে" },
    text: {
      en: "People add things to the basket on our website and then disappear at the payment step. It has been happening for about two months and we do not have a tech person.",
      bn: "আমাদের ওয়েবসাইটে মানুষ ঝুড়িতে জিনিস নেয়, তারপর পেমেন্টের ধাপে গিয়ে হারিয়ে যায়। প্রায় দুই মাস ধরে হচ্ছে, আর আমাদের কোনো টেক লোক নেই।",
    },
  },
  {
    label: { en: "Papers, not a file", bn: "কাগজ আছে, ফাইল নেই" },
    text: {
      en: "We have three seasons of customer records in paper registers, about 600 pages. If someone asks what they bought last season we have to look through them by hand.",
      bn: "কাগজের রেজিস্টারে তিন মৌসুমের কাস্টমার রেকর্ড আছে, প্রায় ৬০০ পাতা। কেউ গত মৌসুমে কী কিনেছিলেন জানতে চাইলে হাতে খুঁজতে হয়।",
    },
  },
  {
    label: { en: "Nothing is written", bn: "কিছুই লেখা নেই" },
    text: {
      en: "Fifty new products are on the site with no Bangla description under them. I need them written in the same voice as the few that are already there.",
      bn: "সাইটে পঞ্চাশটা নতুন প্রোডাক্ট আছে, নিচে কোনো বাংলা বর্ণনা নেই। যে কয়টা আগে থেকে আছে, সেই একই ভাষায় লেখা দরকার।",
    },
  },
  {
    label: { en: "Every outlet looks different", bn: "প্রতিটি আউটলেট আলাদা দেখায়" },
    text: {
      en: "Our four outlets post on social media in four different styles. I want one page of design rules the outlet managers can follow themselves.",
      bn: "আমাদের চারটি আউটলেট সোশ্যাল মিডিয়ায় চার রকম স্টাইলে পোস্ট করে। এক পাতার ডিজাইন নিয়ম চাই, যা ম্যানেজাররা নিজেরাই মানতে পারবেন।",
    },
  },
];

type Step = "write" | "read" | "posted";

/**
 * Posting a problem, end to end.
 *
 * Three screens: write it in your own words, read what the AI made of
 * it, deposit and post. The AI returns one task with one price — not a
 * plan — and the trial it will use, so the client knows before paying
 * exactly what applicants will be asked to do.
 */
export default function PostProblemTab({ clientId, onGo }: { clientId: string; onGo: (k: string) => void }) {
  const { t, tl } = useLang();
  const n = useNum();

  const [step, setStep] = useState<Step>("write");
  const [text, setText] = useState("");
  const [result, setResult] = useState<SingleScope | null>(null);

  const method = useMemo(() => methodsOfClient(clientId).find((m) => m.isDefault), [clientId]);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const enough = words >= 12;

  const read = () => {
    setResult(scopeOne(text));
    setStep("read");
  };

  /* ── 1 · write it ───────────────────────────────────────────── */
  if (step === "write") {
    return (
      <div className="space-y-4">
        <Panel
          title={{ en: "Describe the problem in your own words", bn: "নিজের ভাষায় সমস্যাটা লিখুন" }}
          desc={{ en: "No technical words. Say what goes wrong and who it annoys.", bn: "কোনো টেকনিক্যাল শব্দ নয়। কী ভুল হয় আর কার অসুবিধা হয়, সেটাই বলুন।" }}
        >
          <div className="p-5">
            <textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t({
                en: "For example: every month our stockroom count is off and nobody can say where it went. Transfers between the shop and the stockroom are written in a notepad…",
                bn: "যেমন: প্রতি মাসে আমাদের স্টকরুমের গণনা মেলে না, কোথায় গেল কেউ বলতে পারে না। দোকান আর স্টকরুমের ট্রান্সফার একটা নোটপ্যাডে লেখা হয়…",
              })}
              className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-4 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={cn("num text-[11.5px]", enough ? "text-brand-700" : "text-ink-4")}>
                {n(words)} <T v={{ en: "words", bn: "শব্দ" }} />
                {!enough && (
                  <>
                    {" · "}
                    <T v={{ en: "a couple of sentences is enough", bn: "দুই-এক বাক্যই যথেষ্ট" }} />
                  </>
                )}
              </span>
              <Button className="ml-auto" disabled={!enough} onClick={read} icon={<ArrowRight className="size-4" />}>
                <T v={{ en: "Let the AI read it", bn: "এআই-কে পড়তে দিন" }} />
              </Button>
            </div>
          </div>

          <div className="border-t border-line bg-canvas-2/40 p-5">
            <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <Lightbulb className="size-3" />
              <T v={{ en: "Not sure how to start? Try one of these", bn: "কীভাবে শুরু করবেন বুঝছেন না? এগুলোর একটা দেখুন" }} />
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label.en}
                  onClick={() => setText(t(ex.text))}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-brand-300 hover:text-ink"
                >
                  {t(ex.label)}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid gap-px overflow-hidden rounded-[16px] border border-line bg-line sm:grid-cols-3">
          {[
            { icon: Cpu, t: { en: "The AI reads it", bn: "এআই পড়ে" }, d: { en: "One task, one price, one estimate — not a project plan.", bn: "একটি কাজ, একটি দাম, একটি অনুমান — প্রজেক্ট প্ল্যান নয়।" } },
            { icon: ClipboardCheck, t: { en: "You check the trial", bn: "আপনি ট্রায়াল যাচাই করেন" }, d: { en: "You see the short test applicants will do before anyone applies.", bn: "কেউ আবেদনের আগেই আপনি দেখবেন আবেদনকারীরা কোন ছোট পরীক্ষাটি দেবেন।" } },
            { icon: Wallet, t: { en: "You deposit and post", bn: "জমা দিয়ে পোস্ট করেন" }, d: { en: "The fee is held by the platform until you sign the work off.", bn: "আপনি কাজ সাইন-অফ না করা পর্যন্ত ফি প্ল্যাটফর্মে আটকে থাকে।" } },
          ].map((c) => (
            <div key={c.t.en} className="bg-white p-5">
              <c.icon className="size-4 text-brand-500" />
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(c.t)}</h4>
              <p className="mt-1 text-[12px] leading-snug text-ink-4">{t(c.d)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── 3 · posted ─────────────────────────────────────────────── */
  if (step === "posted" && result) {
    return (
      <div className="space-y-4">
        <Panel title={{ en: "Posted", bn: "পোস্ট হয়েছে" }}>
          <div className="p-6">
            <span className="grid size-11 place-items-center rounded-[12px] bg-brand-600 text-white">
              <CheckCircle2 className="size-5" />
            </span>
            <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-ink">{t(result.task.title)}</h3>
            <p className="num mt-1.5 text-[13px] text-ink-3">
              ৳{n(result.task.fee.toLocaleString("en-US"))} <T v={{ en: "deposited from", bn: "জমা হয়েছে" }}
              /> {method ? t(method.label) : ""}
            </p>

            <ol className="mt-6 space-y-3">
              {[
                { t: { en: "Your deposit is held by the platform", bn: "আপনার জমা প্ল্যাটফর্মে আটকে আছে" }, d: { en: "Not with anyone else, and not spent.", bn: "অন্য কারও কাছে নয়, খরচও নয়।" }, done: true },
                { t: { en: "Check the trial task", bn: "ট্রায়াল টাস্ক যাচাই করুন" }, d: { en: "It is waiting for you now. Nothing goes on the board until you approve it.", bn: "সেটি এখন আপনার অপেক্ষায়। আপনি অনুমোদন না করা পর্যন্ত কিছুই বোর্ডে যায় না।" }, done: false },
                { t: { en: "A coordinator suggests one person", bn: "কোঅর্ডিনেটর একজনকে সাজেস্ট করেন" }, d: { en: "Chosen from everyone who did the trial, with a written reason. The chat opens then.", bn: "যাঁরা ট্রায়াল করেছেন তাঁদের মধ্য থেকে, লিখিত কারণসহ। তখনই চ্যাট খোলে।" }, done: false },
              ].map((r, i) => (
                <li key={r.t.en} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                      r.done ? "bg-brand-600 text-white" : "bg-canvas-2 text-ink-3 ring-1 ring-line"
                    )}
                  >
                    {r.done ? <CheckCircle2 className="size-3.5" /> : n(i + 1)}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{t(r.t)}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-4">{t(r.d)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => onGo("trial")} icon={<ClipboardCheck className="size-4" />}>
                <T v={{ en: "Check the trial task", bn: "ট্রায়াল টাস্ক যাচাই করুন" }} />
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setText("");
                  setResult(null);
                  setStep("write");
                }}
              >
                <T v={{ en: "Post another problem", bn: "আরেকটি সমস্যা পোস্ট করুন" }} />
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  /* ── 2 · what the AI made of it ─────────────────────────────── */
  if (!result) return null;
  const sector = sectorById(result.sectorId);
  const blocked = result.price.level === "blocked";

  return (
    <div className="space-y-4">
      <Panel
        title={{ en: "What the AI made of it", bn: "এআই এটাকে যা বুঝেছে" }}
        desc={{ en: "One task, one price. Check it before you pay.", bn: "একটি কাজ, একটি দাম। টাকা দেওয়ার আগে দেখে নিন।" }}
        action={
          <span className="flex items-center gap-2 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
            <span className="grid size-4 place-items-center rounded text-white" style={{ background: sector.accent }}>
              <SectorIcon name={sector.icon} className="size-2.5" />
            </span>
            {t(sector.name)}
          </span>
        }
      >
        <div className="grid gap-6 border-b border-line bg-canvas-2/40 p-5 lg:grid-cols-2">
          <div>
            <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "What you wrote", bn: "আপনি যা লিখেছেন" }} />
            </h4>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{text.trim()}&rdquo;</p>
          </div>
          <div>
            <h4 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <Sparkles className="size-3 text-brand-500" />
              <T v={{ en: "How the AI read it", bn: "এআই যেভাবে পড়েছে" }} />
              <span className="num rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{n(result.confidence)}%</span>
            </h4>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">{t(result.summary)}</p>
            {result.risks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {result.risks.slice(0, 3).map((r) => (
                  <li key={r.en} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-4">
                    <span className="mt-[6px] size-1 shrink-0 rounded-full bg-warn" />
                    {t(r)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "The one task", bn: "একটিমাত্র কাজ" }} />
            </h4>
            <p className="mt-2.5 text-[15px] font-medium leading-snug text-ink">{t(result.task.title)}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(result.task.desc)}</p>
            <ul className="mt-3.5 space-y-2">
              {tl(result.task.acceptance).map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[14px] border border-line bg-canvas-2/40 p-5">
            <div className="num text-[30px] font-semibold leading-none tracking-[-0.035em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
              ৳{n(result.task.fee.toLocaleString("en-US"))}
            </div>
            <p className="num mt-2 text-[12.5px] text-ink-4">
              {n(result.task.hours)}h <T v={{ en: "estimated", bn: "আনুমানিক" }} /> · ৳{n(result.price.rate)}/h
            </p>
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-center gap-2 text-[11.5px] font-medium text-ink-3">
                <ShieldCheck className={cn("size-3.5", blocked ? "text-warn" : "text-brand-600")} />
                <T v={{ en: "Fair-pay check", bn: "ন্যায্য-মজুরি যাচাই" }} />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-4">{t(result.price.message)}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={{ en: "The trial applicants will do", bn: "আবেদনকারীরা যে ট্রায়ালটি করবেন" }}
        desc={{ en: "You approve it after posting, before anyone sees the task", bn: "পোস্টের পর, কেউ টাস্ক দেখার আগে আপনি এটি অনুমোদন করবেন" }}
        action={
          <span className="num flex items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
            <Timer className="size-3" />
            {n(result.trial.minutes)} <T v={{ en: "min", bn: "মিনিট" }} />
          </span>
        }
      >
        <div className="p-5">
          <p className="text-[13.5px] font-medium leading-snug text-ink">{t(result.trial.title)}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">{t(result.trial.brief)}</p>
          <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-brand-50/50 p-3.5 text-[12.5px] leading-relaxed text-brand-900 ring-1 ring-brand-100">
            <Cpu className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
            {t(result.trial.mirrors)}
          </p>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line bg-white p-5">
        <Button variant="ghost" onClick={() => setStep("write")} icon={<ArrowLeft className="size-4" />}>
          <T v={{ en: "Edit what I wrote", bn: "লেখাটা বদলাই" }} />
        </Button>
        <span className="flex items-center gap-2 text-[12px] text-ink-4">
          <Wallet className="size-3.5" />
          {method ? (
            <>
              <T v={{ en: "from", bn: "যেখান থেকে" }} /> {t(method.label)} <span className="num">{t(method.detail)}</span>
            </>
          ) : (
            <T v={{ en: "add a payment method first", bn: "আগে একটি পেমেন্ট মেথড যোগ করুন" }} />
          )}
        </span>
        <Button
          className="ml-auto"
          disabled={blocked || !method}
          onClick={() => setStep("posted")}
          icon={<BadgeCheck className="size-4" />}
        >
          {blocked ? (
            <T v={{ en: "Raise the fee to post", bn: "পোস্ট করতে ফি বাড়ান" }} />
          ) : (
            <>
              <T v={{ en: "Deposit", bn: "জমা দিন" }} /> ৳{n(result.task.fee.toLocaleString("en-US"))}{" "}
              <T v={{ en: "and post", bn: "ও পোস্ট করুন" }} />
            </>
          )}
        </Button>
      </div>

      <div className="px-1">
        <Bar value={result.confidence} />
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">
          <T
            v={{
              en: "A coordinator reads this before it reaches anyone. If the AI has misread you, they change it or send it back — the AI cannot post a task on its own.",
              bn: "কারও কাছে যাওয়ার আগে একজন কোঅর্ডিনেটর এটি পড়েন। এআই আপনাকে ভুল বুঝলে তিনি বদলে দেন বা ফেরত পাঠান — এআই নিজে থেকে টাস্ক পোস্ট করতে পারে না।",
            }}
          />
        </p>
      </div>
    </div>
  );
}
