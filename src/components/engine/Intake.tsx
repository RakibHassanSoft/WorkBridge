"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Cpu,
  MessageCircleQuestion,
  RotateCcw,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Bar, Button, Reveal, SectionHead } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { priceCheck, scope, type ScopeResult } from "@/lib/engine";
import { sectorById } from "@/data/sectors";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/* ────────────────────────────────────────────────────────────────
   For the client who cannot write a brief.

   Most SME owners can describe what is annoying them but not what
   they want built. Five questions turn the first into the second,
   and the answer goes to a coordinator for a fair-price check before
   it reaches anyone.
   ──────────────────────────────────────────────────────────────── */

type Choice = { id: string; label: L; hint?: L; sector?: string };

type Step = {
  key: string;
  question: L;
  help: L;
  choices: Choice[];
  allowNote?: boolean;
};

const AREAS: Choice[] = [
  { id: "selling", label: { en: "Selling online isn't working", bn: "অনলাইনে বিক্রি হচ্ছে না" }, hint: { en: "Website, orders, checkout", bn: "ওয়েবসাইট, অর্ডার, চেকআউট" }, sector: "it" },
  { id: "money", label: { en: "My records are a mess", bn: "আমার হিসাব এলোমেলো" }, hint: { en: "Books, VAT, costing", bn: "খাতা, ভ্যাট, কস্টিং" }, sector: "biz" },
  { id: "seen", label: { en: "Nobody knows we exist", bn: "কেউ আমাদের চেনে না" }, hint: { en: "Social, campaigns, customers", bn: "সোশ্যাল, ক্যাম্পেইন, কাস্টমার" }, sector: "mkt" },
  { id: "look", label: { en: "We look worse than we are", bn: "আমরা যা, দেখতে তার চেয়ে খারাপ" }, hint: { en: "Design, packaging, photos", bn: "ডিজাইন, প্যাকেজিং, ছবি" }, sector: "design" },
  { id: "paper", label: { en: "Everything is on paper", bn: "সবকিছু কাগজে" }, hint: { en: "Registers, entry, lists", bn: "রেজিস্টার, এন্ট্রি, তালিকা" }, sector: "admin" },
  { id: "words", label: { en: "I need things written", bn: "কিছু লেখা দরকার" }, hint: { en: "Copy, translation, reports", bn: "কপি, অনুবাদ, রিপোর্ট" }, sector: "content" },
];

const SYMPTOMS: Record<string, Choice[]> = {
  selling: [
    { id: "s1", label: { en: "Customers leave before paying", bn: "কাস্টমার টাকা দেওয়ার আগে চলে যায়" } },
    { id: "s2", label: { en: "I can't see what actually sells", bn: "কী আসলে বিক্রি হয় দেখতে পাই না" } },
    { id: "s3", label: { en: "It breaks on phones", bn: "ফোনে ভেঙে যায়" } },
    { id: "s4", label: { en: "Orders arrive but I lose track of them", bn: "অর্ডার আসে কিন্তু হিসাব রাখতে পারি না" } },
  ],
  money: [
    { id: "s1", label: { en: "The books don't match the bank", bn: "খাতা ব্যাংকের সাথে মেলে না" } },
    { id: "s2", label: { en: "A filing deadline is coming", bn: "ফাইলিংয়ের সময় এসে যাচ্ছে" } },
    { id: "s3", label: { en: "I don't know if a product makes money", bn: "কোনো প্রোডাক্টে লাভ হয় কিনা জানি না" } },
    { id: "s4", label: { en: "Nobody has kept records for months", bn: "মাসের পর মাস কেউ হিসাব রাখেনি" } },
  ],
  seen: [
    { id: "s1", label: { en: "An agency charges too much for too little", bn: "এজেন্সি অল্প কাজে বেশি নেয়" } },
    { id: "s2", label: { en: "We post but nothing happens", bn: "পোস্ট করি কিন্তু কিছুই হয় না" } },
    { id: "s3", label: { en: "I can't tell if it brings orders", bn: "এতে অর্ডার আসে কিনা বলতে পারি না" } },
    { id: "s4", label: { en: "We have no idea what to say", bn: "কী বলব তার কোনো ধারণা নেই" } },
  ],
  look: [
    { id: "s1", label: { en: "Our packaging is years out of date", bn: "আমাদের প্যাকেজিং বছর পুরনো" } },
    { id: "s2", label: { en: "Our photos look inconsistent", bn: "আমাদের ছবিগুলো একরকম নয়" } },
    { id: "s3", label: { en: "Everyone designs their own thing", bn: "সবাই নিজের মতো ডিজাইন করে" } },
    { id: "s4", label: { en: "The print shop keeps rejecting our files", bn: "প্রেস বারবার আমাদের ফাইল ফেরত দেয়" } },
  ],
  paper: [
    { id: "s1", label: { en: "Registers nobody can search", bn: "রেজিস্টার, কেউ খুঁজে দেখতে পারে না" } },
    { id: "s2", label: { en: "The same customer is in the list five times", bn: "একই কাস্টমার তালিকায় পাঁচবার" } },
    { id: "s3", label: { en: "Counts never match the system", bn: "গণনা সিস্টেমের সাথে কখনো মেলে না" } },
    { id: "s4", label: { en: "Boxes of slips and invoices", bn: "স্লিপ ও ইনভয়েসের বাক্স" } },
  ],
  words: [
    { id: "s1", label: { en: "Our English means nothing locally", bn: "আমাদের ইংরেজি স্থানীয়ভাবে কিছুই বোঝায় না" } },
    { id: "s2", label: { en: "Descriptions are one line copied from the tag", bn: "ডেসক্রিপশন ট্যাগ থেকে কপি করা এক লাইন" } },
    { id: "s3", label: { en: "Customers ask the same questions daily", bn: "কাস্টমাররা প্রতিদিন একই প্রশ্ন করেন" } },
    { id: "s4", label: { en: "A report needs to be readable", bn: "একটি রিপোর্ট পড়ার মতো করতে হবে" } },
  ],
};

const SCALE: Choice[] = [
  { id: "tiny", label: { en: "Just one thing", bn: "শুধু একটা জিনিস" }, hint: { en: "A single fix or file", bn: "একটি ফিক্স বা ফাইল" } },
  { id: "small", label: { en: "Under 50 items", bn: "৫০টির কম আইটেম" }, hint: { en: "Products, pages, records", bn: "প্রোডাক্ট, পেজ, রেকর্ড" } },
  { id: "mid", label: { en: "A few hundred", bn: "কয়েকশ" }, hint: { en: "Roughly 200 to 600", bn: "প্রায় ২০০ থেকে ৬০০" } },
  { id: "big", label: { en: "Thousands", bn: "কয়েক হাজার" }, hint: { en: "Over 1,000 records", bn: "১,০০০-এর বেশি রেকর্ড" } },
];

const OUTCOME: Record<string, Choice[]> = {
  selling: [
    { id: "o1", label: { en: "Orders go through without failing", bn: "অর্ডার ব্যর্থ না হয়ে সম্পন্ন হয়" } },
    { id: "o2", label: { en: "I can see the numbers on my phone", bn: "ফোনেই সংখ্যাগুলো দেখতে পাই" } },
  ],
  money: [
    { id: "o1", label: { en: "The books reconcile and I can prove it", bn: "খাতা মেলে আর আমি তা দেখাতে পারি" } },
    { id: "o2", label: { en: "I can file on time without panic", bn: "আতঙ্ক ছাড়াই সময়মতো ফাইল করতে পারি" } },
  ],
  seen: [
    { id: "o1", label: { en: "My own staff can run it next month", bn: "আগামী মাসে আমার কর্মীরাই চালাতে পারবেন" } },
    { id: "o2", label: { en: "I can tell which post brought an order", bn: "কোন পোস্ট অর্ডার এনেছে বলতে পারব" } },
  ],
  look: [
    { id: "o1", label: { en: "The print shop accepts it first time", bn: "প্রেস প্রথমবারেই গ্রহণ করে" } },
    { id: "o2", label: { en: "Everything looks like one business", bn: "সবকিছু একই ব্যবসার মতো দেখায়" } },
  ],
  paper: [
    { id: "o1", label: { en: "I can search it in seconds", bn: "সেকেন্ডে খুঁজে পাই" } },
    { id: "o2", label: { en: "My staff can keep it up themselves", bn: "আমার কর্মীরাই এটা চালিয়ে নিতে পারেন" } },
  ],
  words: [
    { id: "o1", label: { en: "A local reader follows it without help", bn: "স্থানীয় পাঠক সাহায্য ছাড়াই বোঝেন" } },
    { id: "o2", label: { en: "The inbox questions stop", bn: "ইনবক্সের প্রশ্ন থেমে যায়" } },
  ],
};

const URGENCY: Choice[] = [
  { id: "relaxed", label: { en: "No rush", bn: "তাড়া নেই" }, hint: { en: "Two to three weeks", bn: "দুই-তিন সপ্তাহ" } },
  { id: "normal", label: { en: "Within two weeks", bn: "দুই সপ্তাহের মধ্যে" } },
  { id: "urgent", label: { en: "It's urgent", bn: "জরুরি" }, hint: { en: "Under a week", bn: "এক সপ্তাহের কম" } },
];

const BUDGET: Choice[] = [
  { id: "b1", label: { en: "Under ৳3,000", bn: "৳৩,০০০-এর কম" } },
  { id: "b2", label: { en: "৳3,000 – ৳8,000", bn: "৳৩,০০০ – ৳৮,০০০" } },
  { id: "b3", label: { en: "৳8,000 – ৳20,000", bn: "৳৮,০০০ – ৳২০,০০০" } },
  { id: "b4", label: { en: "I have no idea", bn: "আমার কোনো ধারণা নেই" } },
];

const BUDGET_VALUE: Record<string, number> = { b1: 2500, b2: 5500, b3: 14000, b4: 0 };

export default function Intake() {
  const { t, lang } = useLang();
  const n = useNum();

  const [step, setStep] = useState(0);
  const [area, setArea] = useState<string | null>(null);
  const [symptom, setSymptom] = useState<string | null>(null);
  const [scale, setScale] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const steps: Step[] = useMemo(() => {
    const a = area ?? "selling";
    return [
      {
        key: "area",
        question: { en: "What is the annoying part of your week?", bn: "আপনার সপ্তাহের বিরক্তিকর অংশটা কী?" },
        help: {
          en: "Not what you want built — what keeps going wrong. Pick the closest one.",
          bn: "কী বানাতে চান তা নয় — কী বারবার ভুল হচ্ছে। কাছাকাছিটা বেছে নিন।",
        },
        choices: AREAS,
      },
      {
        key: "symptom",
        question: { en: "Which of these is closest to what happens?", bn: "এর মধ্যে কোনটি আপনার অবস্থার সবচেয়ে কাছাকাছি?" },
        help: { en: "If none of them fit exactly, pick the nearest and add a line below.", bn: "হুবহু না মিললে কাছাকাছিটা বেছে নিচে এক লাইন যোগ করুন।" },
        choices: SYMPTOMS[a],
        allowNote: true,
      },
      {
        key: "scale",
        question: { en: "How much of it is there?", bn: "এর পরিমাণ কতটা?" },
        help: { en: "A rough count is fine. This is what decides the hours, and the hours decide the price.", bn: "মোটামুটি সংখ্যাই যথেষ্ট। এটাই ঘণ্টা ঠিক করে, আর ঘণ্টাই দাম ঠিক করে।" },
        choices: SCALE,
      },
      {
        key: "outcome",
        question: { en: "What would make you say this worked?", bn: "কী হলে আপনি বলবেন কাজটা হয়েছে?" },
        help: { en: "This becomes the acceptance criteria — what the mentor scores the work against.", bn: "এটাই গ্রহণযোগ্যতার শর্ত হয় — মেন্টর এর বিপরীতেই কাজ মূল্যায়ন করেন।" },
        choices: OUTCOME[a],
      },
      {
        key: "urgency",
        question: { en: "When do you need it?", bn: "কখন দরকার?" },
        help: { en: "Urgent work carries a premium, because it costs someone their weekend.", bn: "জরুরি কাজে বাড়তি ফি লাগে, কারণ এতে কারও ছুটির দিন যায়।" },
        choices: URGENCY,
      },
      {
        key: "budget",
        question: { en: "What did you have in mind to spend?", bn: "খরচের কথা মাথায় কী ছিল?" },
        help: {
          en: "Answer honestly, including \"no idea\". A coordinator checks the price either way, and a number too low is rejected rather than quietly accepted.",
          bn: "সৎভাবে উত্তর দিন, \"ধারণা নেই\" সহ। যাই হোক কোঅর্ডিনেটর দাম যাচাই করেন, আর খুব কম সংখ্যা নীরবে গ্রহণ না করে বাতিল করা হয়।",
        },
        choices: BUDGET,
      },
    ];
  }, [area]);

  const answers = [area, symptom, scale, outcome, urgency, budget];
  const setters = [setArea, setSymptom, setScale, setOutcome, setUrgency, setBudget];
  const done = step >= steps.length;

  const brief = useMemo(() => {
    if (!area) return "";
    const pick = (list: Choice[], id: string | null) => list.find((c) => c.id === id)?.label[lang] ?? "";
    const scaleWord: Record<string, string> = { tiny: "1", small: "40", mid: "400", big: "3000" };
    const urgentWord = urgency === "urgent" ? (lang === "bn" ? " এটা জরুরি।" : " This is urgent.") : "";
    const areaLabel = pick(AREAS, area);
    const symptomLabel = pick(SYMPTOMS[area], symptom);
    const outcomeLabel = pick(OUTCOME[area], outcome);
    const count = scaleWord[scale ?? "small"];

    if (lang === "bn") {
      return `${areaLabel}। ${symptomLabel}। প্রায় ${count} টি আইটেম নিয়ে কাজ। আমি চাই ${outcomeLabel}।${urgentWord} ${note}`.trim();
    }
    return `${areaLabel}. ${symptomLabel}. There are around ${count} items involved. What I want is: ${outcomeLabel}.${urgentWord} ${note}`.trim();
  }, [area, symptom, scale, outcome, urgency, note, lang]);

  const result: ScopeResult | null = useMemo(() => (done && brief ? scope(brief, { sectorId: AREAS.find((a) => a.id === area)?.sector }) : null), [done, brief, area]);

  const clientBudget = BUDGET_VALUE[budget ?? "b4"] ?? 0;
  const verdict = result ? priceCheck(clientBudget > 0 ? clientBudget : result.totalFee, result.totalHours, result.sectorId) : null;

  const reset = () => {
    setStep(0);
    setArea(null);
    setSymptom(null);
    setScale(null);
    setOutcome(null);
    setUrgency(null);
    setBudget(null);
    setNote("");
  };

  const current = steps[Math.min(step, steps.length - 1)];

  return (
    <section id="intake" className="scroll-mt-20 border-y border-line bg-canvas-2/60 py-20 md:py-24">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "For clients who can't write a brief", bn: "যে ক্লায়েন্ট ব্রিফ লিখতে পারেন না" }}
            title={{ en: "Most owners can say what is annoying them. Very few can write a scope.", bn: "বেশিরভাগ মালিক বলতে পারেন কী তাদের বিরক্ত করছে। খুব কম জনই স্কোপ লিখতে পারেন।" }}
            desc={{
              en: "Six questions, no technical words, and the AI writes the brief for them. Then a coordinator checks the price — because a heavy task posted at a light price is how a platform quietly exploits the people it claims to serve.",
              bn: "ছয়টি প্রশ্ন, কোনো কারিগরি শব্দ নয়, আর এআই তাদের হয়ে ব্রিফ লেখে। তারপর কোঅর্ডিনেটর দাম যাচাই করেন — কারণ ভারী কাজ কম দামে পোস্ট হলেই প্ল্যাটফর্ম নীরবে তাদেরই শোষণ করে, যাদের সেবা করার কথা বলে।",
            }}
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div className="overflow-hidden rounded-[20px] border border-line bg-white">
            {/* progress */}
            <div className="flex items-center gap-3 border-b border-line bg-canvas-2/60 px-6 py-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-white">
                <MessageCircleQuestion className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="font-medium text-ink">
                    {done ? <T v={{ en: "Draft ready", bn: "খসড়া প্রস্তুত" }} /> : <T v={{ en: "Guided intake", bn: "প্রশ্নভিত্তিক ইনটেক" }} />}
                  </span>
                  <span className="num text-ink-4">
                    {n(Math.min(step + (done ? 0 : 1), steps.length))} / {n(steps.length)}
                  </span>
                </div>
                <div className="mt-2">
                  <Bar value={(Math.min(step, steps.length) / steps.length) * 100} />
                </div>
              </div>
              {step > 0 && (
                <button onClick={reset} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-ink-3 transition-colors hover:text-ink">
                  <RotateCcw className="size-3" />
                  <T v={{ en: "Start over", bn: "আবার শুরু" }} />
                </button>
              )}
            </div>

            {!done ? (
              <div key={current.key} className="anim-fade p-6 sm:p-8">
                <h3 className="text-[20px] font-semibold leading-snug tracking-[-0.025em] text-ink">{t(current.question)}</h3>
                <p className="mt-2 max-w-[60ch] text-[13.5px] leading-relaxed text-ink-3">{t(current.help)}</p>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {current.choices.map((c) => {
                    const on = answers[step] === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setters[step](c.id);
                          setTimeout(() => setStep((s) => s + 1), 180);
                        }}
                        className={cn(
                          "rounded-[14px] border p-4 text-left transition-all duration-300",
                          on ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:-translate-y-0.5 hover:border-brand-200"
                        )}
                      >
                        <span className={cn("block text-[14px] font-medium leading-snug", on ? "text-brand-800" : "text-ink")}>{t(c.label)}</span>
                        {c.hint && <span className="mt-1 block text-[12px] text-ink-4">{t(c.hint)}</span>}
                      </button>
                    );
                  })}
                </div>

                {current.allowNote && (
                  <div className="mt-5">
                    <label htmlFor="intake-note" className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <T v={{ en: "Anything else, in your own words", bn: "আর কিছু, আপনার নিজের ভাষায়" }} />
                    </label>
                    <textarea
                      id="intake-note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t({ en: "Optional — one line is plenty", bn: "ঐচ্ছিক — এক লাইনই যথেষ্ট" })}
                      className="mt-2 w-full resize-none rounded-[12px] border border-line bg-canvas-2/50 p-3.5 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
                    />
                  </div>
                )}

                {step > 0 && (
                  <button onClick={() => setStep((s) => s - 1)} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink">
                    <ArrowLeft className="size-3.5" />
                    <T v={{ en: "Back", bn: "পেছনে" }} />
                  </button>
                )}
              </div>
            ) : (
              result && verdict && <IntakeResult brief={brief} result={result} verdict={verdict} clientBudget={clientBudget} onReset={reset} />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function IntakeResult({
  brief,
  result,
  verdict,
  clientBudget,
  onReset,
}: {
  brief: string;
  result: ScopeResult;
  verdict: ReturnType<typeof priceCheck>;
  clientBudget: number;
  onReset: () => void;
}) {
  const { t, tl } = useLang();
  const n = useNum();
  const sector = sectorById(result.sectorId);

  return (
    <div className="anim-fade">
      {/* the brief the AI wrote for them */}
      <div className="border-b border-line p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
          <Cpu className="size-3.5 text-brand-500" />
          <T v={{ en: "The brief the AI wrote from your answers", bn: "আপনার উত্তর থেকে এআই যে ব্রিফ লিখেছে" }} />
        </div>
        <blockquote className="mt-3 rounded-[14px] border border-line bg-canvas-2/50 p-5 text-[14.5px] leading-relaxed text-ink-2">{brief}</blockquote>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-4">
          <T
            v={{
              en: "You can edit this before it goes anywhere. Nothing is posted until you approve the wording and a coordinator approves the price.",
              bn: "কোথাও যাওয়ার আগে আপনি এটি সম্পাদনা করতে পারেন। আপনি শব্দ অনুমোদন না করা এবং কোঅর্ডিনেটর দাম অনুমোদন না করা পর্যন্ত কিছুই পোস্ট হয় না।",
            }}
          />
        </p>
      </div>

      {/* scope */}
      <div className="border-b border-line p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: sector.accent }}>
              <SectorIcon name={sector.icon} className="size-[18px]" />
            </span>
            <div>
              <div className="text-[14.5px] font-semibold text-ink">{t(sector.name)}</div>
              <div className="num text-[12px] text-ink-4">
                {n(result.tasks.length)} <T v={{ en: "tasks", bn: "টাস্ক" }} /> · {n(result.totalHours)}h · {result.complexity}
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-ink-4">
                <Wallet className="size-3" />
                <T v={{ en: "AI price", bn: "এআই দাম" }} />
              </div>
              <div className="num mt-0.5 text-[19px] font-semibold text-ink">৳{n(result.totalFee.toLocaleString("en-US"))}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-ink-4">
                <Timer className="size-3" />
                <T v={{ en: "You said", bn: "আপনি বলেছেন" }} />
              </div>
              <div className="num mt-0.5 text-[19px] font-semibold text-ink-3">
                {clientBudget > 0 ? `৳${n(clientBudget.toLocaleString("en-US"))}` : t({ en: "no idea", bn: "ধারণা নেই" })}
              </div>
            </div>
          </div>
        </div>

        <ol className="mt-6 space-y-2">
          {result.tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3.5 rounded-[14px] border border-line p-4">
              <span className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                {n(task.seq)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</span>
                <span className="num mt-1 block text-[11.5px] text-ink-4">
                  ৳{n(task.fee.toLocaleString("en-US"))} · {n(task.hours)}h · {task.level}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
            <T v={{ en: "What counts as done", bn: "কী হলে সম্পন্ন ধরা হবে" }} />
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {tl(result.tasks[0].acceptance).map((a) => (
              <li key={a} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* moderator price check */}
      <div className={cn("p-6 sm:p-8", verdict.level === "blocked" ? "bg-warn-bg/40" : verdict.level === "low" ? "bg-canvas-2/60" : "bg-brand-50/50")}>
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
          <ShieldCheck className="size-3.5" />
          <T v={{ en: "Coordinator fair-price check", bn: "কোঅর্ডিনেটরের ন্যায্য-দাম যাচাই" }} />
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-4">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-[11px] ring-1",
              verdict.level === "ok" ? "bg-brand-600 text-white ring-brand-600" : "bg-warn-bg text-warn ring-warn/20"
            )}
          >
            {verdict.level === "ok" ? <BadgeCheck className="size-[18px]" /> : <TriangleAlert className="size-[18px]" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium leading-snug text-ink">
              {verdict.level === "ok" ? (
                <T v={{ en: "Cleared — the price matches the work", bn: "অনুমোদিত — দাম কাজের সাথে মেলে" }} />
              ) : verdict.level === "low" ? (
                <T v={{ en: "Under the floor — releasable, but it will sit unmatched", bn: "সীমার নিচে — ছাড়া যাবে, তবে ম্যাচ ছাড়াই পড়ে থাকবে" }} />
              ) : (
                <T v={{ en: "Blocked — heavy work cannot be posted at a light price", bn: "আটকানো হয়েছে — ভারী কাজ কম দামে পোস্ট করা যাবে না" }} />
              )}
            </p>
            <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-ink-2">{t(verdict.message)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-[14px] bg-line ring-1 ring-line sm:grid-cols-3">
          <div className="bg-white p-4">
            <div className="text-[10.5px] text-ink-4">
              <T v={{ en: "Effective rate", bn: "কার্যকর হার" }} />
            </div>
            <div className="num mt-1 text-[18px] font-semibold text-ink">৳{n(verdict.rate.toLocaleString("en-US"))}/h</div>
          </div>
          <div className="bg-white p-4">
            <div className="text-[10.5px] text-ink-4">
              <T v={{ en: "Sector floor", bn: "সেক্টর সীমা" }} />
            </div>
            <div className="num mt-1 text-[18px] font-semibold text-ink">৳{n(verdict.floor.toLocaleString("en-US"))}/h</div>
          </div>
          <div className="bg-white p-4">
            <div className="text-[10.5px] text-ink-4">
              <T v={{ en: "Shortfall", bn: "ঘাটতি" }} />
            </div>
            <div className={cn("num mt-1 text-[18px] font-semibold", verdict.shortfall > 0 ? "text-warn" : "text-brand-600")}>
              {verdict.shortfall > 0 ? `৳${n(verdict.shortfall.toLocaleString("en-US"))}` : "—"}
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-[74ch] text-[12px] leading-relaxed text-ink-4">
          <T
            v={{
              en: "The floor is set from what completed work in this sector has actually paid, not from what anyone would like to pay. It exists so a student with no history is never the one who absorbs an underpriced brief.",
              bn: "এই সীমা নির্ধারিত হয়েছে এই সেক্টরে সম্পন্ন কাজে বাস্তবে যা দেওয়া হয়েছে তা থেকে — কেউ কত দিতে চায় তা থেকে নয়। এটি আছে যাতে কম দামে পোস্ট হওয়া ব্রিফের ভার কখনোই ইতিহাসহীন কোনো শিক্ষার্থীর ঘাড়ে না পড়ে।",
            }}
          />
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button size="md" disabled={verdict.level === "blocked"} icon={<ArrowRight className="size-4" />}>
            {verdict.level === "blocked" ? (
              <T v={{ en: "Raise the budget to continue", bn: "চালিয়ে যেতে বাজেট বাড়ান" }} />
            ) : (
              <T v={{ en: "Send to a coordinator", bn: "কোঅর্ডিনেটরের কাছে পাঠান" }} />
            )}
          </Button>
          <Button size="md" variant="secondary" onClick={onReset} icon={<RotateCcw className="size-4" />}>
            <T v={{ en: "Answer again", bn: "আবার উত্তর দিন" }} />
          </Button>
        </div>
      </div>
    </div>
  );
}
