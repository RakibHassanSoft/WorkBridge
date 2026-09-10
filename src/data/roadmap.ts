import type { L } from "@/lib/i18n";

export type Phase = {
  key: string;
  label: L;
  window: L;
  title: L;
  desc: L;
  ships: { en: string[]; bn: string[] };
  gate: L;
  state: "live" | "next" | "later";
};

export const PHASES: Phase[] = [
  {
    key: "p0",
    label: { en: "Phase 0", bn: "ফেজ ০" },
    window: { en: "Month 1–2", bn: "মাস ১–২" },
    title: { en: "Manual pilot — no app, no AI", bn: "ম্যানুয়াল পাইলট — অ্যাপ নেই, এআই নেই" },
    desc: {
      en: "Five to ten real SME problems found by walking Dhaka. Matched by hand to students at one partner university. Coordinated on WhatsApp and a spreadsheet. A small but real fee on every project — roughly ৳3,000 to ৳5,000 — because willingness to pay cannot be validated without money changing hands.",
      bn: "ঢাকায় সরাসরি ঘুরে ৫ থেকে ১০টি বাস্তব এসএমই সমস্যা খুঁজে বের করা। একটি পার্টনার বিশ্ববিদ্যালয়ের শিক্ষার্থীদের সাথে হাতে ম্যাচ করা। কোঅর্ডিনেশন হোয়াটসঅ্যাপ ও স্প্রেডশিটে। প্রতিটি প্রজেক্টে ছোট হলেও বাস্তব ফি — আনুমানিক ৳৩,০০০ থেকে ৳৫,০০০ — কারণ টাকা হাতবদল না হলে willingness to pay যাচাই করা যায় না।",
    },
    ships: {
      en: ["5–10 paid SME projects", "One-page mentor sign-off rubric", "Outreach material for 15–20 target SMEs"],
      bn: ["৫–১০টি পেইড এসএমই প্রজেক্ট", "এক পৃষ্ঠার মেন্টর সাইন-অফ রুব্রিক", "১৫–২০টি টার্গেট এসএমই-র আউটরিচ ম্যাটেরিয়াল"],
    },
    gate: {
      en: "Hard go / no-go on completion rate and repeat-willingness before a single line of platform code.",
      bn: "প্ল্যাটফর্মের এক লাইন কোড লেখার আগেই completion rate ও repeat-willingness নিয়ে কঠোর go / no-go।",
    },
    state: "live",
  },
  {
    key: "p1",
    label: { en: "Phase 1", bn: "ফেজ ১" },
    window: { en: "Month 3–5", bn: "মাস ৩–৫" },
    title: { en: "Minimum platform", bn: "মিনিমাম প্ল্যাটফর্ম" },
    desc: {
      en: "Build only what Phase 0 proved was necessary: a simple problem-submission form, a light project workspace, and a structured verification rubric. Matching is still done by humans behind the scenes, whatever the interface suggests.",
      bn: "ফেজ ০-তে যা প্রয়োজনীয় প্রমাণিত হয়েছে শুধু সেটুকুই বানানো: একটি সহজ প্রবলেম-সাবমিশন ফর্ম, একটি হালকা প্রজেক্ট ওয়ার্কস্পেস, আর একটি স্ট্রাকচার্ড ভেরিফিকেশন রুব্রিক। ইন্টারফেস যা-ই দেখাক, ম্যাচিং তখনও পেছনে মানুষই করবে।",
    },
    ships: {
      en: ["Problem submission + light workspace", "Structured verification rubric", "Per-sector rubric templates drafted in parallel"],
      bn: ["প্রবলেম সাবমিশন ও হালকা ওয়ার্কস্পেস", "স্ট্রাকচার্ড ভেরিফিকেশন রুব্রিক", "সমান্তরালে সেক্টরভিত্তিক রুব্রিক টেমপ্লেটের খসড়া"],
    },
    gate: {
      en: "Enough completed projects flowing through the workspace to trust the data.",
      bn: "ওয়ার্কস্পেস দিয়ে যথেষ্ট সম্পন্ন প্রজেক্ট প্রবাহিত হওয়া, যাতে ডেটার ওপর ভরসা করা যায়।",
    },
    state: "next",
  },
  {
    key: "p2",
    label: { en: "Phase 2", bn: "ফেজ ২" },
    window: { en: "Month 6–12", bn: "মাস ৬–১২" },
    title: { en: "AI-assisted scoping and matching", bn: "এআই-সহায়ক স্কোপিং ও ম্যাচিং" },
    desc: {
      en: "Once 20 to 30 real projects exist as calibration data, AI-assisted scoping begins — and every scope still passes a human coordinator before it reaches a business. AI is not used before there is real data to calibrate it against; that is the single most common way this kind of product produces confident nonsense.",
      bn: "২০ থেকে ৩০টি বাস্তব প্রজেক্ট ক্যালিব্রেশন ডেটা হিসেবে জমা হলে এআই-সহায়ক স্কোপিং শুরু হবে — আর প্রতিটি স্কোপ কোনো ব্যবসার কাছে যাওয়ার আগে একজন human coordinator-এর হাত ঘুরে যাবে। বাস্তব ডেটা না থাকা পর্যন্ত এআই ব্যবহার করা হবে না; এ ধরনের প্রোডাক্ট আত্মবিশ্বাসী অর্থহীনতা তৈরি করার সবচেয়ে সাধারণ কারণ এটাই।",
    },
    ships: {
      en: ["AI scoping on calibrated data", "Explainable match shortlists", "Coordinator review console"],
      bn: ["ক্যালিব্রেটেড ডেটায় এআই স্কোপিং", "ব্যাখ্যাযোগ্য ম্যাচ শর্টলিস্ট", "কোঅর্ডিনেটর রিভিউ কনসোল"],
    },
    gate: {
      en: "AI scope accepted by the coordinator without material edits often enough to be trusted.",
      bn: "কোঅর্ডিনেটর উল্লেখযোগ্য সম্পাদনা ছাড়াই এআই স্কোপ যথেষ্ট বার গ্রহণ করছেন কিনা।",
    },
    state: "later",
  },
  {
    key: "p3",
    label: { en: "Phase 3", bn: "ফেজ ৩" },
    window: { en: "Year 2 onward", bn: "২য় বছর থেকে" },
    title: { en: "Controlled expansion", bn: "নিয়ন্ত্রিত সম্প্রসারণ" },
    desc: {
      en: "Team-based projects, new universities, one new sector at a time, and a university outcome dashboard built on real historical data — never on projections. The micro-entrepreneur layer expands from pilot into a full support track.",
      bn: "টিম-বেসড প্রজেক্ট, নতুন বিশ্ববিদ্যালয়, একবারে একটি করে নতুন সেক্টর, আর বাস্তব হিস্টোরিক্যাল ডেটার ওপর ইউনিভার্সিটি আউটকাম ড্যাশবোর্ড — কখনোই প্রজেকশনের ওপর নয়। ক্ষুদ্র উদ্যোক্তা লেয়ার পাইলট থেকে পূর্ণাঙ্গ সাপোর্ট ট্র্যাকে সম্প্রসারিত হবে।",
    },
    ships: {
      en: ["Team projects and coordination", "University outcome dashboards", "Sector-by-sector rollout", "30 / 60 / 90-day retention tracking"],
      bn: ["টিম প্রজেক্ট ও কোঅর্ডিনেশন", "ইউনিভার্সিটি আউটকাম ড্যাশবোর্ড", "সেক্টরভিত্তিক পর্যায়ক্রমিক রোলআউট", "৩০ / ৬০ / ৯০ দিনের রিটেনশন ট্র্যাকিং"],
    },
    gate: {
      en: "Success redefined from “got hired” to “still there and doing well”.",
      bn: "সাফল্যের সংজ্ঞা “চাকরি পেয়েছে” থেকে বদলে “টিকে আছে এবং ভালো করছে”।",
    },
    state: "later",
  },
];

export const RISKS: { risk: L; fix: L }[] = [
  {
    risk: { en: "Businesses won't pay for unproven students", bn: "ব্যবসাগুলো অপরীক্ষিত ছাত্রের কাজের জন্য টাকা দিতে চাইবে না" },
    fix: { en: "Validate with small but real payments from Phase 0, before anything is built.", bn: "কিছু বানানোর আগেই ফেজ ০ থেকে ছোট কিন্তু বাস্তব পেমেন্ট নিয়ে যাচাই করা।" },
  },
  {
    risk: { en: "Verification becomes meaningless", bn: "ভেরিফিকেশন প্রক্রিয়া অর্থহীন হয়ে যাওয়া" },
    fix: { en: "No self-claim ever counts. Mentor and business must both sign off.", bn: "কোনো self-claim গণনা হবে না। মেন্টর ও ব্যবসা — দুই পক্ষকেই সাইন-অফ করতে হবে।" },
  },
  {
    risk: { en: "Mentor supply dries up", bn: "মেন্টর সাপ্লাই শুকিয়ে যাওয়া" },
    fix: { en: "Referral rights and hiring priority from the start; stipends once revenue exists.", bn: "শুরু থেকেই রেফারেল ও হায়ারিং প্রায়োরিটি; রেভিনিউ এলে স্টাইপেন্ড।" },
  },
  {
    risk: { en: "Team coordination collapses", bn: "টিম-বেসড প্রজেক্ট কোঅর্ডিনেশন ভেঙে পড়া" },
    fix: { en: "Wait until Phase 3. Individual or pair work only until then.", bn: "ফেজ ৩ পর্যন্ত অপেক্ষা। তার আগে শুধু individual বা pair কাজ।" },
  },
  {
    risk: { en: "AI scopes badly and generates weak projects", bn: "এআই ভুল স্কোপ করে দুর্বল প্রজেক্ট তৈরি করা" },
    fix: { en: "No AI until enough real completed-project data exists to calibrate against.", bn: "যথেষ্ট বাস্তব সম্পন্ন প্রজেক্ট ডেটা না হওয়া পর্যন্ত এআই ব্যবহার না করা।" },
  },
];

export const NEXT_STEPS: L[] = [
  { en: "Lock a partner university and its CSE/IT department contact", bn: "একটি পার্টনার বিশ্ববিদ্যালয় ও তাদের সিএসই/আইটি বিভাগের যোগাযোগ চূড়ান্ত করা" },
  { en: "Build outreach material for 15–20 target SMEs to surface the first 5–10 real problems", bn: "প্রথম ৫–১০টি real সমস্যা বের করতে ১৫–২০টি টার্গেট এসএমই-র জন্য আউটরিচ ম্যাটেরিয়াল তৈরি" },
  { en: "Write the one-page mentor sign-off rubric — before any platform work begins", bn: "এক পৃষ্ঠার মেন্টর সাইন-অফ রুব্রিক লেখা — প্ল্যাটফর্মের কাজ শুরুর আগেই" },
  { en: "Run a hard go / no-go review at the end of Phase 0 on completion rate and repeat-willingness", bn: "ফেজ ০ শেষে completion rate ও repeat-willingness-এর ভিত্তিতে কঠোর go / no-go রিভিউ" },
];
