"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Cpu,
  Layers3,
  ListChecks,
  Lock,
  RefreshCw,
  ScanLine,
  Sparkles,
  Split,
  Tags,
  Timer,
  UserRoundSearch,
  Wallet,
} from "lucide-react";
import { Bar, Button, Reveal } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { scope, scopeOne, type ScopeResult, type SingleScope } from "@/lib/engine";
import { sectorById, SECTORS } from "@/data/sectors";
import { PRESETS } from "./presets";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const STAGES: { icon: typeof ScanLine; label: L }[] = [
  { icon: ScanLine, label: { en: "Reading the brief", bn: "ব্রিফ পড়া হচ্ছে" } },
  { icon: Tags, label: { en: "Detecting sector signals", bn: "সেক্টর সংকেত শনাক্তকরণ" } },
  { icon: Split, label: { en: "Separating the problems", bn: "সমস্যাগুলো আলাদা করা" } },
  { icon: Layers3, label: { en: "Decomposing and pricing", bn: "ভাগ করা ও দাম নির্ধারণ" } },
  { icon: AlertTriangle, label: { en: "Flagging risks", bn: "ঝুঁকি চিহ্নিতকরণ" } },
  { icon: UserRoundSearch, label: { en: "Matching candidates", bn: "প্রার্থী ম্যাচিং" } },
];

type Tab = "tasks" | "risks" | "matches" | "rubric";

export default function Playground() {
  const { t, tl, lang } = useLang();
  const n = useNum();

  const [brief, setBrief] = useState(() => PRESETS[0].brief.en);
  const [preset, setPreset] = useState(0);
  const [sectorId, setSectorId] = useState("auto");
  const [stage, setStage] = useState(-1); // -1 idle, 0..5 running, 6 done
  const [result, setResult] = useState<ScopeResult | null>(null);
  const [one, setOne] = useState<SingleScope | null>(null);
  const [tab, setTab] = useState<Tab>("tasks");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep the preset text in the reader's language until they edit it.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched && preset >= 0) setBrief(PRESETS[preset][lang === "bn" ? "brief" : "brief"][lang]);
  }, [lang, preset, touched]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const run = useCallback(() => {
    if (!brief.trim()) return;
    clearTimers();
    setResult(null);
    setOne(null);
    setStage(0);
    setTab("tasks");
    const computed = scope(brief, sectorId === "auto" ? undefined : { sectorId });
    const single = scopeOne(brief, sectorId === "auto" ? undefined : { sectorId });
    for (let i = 1; i <= STAGES.length; i += 1) {
      timers.current.push(
        setTimeout(() => {
          setStage(i);
          if (i === STAGES.length) {
            setResult(computed);
            setOne(single);
          }
        }, 460 * i)
      );
    }
  }, [brief, sectorId]);

  const running = stage >= 0 && stage < STAGES.length;
  const done = !!result;
  const sector = result ? sectorById(result.sectorId) : null;

  const tabs: { key: Tab; label: L; count?: number }[] = useMemo(
    () => [
      { key: "tasks", label: { en: "The task & trial", bn: "কাজ ও ট্রায়াল" } },
      { key: "risks", label: { en: "Risks", bn: "ঝুঁকি" }, count: result?.risks.length },
      { key: "matches", label: { en: "Matches", bn: "ম্যাচ" }, count: result?.matches.length },
      { key: "rubric", label: { en: "Rubric", bn: "রুব্রিক" } },
    ],
    [result]
  );

  return (
    <section className="py-14 md:py-20">
      <div className="shell grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-8">
        {/* ── Input ───────────────────────────────────────────── */}
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-ink text-white">
                <Sparkles className="size-3.5" />
              </span>
              <h2 className="text-[14px] font-semibold text-ink">
                <T v={{ en: "Post a problem", bn: "সমস্যা পোস্ট করুন" }} />
              </h2>
            </div>

            <div className="mt-5">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <T v={{ en: "Start from a real example", bn: "বাস্তব উদাহরণ দিয়ে শুরু" }} />
              </label>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.label.en}
                    onClick={() => {
                      setPreset(i);
                      setTouched(false);
                      setBrief(p.brief[lang]);
                      setSectorId("auto");
                      setStage(-1);
                      setResult(null);
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-left text-[11.5px] leading-tight ring-1 transition-all",
                      preset === i && !touched
                        ? "bg-brand-50 text-brand-700 ring-brand-200"
                        : "bg-canvas-2 text-ink-3 ring-line hover:text-ink"
                    )}
                  >
                    {t(p.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="brief" className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <T v={{ en: "…or write your own", bn: "…অথবা নিজে লিখুন" }} />
              </label>
              <textarea
                id="brief"
                value={brief}
                onChange={(e) => {
                  setBrief(e.target.value);
                  setTouched(true);
                }}
                rows={7}
                spellCheck={false}
                className="mt-2.5 w-full resize-none rounded-[12px] border border-line bg-canvas-2/50 p-3.5 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
                placeholder={t({
                  en: "Describe what is going wrong, in your own words…",
                  bn: "নিজের ভাষায় লিখুন কী সমস্যা হচ্ছে…",
                })}
              />
              <p className="mt-1.5 text-[11px] text-ink-4">
                {n(brief.trim().split(/\s+/).filter(Boolean).length)} <T v={{ en: "words", bn: "শব্দ" }} />
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="sector" className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <T v={{ en: "Sector", bn: "সেক্টর" }} />
              </label>
              <select
                id="sector"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className="mt-2.5 w-full rounded-[12px] border border-line bg-canvas-2/50 px-3.5 py-3 text-[13.5px] text-ink outline-none transition-colors focus:border-brand-300 focus:bg-white"
              >
                <option value="auto">{t({ en: "Detect automatically", bn: "স্বয়ংক্রিয়ভাবে শনাক্ত করুন" })}</option>
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <Button
                full
                size="lg"
                onClick={run}
                disabled={running || !brief.trim()}
                icon={running ? <RefreshCw className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              >
                {running ? (
                  <T v={{ en: "Scoping…", bn: "স্কোপ করা হচ্ছে…" }} />
                ) : done ? (
                  <T v={{ en: "Run again", bn: "আবার চালান" }} />
                ) : (
                  <T v={{ en: "Run the scope", bn: "স্কোপ চালান" }} />
                )}
              </Button>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
                <T
                  v={{
                    en: "Simulated Phase 2 behaviour, running entirely in your browser. No model call, no data leaves the page.",
                    bn: "সিমুলেটেড ফেজ ২ আচরণ, সম্পূর্ণ আপনার ব্রাউজারে চলছে। কোনো মডেল কল নেই, কোনো ডেটা পেজ ছাড়ে না।",
                  }}
                />
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── Output ──────────────────────────────────────────── */}
        <Reveal delay={80}>
          <div className="min-h-[620px] overflow-hidden rounded-[20px] border border-line bg-white">
            {/* stage strip */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-canvas-2/60 px-5 py-3">
              {STAGES.map((s, i) => {
                const state = stage > i ? "done" : stage === i ? "active" : "idle";
                return (
                  <div
                    key={s.label.en}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] transition-all duration-400",
                      state === "done" && "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
                      state === "active" && "bg-ink text-white",
                      state === "idle" && "text-ink-4"
                    )}
                  >
                    <s.icon className={cn("size-3.5", state === "active" && "animate-pulse")} />
                    <span className="whitespace-nowrap">{t(s.label)}</span>
                  </div>
                );
              })}
              <div
                className={cn(
                  "ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] transition-all duration-400",
                  done ? "bg-warn-bg text-warn ring-1 ring-warn/15" : "text-ink-4"
                )}
              >
                <Lock className="size-3.5" />
                <span className="whitespace-nowrap">
                  <T v={{ en: "Human gate", bn: "মানবিক গেট" }} />
                </span>
              </div>
            </div>

            {/* idle */}
            {stage === -1 && (
              <div className="grid place-items-center px-8 py-24 text-center">
                <div className="max-w-[380px]">
                  <span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-canvas-2 text-ink-4 ring-1 ring-line">
                    <Cpu className="size-5" />
                  </span>
                  <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                    <T v={{ en: "Nothing scoped yet", bn: "এখনো কিছু স্কোপ করা হয়নি" }} />
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-3">
                    <T
                      v={{
                        en: "Pick an example or write a brief on the left, then run the scope. The engine will decompose it into priced tasks, flag what it cannot know, and shortlist students with its reasoning shown.",
                        bn: "বাঁ পাশে একটি উদাহরণ বেছে নিন বা ব্রিফ লিখুন, তারপর স্কোপ চালান। ইঞ্জিন কাজটির দাম ঠিক করবে, যা জানা সম্ভব নয় তা চিহ্নিত করবে, আর যুক্তিসহ শিক্ষার্থীদের শর্টলিস্ট করবে।",
                      }}
                    />
                  </p>
                </div>
              </div>
            )}

            {/* running */}
            {running && (
              <div className="space-y-3 p-7">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-[66px] rounded-[14px]" style={{ opacity: 1 - i * 0.18 }} />
                ))}
              </div>
            )}

            {/* result */}
            {done && result && sector && (
              <div className="anim-fade">
                {/* summary bar */}
                <div className="border-b border-line p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-[12px] text-white" style={{ background: sector.accent }}>
                        <SectorIcon name={sector.icon} className="size-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-ink">{t(sector.name)}</span>
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                            {n(result.confidence)}% <T v={{ en: "confidence", bn: "কনফিডেন্স" }} />
                          </span>
                          <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[11px] font-medium text-ink-3 ring-1 ring-line">
                            {result.complexity}
                          </span>
                        </div>
                        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-3">{t(result.summary)}</p>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-4">
                          <Wallet className="size-3" />
                          <T v={{ en: "Total", bn: "মোট" }} />
                        </div>
                        <div className="num mt-0.5 text-[19px] font-semibold text-ink">৳{n(result.totalFee.toLocaleString("en-US"))}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-4">
                          <Timer className="size-3" />
                          <T v={{ en: "Effort", bn: "সময়" }} />
                        </div>
                        <div className="num mt-0.5 text-[19px] font-semibold text-ink">{n(result.totalHours)}h</div>
                      </div>
                    </div>
                  </div>

                  {result.signals.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                        <T v={{ en: "Signals detected", bn: "শনাক্ত সংকেত" }} />
                      </span>
                      {result.signals.map((s) => (
                        <span key={s.label.en} className="rounded-md bg-canvas-2 px-2 py-1 text-[11px] text-ink-3 ring-1 ring-line">
                          {t(s.label)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* tabs */}
                <div className="flex gap-1 border-b border-line px-5 py-2.5">
                  {tabs.map((tb) => (
                    <button
                      key={tb.key}
                      onClick={() => setTab(tb.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                        tab === tb.key ? "bg-ink text-white" : "text-ink-3 hover:bg-canvas-2 hover:text-ink"
                      )}
                    >
                      {t(tb.label)}
                      {tb.count !== undefined && (
                        <span className={cn("num text-[11px]", tab === tb.key ? "text-white/50" : "text-ink-4")}>{n(tb.count)}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-7">
                  {tab === "tasks" && one && <TaskAndTrial one={one} />}
                  {tab === "risks" && <Risks result={result} />}
                  {tab === "matches" && <Matches result={result} />}
                  {tab === "rubric" && <Rubric sectorId={result.sectorId} />}
                </div>

                {/* gate */}
                <div className="flex flex-wrap items-center gap-4 border-t border-line bg-canvas-2/60 px-7 py-5">
                  <div className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-ink-2">
                      <T
                        v={{
                          en: "Held for human review. In Phase 2 a coordinator approves, re-splits, re-prices or rejects this before any student or client sees it — and their edits are the training signal that improves the next scope.",
                          bn: "মানুষের রিভিউয়ের জন্য অপেক্ষমাণ। ফেজ ২-তে কোনো শিক্ষার্থী বা ক্লায়েন্ট দেখার আগে একজন কোঅর্ডিনেটর এটি অনুমোদন, পুনর্বিন্যাস, পুনর্মূল্যায়ন বা বাতিল করেন — আর তাদের সম্পাদনাই পরবর্তী স্কোপ উন্নত করার প্রশিক্ষণ সংকেত।",
                        }}
                      />
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button href="/app/client" size="sm" variant="secondary" icon={<ArrowRight className="size-3.5" />}>
                      <T v={{ en: "Open in the client workspace", bn: "ক্লায়েন্ট ওয়ার্কস্পেসে খুলুন" }} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Result panels ────────────────────────────────────────────── */

function TaskAndTrial({ one }: { one: SingleScope }) {
  const { t, tl } = useLang();
  const n = useNum();

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[14px] border border-line bg-white" style={{ animation: "wb-rise .6s cubic-bezier(.16,1,.3,1) both" }}>
        <div className="flex flex-wrap items-start gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "One task, one price", bn: "একটি কাজ, একটি দাম" }} />
            </div>
            <h4 className="mt-2 text-[15.5px] font-medium leading-snug text-ink">{t(one.task.title)}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{t(one.task.desc)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {one.task.skills.map((sk: string) => (
                <span key={sk} className="rounded-md bg-canvas-2 px-2 py-0.5 text-[10.5px] text-ink-3 ring-1 ring-line">
                  {sk}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[24px] font-semibold tracking-[-0.035em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
              ৳{n(one.task.fee.toLocaleString("en-US"))}
            </div>
            <div className="num mt-1 text-[12px] text-ink-4">
              {n(one.task.hours)}h · ৳{n(one.price.rate)}/h
            </div>
            <div className="mt-1 text-[11px] capitalize text-ink-4">{one.task.level}</div>
          </div>
        </div>

        <div className="border-t border-line bg-canvas-2/40 p-5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
            <CheckCircle2 className="size-3 text-brand-500" />
            <T v={{ en: "What counts as done", bn: "কী হলে সম্পন্ন ধরা হবে" }} />
          </div>
          <ul className="mt-2.5 space-y-2">
            {tl(one.task.acceptance).map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[14px] border border-brand-100 bg-brand-50/40 p-5"
        style={{ animation: "wb-rise .6s cubic-bezier(.16,1,.3,1) 90ms both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
            <Cpu className="size-3" />
            <T v={{ en: "The trial applicants will do", bn: "আবেদনকারীরা যে ট্রায়ালটি করবেন" }} />
          </div>
          <span className="num rounded-full bg-white px-2.5 py-1 text-[11.5px] text-ink-3 ring-1 ring-brand-100">
            {n(one.trial.minutes)} <T v={{ en: "min", bn: "মিনিট" }} />
          </span>
        </div>
        <p className="mt-3 text-[13.5px] font-medium leading-snug text-ink">{t(one.trial.title)}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{t(one.trial.brief)}</p>
        <p className="mt-3 text-[12px] leading-relaxed text-brand-900/80">{t(one.trial.mirrors)}</p>
      </div>
    </div>
  );
}

function Risks({ result }: { result: ScopeResult }) {
  const { t } = useLang();
  return (
    <div className="space-y-2.5">
      <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
        <T
          v={{
            en: "What the engine cannot know from the brief alone. Surfacing these is the point — a scope that hides its unknowns is how a project ends up 40% over budget in week three.",
            bn: "কেবল ব্রিফ থেকে ইঞ্জিন যা জানতে পারে না। এগুলো সামনে আনাই উদ্দেশ্য — যে স্কোপ নিজের অজানা লুকায়, তৃতীয় সপ্তাহে প্রজেক্ট বাজেটের ৪০% ছাড়িয়ে যায় সেভাবেই।",
          }}
        />
      </p>
      {result.risks.map((r, i) => (
        <div
          key={r.en}
          className="flex items-start gap-3 rounded-[14px] border border-line bg-canvas-2/40 p-4"
          style={{ animation: `wb-rise .6s cubic-bezier(.16,1,.3,1) ${i * 70}ms both` }}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-[13.5px] leading-relaxed text-ink-2">{t(r)}</p>
        </div>
      ))}
    </div>
  );
}

function Matches({ result }: { result: ScopeResult }) {
  const { t } = useLang();
  const n = useNum();
  return (
    <div className="space-y-2.5">
      <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
        <T
          v={{
            en: "Ranked with the reasoning shown, never as a black-box score. A cold-start slot is always reserved so a student with no history can still reach a first task.",
            bn: "ব্ল্যাক-বক্স স্কোর নয়, যুক্তিসহ ক্রম। একটি কোল্ড-স্টার্ট স্লট সবসময় সংরক্ষিত, যাতে ইতিহাসহীন শিক্ষার্থীও প্রথম টাস্কে পৌঁছাতে পারেন।",
          }}
        />
      </p>
      {result.matches.map((m, i) => (
        <div
          key={m.student.id}
          className={cn(
            "flex flex-wrap items-start gap-4 rounded-[14px] border p-4",
            m.coldStart ? "border-dashed border-brand-200 bg-brand-50/30" : "border-line bg-white"
          )}
          style={{ animation: `wb-rise .6s cubic-bezier(.16,1,.3,1) ${i * 70}ms both` }}
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
            style={{ background: ["#0f7f52", "#0b6242", "#1a9b66", "#094e36", "#48b583"][i % 5] }}
          >
            {m.student.name.en
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-medium text-ink">{t(m.student.name)}</span>
              {m.coldStart && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700">
                  <T v={{ en: "Cold-start slot", bn: "কোল্ড-স্টার্ট স্লট" }} />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-ink-4">
              {t(m.student.discipline)} · {t(m.student.university)}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {m.reasons.map((r) => (
                <li key={r.en} className="flex items-center gap-1.5 text-[12px] text-ink-2">
                  <span className="size-1 rounded-full bg-brand-400" />
                  {t(r)}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-[120px] shrink-0">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-ink-4">
                <T v={{ en: "Match", bn: "ম্যাচ" }} />
              </span>
              <span className="num text-[14px] font-semibold text-ink">{n(m.score)}</span>
            </div>
            <Bar value={m.score} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Rubric({ sectorId }: { sectorId: string }) {
  const { t, tl } = useLang();
  const n = useNum();
  const sector = sectorById(sectorId);
  return (
    <div>
      <p className="mb-5 text-[13px] leading-relaxed text-ink-3">
        <T
          v={{
            en: "Every delivered task is scored against this sector's rubric by a coordinator, then signed off by the paying client. Both, or the work never enters the graduate's verified record.",
            bn: "ডেলিভার করা প্রতিটি টাস্ক এই সেক্টরের রুব্রিকে মেন্টর মূল্যায়ন করেন, তারপর টাকা দেওয়া ক্লায়েন্ট সাইন-অফ করেন। দুটোই, নাহলে কাজটি কখনো গ্র্যাজুয়েটের ভেরিফায়েড রেকর্ডে ঢোকে না।",
          }}
        />
      </p>
      <div className="overflow-hidden rounded-[14px] border border-line">
        {tl(sector.rubric).map((r, i) => (
          <div key={r} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <span className="num text-[11px] font-semibold text-brand-400">{n(i + 1)}</span>
              <span className="text-[13.5px] text-ink">{r}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <span key={d} className="size-2 rounded-full bg-canvas-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-ink-4">
        <T v={{ en: "Scored 1–5 on each dimension. 25 available.", bn: "প্রতিটি ডাইমেনশনে ১–৫ স্কোর। মোট ২৫।" }} />
      </p>
    </div>
  );
}
