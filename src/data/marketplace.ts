import type { Applicant, Job, Submission, Task, TaskMeta } from "./types";
import { JOBS, TASKS } from "./work";

/* ────────────────────────────────────────────────────────────────
   The public task board.

   Everything a business posted, in its own words, plus the layer the
   AI adds on top: a plain-language restatement, a suggested route
   through the work, and the thing most briefs leave out.

   The client's own text is always the source of truth. The AI copy is
   labelled as such and never replaces it.
   ──────────────────────────────────────────────────────────────── */

/* ── Extra parent jobs for board-only tasks ───────────────────── */

export const EXTRA_JOBS: Job[] = [
  {
    id: "j7", ref: "WB-2556", clientId: "c2",
    title: { en: "Ramadan menu cards for four outlets", bn: "চার আউটলেটের জন্য রমজানের মেনু কার্ড" },
    brief: { en: "We change the menu for Ramadan every year and every year it looks rushed.", bn: "প্রতি বছর রমজানে মেনু বদলাই আর প্রতি বছরই সেটা তাড়াহুড়োর মতো দেখায়।" },
    sectorId: "design", budget: 3500, postedLabel: { en: "Posted 2 days ago", bn: "২ দিন আগে পোস্ট" },
    status: "matching",
    ai: {
      summary: { en: "Single deliverable, four sizes, one print run.", bn: "একটি ডেলিভারেবল, চারটি সাইজ, এক প্রিন্ট রান।" },
      complexity: "Low", confidence: 91, estHours: 6, suggestedFee: 3000,
      risks: { en: ["Menu prices are not final until the week before"], bn: ["মেনুর দাম আগের সপ্তাহ পর্যন্ত চূড়ান্ত হয় না"] },
      skills: ["Figma", "Print prep"],
    },
    taskIds: ["x1"],
  },
  {
    id: "j8", ref: "WB-2561", clientId: "c1",
    title: { en: "Delivery slips going back eighteen months", bn: "আঠারো মাসের ডেলিভারি স্লিপ" },
    brief: { en: "Boxes of paper delivery slips nobody can search.", bn: "কাগজের ডেলিভারি স্লিপের বাক্স, যা কেউ খুঁজে দেখতে পারে না।" },
    sectorId: "admin", budget: 2000, postedLabel: { en: "Posted today", bn: "আজ পোস্ট" },
    status: "matching",
    ai: {
      summary: { en: "Straight digitisation with a verification sample.", bn: "যাচাই নমুনাসহ সরল ডিজিটাইজেশন।" },
      complexity: "Low", confidence: 94, estHours: 9, suggestedFee: 1800,
      risks: { en: ["Handwriting quality varies by driver"], bn: ["চালকভেদে হাতের লেখার মান আলাদা"] },
      skills: ["Data entry", "Excel"],
    },
    taskIds: ["x3"],
  },
  {
    id: "j9", ref: "WB-2544", clientId: "c3",
    title: { en: "Input-cost survey across forty farms", bn: "চল্লিশটি খামারে ইনপুট-খরচ সার্ভে" },
    brief: { en: "We price on guesswork. We want to know what our farmers actually spend.", bn: "আমরা অনুমানে দাম ঠিক করি। জানতে চাই আমাদের কৃষকরা আসলে কত খরচ করেন।" },
    sectorId: "agri", budget: 3500, postedLabel: { en: "Posted 3 days ago", bn: "৩ দিন আগে পোস্ট" },
    status: "matching",
    ai: {
      summary: { en: "Field survey with a pilot round before the full run.", bn: "পূর্ণ রাউন্ডের আগে পাইলটসহ ফিল্ড সার্ভে।" },
      complexity: "Medium", confidence: 86, estHours: 12, suggestedFee: 3200,
      risks: { en: ["Field access depends on the season"], bn: ["ফিল্ডে প্রবেশ মৌসুমের ওপর নির্ভর করে"] },
      skills: ["Field survey", "Data entry"],
    },
    taskIds: ["x8"],
  },
  {
    id: "j10", ref: "WB-2519", clientId: "c2",
    title: { en: "Investor brief translated for a local audience", bn: "স্থানীয় পাঠকের জন্য ইনভেস্টর ব্রিফ অনুবাদ" },
    brief: { en: "Our English brief means nothing to the local partners we actually need.", bn: "আমাদের ইংরেজি ব্রিফ সেই স্থানীয় পার্টনারদের কাছে কিছুই বোঝায় না যাদের আমাদের সত্যিই দরকার।" },
    sectorId: "content", budget: 3600, postedLabel: { en: "Posted 3 weeks ago", bn: "৩ সপ্তাহ আগে পোস্ট" },
    status: "delivered",
    ai: {
      summary: { en: "Translation plus a local-context pass, not a literal render.", bn: "আক্ষরিক নয় — অনুবাদের সাথে স্থানীয় প্রেক্ষাপটের পাঠ।" },
      complexity: "Medium", confidence: 90, estHours: 10, suggestedFee: 3400,
      risks: { en: ["Financial terms have no settled Bangla equivalent"], bn: ["আর্থিক পরিভাষার স্থির বাংলা প্রতিশব্দ নেই"] },
      skills: ["EN⇄BN translation", "Editing"],
    },
    taskIds: ["x6"],
  },
  {
    id: "j11", ref: "WB-2508", clientId: "c1",
    title: { en: "Eid reel series", bn: "ঈদের রিল সিরিজ" },
    brief: { en: "Six short reels for Eid.", bn: "ঈদের জন্য ছয়টি ছোট রিল।" },
    sectorId: "mkt", budget: 5000, postedLabel: { en: "Posted 5 weeks ago", bn: "৫ সপ্তাহ আগে পোস্ট" },
    status: "delivered",
    ai: {
      summary: { en: "Six reels against a shot list the outlet can execute.", bn: "আউটলেট চালাতে পারবে এমন শট লিস্টে ছয়টি রিল।" },
      complexity: "Medium", confidence: 82, estHours: 14, suggestedFee: 5000,
      risks: { en: ["Eid timing leaves no room for a second shoot"], bn: ["ঈদের সময়সীমায় দ্বিতীয় শুটের সুযোগ নেই"] },
      skills: ["Video editing", "Content strategy"],
    },
    taskIds: ["x7"],
  },
  {
    id: "j12", ref: "WB-2563", clientId: "c3",
    title: { en: "VAT filing pack for the quarter", bn: "প্রান্তিকের ভ্যাট ফাইলিং প্যাক" },
    brief: { en: "Our accountant left. Filing is due in eleven days.", bn: "আমাদের অ্যাকাউন্ট্যান্ট চলে গেছেন। এগারো দিনের মধ্যে ফাইলিং।" },
    sectorId: "biz", budget: 4200, postedLabel: { en: "Posted yesterday", bn: "গতকাল পোস্ট" },
    status: "matching",
    ai: {
      summary: { en: "Compilation and checking, not filing on the client's behalf.", bn: "সংকলন ও যাচাই — ক্লায়েন্টের পক্ষে ফাইল করা নয়।" },
      complexity: "Medium", confidence: 88, estHours: 9, suggestedFee: 3800,
      risks: { en: ["Coordinator sign-off required before anything is submitted to NBR"], bn: ["এনবিআর-এ কিছু জমা দেওয়ার আগে কোঅর্ডিনেটরের সাইন-অফ লাগবে"] },
      skills: ["Bookkeeping", "VAT basics"],
    },
    taskIds: ["x4"],
  },
];

/* ── Board-only tasks ─────────────────────────────────────────── */

export const EXTRA_TASKS: Task[] = [
  {
    id: "x1", jobId: "j7", seq: 1,
    title: { en: "Ramadan menu cards, four outlet sizes", bn: "রমজানের মেনু কার্ড, চার আউটলেটের সাইজ" },
    desc: { en: "One menu design produced at four sizes, laid out so the price column can be changed the week before printing without redoing the artwork.", bn: "একটি মেনু ডিজাইন চারটি সাইজে, এমনভাবে সাজানো যাতে ছাপার আগের সপ্তাহে আর্টওয়ার্ক নতুন করে না বানিয়েই দামের কলাম বদলানো যায়।" },
    sectorId: "design", fee: 3000, hours: 6, level: "standard",
    skills: ["Figma", "Print prep", "Bangla typography"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 3 days", bn: "খোলা · ৩ দিনে বন্ধ" },
    acceptance: { en: ["Prices sit in an editable text layer", "Bangla and English both typeset", "Exports at all four sizes with bleed"], bn: ["দাম এডিটযোগ্য টেক্সট লেয়ারে", "বাংলা ও ইংরেজি দুটোই টাইপসেট", "চারটি সাইজেই ব্লিডসহ এক্সপোর্ট"] },
  },
  {
    id: "x2", jobId: "j5", seq: 4,
    title: { en: "Twenty more product descriptions on the approved template", bn: "অনুমোদিত টেমপ্লেটে আরও বিশটি প্রোডাক্ট ডেসক্রিপশন" },
    desc: { en: "The template already exists and has been signed off. This is applying it to twenty new arrivals in both languages.", bn: "টেমপ্লেট আগেই আছে ও সাইন-অফ হয়েছে। এটি সেই টেমপ্লেট বিশটি নতুন আইটেমে দুই ভাষায় প্রয়োগ করা।" },
    sectorId: "content", fee: 2200, hours: 5, level: "micro",
    skills: ["Bangla copy", "SEO writing"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 5 days", bn: "খোলা · ৫ দিনে বন্ধ" },
    acceptance: { en: ["Matches the approved template exactly", "Under 90 words per item", "Bangla and English say the same thing"], bn: ["অনুমোদিত টেমপ্লেটের সাথে হুবহু মেলে", "প্রতি আইটেমে ৯০ শব্দের কম", "বাংলা ও ইংরেজি একই কথা বলে"] },
  },
  {
    id: "x3", jobId: "j8", seq: 1,
    title: { en: "Digitise 500 paper delivery slips", bn: "৫০০টি কাগজের ডেলিভারি স্লিপ ডিজিটাইজ" },
    desc: { en: "Enter eighteen months of delivery slips into an agreed sheet, with a ten percent double-entry check and every illegible entry flagged rather than guessed.", bn: "আঠারো মাসের ডেলিভারি স্লিপ নির্ধারিত শিটে এন্ট্রি করা, দশ শতাংশ ডাবল-এন্ট্রি যাচাইসহ, আর প্রতিটি অস্পষ্ট এন্ট্রি অনুমান না করে চিহ্নিত করা।" },
    sectorId: "admin", fee: 1800, hours: 9, level: "micro",
    skills: ["Data entry", "Excel", "Bangla transcription"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 2 days", bn: "খোলা · ২ দিনে বন্ধ" },
    acceptance: { en: ["99% or better on the verification sample", "Illegible entries flagged, never guessed", "Source slip number on every row"], bn: ["যাচাই নমুনায় ৯৯% বা বেশি", "অস্পষ্ট এন্ট্রি অনুমান নয়, চিহ্নিত", "প্রতিটি সারিতে সোর্স স্লিপ নম্বর"] },
  },
  {
    id: "x4", jobId: "j12", seq: 1,
    title: { en: "Compile and check the quarterly VAT pack", bn: "প্রান্তিক ভ্যাট প্যাক সংকলন ও যাচাই" },
    desc: { en: "Gather the quarter's sales and purchase records, reconcile them, and assemble the filing pack. A qualified accountant signs off before anything is submitted.", bn: "প্রান্তিকের বিক্রয় ও ক্রয়ের রেকর্ড জোগাড় করা, মেলানো, আর ফাইলিং প্যাক তৈরি করা। কিছু জমা দেওয়ার আগে একজন যোগ্য অ্যাকাউন্ট্যান্ট সাইন-অফ করেন।" },
    sectorId: "biz", fee: 3800, hours: 9, level: "advanced",
    skills: ["Bookkeeping", "VAT basics", "Excel"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 4 days", bn: "খোলা · ৪ দিনে বন্ধ" },
    acceptance: { en: ["Every figure traceable to a source document", "Unexplained gaps listed, not smoothed over", "Accountant sign-off before submission"], bn: ["প্রতিটি সংখ্যা সোর্স ডকুমেন্টে মিলিয়ে দেখা যায়", "অব্যাখ্যাত ফারাক ঢাকা নয়, তালিকাভুক্ত", "জমার আগে অ্যাকাউন্ট্যান্টের সাইন-অফ"] },
  },
  {
    id: "x5", jobId: "j1", seq: 6,
    title: { en: "Fix the mobile layout on the order page", bn: "অর্ডার পেজের মোবাইল লেআউট ঠিক করা" },
    desc: { en: "The quantity selector overlaps the price on screens under 380px. Fix it without touching the desktop layout.", bn: "৩৮০ পিক্সেলের কম স্ক্রিনে কোয়ান্টিটি সিলেক্টর দামের ওপর উঠে যায়। ডেস্কটপ লেআউটে হাত না দিয়ে ঠিক করুন।" },
    sectorId: "it", fee: 4200, hours: 7, level: "standard",
    skills: ["CSS", "Responsive design", "QA"], status: "in_progress", assignee: "s1", progress: 65,
    dueLabel: { en: "Due in 2 days", bn: "২ দিনের মধ্যে" },
    acceptance: { en: ["No overlap from 320px upward", "Desktop unchanged, verified side by side", "Tested on a real low-end Android"], bn: ["৩২০ পিক্সেল থেকে কোনো ওভারল্যাপ নেই", "ডেস্কটপ অপরিবর্তিত, পাশাপাশি যাচাই করা", "বাস্তব লো-এন্ড অ্যান্ড্রয়েডে পরীক্ষিত"] },
  },
  {
    id: "x6", jobId: "j10", seq: 1,
    title: { en: "Translate a 12-page investor brief into Bangla", bn: "১২ পৃষ্ঠার ইনভেস্টর ব্রিফ বাংলায় অনুবাদ" },
    desc: { en: "Not a literal translation — a version a local partner will actually read, with financial terms explained the first time they appear.", bn: "আক্ষরিক অনুবাদ নয় — এমন সংস্করণ যা স্থানীয় পার্টনার সত্যিই পড়বেন, আর্থিক পরিভাষা প্রথমবার এলেই ব্যাখ্যাসহ।" },
    sectorId: "content", fee: 3400, hours: 10, level: "standard",
    skills: ["EN⇄BN translation", "Editing", "Finance vocabulary"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered 18 days ago", bn: "১৮ দিন আগে ডেলিভার" },
    acceptance: { en: ["Financial terms explained on first use", "No sentence longer than 25 words", "A local reader can follow it without the English"], bn: ["আর্থিক পরিভাষা প্রথম ব্যবহারেই ব্যাখ্যা", "কোনো বাক্য ২৫ শব্দের বেশি নয়", "ইংরেজি ছাড়াই স্থানীয় পাঠক অনুসরণ করতে পারেন"] },
  },
  {
    id: "x7", jobId: "j11", seq: 1,
    title: { en: "Six Eid reels with an outlet-executable shot list", bn: "আউটলেট চালাতে পারবে এমন শট লিস্টসহ ছয়টি ঈদ রিল" },
    desc: { en: "Six short vertical videos plus the shot list, so the outlet team can reshoot the same setups next season without the platform.", bn: "ছয়টি ছোট ভার্টিকাল ভিডিও ও শট লিস্ট, যাতে আউটলেট টিম আগামী মৌসুমে প্ল্যাটফর্ম ছাড়াই একই সেটআপ আবার শুট করতে পারে।" },
    sectorId: "mkt", fee: 5000, hours: 14, level: "advanced",
    skills: ["Video editing", "Content strategy", "Photography"], status: "cancelled", progress: 0,
    dueLabel: { en: "Cancelled before matching", bn: "ম্যাচিংয়ের আগেই বাতিল" },
    acceptance: { en: ["Six finished vertical cuts", "Shot list the outlet can reshoot from", "Delivered ten days before Eid"], bn: ["ছয়টি সম্পূর্ণ ভার্টিকাল কাট", "আউটলেট আবার শুট করতে পারে এমন শট লিস্ট", "ঈদের দশ দিন আগে ডেলিভারি"] },
  },
  {
    id: "x8", jobId: "j9", seq: 1,
    title: { en: "Interview forty farmers on their input costs", bn: "চল্লিশ জন কৃষকের ইনপুট খরচ নিয়ে সাক্ষাৎকার" },
    desc: { en: "A pilot round of five first to measure the real time per response, then the full forty with consent recorded and refusals logged rather than replaced.", bn: "আগে পাঁচজনের পাইলট রাউন্ড, যাতে প্রতি উত্তরের প্রকৃত সময় মাপা যায়, তারপর পুরো চল্লিশ — সম্মতি নথিভুক্ত এবং অস্বীকৃতি প্রতিস্থাপন নয়, লগ করা।" },
    sectorId: "agri", fee: 3200, hours: 12, level: "standard",
    skills: ["Field survey", "KoboToolbox", "Bangla reporting"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 6 days", bn: "খোলা · ৬ দিনে বন্ধ" },
    acceptance: { en: ["Consent recorded for every respondent", "Refusals logged, never substituted", "Time and cost per response measured in the pilot"], bn: ["প্রতিটি উত্তরদাতার সম্মতি নথিভুক্ত", "অস্বীকৃতি প্রতিস্থাপন নয়, লগ করা", "পাইলটে প্রতি উত্তরের সময় ও খরচ মাপা"] },
  },
  {
    id: "x9", jobId: "j3", seq: 5,
    title: { en: "Code 25 interview transcripts into themes", bn: "২৫টি সাক্ষাৎকার ট্রান্সক্রিপ্ট থিমে কোডিং" },
    desc: { en: "Build a codebook from the transcripts, apply it consistently, and report the counter-evidence rather than dropping it.", bn: "ট্রান্সক্রিপ্ট থেকে কোডবুক তৈরি, ধারাবাহিকভাবে প্রয়োগ, আর বিপরীত প্রমাণ বাদ না দিয়ে রিপোর্ট করা।" },
    sectorId: "social", fee: 2800, hours: 8, level: "standard",
    skills: ["Qualitative coding", "Research design", "Writing"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 7 days", bn: "খোলা · ৭ দিনে বন্ধ" },
    acceptance: { en: ["Codebook attached and versioned", "Every theme carries at least three quotes", "Counter-evidence reported, not dropped"], bn: ["কোডবুক সংযুক্ত ও ভার্সনযুক্ত", "প্রতিটি থিমে অন্তত তিনটি উদ্ধৃতি", "বিপরীত প্রমাণ বাদ নয়, উল্লেখিত"] },
  },
  {
    id: "x10", jobId: "j1", seq: 7,
    title: { en: "Loyalty points system for repeat customers", bn: "নিয়মিত ক্রেতাদের জন্য লয়ালটি পয়েন্ট সিস্টেম" },
    desc: { en: "Points earned per order, redeemable at checkout, with a simple admin view.", bn: "প্রতি অর্ডারে পয়েন্ট, চেকআউটে ব্যবহারযোগ্য, সাথে সহজ অ্যাডমিন ভিউ।" },
    sectorId: "it", fee: 9000, hours: 20, level: "advanced",
    skills: ["React", "APIs", "Database design"], status: "cancelled", progress: 0,
    dueLabel: { en: "Cancelled during scoping", bn: "স্কোপিংয়ের সময় বাতিল" },
    acceptance: { en: ["Points calculate correctly across refunds", "Redemption cannot go negative", "Admin can adjust a balance with a reason"], bn: ["রিফান্ড সহ পয়েন্ট সঠিকভাবে হিসাব হয়", "রিডেম্পশন ঋণাত্মক হতে পারে না", "অ্যাডমিন কারণসহ ব্যালান্স সমন্বয় করতে পারেন"] },
  },
  {
    id: "x11", jobId: "j6", seq: 4,
    title: { en: "Redraw as-built layouts for a three-storey building", bn: "তিনতলা ভবনের অ্যাজ-বিল্ট লেআউট নতুন করে আঁকা" },
    desc: { en: "Measure what is actually there, photograph every measured dimension, and produce drawings that reference the applicable code on each sheet.", bn: "বাস্তবে যা আছে তা মাপা, প্রতিটি মাপা মাত্রার ছবি তোলা, আর প্রতিটি শিটে প্রযোজ্য কোডের উল্লেখসহ ড্রয়িং তৈরি।" },
    sectorId: "eng", fee: 4800, hours: 14, level: "advanced",
    skills: ["AutoCAD", "Site survey", "Documentation"], status: "open", progress: 0,
    dueLabel: { en: "Open · closes in 8 days", bn: "খোলা · ৮ দিনে বন্ধ" },
    acceptance: { en: ["Every measured dimension photographed", "Discrepancies with old drawings flagged", "Code compliance checked before handover"], bn: ["প্রতিটি মাপা মাত্রার ছবি", "পুরনো ড্রয়িংয়ের সাথে অসঙ্গতি চিহ্নিত", "হ্যান্ডওভারের আগে কোড সঙ্গতি যাচাই"] },
  },
  {
    id: "x12", jobId: "j4", seq: 4,
    title: { en: "Product photography for 30 packaging SKUs", bn: "৩০টি প্যাকেজিং এসকেইউ-এর প্রোডাক্ট ফটোগ্রাফি" },
    desc: { en: "Thirty products shot on a consistent white setup with window light, retouched to a single look, delivered web-ready and print-ready.", bn: "জানালার আলোয় একই সাদা সেটআপে তিরিশটি প্রোডাক্ট, এক লুকে রিটাচ, ওয়েব ও প্রিন্ট দুই ফরম্যাটেই ডেলিভারি।" },
    sectorId: "design", fee: 3600, hours: 11, level: "standard",
    skills: ["Photography", "Retouching", "Figma"], status: "in_review", assignee: "s5", progress: 100,
    dueLabel: { en: "In review", bn: "রিভিউতে" },
    acceptance: { en: ["Consistent white balance across all 30", "Web and print exports of each", "No product cropped at the edges"], bn: ["৩০টিতেই সামঞ্জস্যপূর্ণ হোয়াইট ব্যালান্স", "প্রতিটির ওয়েব ও প্রিন্ট এক্সপোর্ট", "কোনো প্রোডাক্ট প্রান্তে কাটা পড়েনি"] },
  },
];

/* ── AI layer per task ────────────────────────────────────────── */

export const TASK_META: Record<string, TaskMeta> = {
  x1: {
    applicants: 11, postedOrder: 96, postedLabel: { en: "2 days ago", bn: "২ দিন আগে" },
    clientWords: { en: "We change the menu for Ramadan every year and every year it looks rushed. Four outlets, four different board sizes, and the prices are never final until the last week.", bn: "প্রতি বছর রমজানে মেনু বদলাই আর প্রতি বছরই সেটা তাড়াহুড়োর মতো দেখায়। চারটি আউটলেট, চারটি আলাদা বোর্ড সাইজ, আর দাম শেষ সপ্তাহের আগে কখনোই চূড়ান্ত হয় না।" },
    aiSimple: { en: "Design one menu, output it at four sizes, and build it so the prices can change late without redoing the artwork. The late-price problem is the actual brief — not the design.", bn: "একটি মেনু ডিজাইন করুন, চারটি সাইজে বের করুন, আর এমনভাবে বানান যাতে শেষ মুহূর্তে দাম বদলালেও আর্টওয়ার্ক নতুন করে করতে না হয়। দেরিতে দাম চূড়ান্ত হওয়াটাই আসল ব্রিফ — ডিজাইন নয়।" },
    aiSteps: {
      en: ["Get the four board dimensions in writing before designing anything", "Build one master layout with prices on their own text layer", "Set Bangla and English type together, not as an afterthought", "Export all four with bleed and hand over the editable source"],
      bn: ["ডিজাইন শুরুর আগে চারটি বোর্ডের মাপ লিখিতভাবে নিন", "দাম আলাদা টেক্সট লেয়ারে রেখে একটি মাস্টার লেআউট বানান", "বাংলা ও ইংরেজি টাইপ একসাথে সাজান, পরে বসানোর মতো নয়", "চারটিই ব্লিডসহ এক্সপোর্ট করুন ও এডিটযোগ্য সোর্স দিন"],
    },
    aiWatchOut: { en: "If you flatten the prices into the artwork you will be redoing this the week before Ramadan. That is the trap this brief is really describing.", bn: "দাম আর্টওয়ার্কে মিশিয়ে দিলে রমজানের আগের সপ্তাহে পুরোটা আবার করতে হবে। এই ব্রিফ আসলে সেই ফাঁদটার কথাই বলছে।" },
  },
  x2: {
    applicants: 24, postedOrder: 92, postedLabel: { en: "3 days ago", bn: "৩ দিন আগে" },
    clientWords: { en: "The template you built last month works. We have twenty new pieces going online — same treatment please.", bn: "গত মাসে আপনারা যে টেমপ্লেট বানিয়েছেন সেটা কাজ করছে। আরও বিশটি নতুন পিস অনলাইনে যাচ্ছে — একই ট্রিটমেন্ট চাই।" },
    aiSimple: { en: "The thinking is already done. This is disciplined application of an approved template to twenty items, in two languages, without drifting from it.", bn: "চিন্তার কাজটা আগেই হয়ে গেছে। এটি একটি অনুমোদিত টেমপ্লেট বিশটি আইটেমে, দুই ভাষায়, না সরে গিয়ে নিয়মমাফিক প্রয়োগ করা।" },
    aiSteps: {
      en: ["Read the approved template and the ten items already written", "Ask for fabric and care details up front — they are the usual blocker", "Write in batches of five and check each against the template", "Deliver in the client's own upload format"],
      bn: ["অনুমোদিত টেমপ্লেট ও আগে লেখা দশটি আইটেম পড়ুন", "কাপড় ও যত্নের তথ্য শুরুতেই চেয়ে নিন — এটাই সাধারণ বাধা", "পাঁচটি করে ব্যাচে লিখুন ও প্রতিটি টেমপ্লেটের সাথে মিলিয়ে দেখুন", "ক্লায়েন্টের নিজের আপলোড ফরম্যাটে দিন"],
    },
    aiWatchOut: { en: "Twenty-four people applied. Consistency with the existing template will decide this, not better writing.", bn: "চব্বিশ জন আবেদন করেছেন। ভালো লেখা নয়, বিদ্যমান টেমপ্লেটের সাথে সামঞ্জস্যই এটি নির্ধারণ করবে।" },
  },
  x3: {
    applicants: 31, postedOrder: 99, postedLabel: { en: "Today", bn: "আজ" },
    clientWords: { en: "Boxes of paper delivery slips going back a year and a half. Nobody can search them. We just want it in a sheet.", bn: "দেড় বছরের কাগজের ডেলিভারি স্লিপের বাক্স। কেউ খুঁজে দেখতে পারে না। আমরা শুধু এটা একটা শিটে চাই।" },
    aiSimple: { en: "Straightforward digitisation. What separates a good job from a bad one here is what you do with the entries you cannot read.", bn: "সরল ডিজিটাইজেশন। ভালো ও খারাপ কাজের পার্থক্য এখানে একটাই — যেসব এন্ট্রি পড়া যায় না, সেগুলো নিয়ে আপনি কী করেন।" },
    aiSteps: {
      en: ["Agree the columns with the client before entering anything", "Transcribe 30 slips first and measure your real time per slip", "Flag illegible entries in their own column — never guess", "Double-enter a random 10% and report the accuracy you measured"],
      bn: ["কিছু এন্ট্রি করার আগে ক্লায়েন্টের সাথে কলাম চূড়ান্ত করুন", "প্রথমে ৩০টি স্লিপ লিখে প্রতি স্লিপে আপনার প্রকৃত সময় মাপুন", "অস্পষ্ট এন্ট্রি আলাদা কলামে চিহ্নিত করুন — কখনো অনুমান নয়", "এলোমেলো ১০% ডাবল-এন্ট্রি করে মাপা নির্ভুলতা জানান"],
    },
    aiWatchOut: { en: "Thirty-one applicants, and most will promise 100% accuracy. Promising 99% and showing how you measured it is the stronger application.", bn: "একত্রিশ জন আবেদনকারী, এবং বেশিরভাগই ১০০% নির্ভুলতার প্রতিশ্রুতি দেবেন। ৯৯% বলা আর কীভাবে মেপেছেন তা দেখানোই শক্তিশালী আবেদন।" },
  },
  x4: {
    applicants: 7, postedOrder: 95, postedLabel: { en: "Yesterday", bn: "গতকাল" },
    clientWords: { en: "Our accountant left without notice. Filing is due in eleven days and I do not know where to start.", bn: "আমাদের অ্যাকাউন্ট্যান্ট না জানিয়ে চলে গেছেন। এগারো দিনের মধ্যে ফাইলিং, আর আমি জানি না কোথা থেকে শুরু করব।" },
    aiSimple: { en: "Compile and reconcile the quarter, then hand over a checked pack. You are not filing on the client's behalf and you are not signing anything — a qualified accountant does that.", bn: "প্রান্তিকের হিসাব সংকলন ও মেলানো, তারপর যাচাই করা প্যাক হস্তান্তর। আপনি ক্লায়েন্টের পক্ষে ফাইল করছেন না, কিছুতে সইও করছেন না — সেটা একজন যোগ্য অ্যাকাউন্ট্যান্ট করেন।" },
    aiSteps: {
      en: ["List what documents exist and what is missing on day one", "Reconcile sales and purchases separately before combining", "Put every unexplained gap in its own row instead of forcing a balance", "Book the accountant review two days before the deadline, not on it"],
      bn: ["প্রথম দিনেই কোন ডকুমেন্ট আছে ও কী নেই তার তালিকা করুন", "একত্র করার আগে বিক্রয় ও ক্রয় আলাদা করে মেলান", "ব্যালান্স জোর করে না মিলিয়ে প্রতিটি অব্যাখ্যাত ফারাক আলাদা সারিতে রাখুন", "মেন্টর রিভিউ ডেডলাইনের দিনে নয়, দুই দিন আগে বুক করুন"],
    },
    aiWatchOut: { en: "Only seven applied because the deadline scares people. That is exactly why the fee is high for the hours — the risk is the calendar, not the work.", bn: "মাত্র সাতজন আবেদন করেছেন কারণ ডেডলাইন ভয় ধরায়। ঘণ্টার তুলনায় ফি বেশি ঠিক সেজন্যই — ঝুঁকিটা কাজের নয়, ক্যালেন্ডারের।" },
  },
  x5: {
    applicants: 9, postedOrder: 88, postedLabel: { en: "6 days ago", bn: "৬ দিন আগে" },
    clientWords: { en: "On my phone the quantity box sits on top of the price. My nephew says it is a CSS thing.", bn: "আমার ফোনে কোয়ান্টিটি বক্সটা দামের ওপর বসে যায়। আমার ভাগ্নে বলছে এটা নাকি সিএসএস-এর ব্যাপার।" },
    aiSimple: { en: "A contained layout bug on narrow screens. The hard part is proving the desktop layout did not move while you fixed it.", bn: "সরু স্ক্রিনে একটি সীমিত লেআউট বাগ। কঠিন অংশ হলো — ঠিক করার সময় ডেস্কটপ লেআউট নড়েনি, সেটা প্রমাণ করা।" },
    aiSteps: {
      en: ["Reproduce at 320, 360 and 380px before changing anything", "Screenshot desktop before and after, side by side", "Test on a real low-end Android, not just the browser emulator", "Note in the handover what you deliberately did not touch"],
      bn: ["কিছু বদলানোর আগে ৩২০, ৩৬০ ও ৩৮০ পিক্সেলে সমস্যাটি পুনরায় ঘটান", "ডেস্কটপের আগে ও পরের স্ক্রিনশট পাশাপাশি রাখুন", "কেবল ব্রাউজার এমুলেটর নয়, বাস্তব লো-এন্ড অ্যান্ড্রয়েডে পরীক্ষা করুন", "হ্যান্ডওভারে লিখুন কোন অংশে আপনি ইচ্ছাকৃতভাবে হাত দেননি"],
    },
  },
  x6: {
    applicants: 16, postedOrder: 40, postedLabel: { en: "3 weeks ago", bn: "৩ সপ্তাহ আগে" },
    clientWords: { en: "Our English brief means nothing to the local partners we actually need. We tried Google Translate and it read like a machine.", bn: "আমাদের ইংরেজি ব্রিফ সেই স্থানীয় পার্টনারদের কাছে কিছুই বোঝায় না যাদের আমাদের সত্যিই দরকার। গুগল ট্রান্সলেট দিয়ে চেষ্টা করেছিলাম, যন্ত্রের লেখার মতো শোনায়।" },
    aiSimple: { en: "This is rewriting for a different reader, not translating for a different language. Financial terms have no settled Bangla equivalent, so the first use has to carry an explanation.", bn: "এটি ভিন্ন ভাষার জন্য অনুবাদ নয়, ভিন্ন পাঠকের জন্য নতুন করে লেখা। আর্থিক পরিভাষার স্থির বাংলা প্রতিশব্দ নেই, তাই প্রথম ব্যবহারেই ব্যাখ্যা রাখতে হবে।" },
    aiSteps: {
      en: ["Read the whole brief before translating a single line", "Build a term list with the client and agree each choice once", "Explain each financial term on first use, then use it freely", "Read the Bangla aloud — if you run out of breath the sentence is too long"],
      bn: ["এক লাইন অনুবাদের আগে পুরো ব্রিফ পড়ুন", "ক্লায়েন্টের সাথে পরিভাষার তালিকা বানিয়ে প্রতিটি একবারেই চূড়ান্ত করুন", "প্রতিটি আর্থিক শব্দ প্রথম ব্যবহারে ব্যাখ্যা করুন, তারপর অবাধে ব্যবহার করুন", "বাংলাটা জোরে পড়ুন — দম ফুরিয়ে গেলে বাক্যটা বড্ড লম্বা"],
    },
  },
  x7: {
    applicants: 19, postedOrder: 20, postedLabel: { en: "5 weeks ago", bn: "৫ সপ্তাহ আগে" },
    clientWords: { en: "Six reels for Eid, shot at the Mirpur outlet.", bn: "ঈদের জন্য ছয়টি রিল, মিরপুর আউটলেটে শুট।" },
    aiSimple: { en: "Six vertical videos plus a shot list the outlet can reuse. The reusable shot list, not the videos, is what would have made this worth the money.", bn: "ছয়টি ভার্টিকাল ভিডিও ও একটি শট লিস্ট যা আউটলেট আবার ব্যবহার করতে পারবে। ভিডিও নয়, পুনর্ব্যবহারযোগ্য শট লিস্টই এটিকে টাকার যোগ্য করত।" },
    aiSteps: {
      en: ["Lock the shot list before booking any shoot day", "Shoot everything in one session — Eid leaves no second chance", "Cut vertical first, never crop from a horizontal edit", "Hand over the shot list as a printable page"],
      bn: ["কোনো শুট ডে বুক করার আগে শট লিস্ট চূড়ান্ত করুন", "সব এক সেশনে শুট করুন — ঈদ দ্বিতীয় সুযোগ দেয় না", "প্রথমেই ভার্টিকাল কাটুন, হরাইজন্টাল এডিট থেকে ক্রপ নয়", "শট লিস্ট ছাপার উপযোগী পাতা হিসেবে দিন"],
    },
    cancelReason: {
      en: "The outlet's renovation ran three weeks over and the kitchen was a building site through Eid week. We could not shoot food in it and we did not want a student to travel out for nothing. We will repost this before Qurbani.",
      bn: "আউটলেটের সংস্কার তিন সপ্তাহ বেশি লেগেছে, ঈদের সপ্তাহ জুড়ে রান্নাঘর ছিল নির্মাণস্থল। সেখানে খাবারের শুট সম্ভব ছিল না, আর কোনো শিক্ষার্থীকে বৃথা যাতায়াত করাতে চাইনি। কোরবানির আগে আবার পোস্ট করব।",
    },
    cancelledLabel: { en: "Cancelled 4 weeks ago by Nokshi Threads", bn: "৪ সপ্তাহ আগে নকশী থ্রেডস বাতিল করেছে" },
  },
  x8: {
    applicants: 6, postedOrder: 93, postedLabel: { en: "3 days ago", bn: "৩ দিন আগে" },
    clientWords: { en: "We price on guesswork. We want to know what our farmers actually spend on seed and fertiliser in a season.", bn: "আমরা অনুমানে দাম ঠিক করি। জানতে চাই আমাদের কৃষকরা এক মৌসুমে বীজ ও সারে আসলে কত খরচ করেন।" },
    aiSimple: { en: "Field research with a pilot round built in, so the price of the full run is set by measured effort rather than a guess.", bn: "পাইলট রাউন্ডসহ ফিল্ড গবেষণা, যাতে পূর্ণ রাউন্ডের দাম অনুমানে নয়, মাপা পরিশ্রমে নির্ধারিত হয়।" },
    aiSteps: {
      en: ["Run five pilot interviews and time them honestly", "Record consent before every single interview", "Log refusals — a replaced refusal quietly biases the whole survey", "Report what the data cannot tell the client, not only what it can"],
      bn: ["পাঁচটি পাইলট সাক্ষাৎকার নিন ও সৎভাবে সময় মাপুন", "প্রতিটি সাক্ষাৎকারের আগে সম্মতি রেকর্ড করুন", "অস্বীকৃতি লগ করুন — প্রতিস্থাপিত অস্বীকৃতি নীরবে পুরো সার্ভেকে পক্ষপাতদুষ্ট করে", "ডেটা ক্লায়েন্টকে যা বলতে পারে না, কেবল যা পারে তা নয় — দুটোই জানান"],
    },
    aiWatchOut: { en: "Only six applicants because it needs someone outside Dhaka. If you are in Bogura or Mymensingh this is the least competitive task on the board.", bn: "মাত্র ছয়জন আবেদনকারী, কারণ ঢাকার বাইরের কাউকে দরকার। আপনি বগুড়া বা ময়মনসিংহে থাকলে বোর্ডের সবচেয়ে কম প্রতিযোগিতার কাজ এটি।" },
  },
  x9: {
    applicants: 8, postedOrder: 90, postedLabel: { en: "4 days ago", bn: "৪ দিন আগে" },
    clientWords: { en: "We have 25 recorded interviews and no idea how to turn them into a chapter.", bn: "আমাদের ২৫টি রেকর্ড করা সাক্ষাৎকার আছে, কিন্তু সেগুলো কীভাবে একটি অধ্যায়ে দাঁড় করাতে হয় জানি না।" },
    aiSimple: { en: "Turn transcripts into themes with a codebook someone else could re-apply and get the same answer. Reproducibility is the deliverable.", bn: "ট্রান্সক্রিপ্টকে থিমে রূপ দিন, এমন কোডবুকসহ যা অন্য কেউ প্রয়োগ করলেও একই উত্তর পাবেন। পুনরুৎপাদনযোগ্যতাই ডেলিভারেবল।" },
    aiSteps: {
      en: ["Code five transcripts, then stop and revise the codebook", "Keep the respondent's own words in every quote", "Separate identifying details from the coded file", "Report the counter-evidence in its own section"],
      bn: ["পাঁচটি ট্রান্সক্রিপ্ট কোড করুন, তারপর থেমে কোডবুক সংশোধন করুন", "প্রতিটি উদ্ধৃতিতে উত্তরদাতার নিজের শব্দ রাখুন", "শনাক্তকারী তথ্য কোডেড ফাইল থেকে আলাদা রাখুন", "বিপরীত প্রমাণ আলাদা অংশে জানান"],
    },
  },
  x10: {
    applicants: 14, postedOrder: 55, postedLabel: { en: "2 weeks ago", bn: "২ সপ্তাহ আগে" },
    clientWords: { en: "Something like the points card the pharmacy down the road gives out, but on the website.", bn: "রাস্তার ওপাশের ফার্মেসি যেরকম পয়েন্ট কার্ড দেয়, সেরকম কিছু — তবে ওয়েবসাইটে।" },
    aiSimple: { en: "A points ledger with a redemption flow. Sounds small, but refunds, partial returns and negative balances are where this kind of build actually goes wrong.", bn: "রিডেম্পশন ফ্লো সহ একটি পয়েন্ট লেজার। শুনতে ছোট, কিন্তু রিফান্ড, আংশিক ফেরত আর ঋণাত্মক ব্যালান্স — এ ধরনের কাজ আসলে সেখানেই ভুল হয়।" },
    aiSteps: {
      en: ["Write down what happens to points on a refund before writing code", "Model the ledger as immutable entries, never a mutable balance", "Give the admin an adjustment tool that requires a reason", "Test the negative-balance path first, not last"],
      bn: ["কোড লেখার আগে লিখে রাখুন রিফান্ডে পয়েন্টের কী হবে", "ব্যালান্স পরিবর্তনযোগ্য না রেখে লেজারকে অপরিবর্তনীয় এন্ট্রি হিসেবে সাজান", "অ্যাডমিনকে কারণ-বাধ্যতামূলক সমন্বয় টুল দিন", "ঋণাত্মক ব্যালান্সের পথ সবার শেষে নয়, সবার আগে পরীক্ষা করুন"],
    },
    cancelReason: {
      en: "The coordinator and I went through it and the honest scope was closer to ৳26,000 than the ৳9,000 I had budgeted. Rather than push a student to build half of it and call it done, we cancelled. I would rather come back for it next year with the right budget.",
      bn: "কোঅর্ডিনেটরের সাথে বসে দেখলাম, সৎ স্কোপ আমার ধরা ৳৯,০০০ নয়, ৳২৬,০০০-এর কাছাকাছি। কোনো শিক্ষার্থীকে দিয়ে অর্ধেক বানিয়ে 'হয়ে গেছে' বলার চেয়ে আমরা বাতিল করেছি। আগামী বছর সঠিক বাজেট নিয়ে ফিরব।",
    },
    cancelledLabel: { en: "Cancelled 11 days ago by Nokshi Threads", bn: "১১ দিন আগে নকশী থ্রেডস বাতিল করেছে" },
  },
  x11: {
    applicants: 4, postedOrder: 89, postedLabel: { en: "5 days ago", bn: "৫ দিন আগে" },
    clientWords: { en: "The drawings we have are from before two extensions were built. Nothing matches the building.", bn: "আমাদের কাছে যে ড্রয়িং আছে সেটা দুটি সম্প্রসারণের আগের। ভবনের সাথে কিছুই মেলে না।" },
    aiSimple: { en: "Measure reality first, draw second. The value here is the discrepancy list between the old drawings and what is actually standing.", bn: "আগে বাস্তব মাপুন, তারপর আঁকুন। এখানে আসল মূল্য পুরনো ড্রয়িং আর বাস্তবে যা দাঁড়িয়ে আছে তার মধ্যে অসঙ্গতির তালিকা।" },
    aiSteps: {
      en: ["Photograph every dimension as you measure it", "Mark each discrepancy against the old drawing explicitly", "Reference the applicable code on every sheet", "Check every sheet against the code before you finalise"],
      bn: ["মাপার সময়েই প্রতিটি মাত্রার ছবি তুলুন", "পুরনো ড্রয়িংয়ের বিপরীতে প্রতিটি অসঙ্গতি স্পষ্টভাবে চিহ্নিত করুন", "প্রতিটি শিটে প্রযোজ্য কোডের উল্লেখ দিন", "চূড়ান্ত করার আগে মেন্টর ইঞ্জিনিয়ারের রিভিউ বুক করুন"],
    },
    aiWatchOut: { en: "Four applicants. Site work outside Dhaka thins the field, which is an opening if you can get there.", bn: "চারজন আবেদনকারী। ঢাকার বাইরে সাইটের কাজে প্রতিযোগী কমে যায় — পৌঁছাতে পারলে এটি সুযোগ।" },
  },
  x12: {
    applicants: 13, postedOrder: 85, postedLabel: { en: "8 days ago", bn: "৮ দিন আগে" },
    clientWords: { en: "Thirty products, all shot at different times by different people. They look like thirty different brands.", bn: "তিরিশটি প্রোডাক্ট, ভিন্ন সময়ে ভিন্ন মানুষের তোলা। দেখতে তিরিশটি আলাদা ব্র্যান্ডের মতো লাগে।" },
    aiSimple: { en: "The problem is not photo quality, it is inconsistency. One setup, one light, one retouch recipe across all thirty is the whole job.", bn: "সমস্যা ছবির মান নয়, অসামঞ্জস্য। এক সেটআপ, এক আলো, তিরিশটিতেই এক রিটাচ রেসিপি — এটাই পুরো কাজ।" },
    aiSteps: {
      en: ["Set the surface, light and camera position once and do not move them", "Shoot a grey card at the start of every session", "Build one retouch action and apply it to all thirty", "Export web and print from the same master, never twice from scratch"],
      bn: ["পৃষ্ঠ, আলো ও ক্যামেরার অবস্থান একবার ঠিক করে আর নড়াবেন না", "প্রতিটি সেশনের শুরুতে একটি গ্রে কার্ড শুট করুন", "একটি রিটাচ অ্যাকশন বানিয়ে তিরিশটিতেই প্রয়োগ করুন", "একই মাস্টার থেকে ওয়েব ও প্রিন্ট এক্সপোর্ট করুন, দুবার নতুন করে নয়"],
    },
  },

  /* Meta for the tasks that already existed in the workspace demos */
  t1: { applicants: 12, postedOrder: 70, postedLabel: { en: "8 days ago", bn: "৮ দিন আগে" },
    clientWords: { en: "One in four customers vanishes at checkout and nobody can tell me why.", bn: "প্রতি চারজন কাস্টমারের একজন চেকআউটে গিয়ে হারিয়ে যায়, কেউ বলতে পারে না কেন।" },
    aiSimple: { en: "Find the cause before anyone builds anything. The deliverable is a one-page explanation an owner can read.", bn: "কেউ কিছু বানানোর আগে কারণ খুঁজুন। ডেলিভারেবল হলো এক পৃষ্ঠার ব্যাখ্যা, যা একজন মালিক পড়তে পারবেন।" },
    aiSteps: { en: ["Reproduce on three devices and two payment methods", "Capture console and network evidence", "Write the cause in non-technical language"], bn: ["তিনটি ডিভাইস ও দুটি পেমেন্ট মেথডে পুনরায় ঘটান", "কনসোল ও নেটওয়ার্ক প্রমাণ ধরুন", "কারণটি অ-কারিগরি ভাষায় লিখুন"] } },
  t3: { applicants: 18, postedOrder: 72, postedLabel: { en: "7 days ago", bn: "৭ দিন আগে" },
    clientWords: { en: "240 products and no idea which ones sell.", bn: "২৪০টি প্রোডাক্ট, কোনটা বিক্রি হয় জানি না।" },
    aiSimple: { en: "Clean the catalogue so the reporting built on top of it can be trusted. Boring, and everything downstream depends on it.", bn: "ক্যাটালগ পরিষ্কার করুন যাতে তার ওপর দাঁড়ানো রিপোর্টিংয়ে ভরসা করা যায়। একঘেয়ে কাজ, আর পরের সবকিছুই এর ওপর নির্ভর করে।" },
    aiSteps: { en: ["De-duplicate variants before anything else", "Standardise category and size fields", "Keep a change log of every merge"], bn: ["সবার আগে ভ্যারিয়েন্ট ডি-ডুপ্লিকেট করুন", "ক্যাটাগরি ও সাইজ ফিল্ড স্ট্যান্ডার্ডাইজ করুন", "প্রতিটি মার্জের চেঞ্জ লগ রাখুন"] } },
  t20: { applicants: 21, postedOrder: 94, postedLabel: { en: "2 days ago", bn: "২ দিন আগে" },
    clientWords: { en: "Staff write stock transfers on a notepad. Every month the count is off by thirty or forty pieces.", bn: "কর্মীরা স্টক ট্রান্সফার নোটপ্যাডে লেখেন। প্রতি মাসে গণনা ত্রিশ-চল্লিশ পিস কম-বেশি হয়।" },
    aiSimple: { en: "Reconstruct one month of movement from paper and line it up against the system. You are looking for where the gap enters, not fixing it yet.", bn: "কাগজ থেকে এক মাসের গতিবিধি পুনর্গঠন করে সিস্টেমের পাশে মেলান। আপনি খুঁজছেন ফারাকটা কোথায় ঢোকে — এখনো ঠিক করছেন না।" },
    aiSteps: { en: ["Capture every notepad entry or flag it illegible", "Align dates with the system's own records", "Never silently drop an entry"], bn: ["প্রতিটি নোটপ্যাড এন্ট্রি ধরুন বা অস্পষ্ট চিহ্নিত করুন", "তারিখ সিস্টেমের রেকর্ডের সাথে সারিবদ্ধ করুন", "কোনো এন্ট্রি নীরবে বাদ দেবেন না"] } },
  t6: { applicants: 15, postedOrder: 80, postedLabel: { en: "10 days ago", bn: "১০ দিন আগে" },
    clientWords: { en: "We have no brand guideline. Everything is done by whoever is free.", bn: "আমাদের কোনো ব্র্যান্ড গাইডলাইন নেই। যে খালি থাকে সে-ই যা খুশি করে।" },
    aiSimple: { en: "One page that ends the argument about colours and fonts, built only from assets that already exist.", bn: "এক পৃষ্ঠা যা রঙ ও ফন্ট নিয়ে তর্ক থামিয়ে দেয়, কেবল বিদ্যমান অ্যাসেট দিয়েই বানানো।" },
    aiSteps: { en: ["Pull colours from existing outlet photos", "Give both print and screen values", "Keep it to a single printable page"], bn: ["বিদ্যমান আউটলেট ছবি থেকে রঙ নিন", "প্রিন্ট ও স্ক্রিন দুই মানই দিন", "এক ছাপার উপযোগী পাতায় রাখুন"] } },
  t7: { applicants: 27, postedOrder: 79, postedLabel: { en: "10 days ago", bn: "১০ দিন আগে" },
    clientWords: { en: "We pay an agency 25,000 a month for 12 posts we don't like.", bn: "আমরা এজেন্সিকে মাসে ২৫,০০০ দিই ১২টি পোস্টের জন্য, যা আমাদের পছন্দ হয় না।" },
    aiSimple: { en: "Thirty posts, but the real deliverable is a shot list the outlet manager can run alone in month two.", bn: "ত্রিশটি পোস্ট, তবে আসল ডেলিভারেবল এমন শট লিস্ট যা দ্বিতীয় মাসে আউটলেট ম্যানেজার একাই চালাতে পারবেন।" },
    aiSteps: { en: ["Write the shot instruction before the caption", "Keep captions under 220 characters", "Make a quarter of the posts need no new photo"], bn: ["ক্যাপশনের আগে শট নির্দেশনা লিখুন", "ক্যাপশন ২২০ অক্ষরের নিচে রাখুন", "এক-চতুর্থাংশ পোস্টে নতুন ছবি লাগবে না এমন রাখুন"] } },
  t8: { applicants: 10, postedOrder: 78, postedLabel: { en: "11 days ago", bn: "১১ দিন আগে" },
    clientWords: { en: "We have a decent camera and nobody who knows how to use it.", bn: "আমাদের ভালো ক্যামেরা আছে, কিন্তু ব্যবহার জানে এমন কেউ নেই।" },
    aiSimple: { en: "Teach six repeatable shots using window light and a phone. No equipment purchase is part of the brief.", bn: "জানালার আলো ও ফোন দিয়ে ছয়টি পুনরাবৃত্তিযোগ্য শট শেখান। কোনো যন্ত্র কেনা ব্রিফের অংশ নয়।" },
    aiSteps: { en: ["Shoot a before and after for each of the six", "Reference no paid equipment", "Fit it on a printable A4"], bn: ["ছয়টির প্রতিটির আগে ও পরের ছবি তুলুন", "কোনো পেইড যন্ত্রের উল্লেখ করবেন না", "ছাপার উপযোগী এ৪-এ রাখুন"] } },
  t9: { applicants: 17, postedOrder: 77, postedLabel: { en: "11 days ago", bn: "১১ দিন আগে" },
    clientWords: { en: "We want to know if any of the posting actually brings orders.", bn: "জানতে চাই পোস্ট করে আদৌ কোনো অর্ডার আসে কিনা।" },
    aiSimple: { en: "A coupon-code sheet is the honest measurement here. Anything fancier will over-claim.", bn: "এখানে সৎ পরিমাপ হলো কুপন-কোড শিট। এর চেয়ে জমকালো কিছু বাড়িয়ে দাবি করবে।" },
    aiSteps: { en: ["One code per channel, nothing shared", "Under two minutes of staff effort a day", "Monthly summary that calculates itself"], bn: ["প্রতি চ্যানেলে একটি কোড, ভাগাভাগি নয়", "কর্মীর দৈনিক দুই মিনিটের কম", "নিজে হিসাব করা মাসিক সারসংক্ষেপ"] } },
  t14: { applicants: 5, postedOrder: 91, postedLabel: { en: "4 days ago", bn: "৪ দিন আগে" },
    clientWords: { en: "Our packaging looks the same as three years ago.", bn: "আমাদের প্যাকেজিং তিন বছর আগের মতোই দেখায়।" },
    aiSimple: { en: "A phone call to the press, written up. Two hours of work that decides whether the next twenty are wasted.", bn: "প্রেসে একটি ফোন কল, লিখে রাখা। দুই ঘণ্টার কাজ, যা ঠিক করে দেয় পরের বিশ ঘণ্টা বৃথা যাবে কিনা।" },
    aiSteps: { en: ["Confirm colours, stock, die-cut and minimum run", "Get cost at three run sizes", "Rule out impossible options in writing"], bn: ["রঙ, কাগজ, ডাই-কাট ও ন্যূনতম রান নিশ্চিত করুন", "তিনটি রান সাইজে খরচ নিন", "অসম্ভব অপশন লিখিতভাবে বাদ দিন"] } },
};

/* ── Applicants ───────────────────────────────────────────────── */

export const APPLICANTS: Record<string, Applicant[]> = {
  x6: [
    {
      studentId: "s3", matchScore: 91, appliedLabel: { en: "Applied 21 days ago", bn: "২১ দিন আগে আবেদন" }, outcome: "selected",
      pitch: {
        en: "I would agree the financial term list with you before translating a single line, so we are not arguing about vocabulary in the final draft.",
        bn: "এক লাইন অনুবাদের আগে আপনার সাথে আর্থিক পরিভাষার তালিকা চূড়ান্ত করব, যাতে চূড়ান্ত খসড়ায় শব্দ নিয়ে তর্ক না হয়।",
      },
    },
    {
      studentId: "s8", matchScore: 64, appliedLabel: { en: "Applied 21 days ago", bn: "২১ দিন আগে আবেদন" }, outcome: "not_selected",
      pitch: { en: "I can translate the full document in three days.", bn: "আমি তিন দিনে পুরো ডকুমেন্ট অনুবাদ করে দিতে পারি।" },
      reason: {
        en: "Speed was the only thing offered. The brief said Google Translate had already failed, which made the how more important than the when.",
        bn: "কেবল দ্রুততার প্রস্তাব ছিল। ব্রিফে বলা ছিল গুগল ট্রান্সলেট আগেই ব্যর্থ হয়েছে, তাই কখন-এর চেয়ে কীভাবে বেশি গুরুত্বপূর্ণ হয়ে উঠেছিল।",
      },
    },
    {
      studentId: "s2", matchScore: 58, appliedLabel: { en: "Applied 20 days ago", bn: "২০ দিন আগে আবেদন" }, outcome: "not_selected",
      pitch: { en: "I work in finance so I know the terminology well.", bn: "আমি ফিন্যান্সে কাজ করি তাই পরিভাষা ভালো জানি।" },
      reason: {
        en: "Strong on the finance side, but no sample of Bangla prose. For a translation task the writing sample is the evidence, not the domain.",
        bn: "ফিন্যান্সের দিকটা শক্ত, কিন্তু বাংলা গদ্যের কোনো নমুনা ছিল না। অনুবাদের কাজে প্রমাণ হলো লেখার নমুনা, বিষয়ের জ্ঞান নয়।",
      },
    },
  ],
  x3: [
    { studentId: "s6", matchScore: 78, appliedLabel: { en: "Applied 3 hours ago", bn: "৩ ঘণ্টা আগে আবেদন" }, outcome: "pending",
      pitch: { en: "I would transcribe 30 slips first and quote the rest from measured time.", bn: "আগে ৩০টি স্লিপ লিখে মাপা সময় থেকে বাকিটার দাম বলব।" } },
    { studentId: "s8", matchScore: 71, appliedLabel: { en: "Applied 5 hours ago", bn: "৫ ঘণ্টা আগে আবেদন" }, outcome: "pending",
      pitch: { en: "I have done a 4,000-row contact clean-up with a documented merge rule.", bn: "নথিভুক্ত মার্জ নিয়মসহ ৪,০০০ সারির কন্টাক্ট ক্লিনআপ করেছি।" } },
    { studentId: "s2", matchScore: 66, appliedLabel: { en: "Applied 6 hours ago", bn: "৬ ঘণ্টা আগে আবেদন" }, outcome: "pending",
      pitch: { en: "Available full days this week, comfortable with Bangla handwriting.", bn: "এই সপ্তাহে পুরো দিন খালি, বাংলা হাতের লেখায় স্বচ্ছন্দ।" } },
  ],
  x1: [
    { studentId: "s5", matchScore: 88, appliedLabel: { en: "Applied yesterday", bn: "গতকাল আবেদন" }, outcome: "pending",
      pitch: { en: "I would keep prices on their own layer so the late change costs you nothing.", bn: "দাম আলাদা লেয়ারে রাখব, যাতে শেষ মুহূর্তের পরিবর্তনে আপনার কিছু খরচ না হয়।" } },
    { studentId: "s3", matchScore: 62, appliedLabel: { en: "Applied 2 days ago", bn: "২ দিন আগে আবেদন" }, outcome: "pending",
      pitch: { en: "I can write the Bangla menu copy alongside the layout.", bn: "লেআউটের পাশাপাশি বাংলা মেনু কপিও লিখতে পারি।" } },
  ],
};

/* ── Submissions on a closed task ─────────────────────────────── */

export const SUBMISSIONS: Record<string, Submission[]> = {
  x6: [
    {
      id: "sub1", taskId: "x6", studentId: "s3", outcome: "accepted",
      headline: { en: "Agreed a 22-term glossary with the client before writing anything", bn: "লেখার আগেই ক্লায়েন্টের সাথে ২২টি পরিভাষার শব্দকোষ চূড়ান্ত" },
      approach: {
        en: "Read the whole brief, listed every financial term, and sent a one-page glossary for approval on day one. Translated after it came back signed. Each term is explained the first time it appears and used plainly after that.",
        bn: "পুরো ব্রিফ পড়ে প্রতিটি আর্থিক পরিভাষার তালিকা করেছেন, আর প্রথম দিনেই অনুমোদনের জন্য এক পৃষ্ঠার শব্দকোষ পাঠিয়েছেন। সই হয়ে ফিরে আসার পর অনুবাদ শুরু। প্রতিটি শব্দ প্রথমবার এলে ব্যাখ্যা, তারপর সহজভাবে ব্যবহার।",
      },
      strengths: {
        en: ["Removed the vocabulary argument before it could happen", "Sentences average 19 words — read aloud and trimmed", "Delivered a glossary the client can reuse on the next document"],
        bn: ["শব্দ নিয়ে তর্ক শুরু হওয়ার আগেই তা সরিয়ে দিয়েছেন", "বাক্যের গড় ১৯ শব্দ — জোরে পড়ে ছেঁটেছেন", "এমন শব্দকোষ দিয়েছেন যা পরের ডকুমেন্টেও কাজে লাগবে"],
      },
      gaps: { en: ["Two footnotes were left in English"], bn: ["দুটি ফুটনোট ইংরেজিতেই রয়ে গেছে"] },
      score: 24, maxScore: 25,
      aiFeedback: {
        en: "The glossary-first move is what won this, and it is repeatable. On the next translation task, propose it in the application itself rather than after selection — it is the strongest thing you do and it is currently invisible until you are already hired.",
        bn: "শব্দকোষ-আগে পদ্ধতিটিই এটি জিতিয়েছে, আর এটি পুনরাবৃত্তিযোগ্য। পরের অনুবাদ কাজে নির্বাচনের পরে নয়, আবেদনেই এটি প্রস্তাব করুন — এটি আপনার সবচেয়ে শক্তিশালী কাজ, অথচ নিয়োগ না হওয়া পর্যন্ত কেউ দেখতেই পায় না।",
      },
    },
    {
      id: "sub2", taskId: "x6", studentId: "s8", outcome: "not_selected",
      headline: { en: "Offered the fastest turnaround on the board", bn: "বোর্ডের সবচেয়ে দ্রুত ডেলিভারির প্রস্তাব" },
      approach: {
        en: "Proposed a full translation in three days at the listed fee, with a revision round included.",
        bn: "নির্ধারিত ফি-তে তিন দিনে পূর্ণ অনুবাদ, সাথে একটি রিভিশন রাউন্ড।",
      },
      strengths: { en: ["Clear, confident, and quick to respond", "Realistic about the volume"], bn: ["স্পষ্ট, আত্মবিশ্বাসী, দ্রুত সাড়া", "পরিমাণ নিয়ে বাস্তবসম্মত"] },
      gaps: {
        en: ["Nothing in the pitch addressed why the previous attempt failed", "No writing sample attached", "Speed was the only differentiator offered"],
        bn: ["আগের চেষ্টাটি কেন ব্যর্থ হয়েছিল তা পিচে ছিল না", "কোনো লেখার নমুনা সংযুক্ত ছিল না", "পার্থক্য হিসেবে কেবল দ্রুততা"],
      },
      aiFeedback: {
        en: "The brief told you the failure mode — Google Translate had already been tried and read like a machine. Any pitch that does not answer that reads as if the brief was skimmed. Next time, quote the client's own words back and say what you would do differently; a two-paragraph sample of your Bangla prose would have beaten three days of speed.",
        bn: "ব্রিফেই ব্যর্থতার কারণ বলা ছিল — গুগল ট্রান্সলেট আগেই চেষ্টা হয়েছে ও যন্ত্রের মতো শোনায়। যে পিচ এর উত্তর দেয় না, সেটি পড়লে মনে হয় ব্রিফটা ভাসাভাসা দেখা হয়েছে। পরেরবার ক্লায়েন্টের নিজের কথা উদ্ধৃত করে বলুন আপনি কী আলাদা করবেন; আপনার বাংলা গদ্যের দুই অনুচ্ছেদের নমুনা তিন দিনের দ্রুততাকে হারিয়ে দিত।",
      },
    },
    {
      id: "sub3", taskId: "x6", studentId: "s2", outcome: "not_selected",
      headline: { en: "Led with domain knowledge instead of writing", bn: "লেখার বদলে বিষয়জ্ঞান সামনে এনেছেন" },
      approach: {
        en: "Pitched on finance background — comfortable with the terminology, has built models and read investor material before.",
        bn: "ফিন্যান্স ব্যাকগ্রাউন্ড নিয়ে পিচ — পরিভাষায় স্বচ্ছন্দ, আগে মডেল বানিয়েছেন ও ইনভেস্টর ম্যাটেরিয়াল পড়েছেন।",
      },
      strengths: { en: ["Genuinely strong on the subject matter", "Would not mistranslate a financial concept"], bn: ["বিষয়ের ওপর সত্যিই শক্ত দখল", "কোনো আর্থিক ধারণা ভুল অনুবাদ করতেন না"] },
      gaps: {
        en: ["No Bangla writing sample of any kind", "Treated the task as a finance task rather than a writing task"],
        bn: ["কোনো ধরনের বাংলা লেখার নমুনা নেই", "কাজটিকে লেখার কাজ নয়, ফিন্যান্সের কাজ ধরে নিয়েছেন"],
      },
      aiFeedback: {
        en: "Your finance knowledge is a real advantage here and it was wasted, because the client could not see your prose. The winning application had weaker finance and a visible sample. Pair the two next time — translate one paragraph of the brief for free and attach it. On a writing task, a sample beats a claim every single time.",
        bn: "এখানে আপনার ফিন্যান্স জ্ঞান সত্যিকারের সুবিধা, আর সেটি বৃথা গেছে — কারণ ক্লায়েন্ট আপনার গদ্য দেখতে পাননি। যিনি জিতেছেন তার ফিন্যান্স দুর্বল ছিল, কিন্তু নমুনা দৃশ্যমান ছিল। পরেরবার দুটো মেলান — ব্রিফের একটি অনুচ্ছেদ বিনামূল্যে অনুবাদ করে সংযুক্ত করুন। লেখার কাজে দাবির চেয়ে নমুনা প্রতিবারই জেতে।",
      },
    },
  ],
};

/* ── Combined access ──────────────────────────────────────────── */

export const ALL_TASKS: Task[] = [...TASKS, ...EXTRA_TASKS];
export const ALL_JOBS: Job[] = [...JOBS, ...EXTRA_JOBS];

export const anyTaskById = (id: string) => ALL_TASKS.find((t) => t.id === id);
export const anyJobById = (id: string) => ALL_JOBS.find((j) => j.id === id);
export const metaOf = (id: string) => TASK_META[id];
export const applicantsOf = (id: string) => APPLICANTS[id] ?? [];
export const submissionsOf = (id: string) => SUBMISSIONS[id] ?? [];

/** Only tasks the board should show: those with a written brief behind them. */
export const BOARD_TASKS: Task[] = ALL_TASKS.filter((t) => TASK_META[t.id]).sort(
  (a, b) => (TASK_META[b.id]?.postedOrder ?? 0) - (TASK_META[a.id]?.postedOrder ?? 0)
);

/** Every skill mentioned across the board, for the filter row. */
export const BOARD_SKILLS: string[] = Array.from(new Set(BOARD_TASKS.flatMap((t) => t.skills))).sort();
