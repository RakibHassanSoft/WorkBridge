import type { Evaluation, Job, Task } from "./types";

/* ────────────────────────────────────────────────────────────────
   Demo jobs — a client's raw problem statement, the AI's scope,
   and the task graph the AI decomposed it into.
   ──────────────────────────────────────────────────────────────── */

export const JOBS: Job[] = [
  {
    id: "j1",
    ref: "WB-2481",
    clientId: "c1",
    title: { en: "Online orders keep failing and we can't see what sells", bn: "অনলাইন অর্ডার বারবার ফেল করছে, কী বিক্রি হচ্ছে বোঝা যাচ্ছে না" },
    brief: {
      en: "About one in four customers drops off at checkout on our website and we don't know why. We also have no idea which of our 240 products actually sell — we guess from memory when we reorder fabric. We're a 9-person boutique, we don't have a tech person.",
      bn: "আমাদের ওয়েবসাইটে প্রতি চারজন কাস্টমারের একজন চেকআউটে গিয়ে চলে যায়, কেন জানি না। আমাদের ২৪০টি প্রোডাক্টের মধ্যে আসলে কোনটা বিক্রি হয় সেটাও জানি না — কাপড় রিঅর্ডারের সময় স্মৃতি থেকে অনুমান করি। আমরা ৯ জনের একটা বুটিক, আমাদের কোনো টেক লোক নেই।",
    },
    sectorId: "it",
    budget: 24000,
    postedLabel: { en: "Posted 6 days ago", bn: "৬ দিন আগে পোস্ট করা" },
    status: "active",
    ai: {
      summary: {
        en: "Two separable problems in one brief: a broken conversion funnel and an absent sales-reporting layer. Split so the revenue leak is fixed first, then reporting is built on clean data. No new platform needed — instrument the existing store.",
        bn: "একটি ব্রিফে দুটি আলাদা সমস্যা: ভাঙা কনভার্সন ফানেল এবং সেলস-রিপোর্টিং লেয়ারের অনুপস্থিতি। ভাগ করা হয়েছে যাতে আগে রেভিনিউ লিক বন্ধ হয়, পরে পরিষ্কার ডেটার ওপর রিপোর্টিং দাঁড়ায়। নতুন প্ল্যাটফর্ম লাগবে না — বিদ্যমান স্টোরেই ইনস্ট্রুমেন্ট বসবে।",
      },
      complexity: "Medium",
      confidence: 91,
      estHours: 38,
      suggestedFee: 22400,
      risks: {
        en: [
          "Checkout failure may be a payment-gateway issue outside the store — task 1 diagnoses before anyone builds.",
          "Product catalogue is likely inconsistent; reporting is unreliable until it is normalised.",
          "Client has no staging site — mentor must approve any live change.",
        ],
        bn: [
          "চেকআউট ফেইলিওর স্টোরের বাইরে পেমেন্ট গেটওয়ের সমস্যা হতে পারে — টাস্ক ১ বানানোর আগেই নির্ণয় করবে।",
          "প্রোডাক্ট ক্যাটালগ সম্ভবত অসামঞ্জস্যপূর্ণ; নরমালাইজ না হওয়া পর্যন্ত রিপোর্টিং নির্ভরযোগ্য নয়।",
          "ক্লায়েন্টের স্টেজিং সাইট নেই — লাইভ পরিবর্তনে মেন্টরের অনুমোদন লাগবে।",
        ],
      },
      skills: ["Analytics", "JavaScript", "Data cleaning", "Dashboards", "QA"],
    },
    taskIds: ["t1", "t2", "t3", "t4", "t5"],
  },
  {
    id: "j2",
    ref: "WB-2503",
    clientId: "c2",
    title: { en: "Bring social media in-house instead of paying an agency", bn: "এজেন্সিকে টাকা না দিয়ে সোশ্যাল মিডিয়া নিজেরাই চালাতে চাই" },
    brief: {
      en: "We pay an agency ৳25,000 a month and get 12 posts we don't like. We have 4 outlets and a decent camera. We want a month of content we can shoot ourselves, and to finally know if any of it drives orders.",
      bn: "আমরা এজেন্সিকে মাসে ৳২৫,০০০ দিই আর ১২টা পোস্ট পাই যা আমাদের পছন্দ হয় না। আমাদের ৪টি আউটলেট আর একটা ভালো ক্যামেরা আছে। আমরা এক মাসের কনটেন্ট চাই যা নিজেরাই শুট করতে পারব, আর জানতে চাই এতে আসলে অর্ডার বাড়ে কিনা।",
    },
    sectorId: "mkt",
    budget: 12000,
    postedLabel: { en: "Posted 2 days ago", bn: "২ দিন আগে পোস্ট করা" },
    status: "matching",
    ai: {
      summary: {
        en: "A capability-transfer job, not a content job. The deliverable that matters is a repeatable system the outlet manager can run alone in month two — so a shoot guide and a measurement sheet are weighted above the posts themselves.",
        bn: "এটি কনটেন্ট নয়, সক্ষমতা-হস্তান্তরের কাজ। আসল ডেলিভারেবল এমন একটি পুনরাবৃত্তিযোগ্য সিস্টেম যা দ্বিতীয় মাসে আউটলেট ম্যানেজার একাই চালাতে পারবেন — তাই শুট গাইড ও মেজারমেন্ট শিটকে পোস্টের চেয়ে বেশি গুরুত্ব দেওয়া হয়েছে।",
      },
      complexity: "Low",
      confidence: 87,
      estHours: 22,
      suggestedFee: 11400,
      risks: {
        en: [
          "Client owns no brand guideline — a one-page style sheet has to be created first.",
          "Attribution will be approximate; a single-channel coupon code is the honest measurement.",
        ],
        bn: [
          "ক্লায়েন্টের কোনো ব্র্যান্ড গাইডলাইন নেই — প্রথমে এক পৃষ্ঠার স্টাইল শিট বানাতে হবে।",
          "অ্যাট্রিবিউশন আনুমানিক হবে; একটি চ্যানেল-নির্দিষ্ট কুপন কোডই সৎ পরিমাপ।",
        ],
      },
      skills: ["Content strategy", "Bangla copy", "Photography direction", "Analytics"],
    },
    taskIds: ["t6", "t7", "t8", "t9"],
  },
  {
    id: "j3",
    ref: "WB-2517",
    clientId: "c3",
    title: { en: "Three seasons of farmer records are sitting in paper registers", bn: "তিন মৌসুমের কৃষক রেকর্ড কাগজের রেজিস্টারে পড়ে আছে" },
    brief: {
      en: "We supply seed and fertiliser to about 600 farmers in Bogura. Everything is written in registers. We can't tell who buys regularly, who has stopped, or what we should stock next season.",
      bn: "আমরা বগুড়ায় প্রায় ৬০০ কৃষককে বীজ ও সার সরবরাহ করি। সবকিছু রেজিস্টারে লেখা। কে নিয়মিত কেনে, কে বন্ধ করে দিয়েছে, বা আগামী মৌসুমে কী স্টক করা উচিত — কিছুই বলতে পারি না।",
    },
    sectorId: "admin",
    budget: 9500,
    postedLabel: { en: "Posted 11 days ago", bn: "১১ দিন আগে পোস্ট করা" },
    status: "review",
    ai: {
      summary: {
        en: "Classic digitisation-then-insight job. Sequenced strictly: schema before entry, double-entry verification on a 10% sample before any analysis, and a template the client's own staff can keep filling.",
        bn: "সাধারণ ডিজিটাইজেশন-তারপর-অন্তর্দৃষ্টির কাজ। কঠোরভাবে ধাপে সাজানো: এন্ট্রির আগে স্কিমা, বিশ্লেষণের আগে ১০% নমুনায় ডাবল-এন্ট্রি যাচাই, আর এমন টেমপ্লেট যা ক্লায়েন্টের নিজের কর্মীরাই ভরে যেতে পারবেন।",
      },
      complexity: "Low",
      confidence: 94,
      estHours: 31,
      suggestedFee: 9200,
      risks: {
        en: [
          "Handwriting quality varies by register — a 30-page sample is transcribed first to price the rest honestly.",
          "Farmer names repeat with spelling variants; fuzzy de-duplication needs a human decision rule.",
        ],
        bn: [
          "রেজিস্টার ভেদে হাতের লেখার মান আলাদা — বাকিটা সৎভাবে মূল্য নির্ধারণের জন্য প্রথমে ৩০ পৃষ্ঠার নমুনা লেখা হবে।",
          "কৃষকের নাম বানানভেদে পুনরাবৃত্ত হয়; ফাজি ডি-ডুপ্লিকেশনে মানুষের সিদ্ধান্তের নিয়ম লাগবে।",
        ],
      },
      skills: ["Data entry", "Excel", "Data cleaning", "Bangla transcription"],
    },
    taskIds: ["t10", "t11", "t12", "t13"],
  },
  {
    id: "j4",
    ref: "WB-2534",
    clientId: "c1",
    title: { en: "Eid packaging and gift-set labels need a refresh", bn: "ঈদের প্যাকেজিং ও গিফট-সেট লেবেল নতুন করে দরকার" },
    brief: {
      en: "Our packaging looks the same as three years ago. We need something that photographs well for Instagram and still prints cheap at our local press.",
      bn: "আমাদের প্যাকেজিং তিন বছর আগের মতোই দেখায়। এমন কিছু দরকার যা ইনস্টাগ্রামে ভালো ছবি হয়, আবার স্থানীয় প্রেসে সস্তায় ছাপা যায়।",
    },
    sectorId: "design",
    budget: 8000,
    postedLabel: { en: "Posted 1 day ago", bn: "১ দিন আগে পোস্ট করা" },
    status: "scoping",
    ai: {
      summary: {
        en: "Constraint-led design brief: the print budget and a two-colour local press are the real specification. Scoped so press feasibility is confirmed before any concept is polished.",
        bn: "সীমাবদ্ধতা-নির্ভর ডিজাইন ব্রিফ: প্রিন্ট বাজেট ও দুই-রঙা স্থানীয় প্রেসই আসল স্পেসিফিকেশন। এমনভাবে সাজানো যাতে কোনো কনসেপ্ট পালিশ করার আগেই প্রেস সম্ভাব্যতা নিশ্চিত হয়।",
      },
      complexity: "Low",
      confidence: 89,
      estHours: 18,
      suggestedFee: 7600,
      risks: {
        en: ["Local press capability is unverified — a spec call is task 1.", "Client has no vector logo; a redraw may be needed."],
        bn: ["স্থানীয় প্রেসের সক্ষমতা যাচাই হয়নি — স্পেক কল-ই টাস্ক ১।", "ক্লায়েন্টের ভেক্টর লোগো নেই; নতুন করে আঁকতে হতে পারে।"],
      },
      skills: ["Packaging design", "Print prep", "Illustrator", "Photography direction"],
    },
    taskIds: ["t14", "t15", "t16"],
  },
  {
    id: "j5",
    ref: "WB-2402",
    clientId: "c1",
    title: { en: "Bangla product descriptions for 60 new items", bn: "৬০টি নতুন আইটেমের বাংলা প্রোডাক্ট ডেসক্রিপশন" },
    brief: {
      en: "Our new season has 60 pieces going online and the descriptions are one line each, copied from the tag. Customers ask us the same three questions in the inbox every single day. We want descriptions that answer those before anyone has to ask.",
      bn: "নতুন সিজনের ৬০টি পিস অনলাইনে যাচ্ছে, প্রতিটির ডেসক্রিপশন ট্যাগ থেকে কপি করা এক লাইন। কাস্টমাররা প্রতিদিন ইনবক্সে একই তিনটি প্রশ্ন করেন। আমরা এমন ডেসক্রিপশন চাই যা প্রশ্ন করার আগেই উত্তর দেয়।",
    },
    sectorId: "content",
    budget: 9000,
    postedLabel: { en: "Posted 3 weeks ago", bn: "৩ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "The real deliverable is a repeatable description template, not 60 pieces of prose. Scoped so the inbox questions are mined first and the template is proved on 10 items before the remaining 50 are written.",
        bn: "আসল ডেলিভারেবল ৬০টি গদ্য নয়, একটি পুনরাবৃত্তিযোগ্য ডেসক্রিপশন টেমপ্লেট। এমনভাবে সাজানো যে আগে ইনবক্সের প্রশ্নগুলো বের করা হয়, ১০টি আইটেমে টেমপ্লেট প্রমাণিত হয়, তারপর বাকি ৫০টি লেখা হয়।",
      },
      complexity: "Low",
      confidence: 92,
      estHours: 20,
      suggestedFee: 8600,
      risks: {
        en: [
          "Fabric and care details may not exist in writing anywhere — the client has to supply them or they get left out.",
          "Bangla and English versions must not drift apart as items are added later.",
        ],
        bn: [
          "কাপড় ও যত্নের তথ্য কোথাও লিখিত না-ও থাকতে পারে — ক্লায়েন্টকে দিতে হবে, নইলে বাদ যাবে।",
          "পরে আইটেম যোগ হলে বাংলা ও ইংরেজি সংস্করণ যেন আলাদা হয়ে না যায়।",
        ],
      },
      skills: ["Bangla copy", "SEO writing", "Editing"],
    },
    taskIds: ["t17", "t18", "t19"],
  },
  {
    id: "j6",
    ref: "WB-2549",
    clientId: "c1",
    title: { en: "Stockroom counts never match the system", bn: "স্টকরুমের গণনা সিস্টেমের সাথে কখনো মেলে না" },
    brief: {
      en: "Every month our physical count is off from what the system says, sometimes by 30 or 40 pieces. Staff write transfers between the shop and the stockroom on a notepad. We do not want new software, we want to know where it is leaking.",
      bn: "প্রতি মাসে আমাদের ফিজিক্যাল কাউন্ট সিস্টেমের সাথে মেলে না, কখনো ৩০-৪০ পিস পর্যন্ত। কর্মীরা দোকান ও স্টকরুমের মধ্যে ট্রান্সফার নোটপ্যাডে লেখেন। আমরা নতুন সফটওয়্যার চাই না, জানতে চাই লিকটা কোথায়।",
    },
    sectorId: "admin",
    budget: 7000,
    postedLabel: { en: "Posted 4 days ago", bn: "৪ দিন আগে পোস্ট করা" },
    status: "matching",
    ai: {
      summary: {
        en: "Diagnosis before tooling. Scoped to reconstruct one month of movement from the notepads, locate where the discrepancy enters, and hand back a counting procedure — no software purchase implied.",
        bn: "টুলের আগে নির্ণয়। নোটপ্যাড থেকে এক মাসের গতিবিধি পুনর্গঠন, অসঙ্গতি কোথায় ঢোকে তা শনাক্ত, আর একটি গণনা পদ্ধতি হস্তান্তর — কোনো সফটওয়্যার কেনার ইঙ্গিত নেই।",
      },
      complexity: "Medium",
      confidence: 84,
      estHours: 24,
      suggestedFee: 6800,
      risks: {
        en: [
          "Notepad records may be incomplete for some days; those gaps are reported, not estimated.",
          "The cause may be behavioural rather than clerical, which is a management finding, not a data one.",
        ],
        bn: [
          "কিছু দিনের নোটপ্যাড রেকর্ড অসম্পূর্ণ থাকতে পারে; সেই ফাঁকগুলো অনুমান নয়, রিপোর্ট করা হবে।",
          "কারণটি কেরানিগত নয়, আচরণগত হতে পারে — যা ডেটার নয়, ব্যবস্থাপনার ফলাফল।",
        ],
      },
      skills: ["Data cleaning", "Excel", "Process mapping"],
    },
    taskIds: ["t20", "t21", "t22"],
  },
];

export const TASKS: Task[] = [
  /* ── J1 ── */
  {
    id: "t1", jobId: "j1", seq: 1,
    title: { en: "Diagnose the checkout drop-off", bn: "চেকআউট ড্রপ-অফ নির্ণয় করা" },
    desc: { en: "Reproduce the failure across 3 devices and 2 payment methods, capture console + network errors, and write a one-page cause note.", bn: "৩টি ডিভাইস ও ২টি পেমেন্ট মেথডে সমস্যাটি পুনরায় ঘটানো, কনসোল ও নেটওয়ার্ক এরর ধরা, এবং এক পৃষ্ঠার কারণ-নোট লেখা।" },
    sectorId: "it", fee: 2500, hours: 5, level: "micro",
    skills: ["QA", "Debugging"], status: "approved", assignee: "s1", progress: 100,
    dueLabel: { en: "Delivered day 2", bn: "২য় দিনে ডেলিভার" },
    acceptance: { en: ["Failure reproduced with evidence", "Root cause identified or ruled out", "Written in non-technical language"], bn: ["প্রমাণসহ সমস্যা পুনরায় ঘটানো", "মূল কারণ শনাক্ত বা বাতিল", "অ-কারিগরি ভাষায় লেখা"] },
  },
  {
    id: "t2", jobId: "j1", seq: 2,
    title: { en: "Fix the payment callback and add error messaging", bn: "পেমেন্ট কলব্যাক ঠিক করা ও এরর মেসেজ যোগ করা" },
    desc: { en: "Repair the failing gateway callback identified in task 1 and replace silent failures with a clear Bangla + English message.", bn: "টাস্ক ১-এ শনাক্ত হওয়া গেটওয়ে কলব্যাক ঠিক করা এবং নীরব ব্যর্থতার বদলে স্পষ্ট বাংলা ও ইংরেজি বার্তা দেখানো।" },
    sectorId: "it", fee: 6000, hours: 10, level: "standard",
    skills: ["JavaScript", "APIs"], status: "approved", assignee: "s1", progress: 100,
    dueLabel: { en: "Delivered day 5", bn: "৫ম দিনে ডেলিভার" },
    acceptance: { en: ["Test transaction completes end to end", "Failure states show a readable message", "No regression on mobile"], bn: ["টেস্ট লেনদেন শুরু থেকে শেষ সম্পন্ন", "ব্যর্থ অবস্থায় পাঠযোগ্য বার্তা", "মোবাইলে কোনো রিগ্রেশন নেই"] },
    dependsOn: ["t1"],
  },
  {
    id: "t3", jobId: "j1", seq: 3,
    title: { en: "Normalise the 240-product catalogue", bn: "২৪০টি প্রোডাক্টের ক্যাটালগ নরমালাইজ করা" },
    desc: { en: "De-duplicate variants, standardise category and size fields, and produce a clean export the reporting layer can trust.", bn: "ভ্যারিয়েন্ট ডি-ডুপ্লিকেট করা, ক্যাটাগরি ও সাইজ ফিল্ড স্ট্যান্ডার্ডাইজ করা, এবং রিপোর্টিং লেয়ার নির্ভর করতে পারে এমন পরিষ্কার এক্সপোর্ট তৈরি।" },
    sectorId: "admin", fee: 3000, hours: 8, level: "micro",
    skills: ["Data cleaning", "Excel"], status: "in_review", assignee: "s2", progress: 100,
    dueLabel: { en: "In mentor review", bn: "মেন্টর রিভিউতে" },
    acceptance: { en: ["Zero duplicate SKUs", "Every product has a category", "Change log included"], bn: ["কোনো ডুপ্লিকেট এসকেইউ নেই", "প্রতিটি প্রোডাক্টের ক্যাটাগরি আছে", "চেঞ্জ লগ সংযুক্ত"] },
  },
  {
    id: "t4", jobId: "j1", seq: 4,
    title: { en: "Build the weekly sales dashboard", bn: "সাপ্তাহিক সেলস ড্যাশবোর্ড তৈরি" },
    desc: { en: "A single page showing top and bottom sellers, week-on-week movement, and stock-out risk — readable on a phone.", bn: "এক পৃষ্ঠায় সর্বোচ্চ ও সর্বনিম্ন বিক্রি, সপ্তাহভিত্তিক পরিবর্তন এবং স্টক-আউট ঝুঁকি — ফোনে পড়ার মতো।" },
    sectorId: "it", fee: 7500, hours: 12, level: "standard",
    skills: ["Dashboards", "React"], status: "in_progress", assignee: "s1", progress: 55,
    dueLabel: { en: "Due in 3 days", bn: "৩ দিনের মধ্যে" },
    acceptance: { en: ["Loads in under 3 seconds on 4G", "Owner can read it without training", "Numbers reconcile with the store"], bn: ["৪জি-তে ৩ সেকেন্ডের কম লোড", "প্রশিক্ষণ ছাড়াই মালিক পড়তে পারেন", "সংখ্যা স্টোরের সাথে মেলে"] },
    dependsOn: ["t3"],
  },
  {
    id: "t5", jobId: "j1", seq: 5,
    title: { en: "Handover: 20-minute walkthrough + one-page guide", bn: "হ্যান্ডওভার: ২০ মিনিটের ওয়াকথ্রু ও এক পৃষ্ঠার গাইড" },
    desc: { en: "Record a Bangla screen walkthrough and write a one-page guide so the owner can use everything without calling anyone.", bn: "বাংলায় স্ক্রিন ওয়াকথ্রু রেকর্ড করা এবং এক পৃষ্ঠার গাইড লেখা, যাতে মালিক কাউকে না ডেকেই সব ব্যবহার করতে পারেন।" },
    sectorId: "content", fee: 2000, hours: 3, level: "micro",
    skills: ["Bangla writing", "Screen recording"], status: "matching", progress: 0,
    dueLabel: { en: "Starts after task 4", bn: "টাস্ক ৪-এর পরে শুরু" },
    acceptance: { en: ["Video under 20 minutes", "Guide fits one printed page", "Owner confirms understanding"], bn: ["ভিডিও ২০ মিনিটের কম", "গাইড এক পৃষ্ঠায়", "মালিক বুঝেছেন বলে নিশ্চিত করেছেন"] },
    dependsOn: ["t4"],
  },

  /* ── J2 ── */
  {
    id: "t6", jobId: "j2", seq: 1,
    title: { en: "One-page brand style sheet", bn: "এক পৃষ্ঠার ব্র্যান্ড স্টাইল শিট" },
    desc: { en: "Lock colours, typefaces, logo usage and photo mood from existing outlet photos.", bn: "বিদ্যমান আউটলেট ছবি থেকে রঙ, টাইপফেস, লোগো ব্যবহার ও ফটো মুড নির্ধারণ।" },
    sectorId: "design", fee: 2000, hours: 4, level: "micro",
    skills: ["Brand basics", "Figma"], status: "open", progress: 0,
    dueLabel: { en: "Open — 4 candidates", bn: "খোলা — ৪ জন প্রার্থী" },
    acceptance: { en: ["Fits on one page", "Uses only existing assets", "Print + screen colour values"], bn: ["এক পৃষ্ঠায়", "কেবল বিদ্যমান অ্যাসেট", "প্রিন্ট ও স্ক্রিন রঙের মান"] },
  },
  {
    id: "t7", jobId: "j2", seq: 2,
    title: { en: "30-day bilingual content calendar", bn: "৩০ দিনের দ্বিভাষিক কনটেন্ট ক্যালেন্ডার" },
    desc: { en: "30 posts with Bangla and English captions, hook lines, and a shot list the outlet manager can execute.", bn: "৩০টি পোস্ট — বাংলা ও ইংরেজি ক্যাপশন, হুক লাইন এবং আউটলেট ম্যানেজার চালাতে পারবেন এমন শট লিস্ট।" },
    sectorId: "content", fee: 4500, hours: 9, level: "standard",
    skills: ["Bangla copy", "Content strategy"], status: "open", progress: 0,
    dueLabel: { en: "Open — 7 candidates", bn: "খোলা — ৭ জন প্রার্থী" },
    acceptance: { en: ["Every post has a shot instruction", "No caption over 220 characters", "At least 8 posts need no new photo"], bn: ["প্রতিটি পোস্টে শট নির্দেশনা", "কোনো ক্যাপশন ২২০ অক্ষরের বেশি নয়", "অন্তত ৮টি পোস্টে নতুন ছবি লাগবে না"] },
    dependsOn: ["t6"],
  },
  {
    id: "t8", jobId: "j2", seq: 3,
    title: { en: "Phone photography guide for outlet staff", bn: "আউটলেট কর্মীদের জন্য ফোন ফটোগ্রাফি গাইড" },
    desc: { en: "A visual guide showing 6 repeatable food shots using window light and a phone — no equipment purchase.", bn: "জানালার আলো ও ফোন দিয়ে ৬টি পুনরাবৃত্তিযোগ্য ফুড শটের ভিজ্যুয়াল গাইড — কোনো যন্ত্র কিনতে হবে না।" },
    sectorId: "design", fee: 2500, hours: 5, level: "micro",
    skills: ["Photography", "Layout"], status: "open", progress: 0,
    dueLabel: { en: "Open — 3 candidates", bn: "খোলা — ৩ জন প্রার্থী" },
    acceptance: { en: ["Shot before/after examples", "No paid equipment referenced", "Printable A4"], bn: ["আগে/পরে উদাহরণ", "কোনো পেইড যন্ত্রের উল্লেখ নেই", "এ৪-এ ছাপার উপযোগী"] },
  },
  {
    id: "t9", jobId: "j2", seq: 4,
    title: { en: "Attribution sheet with coupon-code tracking", bn: "কুপন-কোড ট্র্যাকিংসহ অ্যাট্রিবিউশন শিট" },
    desc: { en: "A simple sheet linking each channel to a coupon code so the owner sees which posts actually created orders.", bn: "প্রতিটি চ্যানেলকে একটি কুপন কোডের সাথে যুক্ত করা সাধারণ শিট, যাতে মালিক দেখতে পান কোন পোস্ট আসলে অর্ডার এনেছে।" },
    sectorId: "biz", fee: 2000, hours: 4, level: "micro",
    skills: ["Excel", "Analytics"], status: "open", progress: 0,
    dueLabel: { en: "Open — 5 candidates", bn: "খোলা — ৫ জন প্রার্থী" },
    acceptance: { en: ["Works without any paid tool", "Staff can fill it in under 2 minutes daily", "Monthly summary auto-calculates"], bn: ["কোনো পেইড টুল ছাড়াই চলে", "কর্মীরা দৈনিক ২ মিনিটে ভরতে পারেন", "মাসিক সারসংক্ষেপ স্বয়ংক্রিয়"] },
  },

  /* ── J3 ── */
  {
    id: "t10", jobId: "j3", seq: 1,
    title: { en: "Design the record schema + transcribe a 30-page sample", bn: "রেকর্ড স্কিমা ডিজাইন ও ৩০ পৃষ্ঠার নমুনা লেখা" },
    desc: { en: "Agree the columns with the client, then transcribe a representative sample to measure real time-per-page.", bn: "ক্লায়েন্টের সাথে কলাম চূড়ান্ত করা, তারপর প্রতিনিধিত্বমূলক নমুনা লিখে প্রতি পৃষ্ঠায় প্রকৃত সময় মাপা।" },
    sectorId: "admin", fee: 1500, hours: 4, level: "micro",
    skills: ["Data entry", "Bangla transcription"], status: "approved", assignee: "s6", progress: 100,
    dueLabel: { en: "Delivered day 3", bn: "৩য় দিনে ডেলিভার" },
    acceptance: { en: ["Schema signed off by client", "Sample transcribed at 99% accuracy", "Time-per-page measured"], bn: ["ক্লায়েন্টের স্কিমা অনুমোদন", "নমুনা ৯৯% নির্ভুলতায় লেখা", "প্রতি পৃষ্ঠার সময় মাপা"] },
  },
  {
    id: "t11", jobId: "j3", seq: 2,
    title: { en: "Digitise 3 seasons of registers", bn: "৩ মৌসুমের রেজিস্টার ডিজিটাইজ" },
    desc: { en: "Enter all remaining pages into the agreed schema with a 10% double-entry verification pass.", bn: "বাকি সব পৃষ্ঠা নির্ধারিত স্কিমায় এন্ট্রি করা, ১০% ডাবল-এন্ট্রি যাচাইসহ।" },
    sectorId: "admin", fee: 4000, hours: 16, level: "standard",
    skills: ["Data entry", "Excel"], status: "approved", assignee: "s6", progress: 100,
    dueLabel: { en: "Delivered day 9", bn: "৯ম দিনে ডেলিভার" },
    acceptance: { en: ["≥99% accuracy on the verification sample", "No blank mandatory fields", "Source page number on every row"], bn: ["যাচাই নমুনায় ৯৯%+ নির্ভুলতা", "কোনো বাধ্যতামূলক ফিল্ড ফাঁকা নয়", "প্রতিটি সারিতে সোর্স পৃষ্ঠা নম্বর"] },
    dependsOn: ["t10"],
  },
  {
    id: "t12", jobId: "j3", seq: 3,
    title: { en: "De-duplicate farmers and build the customer view", bn: "কৃষক ডি-ডুপ্লিকেট ও কাস্টমার ভিউ তৈরি" },
    desc: { en: "Resolve spelling variants into single farmer records and produce active / lapsed / dormant segments.", bn: "বানানের ভিন্নতা মিলিয়ে একক কৃষক রেকর্ড তৈরি এবং সক্রিয় / নিষ্ক্রিয় / সুপ্ত সেগমেন্ট বের করা।" },
    sectorId: "biz", fee: 2500, hours: 7, level: "standard",
    skills: ["Data cleaning", "Excel"], status: "in_review", assignee: "s2", progress: 100,
    dueLabel: { en: "In mentor review", bn: "মেন্টর রিভিউতে" },
    acceptance: { en: ["Merge decisions documented", "Segments defined in writing", "Client can re-run the rule next season"], bn: ["মার্জ সিদ্ধান্ত নথিভুক্ত", "সেগমেন্টের লিখিত সংজ্ঞা", "আগামী মৌসুমে ক্লায়েন্ট নিজেই নিয়ম চালাতে পারবেন"] },
    dependsOn: ["t11"],
  },
  {
    id: "t13", jobId: "j3", seq: 4,
    title: { en: "Next-season stocking recommendation", bn: "আগামী মৌসুমের স্টকিং সুপারিশ" },
    desc: { en: "A two-page note: what to stock more of, what to drop, and which lapsed farmers to call first.", bn: "দুই পৃষ্ঠার নোট: কী বেশি স্টক করতে হবে, কী বাদ দিতে হবে, আর কোন নিষ্ক্রিয় কৃষকদের আগে ফোন করতে হবে।" },
    sectorId: "agri", fee: 1500, hours: 4, level: "micro",
    skills: ["Analysis", "Bangla reporting"], status: "revision", assignee: "s6", progress: 80,
    dueLabel: { en: "Revision requested", bn: "রিভিশন চাওয়া হয়েছে" },
    acceptance: { en: ["Every claim traced to the data", "Written in Bangla", "Top 20 call list attached"], bn: ["প্রতিটি দাবি ডেটার সাথে যুক্ত", "বাংলায় লেখা", "শীর্ষ ২০ কল লিস্ট সংযুক্ত"] },
    dependsOn: ["t12"],
  },

  /* ── J4 ── */
  {
    id: "t14", jobId: "j4", seq: 1,
    title: { en: "Confirm press specification and constraints", bn: "প্রেস স্পেসিফিকেশন ও সীমাবদ্ধতা নিশ্চিত করা" },
    desc: { en: "Call the local press, confirm colours, stock, die-cut options and minimum run, and write the design constraints.", bn: "স্থানীয় প্রেসে কল করে রঙ, কাগজ, ডাই-কাট অপশন ও ন্যূনতম রান নিশ্চিত করা এবং ডিজাইন সীমাবদ্ধতা লেখা।" },
    sectorId: "design", fee: 1000, hours: 2, level: "micro",
    skills: ["Print prep"], status: "matching", progress: 0,
    dueLabel: { en: "Matching now", bn: "এখন ম্যাচিং হচ্ছে" },
    acceptance: { en: ["Written spec confirmed by press", "Cost per unit at 3 run sizes", "Any impossible option ruled out"], bn: ["প্রেস কর্তৃক নিশ্চিত লিখিত স্পেক", "৩টি রান সাইজে ইউনিট খরচ", "অসম্ভব অপশন বাদ"] },
  },
  {
    id: "t15", jobId: "j4", seq: 2,
    title: { en: "Three packaging concepts within the press spec", bn: "প্রেস স্পেকের মধ্যে তিনটি প্যাকেজিং কনসেপ্ট" },
    desc: { en: "Three distinct directions, each rendered flat and mocked on a photographed box.", bn: "তিনটি আলাদা দিক, প্রতিটি ফ্ল্যাট রেন্ডার ও ছবি তোলা বাক্সে মকআপ।" },
    sectorId: "design", fee: 4000, hours: 10, level: "standard",
    skills: ["Packaging design", "Illustrator"], status: "matching", progress: 0,
    dueLabel: { en: "Starts after task 1", bn: "টাস্ক ১-এর পরে শুরু" },
    acceptance: { en: ["All three printable within spec", "Bangla and English lockups", "Editable source files"], bn: ["তিনটিই স্পেকের মধ্যে ছাপার উপযোগী", "বাংলা ও ইংরেজি লকআপ", "এডিটযোগ্য সোর্স ফাইল"] },
    dependsOn: ["t14"],
  },
  {
    id: "t16", jobId: "j4", seq: 3,
    title: { en: "Print-ready files for the chosen concept", bn: "নির্বাচিত কনসেপ্টের প্রিন্ট-রেডি ফাইল" },
    desc: { en: "Bleed, crop marks, colour separation and a packaged folder the press can open without questions.", bn: "ব্লিড, ক্রপ মার্ক, কালার সেপারেশন এবং প্রশ্ন ছাড়াই প্রেস খুলতে পারে এমন প্যাকেজড ফোল্ডার।" },
    sectorId: "design", fee: 2500, hours: 6, level: "standard",
    skills: ["Print prep", "Illustrator"], status: "matching", progress: 0,
    dueLabel: { en: "Starts after task 2", bn: "টাস্ক ২-এর পরে শুরু" },
    acceptance: { en: ["Press opens files without a callback", "3mm bleed on all edges", "Fonts outlined or packaged"], bn: ["প্রেস কল ছাড়াই ফাইল খোলে", "সব প্রান্তে ৩ মিমি ব্লিড", "ফন্ট আউটলাইন বা প্যাকেজড"] },
    dependsOn: ["t15"],
  },

  /* ── J5 ── */
  {
    id: "t17", jobId: "j5", seq: 1,
    title: { en: "Mine the inbox for the three repeated questions", bn: "ইনবক্স থেকে পুনরাবৃত্ত তিনটি প্রশ্ন বের করা" },
    desc: { en: "Read three months of customer messages and extract exactly what buyers ask before ordering.", bn: "তিন মাসের কাস্টমার বার্তা পড়ে বের করা, অর্ডারের আগে ক্রেতারা ঠিক কী জিজ্ঞেস করেন।" },
    sectorId: "content", fee: 1500, hours: 4, level: "micro",
    skills: ["Research", "Bangla copy"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered day 2", bn: "২য় দিনে ডেলিভার" },
    acceptance: { en: ["Questions ranked by frequency", "Quoted in the customer's own words", "Fits one page"], bn: ["ফ্রিকোয়েন্সি অনুযায়ী প্রশ্নের ক্রম", "কাস্টমারের নিজের ভাষায় উদ্ধৃত", "এক পৃষ্ঠায়"] },
  },
  {
    id: "t18", jobId: "j5", seq: 2,
    title: { en: "Build and prove the description template on 10 items", bn: "১০টি আইটেমে ডেসক্রিপশন টেমপ্লেট তৈরি ও প্রমাণ" },
    desc: { en: "A bilingual template that answers the mined questions, written out for ten real products first.", bn: "একটি দ্বিভাষিক টেমপ্লেট যা বের করা প্রশ্নগুলোর উত্তর দেয়, প্রথমে দশটি বাস্তব প্রোডাক্টে লেখা।" },
    sectorId: "content", fee: 2500, hours: 6, level: "standard",
    skills: ["Bangla copy", "SEO writing"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered day 6", bn: "৬ষ্ঠ দিনে ডেলিভার" },
    acceptance: { en: ["Template answers all three questions", "Bangla and English say the same thing", "Under 90 words per item"], bn: ["টেমপ্লেট তিনটি প্রশ্নেরই উত্তর দেয়", "বাংলা ও ইংরেজি একই কথা বলে", "প্রতি আইটেমে ৯০ শব্দের কম"] },
    dependsOn: ["t17"],
  },
  {
    id: "t19", jobId: "j5", seq: 3,
    title: { en: "Write the remaining 50 descriptions", bn: "বাকি ৫০টি ডেসক্রিপশন লেখা" },
    desc: { en: "Apply the approved template across the rest of the new season, in both languages.", bn: "অনুমোদিত টেমপ্লেট নতুন সিজনের বাকি অংশে প্রয়োগ, দুই ভাষাতেই।" },
    sectorId: "content", fee: 4500, hours: 10, level: "standard",
    skills: ["Bangla copy", "Editing"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered day 14", bn: "১৪তম দিনে ডেলিভার" },
    acceptance: { en: ["All 50 items covered", "Consistent with the approved template", "Uploaded in the client's format"], bn: ["৫০টি আইটেমই অন্তর্ভুক্ত", "অনুমোদিত টেমপ্লেটের সাথে সামঞ্জস্যপূর্ণ", "ক্লায়েন্টের ফরম্যাটে আপলোড"] },
    dependsOn: ["t18"],
  },

  /* ── J6 ── */
  {
    id: "t20", jobId: "j6", seq: 1,
    title: { en: "Reconstruct one month of stock movement", bn: "এক মাসের স্টক গতিবিধি পুনর্গঠন" },
    desc: { en: "Digitise the notepad transfers for one month and line them up against the system's own records.", bn: "এক মাসের নোটপ্যাড ট্রান্সফার ডিজিটাইজ করে সিস্টেমের নিজের রেকর্ডের পাশে মেলানো।" },
    sectorId: "admin", fee: 2000, hours: 7, level: "micro",
    skills: ["Data entry", "Excel"], status: "matching", progress: 0,
    dueLabel: { en: "Matching now", bn: "এখন ম্যাচিং হচ্ছে" },
    acceptance: { en: ["Every notepad entry captured or flagged as illegible", "Dates aligned with system records", "No entry silently dropped"], bn: ["প্রতিটি নোটপ্যাড এন্ট্রি ধরা বা অস্পষ্ট হিসেবে চিহ্নিত", "তারিখ সিস্টেম রেকর্ডের সাথে সারিবদ্ধ", "কোনো এন্ট্রি নীরবে বাদ নয়"] },
  },
  {
    id: "t21", jobId: "j6", seq: 2,
    title: { en: "Locate where the discrepancy enters", bn: "অসঙ্গতি কোথায় ঢোকে তা শনাক্তকরণ" },
    desc: { en: "Trace the gap to a step in the process — receiving, transfer, sale or return — with the evidence for each candidate.", bn: "ফারাকটি প্রক্রিয়ার কোন ধাপে — গ্রহণ, ট্রান্সফার, বিক্রি না ফেরত — প্রতিটি সম্ভাবনার প্রমাণসহ চিহ্নিত করা।" },
    sectorId: "admin", fee: 2500, hours: 9, level: "standard",
    skills: ["Data cleaning", "Process mapping"], status: "matching", progress: 0,
    dueLabel: { en: "Starts after task 1", bn: "টাস্ক ১-এর পরে শুরু" },
    acceptance: { en: ["Each candidate step evidenced or ruled out", "Quantified, not described", "Written for a shop manager"], bn: ["প্রতিটি সম্ভাব্য ধাপ প্রমাণিত বা বাতিল", "বর্ণনা নয়, পরিমাণে", "দোকান ম্যানেজারের জন্য লেখা"] },
    dependsOn: ["t20"],
  },
  {
    id: "t22", jobId: "j6", seq: 3,
    title: { en: "Counting procedure the staff can actually follow", bn: "কর্মীরা সত্যিই মানতে পারবেন এমন গণনা পদ্ধতি" },
    desc: { en: "A one-page procedure and a printable transfer slip, tested once with the staff who will use it.", bn: "এক পৃষ্ঠার পদ্ধতি ও ছাপার উপযোগী ট্রান্সফার স্লিপ, যারা ব্যবহার করবেন তাদের সাথে একবার পরীক্ষিত।" },
    sectorId: "admin", fee: 2000, hours: 6, level: "micro",
    skills: ["Process mapping", "Bangla writing"], status: "matching", progress: 0,
    dueLabel: { en: "Starts after task 2", bn: "টাস্ক ২-এর পরে শুরু" },
    acceptance: { en: ["Tested with the actual staff once", "No step needs a computer", "Slip fits on a half page"], bn: ["প্রকৃত কর্মীদের সাথে একবার পরীক্ষিত", "কোনো ধাপে কম্পিউটার লাগে না", "স্লিপ আধা পৃষ্ঠায়"] },
    dependsOn: ["t21"],
  },
];

export const EVALUATIONS: Evaluation[] = [
  {
    id: "e1", taskId: "t2", studentId: "s1", mentorId: "m1",
    scores: [
      { dim: { en: "Requirement coverage", bn: "রিকোয়ারমেন্ট কভারেজ" }, score: 5, max: 5 },
      { dim: { en: "Code quality & structure", bn: "কোড কোয়ালিটি ও স্ট্রাকচার" }, score: 4, max: 5 },
      { dim: { en: "Testing / edge cases", bn: "টেস্টিং / এজ কেস" }, score: 4, max: 5 },
      { dim: { en: "Documentation", bn: "ডকুমেন্টেশন" }, score: 5, max: 5 },
      { dim: { en: "Handover readiness", bn: "হ্যান্ডওভার প্রস্তুতি" }, score: 5, max: 5 },
    ],
    mentorNote: {
      en: "Found the real cause — a timeout in the gateway callback, not the cart code everyone assumed. Error messages are written in plain Bangla, which matters more here than the fix itself.",
      bn: "আসল কারণ বের করেছেন — গেটওয়ে কলব্যাকের টাইমআউট, সবাই যে কার্ট কোডকে দায়ী ভেবেছিল সেটা নয়। এরর মেসেজ সহজ বাংলায় লেখা, যা এখানে ফিক্সের চেয়েও গুরুত্বপূর্ণ।",
    },
    clientSignoff: true,
    clientNote: { en: "Orders went through the same evening. We have not lost one since.", bn: "সেই সন্ধ্যাতেই অর্ডার যেতে শুরু করে। এরপর একটাও হারাইনি।" },
    dateLabel: { en: "Signed off 4 days ago", bn: "৪ দিন আগে সাইন-অফ" },
  },
  {
    id: "e2", taskId: "t11", studentId: "s6", mentorId: "m2",
    scores: [
      { dim: { en: "Accuracy rate", bn: "নির্ভুলতার হার" }, score: 5, max: 5 },
      { dim: { en: "Format consistency", bn: "ফরম্যাট সামঞ্জস্য" }, score: 5, max: 5 },
      { dim: { en: "Completeness", bn: "সম্পূর্ণতা" }, score: 4, max: 5 },
      { dim: { en: "Confidentiality", bn: "গোপনীয়তা" }, score: 5, max: 5 },
      { dim: { en: "Speed", bn: "গতি" }, score: 4, max: 5 },
    ],
    mentorNote: {
      en: "99.4% on the verification sample across 1,180 rows. Flagged 26 illegible entries instead of guessing — exactly the right instinct.",
      bn: "১,১৮০ সারির যাচাই নমুনায় ৯৯.৪%। অনুমান না করে ২৬টি অস্পষ্ট এন্ট্রি চিহ্নিত করেছেন — ঠিক এই প্রবৃত্তিটাই দরকার।",
    },
    clientSignoff: true,
    dateLabel: { en: "Signed off 2 days ago", bn: "২ দিন আগে সাইন-অফ" },
  },
  {
    id: "e3", taskId: "t19", studentId: "s3", mentorId: "m3",
    scores: [
      { dim: { en: "Factual accuracy", bn: "তথ্যগত নির্ভুলতা" }, score: 5, max: 5 },
      { dim: { en: "Language & tone", bn: "ভাষা ও টোন" }, score: 5, max: 5 },
      { dim: { en: "Structure & flow", bn: "কাঠামো ও প্রবাহ" }, score: 5, max: 5 },
      { dim: { en: "Source citation", bn: "সোর্স উল্লেখ" }, score: 4, max: 5 },
      { dim: { en: "Turnaround discipline", bn: "সময়ানুবর্তিতা" }, score: 5, max: 5 },
    ],
    mentorNote: {
      en: "The template is the real deliverable here and it holds up — the client's own staff added twelve more items using it without asking a single question. The Bangla reads like a person wrote it, not a translation engine.",
      bn: "এখানে আসল ডেলিভারেবল টেমপ্লেটটাই, আর সেটা টিকেছে — ক্লায়েন্টের নিজের কর্মীরা কোনো প্রশ্ন না করেই আরও বারোটি আইটেম যোগ করেছেন। বাংলাটা অনুবাদ যন্ত্রের নয়, মানুষের লেখা মনে হয়।",
    },
    clientSignoff: true,
    clientNote: { en: "Inbox questions dropped by about half in the first fortnight.", bn: "প্রথম পক্ষকালেই ইনবক্সের প্রশ্ন প্রায় অর্ধেকে নেমেছে।" },
    dateLabel: { en: "Signed off 9 days ago", bn: "৯ দিন আগে সাইন-অফ" },
  },
];

export const jobById = (id: string) => JOBS.find((j) => j.id === id);
export const taskById = (id: string) => TASKS.find((t) => t.id === id);
export const tasksOfJob = (jobId: string) => TASKS.filter((t) => t.jobId === jobId).sort((a, b) => a.seq - b.seq);
export const evaluationOfTask = (taskId: string) => EVALUATIONS.find((e) => e.taskId === taskId);
