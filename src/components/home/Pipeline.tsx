"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Cpu, FileText, Handshake, UserRoundSearch, UserCheck } from "lucide-react";
import { Reveal } from "@/components/ui";
import { T, useLang, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Step = {
  icon: typeof FileText;
  kicker: L;
  title: L;
  desc: L;
  bullets: { en: string[]; bn: string[] };
  ai: boolean;
};

const STEPS: Step[] = [
  {
    icon: FileText,
    kicker: { en: "Client", bn: "ক্লায়েন্ট" },
    title: { en: "A business describes the problem — in its own words", bn: "একটি ব্যবসা নিজের ভাষায় সমস্যাটা বলে" },
    desc: {
      en: "No job spec, no technical vocabulary, no scoping skill required. A shop owner types what is going wrong, in Bangla or English, and attaches whatever they have.",
      bn: "কোনো জব স্পেক নয়, কোনো কারিগরি শব্দ নয়, স্কোপ করার দক্ষতাও লাগে না। একজন দোকানমালিক বাংলা বা ইংরেজিতে লেখেন কী সমস্যা হচ্ছে, আর যা আছে তা সংযুক্ত করেন।",
    },
    bullets: {
      en: ["Plain-language brief, Bangla or English", "Optional budget — AI suggests one if blank", "Takes about four minutes"],
      bn: ["সহজ ভাষায় ব্রিফ, বাংলা বা ইংরেজি", "বাজেট ঐচ্ছিক — ফাঁকা থাকলে এআই প্রস্তাব দেয়", "প্রায় চার মিনিট সময় লাগে"],
    },
    ai: false,
  },
  {
    icon: Cpu,
    kicker: { en: "AI layer", bn: "এআই লেয়ার" },
    title: { en: "AI turns it into one priced task with a written test", bn: "এআই সেটাকে একটি নির্ধারিত দামের কাজ ও একটি লিখিত পরীক্ষায় রূপ দেয়" },
    desc: {
      en: "The model reads the brief, splits genuinely separate problems apart, prices each piece against completed-work history, orders them by dependency, and writes acceptance criteria a student can be judged against.",
      bn: "মডেল ব্রিফ পড়ে, সত্যিকারের আলাদা সমস্যাগুলো পৃথক করে, সম্পন্ন কাজের ইতিহাসের সাথে মিলিয়ে প্রতিটি অংশের দাম ঠিক করে, নির্ভরতা অনুযায়ী ক্রম সাজায়, আর এমন গ্রহণযোগ্যতার শর্ত লেখে যার ভিত্তিতে শিক্ষার্থীকে মূল্যায়ন করা যায়।",
    },
    bullets: {
      en: ["One task, one fee, one estimate — never a project plan", "A short trial that mirrors the real work", "Risks and unknowns surfaced, not hidden"],
      bn: ["নির্ভরতা অনুযায়ী সাজানো টাস্ক গ্রাফ", "প্রতি টাস্কে ফি, সময় ও কঠিনতা", "ঝুঁকি ও অজানা বিষয় লুকানো নয়, সামনে আনা"],
    },
    ai: true,
  },
  {
    icon: UserCheck,
    kicker: { en: "Human gate", bn: "মানবিক গেট" },
    title: { en: "A coordinator approves or edits before anyone sees it", bn: "কেউ দেখার আগেই একজন কোঅর্ডিনেটর অনুমোদন বা সম্পাদনা করেন" },
    desc: {
      en: "This gate is not optional and never will be. Until enough real completed projects exist as calibration data, AI output is a draft — a human decides what reaches a student and a client.",
      bn: "এই গেটটি ঐচ্ছিক নয় এবং কখনো হবে না। ক্যালিব্রেশন ডেটা হিসেবে যথেষ্ট বাস্তব সম্পন্ন প্রজেক্ট না হওয়া পর্যন্ত এআই-এর আউটপুট একটি খসড়া — কোনটা শিক্ষার্থী ও ক্লায়েন্টের কাছে যাবে, তা মানুষই ঠিক করে।",
    },
    bullets: {
      en: ["Every AI scope reviewed before release", "Coordinator can re-split, re-price or reject", "Edits feed back as training signal"],
      bn: ["প্রকাশের আগে প্রতিটি এআই স্কোপ রিভিউ হয়", "কোঅর্ডিনেটর পুনরায় ভাগ, দাম বা বাতিল করতে পারেন", "সম্পাদনা প্রশিক্ষণ সংকেত হিসেবে ফিরে আসে"],
    },
    ai: false,
  },
  {
    icon: UserRoundSearch,
    kicker: { en: "Matching", bn: "ম্যাচিং" },
    title: { en: "Each task finds the students who can actually do it", bn: "প্রতিটি টাস্ক এমন শিক্ষার্থীদের খুঁজে নেয় যারা সত্যিই সেটা পারেন" },
    desc: {
      en: "Matching runs on discipline, demonstrated skill, prior rubric scores, on-time record and availability — weighted so a first task is always reachable for someone with no history at all.",
      bn: "ম্যাচিং চলে ডিসিপ্লিন, প্রদর্শিত দক্ষতা, আগের রুব্রিক স্কোর, সময়মতো ডেলিভারির রেকর্ড ও প্রাপ্যতার ভিত্তিতে — এমনভাবে ওজন করা যে কোনো ইতিহাস নেই এমন কারও জন্যও প্রথম টাস্ক সবসময় নাগালের মধ্যে থাকে।",
    },
    bullets: {
      en: ["Discipline-aware across all nine sectors", "Cold-start slots reserved on micro-tasks", "Shortlist explained, not a black box"],
      bn: ["নয়টি সেক্টর জুড়ে ডিসিপ্লিন-সচেতন", "মাইক্রো-টাস্কে কোল্ড-স্টার্ট স্লট সংরক্ষিত", "শর্টলিস্টের ব্যাখ্যা থাকে, ব্ল্যাক বক্স নয়"],
    },
    ai: true,
  },
  {
    icon: CheckCircle2,
    kicker: { en: "Verification", bn: "ভেরিফিকেশন" },
    title: { en: "A coordinator scores it. The client signs it. Both, or it doesn't count.", bn: "কোঅর্ডিনেটর স্কোর দেন। ক্লায়েন্ট সাইন করেন। দুটোই, নাহলে গণনা হয় না।" },
    desc: {
      en: "Work is scored against a per-sector rubric — a marketing task and a coding task do not share a definition of done. No self-claim ever becomes a verified record.",
      bn: "কাজ মূল্যায়ন হয় সেক্টরভিত্তিক রুব্রিকে — একটা মার্কেটিং টাস্ক আর একটা কোডিং টাস্কের 'সম্পন্ন'-এর সংজ্ঞা এক নয়। কোনো self-claim কখনো ভেরিফায়েড রেকর্ড হয় না।",
    },
    bullets: {
      en: ["Five scored dimensions per sector", "Coordinator note plus client sign-off", "Revisions are recorded, not erased"],
      bn: ["প্রতি সেক্টরে পাঁচটি স্কোরড ডাইমেনশন", "মেন্টরের নোট ও ক্লায়েন্টের সাইন-অফ", "রিভিশন মুছে ফেলা হয় না, রেকর্ড থাকে"],
    },
    ai: false,
  },
  {
    icon: Handshake,
    kicker: { en: "Outcome", bn: "ফলাফল" },
    title: { en: "The client connects directly — and the proof stays with the graduate", bn: "ক্লায়েন্ট সরাসরি যুক্ত হন — আর প্রমাণটা গ্র্যাজুয়েটের সাথে থেকে যায়" },
    desc: {
      en: "Strong performers move straight into the client's hiring pipeline without competing for the job. The signed-off record becomes a public Proof-of-Work passport the graduate carries anywhere.",
      bn: "ভালো পারফর্মাররা চাকরির জন্য প্রতিযোগিতা না করেই সরাসরি ক্লায়েন্টের হায়ারিং পাইপলাইনে ঢোকেন। সাইন-অফ করা রেকর্ডটি একটি পাবলিক প্রুফ-অফ-ওয়ার্ক পাসপোর্ট হয়ে যায়, যা গ্র্যাজুয়েট যেকোনো জায়গায় নিয়ে যেতে পারেন।",
    },
    bullets: {
      en: ["Direct client ↔ graduate channel opens", "Referral and hiring priority for top scorers", "30 / 60 / 90-day retention check-ins"],
      bn: ["সরাসরি ক্লায়েন্ট ↔ গ্র্যাজুয়েট চ্যানেল খোলে", "শীর্ষ স্কোরারদের রেফারেল ও হায়ারিং প্রায়োরিটি", "৩০ / ৬০ / ৯০ দিনের রিটেনশন চেক-ইন"],
    },
    ai: false,
  },
];

export default function Pipeline() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const { tl } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 5200);
    return () => clearInterval(id);
  }, [auto, inView]);

  const step = STEPS[active];

  return (
    <section id="pipeline" ref={ref} className="border-y border-line bg-ink py-20 text-white md:py-28">
      <div className="shell">
        <Reveal className="max-w-2xl">
          <div className="eyebrow mb-3.5 flex items-center gap-2.5 text-brand-300">
            <span className="h-px w-6 bg-brand-400/60" />
            <T v={{ en: "The pipeline", bn: "পাইপলাইন" }} />
          </div>
          <h2 className="display-2 text-white">
            <T v={{ en: "One problem in. Verified work out.", bn: "একটা সমস্যা ঢোকে। ভেরিফায়েড কাজ বেরোয়।" }} />
          </h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-white/60">
            <T
              v={{
                en: "Six steps, two of them AI, and a human gate that neither of them can bypass.",
                bn: "ছয়টি ধাপ, তার দুটিতে এআই, আর একটি মানবিক গেট যা কোনোটিই এড়াতে পারে না।",
              }}
            />
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* rail */}
          <ol className="relative space-y-1">
            <span aria-hidden className="absolute left-[19px] top-4 bottom-4 w-px bg-white/12" />
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.title.en}>
                  <button
                    onClick={() => {
                      setActive(i);
                      setAuto(false);
                    }}
                    className={cn(
                      "group relative flex w-full items-center gap-4 rounded-[14px] p-3 text-left transition-all duration-400",
                      on ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-400",
                        on ? "border-brand-400 bg-brand-500 text-white" : "border-white/15 bg-ink text-white/45 group-hover:text-white/70"
                      )}
                    >
                      <s.icon className="size-[17px]" />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors", on ? "text-brand-300" : "text-white/35")}>
                        <T v={s.kicker} />
                      </span>
                      <span className={cn("mt-0.5 block text-[14.5px] font-medium leading-snug transition-colors", on ? "text-white" : "text-white/55")}>
                        <T v={s.title} />
                      </span>
                    </span>
                  </button>
                  {on && auto && (
                    <span aria-hidden className="ml-[19px] block h-px w-[calc(100%-38px)] origin-left bg-brand-400/50" style={{ animation: "wb-fade .4s ease both" }} />
                  )}
                </li>
              );
            })}
          </ol>

          {/* panel */}
          <div className="relative">
            <div key={active} className="anim-rise rounded-[20px] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm sm:p-9">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-[10px] bg-brand-500 text-white">
                  <step.icon className="size-[18px]" />
                </span>
                {step.ai && (
                  <span className="rounded-full bg-brand-400/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand-300 ring-1 ring-brand-400/25">
                    <T v={{ en: "AI assisted", bn: "এআই-সহায়ক" }} />
                  </span>
                )}
                <span className="num ml-auto text-[12px] text-white/35">
                  {active + 1} / {STEPS.length}
                </span>
              </div>

              <h3 className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[26px]">
                <T v={step.title} />
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-white/65">
                <T v={step.desc} />
              </p>

              <ul className="mt-7 space-y-2.5 border-t border-white/10 pt-6">
                {tl(step.bullets).map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[14px] text-white/75">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
