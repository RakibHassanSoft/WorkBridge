import type { L } from "@/lib/i18n";
import type { Evaluation, Job, Task } from "./types";

/* ────────────────────────────────────────────────────────────────
   Demo problems.

   One problem, one task, one price. The AI reads the client's own
   words and returns a single piece of work with a fee, an estimate
   and acceptance criteria — it does not split a problem into a
   dependency chain of sub-tasks. A shop owner who wanted one thing
   fixed should not be handed a project plan.
   ──────────────────────────────────────────────────────────────── */

export const JOBS: Job[] = [
  {
    id: "j1",
    ref: "WB-2481",
    clientId: "c1",
    title: { en: "One in four customers never finishes paying", bn: "প্রতি চারজন কাস্টমারের একজন টাকা দেওয়াই শেষ করেন না" },
    brief: {
      en: "People put things in the basket and then just vanish at the payment step. It has been happening for about two months. We are a 9-person boutique and we do not have a tech person to look at it.",
      bn: "মানুষ ঝুড়িতে জিনিস নেয়, তারপর পেমেন্টের ধাপে গিয়ে হারিয়ে যায়। প্রায় দুই মাস ধরে এটা হচ্ছে। আমরা ৯ জনের একটা বুটিক, দেখার মতো কোনো টেক লোক নেই।",
    },
    sectorId: "it",
    budget: 6000,
    postedLabel: { en: "Posted 6 days ago", bn: "৬ দিন আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "The payment gateway's callback is failing silently, so a paid order never registers and the customer sees nothing. One job: repair the callback and put a readable message on every failure path.",
        bn: "পেমেন্ট গেটওয়ের কলব্যাক নীরবে ব্যর্থ হচ্ছে, ফলে টাকা দেওয়া অর্ডার নথিভুক্তই হয় না আর কাস্টমার কিছুই দেখেন না। একটাই কাজ: কলব্যাক ঠিক করা আর প্রতিটি ব্যর্থতার পথে পড়ার মতো বার্তা বসানো।",
      },
      complexity: "Medium",
      confidence: 91,
      estHours: 10,
      suggestedFee: 6000,
      risks: {
        en: [
          "The fault may sit with the gateway rather than the store — the first hour is spent proving which.",
          "There is no staging site, so a coordinator approves any change that touches the live checkout.",
        ],
        bn: [
          "দোষটা স্টোরের নয়, গেটওয়ের হতে পারে — প্রথম ঘণ্টাটা কোনটা তা প্রমাণেই যাবে।",
          "স্টেজিং সাইট নেই, তাই লাইভ চেকআউট ছোঁয় এমন যেকোনো পরিবর্তনে কোঅর্ডিনেটরের অনুমোদন লাগবে।",
        ],
      },
      skills: ["JavaScript", "Payments", "QA"],
    },
    taskIds: ["t2"],
  },
  {
    id: "j7",
    ref: "WB-2560",
    clientId: "c1",
    title: { en: "I cannot tell what actually sells each week", bn: "সপ্তাহে আসলে কী বিক্রি হচ্ছে বুঝতে পারি না" },
    brief: {
      en: "When I reorder fabric I am guessing from memory. I want one page I can open on my phone that tells me what moved this week and what is about to run out.",
      bn: "কাপড় রিঅর্ডার করার সময় আমি স্মৃতি থেকে অনুমান করি। আমি এমন একটা পাতা চাই যেটা ফোনে খুলে দেখব — এই সপ্তাহে কী গেছে আর কী ফুরিয়ে আসছে।",
    },
    sectorId: "it",
    budget: 7500,
    postedLabel: { en: "Posted 4 days ago", bn: "৪ দিন আগে পোস্ট করা" },
    status: "active",
    ai: {
      summary: {
        en: "A single read-only page over the store's existing order data. No new platform, no migration — the numbers already exist, nobody has ever put them on one screen.",
        bn: "স্টোরের বিদ্যমান অর্ডার ডেটার ওপর একটিমাত্র রিড-অনলি পাতা। নতুন প্ল্যাটফর্ম নয়, মাইগ্রেশন নয় — সংখ্যাগুলো আছেই, কেউ কখনো এক পর্দায় বসায়নি।",
      },
      complexity: "Medium",
      confidence: 88,
      estHours: 12,
      suggestedFee: 7500,
      risks: {
        en: [
          "Returns are recorded inconsistently, so the weekly total needs a rule agreed with the owner before anything is built.",
          "It has to load on a phone over 4G, which rules out most chart libraries.",
        ],
        bn: [
          "রিটার্ন অসামঞ্জস্যভাবে লেখা হয়, তাই কিছু বানানোর আগে সাপ্তাহিক হিসাবের নিয়ম মালিকের সাথে ঠিক করতে হবে।",
          "৪জি-তে ফোনে লোড হতে হবে, ফলে বেশিরভাগ চার্ট লাইব্রেরি বাদ।",
        ],
      },
      skills: ["Dashboards", "React", "Analytics"],
    },
    taskIds: ["t4"],
  },
  {
    id: "j9",
    ref: "WB-2472",
    clientId: "c1",
    title: { en: "Find out why the checkout is dropping people", bn: "চেকআউটে মানুষ কেন হারিয়ে যাচ্ছে, বের করুন" },
    brief: {
      en: "Before anybody changes anything on the site, I want to know what is actually going wrong and see it written down. I have been told three different things by three different people.",
      bn: "সাইটে কেউ কিছু বদলানোর আগে আমি জানতে চাই আসলে কী ভুল হচ্ছে, আর সেটা লেখা দেখতে চাই। তিনজন মানুষ আমাকে তিন রকম কথা বলেছেন।",
    },
    sectorId: "it",
    budget: 2500,
    postedLabel: { en: "Posted 3 weeks ago", bn: "৩ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "A diagnosis, not a fix. Reproduce the failure across devices and payment methods and hand back a written finding the owner can act on or take elsewhere.",
        bn: "সমাধান নয়, নির্ণয়। বিভিন্ন ডিভাইস ও পেমেন্ট মেথডে ব্যর্থতাটি পুনরায় ঘটিয়ে লিখিত ফলাফল দেওয়া, যা নিয়ে মালিক কাজ করতে বা অন্য কোথাও যেতে পারেন।",
      },
      complexity: "Low",
      confidence: 94,
      estHours: 5,
      suggestedFee: 2500,
      risks: {
        en: ["The fault may not reproduce on every device — the finding has to say honestly what could not be tested."],
        bn: ["প্রতিটি ডিভাইসে ত্রুটিটি নাও ঘটতে পারে — কী পরীক্ষা করা যায়নি, ফলাফলে সৎভাবে লিখতে হবে।"],
      },
      skills: ["QA", "Debugging"],
    },
    taskIds: ["t1"],
  },
  {
    id: "j5",
    ref: "WB-2495",
    clientId: "c1",
    title: { en: "50 new items have no Bangla description", bn: "৫০টি নতুন আইটেমের বাংলা বর্ণনা নেই" },
    brief: {
      en: "The new season is up on the site with nothing written under it. My niece wrote a few and they were good, but she has exams now.",
      bn: "নতুন সিজন সাইটে উঠেছে, নিচে কিছুই লেখা নেই। আমার ভাইঝি কয়েকটা লিখে দিয়েছিল, ভালো হয়েছিল, কিন্তু এখন তার পরীক্ষা।",
    },
    sectorId: "content",
    budget: 4500,
    postedLabel: { en: "Posted 2 weeks ago", bn: "২ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "Writing to an existing voice, not inventing one. The few descriptions already on the site define the template; the work is applying it across the rest in both languages.",
        bn: "নতুন কণ্ঠ বানানো নয়, বিদ্যমান কণ্ঠেই লেখা। সাইটে থাকা কয়েকটি বর্ণনাই টেমপ্লেট ঠিক করে দেয়; কাজ হলো বাকিগুলোতে দুই ভাষায় সেটা প্রয়োগ করা।",
      },
      complexity: "Low",
      confidence: 93,
      estHours: 10,
      suggestedFee: 4500,
      risks: {
        en: ["Fabric names differ between the tag and the website — the writer has to ask rather than pick one."],
        bn: ["ট্যাগ আর ওয়েবসাইটে কাপড়ের নাম আলাদা — লেখককে নিজে একটা বেছে না নিয়ে জিজ্ঞেস করতে হবে।"],
      },
      skills: ["Bangla writing", "Copywriting", "E-commerce"],
    },
    taskIds: ["t19"],
  },
  {
    id: "j11",
    ref: "WB-2488",
    clientId: "c1",
    title: { en: "The same three questions come in every single day", bn: "একই তিনটা প্রশ্ন প্রতিদিন আসে" },
    brief: {
      en: "My staff answer the same things on Messenger all day. I want to know exactly what people keep asking so we can just write it on the site.",
      bn: "আমার কর্মীরা সারাদিন মেসেঞ্জারে একই জিনিস উত্তর দেয়। মানুষ ঠিক কী বারবার জিজ্ঞেস করে জানতে চাই, যাতে সাইটেই লিখে দিতে পারি।",
    },
    sectorId: "content",
    budget: 1500,
    postedLabel: { en: "Posted 5 weeks ago", bn: "৫ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "Reading, counting and quoting — not summarising. The value is in the customers' own words, which is what the site copy then has to answer.",
        bn: "সারসংক্ষেপ নয় — পড়া, গোনা ও উদ্ধৃত করা। মূল্য কাস্টমারের নিজের ভাষায়, আর সাইটের লেখাকে সেটারই উত্তর দিতে হবে।",
      },
      complexity: "Low",
      confidence: 90,
      estHours: 4,
      suggestedFee: 1500,
      risks: {
        en: ["Customer messages contain phone numbers and addresses — nothing personal may leave the export."],
        bn: ["কাস্টমারের বার্তায় ফোন নম্বর ও ঠিকানা থাকে — ব্যক্তিগত কিছুই এক্সপোর্টের বাইরে যাবে না।"],
      },
      skills: ["Research", "Bangla writing"],
    },
    taskIds: ["t17"],
  },
  {
    id: "j4",
    ref: "WB-2519",
    clientId: "c1",
    title: { en: "Eid gift boxes have to go to press and I do not know the specs", bn: "ঈদের গিফট বক্স ছাপাতে দিতে হবে, স্পেসিফিকেশন জানি না" },
    brief: {
      en: "The press keeps asking me questions I cannot answer — colours, board thickness, die-cut. I need someone to talk to them and come back with the answers written down.",
      bn: "প্রেস আমাকে এমন সব প্রশ্ন করে যার উত্তর আমি জানি না — রঙ, বোর্ডের পুরুত্ব, ডাই-কাট। কেউ তাদের সাথে কথা বলে উত্তরগুলো লিখে এনে দিক।",
    },
    sectorId: "design",
    budget: 1000,
    postedLabel: { en: "Posted 3 days ago", bn: "৩ দিন আগে পোস্ট করা" },
    status: "matching",
    ai: {
      summary: {
        en: "A phone call and a written specification, done before any artwork exists. Cheap now, and it is what stops a whole print run being wrong later.",
        bn: "কোনো আর্টওয়ার্ক তৈরির আগেই একটা ফোনকল ও একটি লিখিত স্পেসিফিকেশন। এখন সস্তা, আর এটাই পরে পুরো ছাপা ভুল হওয়া থামায়।",
      },
      complexity: "Low",
      confidence: 89,
      estHours: 2,
      suggestedFee: 1000,
      risks: {
        en: ["Presses quote differently over the phone than in writing — the specification has to be confirmed by message."],
        bn: ["প্রেস ফোনে আর লিখিতভাবে আলাদা দর বলে — স্পেসিফিকেশন বার্তায় নিশ্চিত করতে হবে।"],
      },
      skills: ["Print production", "Coordination"],
    },
    taskIds: ["t14"],
  },
  {
    id: "j6",
    ref: "WB-2549",
    clientId: "c1",
    title: { en: "Stockroom counts never match the system", bn: "স্টকরুমের গণনা সিস্টেমের সাথে কখনো মেলে না" },
    brief: {
      en: "Every month the count is off and nobody can say where it went. Transfers between the shop and the stockroom are written in a notepad.",
      bn: "প্রতি মাসে গণনা মেলে না, কোথায় গেল কেউ বলতে পারে না। দোকান আর স্টকরুমের মধ্যে ট্রান্সফার একটা নোটপ্যাডে লেখা হয়।",
    },
    sectorId: "admin",
    budget: 2000,
    postedLabel: { en: "Posted yesterday", bn: "গতকাল পোস্ট করা" },
    status: "matching",
    ai: {
      summary: {
        en: "Rebuild one month from the notepad and line it up against the system. One month is enough to find the leak, and it costs a fraction of digitising a year.",
        bn: "নোটপ্যাড থেকে এক মাস পুনর্গঠন করে সিস্টেমের সাথে মিলিয়ে দেখা। ফাঁকটা ধরতে এক মাসই যথেষ্ট, আর এক বছর ডিজিটাইজ করার তুলনায় খরচ সামান্য।",
      },
      complexity: "Low",
      confidence: 86,
      estHours: 7,
      suggestedFee: 2000,
      risks: {
        en: [
          "The notepad may not cover every transfer — gaps have to be listed, not filled in from memory.",
          "If the leak turns out to be theft rather than paperwork, that is the owner's matter, not the student's.",
        ],
        bn: [
          "নোটপ্যাডে হয়তো সব ট্রান্সফার নেই — ফাঁকগুলো স্মৃতি থেকে ভরাট না করে তালিকা করতে হবে।",
          "ফাঁকটা যদি কাগজের ভুল নয় বরং চুরি হয়, সেটা মালিকের বিষয় — শিক্ষার্থীর নয়।",
        ],
      },
      skills: ["Data entry", "Reconciliation", "Excel"],
    },
    taskIds: ["t20"],
  },
  {
    id: "j2",
    ref: "WB-2503",
    clientId: "c2",
    title: { en: "Every outlet posts in a different style", bn: "প্রতিটি আউটলেট আলাদা স্টাইলে পোস্ট করে" },
    brief: {
      en: "We pay an agency and I still cannot tell our four outlets apart from anyone else's posts. I want one sheet the outlet managers can follow themselves.",
      bn: "আমরা এজেন্সিকে টাকা দিই, তবু আমাদের চারটি আউটলেটের পোস্ট আর অন্যদের পোস্টে পার্থক্য বুঝি না। আমি এমন একটা শিট চাই যা আউটলেট ম্যানেজাররা নিজেরাই মানতে পারবেন।",
    },
    sectorId: "design",
    budget: 2000,
    postedLabel: { en: "Posted 2 days ago", bn: "২ দিন আগে পোস্ট করা" },
    status: "matching",
    ai: {
      summary: {
        en: "One page, not a brand book. Colours, typefaces, logo usage and photo mood locked from what the outlets already do well, so a manager with a phone can follow it.",
        bn: "ব্র্যান্ড বুক নয়, এক পাতা। আউটলেটগুলো এখনই যা ভালো করে তা থেকেই রঙ, টাইপফেস, লোগোর ব্যবহার ও ছবির মেজাজ ঠিক করা — যাতে ফোন হাতে একজন ম্যানেজারও মানতে পারেন।",
      },
      complexity: "Low",
      confidence: 92,
      estHours: 4,
      suggestedFee: 2000,
      risks: {
        en: ["The four outlets disagree about the logo colour — the sheet has to pick one and say why."],
        bn: ["লোগোর রঙ নিয়ে চার আউটলেটের মত আলাদা — শিটকে একটা বেছে নিয়ে কারণ লিখতে হবে।"],
      },
      skills: ["Brand design", "Typography"],
    },
    taskIds: ["t6"],
  },
  {
    id: "j10",
    ref: "WB-2455",
    clientId: "c3",
    title: { en: "Nobody has agreed what a farmer record should even contain", bn: "কৃষকের রেকর্ডে আসলে কী থাকবে, কেউ ঠিকই করেনি" },
    brief: {
      en: "Before we type three seasons of registers into a computer, I want to be sure we are typing the right columns. Last time we did this the file was useless.",
      bn: "তিন মৌসুমের রেজিস্টার কম্পিউটারে তোলার আগে নিশ্চিত হতে চাই, আমরা ঠিক কলামগুলোই তুলছি। গতবার এটা করে ফাইলটা অকেজো হয়েছিল।",
    },
    sectorId: "admin",
    budget: 1500,
    postedLabel: { en: "Posted 4 weeks ago", bn: "৪ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "Agree the columns first, then prove them on a 30-page sample. Cheap insurance against typing 600 pages into a shape nobody can use.",
        bn: "আগে কলাম ঠিক করা, তারপর ৩০ পাতার নমুনায় প্রমাণ করা। ৬০০ পাতা এমন একটা আকারে তোলার বিরুদ্ধে সস্তা বিমা, যা কেউ ব্যবহার করতে পারে না।",
      },
      complexity: "Low",
      confidence: 91,
      estHours: 4,
      suggestedFee: 1500,
      risks: {
        en: ["Handwriting varies by register keeper — the sample must include the worst one, not the tidiest."],
        bn: ["রেজিস্টার লেখকভেদে হাতের লেখা আলাদা — নমুনায় সবচেয়ে পরিপাটি নয়, সবচেয়ে খারাপটাই রাখতে হবে।"],
      },
      skills: ["Data modelling", "Data entry"],
    },
    taskIds: ["t10"],
  },
  {
    id: "j3",
    ref: "WB-2467",
    clientId: "c3",
    title: { en: "Three seasons of farmer records are sitting in paper registers", bn: "তিন মৌসুমের কৃষক রেকর্ড কাগজের রেজিস্টারে পড়ে আছে" },
    brief: {
      en: "Six hundred pages in a cupboard. If a farmer asks what he bought last season we have to send someone to look through them by hand.",
      bn: "আলমারিতে ছয়শো পাতা। কোনো কৃষক গত মৌসুমে কী কিনেছিলেন জানতে চাইলে আমাদের একজনকে পাঠিয়ে হাতে খুঁজতে হয়।",
    },
    sectorId: "admin",
    budget: 4000,
    postedLabel: { en: "Posted 3 weeks ago", bn: "৩ সপ্তাহ আগে পোস্ট করা" },
    status: "delivered",
    ai: {
      summary: {
        en: "Volume work against an agreed schema, with a ten percent double-entry check. The check is what makes the file trustworthy enough to act on.",
        bn: "সম্মত কাঠামোর বিপরীতে পরিমাণের কাজ, সাথে দশ শতাংশ ডাবল-এন্ট্রি যাচাই। এই যাচাইটাই ফাইলটিকে কাজে লাগানোর মতো নির্ভরযোগ্য করে।",
      },
      complexity: "Medium",
      confidence: 90,
      estHours: 16,
      suggestedFee: 4000,
      risks: {
        en: [
          "Illegible entries must be flagged, never guessed — a guessed row is worse than a blank one.",
          "The registers cannot leave the office, so the work has to happen on site or from photographs.",
        ],
        bn: [
          "অস্পষ্ট এন্ট্রি অনুমান নয়, চিহ্নিত করতে হবে — অনুমান করা সারি ফাঁকা সারির চেয়েও খারাপ।",
          "রেজিস্টার অফিস ছেড়ে যাবে না, তাই কাজটা অফিসে বসে বা ছবি থেকে করতে হবে।",
        ],
      },
      skills: ["Data entry", "Excel", "Accuracy"],
    },
    taskIds: ["t11"],
  },
  {
    id: "j8",
    ref: "WB-2538",
    clientId: "c3",
    title: { en: "What should we stock for next season?", bn: "আগামী মৌসুমে কী স্টক করা উচিত?" },
    brief: {
      en: "Now that the records are in a file, I want two pages telling me what to buy more of, what to drop, and which farmers stopped coming.",
      bn: "রেকর্ডগুলো এখন ফাইলে আছে, তাই দুই পাতা চাই — কী বেশি কিনব, কী বাদ দেব, আর কোন কৃষকরা আসা বন্ধ করেছেন।",
    },
    sectorId: "agri",
    budget: 1500,
    postedLabel: { en: "Posted 8 days ago", bn: "৮ দিন আগে পোস্ট করা" },
    status: "review",
    ai: {
      summary: {
        en: "A short written recommendation an owner can act on in an afternoon, with the numbers behind each line shown rather than asserted.",
        bn: "একটি সংক্ষিপ্ত লিখিত সুপারিশ, যা নিয়ে মালিক এক বিকেলেই কাজ করতে পারেন — প্রতিটি লাইনের পেছনের সংখ্যা দাবি নয়, দেখানো।",
      },
      complexity: "Low",
      confidence: 84,
      estHours: 4,
      suggestedFee: 1500,
      risks: {
        en: [
          "Three seasons is thin evidence for a trend — the note has to say where it is guessing.",
          "A lapsed farmer may have moved away rather than gone to a competitor.",
        ],
        bn: [
          "প্রবণতা বোঝার জন্য তিন মৌসুম কম প্রমাণ — নোটে লিখতে হবে কোথায় অনুমান করা হয়েছে।",
          "কোনো কৃষক প্রতিযোগীর কাছে নয়, এলাকা ছেড়ে চলে গিয়ে থাকতে পারেন।",
        ],
      },
      skills: ["Analysis", "Bangla writing", "Agribusiness"],
    },
    taskIds: ["t13"],
  },
];

export const TASKS: Task[] = [
  {
    id: "t1", jobId: "j9", seq: 1,
    title: { en: "Diagnose the checkout drop-off", bn: "চেকআউট ড্রপ-অফ নির্ণয় করা" },
    desc: { en: "Reproduce the failure across 3 devices and 2 payment methods, capture console + network errors, and write a one-page cause note.", bn: "৩টি ডিভাইস ও ২টি পেমেন্ট মেথডে সমস্যাটি পুনরায় ঘটানো, কনসোল ও নেটওয়ার্ক এরর ধরা, এবং এক পৃষ্ঠার কারণ-নোট লেখা।" },
    sectorId: "it", fee: 2500, hours: 5, level: "micro",
    skills: ["QA", "Debugging"], status: "approved", assignee: "s1", progress: 100,
    dueLabel: { en: "Delivered day 2", bn: "২য় দিনে ডেলিভার" },
    acceptance: { en: ["Failure reproduced with evidence", "Root cause identified or ruled out", "Written in non-technical language"], bn: ["প্রমাণসহ সমস্যা পুনরায় ঘটানো", "মূল কারণ শনাক্ত বা বাতিল", "অ-কারিগরি ভাষায় লেখা"] },
  },
  {
    id: "t2", jobId: "j1", seq: 1,
    title: { en: "Fix the payment callback and add error messaging", bn: "পেমেন্ট কলব্যাক ঠিক করা ও এরর মেসেজ যোগ করা" },
    desc: { en: "Repair the failing gateway callback and replace silent failures with a clear Bangla + English message.", bn: "টাস্ক ১-এ শনাক্ত হওয়া গেটওয়ে কলব্যাক ঠিক করা এবং নীরব ব্যর্থতার বদলে স্পষ্ট বাংলা ও ইংরেজি বার্তা দেখানো।" },
    sectorId: "it", fee: 6000, hours: 10, level: "standard",
    skills: ["JavaScript", "APIs"], status: "approved", assignee: "s1", progress: 100,
    dueLabel: { en: "Delivered day 5", bn: "৫ম দিনে ডেলিভার" },
    acceptance: { en: ["Test transaction completes end to end", "Failure states show a readable message", "No regression on mobile"], bn: ["টেস্ট লেনদেন শুরু থেকে শেষ সম্পন্ন", "ব্যর্থ অবস্থায় পাঠযোগ্য বার্তা", "মোবাইলে কোনো রিগ্রেশন নেই"] },
  },
  {
    id: "t4", jobId: "j7", seq: 1,
    title: { en: "Build the weekly sales dashboard", bn: "সাপ্তাহিক সেলস ড্যাশবোর্ড তৈরি" },
    desc: { en: "A single page showing top and bottom sellers, week-on-week movement, and stock-out risk — readable on a phone.", bn: "এক পৃষ্ঠায় সর্বোচ্চ ও সর্বনিম্ন বিক্রি, সপ্তাহভিত্তিক পরিবর্তন এবং স্টক-আউট ঝুঁকি — ফোনে পড়ার মতো।" },
    sectorId: "it", fee: 7500, hours: 12, level: "standard",
    skills: ["Dashboards", "React"], status: "in_progress", assignee: "s1", progress: 55,
    dueLabel: { en: "Due in 3 days", bn: "৩ দিনের মধ্যে" },
    acceptance: { en: ["Loads in under 3 seconds on 4G", "Owner can read it without training", "Numbers reconcile with the store"], bn: ["৪জি-তে ৩ সেকেন্ডের কম লোড", "প্রশিক্ষণ ছাড়াই মালিক পড়তে পারেন", "সংখ্যা স্টোরের সাথে মেলে"] },
  },
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
    id: "t10", jobId: "j10", seq: 1,
    title: { en: "Design the record schema + transcribe a 30-page sample", bn: "রেকর্ড স্কিমা ডিজাইন ও ৩০ পৃষ্ঠার নমুনা লেখা" },
    desc: { en: "Agree the columns with the client, then transcribe a representative sample to measure real time-per-page.", bn: "ক্লায়েন্টের সাথে কলাম চূড়ান্ত করা, তারপর প্রতিনিধিত্বমূলক নমুনা লিখে প্রতি পৃষ্ঠায় প্রকৃত সময় মাপা।" },
    sectorId: "admin", fee: 1500, hours: 4, level: "micro",
    skills: ["Data entry", "Bangla transcription"], status: "approved", assignee: "s6", progress: 100,
    dueLabel: { en: "Delivered day 3", bn: "৩য় দিনে ডেলিভার" },
    acceptance: { en: ["Schema signed off by client", "Sample transcribed at 99% accuracy", "Time-per-page measured"], bn: ["ক্লায়েন্টের স্কিমা অনুমোদন", "নমুনা ৯৯% নির্ভুলতায় লেখা", "প্রতি পৃষ্ঠার সময় মাপা"] },
  },
  {
    id: "t11", jobId: "j3", seq: 1,
    title: { en: "Digitise 3 seasons of registers", bn: "৩ মৌসুমের রেজিস্টার ডিজিটাইজ" },
    desc: { en: "Enter all remaining pages into the agreed schema with a 10% double-entry verification pass.", bn: "বাকি সব পৃষ্ঠা নির্ধারিত স্কিমায় এন্ট্রি করা, ১০% ডাবল-এন্ট্রি যাচাইসহ।" },
    sectorId: "admin", fee: 4000, hours: 16, level: "standard",
    skills: ["Data entry", "Excel"], status: "approved", assignee: "s6", progress: 100,
    dueLabel: { en: "Delivered day 9", bn: "৯ম দিনে ডেলিভার" },
    acceptance: { en: ["≥99% accuracy on the verification sample", "No blank mandatory fields", "Source page number on every row"], bn: ["যাচাই নমুনায় ৯৯%+ নির্ভুলতা", "কোনো বাধ্যতামূলক ফিল্ড ফাঁকা নয়", "প্রতিটি সারিতে সোর্স পৃষ্ঠা নম্বর"] },
  },
  {
    id: "t13", jobId: "j8", seq: 1,
    title: { en: "Next-season stocking recommendation", bn: "আগামী মৌসুমের স্টকিং সুপারিশ" },
    desc: { en: "A two-page note: what to stock more of, what to drop, and which lapsed farmers to call first.", bn: "দুই পৃষ্ঠার নোট: কী বেশি স্টক করতে হবে, কী বাদ দিতে হবে, আর কোন নিষ্ক্রিয় কৃষকদের আগে ফোন করতে হবে।" },
    sectorId: "agri", fee: 1500, hours: 4, level: "micro",
    skills: ["Analysis", "Bangla reporting"], status: "revision", assignee: "s6", progress: 80,
    dueLabel: { en: "Revision requested", bn: "রিভিশন চাওয়া হয়েছে" },
    acceptance: { en: ["Every claim traced to the data", "Written in Bangla", "Top 20 call list attached"], bn: ["প্রতিটি দাবি ডেটার সাথে যুক্ত", "বাংলায় লেখা", "শীর্ষ ২০ কল লিস্ট সংযুক্ত"] },
  },
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
    id: "t17", jobId: "j11", seq: 1,
    title: { en: "Mine the inbox for the three repeated questions", bn: "ইনবক্স থেকে পুনরাবৃত্ত তিনটি প্রশ্ন বের করা" },
    desc: { en: "Read three months of customer messages and extract exactly what buyers ask before ordering.", bn: "তিন মাসের কাস্টমার বার্তা পড়ে বের করা, অর্ডারের আগে ক্রেতারা ঠিক কী জিজ্ঞেস করেন।" },
    sectorId: "content", fee: 1500, hours: 4, level: "micro",
    skills: ["Research", "Bangla copy"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered day 2", bn: "২য় দিনে ডেলিভার" },
    acceptance: { en: ["Questions ranked by frequency", "Quoted in the customer's own words", "Fits one page"], bn: ["ফ্রিকোয়েন্সি অনুযায়ী প্রশ্নের ক্রম", "কাস্টমারের নিজের ভাষায় উদ্ধৃত", "এক পৃষ্ঠায়"] },
  },
  {
    id: "t19", jobId: "j5", seq: 1,
    title: { en: "Write the remaining 50 descriptions", bn: "বাকি ৫০টি ডেসক্রিপশন লেখা" },
    desc: { en: "Apply the approved template across the rest of the new season, in both languages.", bn: "অনুমোদিত টেমপ্লেট নতুন সিজনের বাকি অংশে প্রয়োগ, দুই ভাষাতেই।" },
    sectorId: "content", fee: 4500, hours: 10, level: "standard",
    skills: ["Bangla copy", "Editing"], status: "approved", assignee: "s3", progress: 100,
    dueLabel: { en: "Delivered day 14", bn: "১৪তম দিনে ডেলিভার" },
    acceptance: { en: ["All 50 items covered", "Consistent with the approved template", "Uploaded in the client's format"], bn: ["৫০টি আইটেমই অন্তর্ভুক্ত", "অনুমোদিত টেমপ্লেটের সাথে সামঞ্জস্যপূর্ণ", "ক্লায়েন্টের ফরম্যাটে আপলোড"] },
  },
  {
    id: "t20", jobId: "j6", seq: 1,
    title: { en: "Reconstruct one month of stock movement", bn: "এক মাসের স্টক গতিবিধি পুনর্গঠন" },
    desc: { en: "Digitise the notepad transfers for one month and line them up against the system's own records.", bn: "এক মাসের নোটপ্যাড ট্রান্সফার ডিজিটাইজ করে সিস্টেমের নিজের রেকর্ডের পাশে মেলানো।" },
    sectorId: "admin", fee: 2000, hours: 7, level: "micro",
    skills: ["Data entry", "Excel"], status: "matching", progress: 0,
    dueLabel: { en: "Matching now", bn: "এখন ম্যাচিং হচ্ছে" },
    acceptance: { en: ["Every notepad entry captured or flagged as illegible", "Dates aligned with system records", "No entry silently dropped"], bn: ["প্রতিটি নোটপ্যাড এন্ট্রি ধরা বা অস্পষ্ট হিসেবে চিহ্নিত", "তারিখ সিস্টেম রেকর্ডের সাথে সারিবদ্ধ", "কোনো এন্ট্রি নীরবে বাদ নয়"] },
  },
];

export const EVALUATIONS: Evaluation[] = [
  {
    id: "e1", taskId: "t2", studentId: "s1", reviewerId: "mod1",
    scores: [
      { dim: { en: "Requirement coverage", bn: "রিকোয়ারমেন্ট কভারেজ" }, score: 5, max: 5 },
      { dim: { en: "Code quality & structure", bn: "কোড কোয়ালিটি ও স্ট্রাকচার" }, score: 4, max: 5 },
      { dim: { en: "Testing / edge cases", bn: "টেস্টিং / এজ কেস" }, score: 4, max: 5 },
      { dim: { en: "Documentation", bn: "ডকুমেন্টেশন" }, score: 5, max: 5 },
      { dim: { en: "Handover readiness", bn: "হ্যান্ডওভার প্রস্তুতি" }, score: 5, max: 5 },
    ],
    reviewerNote: {
      en: "Found the real cause — a timeout in the gateway callback, not the cart code everyone assumed. Error messages are written in plain Bangla, which matters more here than the fix itself.",
      bn: "আসল কারণ বের করেছেন — গেটওয়ে কলব্যাকের টাইমআউট, সবাই যে কার্ট কোডকে দায়ী ভেবেছিল সেটা নয়। এরর মেসেজ সহজ বাংলায় লেখা, যা এখানে ফিক্সের চেয়েও গুরুত্বপূর্ণ।",
    },
    clientSignoff: true,
    clientNote: { en: "Orders went through the same evening. We have not lost one since.", bn: "সেই সন্ধ্যাতেই অর্ডার যেতে শুরু করে। এরপর একটাও হারাইনি।" },
    dateLabel: { en: "Signed off 4 days ago", bn: "৪ দিন আগে সাইন-অফ" },
  },
  {
    id: "e2", taskId: "t11", studentId: "s6", reviewerId: "mod1",
    scores: [
      { dim: { en: "Accuracy rate", bn: "নির্ভুলতার হার" }, score: 5, max: 5 },
      { dim: { en: "Format consistency", bn: "ফরম্যাট সামঞ্জস্য" }, score: 5, max: 5 },
      { dim: { en: "Completeness", bn: "সম্পূর্ণতা" }, score: 4, max: 5 },
      { dim: { en: "Confidentiality", bn: "গোপনীয়তা" }, score: 5, max: 5 },
      { dim: { en: "Speed", bn: "গতি" }, score: 4, max: 5 },
    ],
    reviewerNote: {
      en: "99.4% on the verification sample across 1,180 rows. Flagged 26 illegible entries instead of guessing — exactly the right instinct.",
      bn: "১,১৮০ সারির যাচাই নমুনায় ৯৯.৪%। অনুমান না করে ২৬টি অস্পষ্ট এন্ট্রি চিহ্নিত করেছেন — ঠিক এই প্রবৃত্তিটাই দরকার।",
    },
    clientSignoff: true,
    dateLabel: { en: "Signed off 2 days ago", bn: "২ দিন আগে সাইন-অফ" },
  },
  {
    id: "e3", taskId: "t19", studentId: "s3", reviewerId: "mod1",
    scores: [
      { dim: { en: "Factual accuracy", bn: "তথ্যগত নির্ভুলতা" }, score: 5, max: 5 },
      { dim: { en: "Language & tone", bn: "ভাষা ও টোন" }, score: 5, max: 5 },
      { dim: { en: "Structure & flow", bn: "কাঠামো ও প্রবাহ" }, score: 5, max: 5 },
      { dim: { en: "Source citation", bn: "সোর্স উল্লেখ" }, score: 4, max: 5 },
      { dim: { en: "Turnaround discipline", bn: "সময়ানুবর্তিতা" }, score: 5, max: 5 },
    ],
    reviewerNote: {
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

/* ── What the client is actually signing off on ───────────────

   A sign-off screen that shows a score but not the work is asking
   someone to rubber-stamp a number. These are the files and the
   student's own note, shown beside the rubric.
   ──────────────────────────────────────────────────────────── */

export type Deliverable = {
  taskId: string;
  files: { name: string; size: L }[];
  note: L;
  agreedInChat: L[];   // decisions made mid-task that changed the criteria
};

export const DELIVERABLES: Deliverable[] = [
  {
    taskId: "t2",
    files: [
      { name: "sales-clean-2024.xlsx", size: { en: "2.1 MB · 4,180 rows", bn: "২.১ এমবি · ৪,১৮০ সারি" } },
      { name: "what-i-changed.md", size: { en: "3 KB", bn: "৩ কেবি" } },
      { name: "walkthrough.mp4", size: { en: "6 min", bn: "৬ মিনিট" } },
    ],
    note: {
      en: "Duplicates removed by invoice number, not by name — 61 rows differed only in spelling. Everything I could not resolve is on a separate sheet called 'check these', 34 rows in total. I did not guess any of them.",
      bn: "নাম নয়, ইনভয়েস নম্বর ধরে ডুপ্লিকেট সরিয়েছি — ৬১টি সারিতে কেবল বানানের পার্থক্য ছিল। যা মেলাতে পারিনি সব 'check these' নামের আলাদা শিটে, মোট ৩৪টি সারি। কোনোটিই অনুমান করিনি।",
    },
    agreedInChat: [
      { en: "Returns are counted as negative rows, not deleted — you confirmed this on day two", bn: "রিটার্ন মুছে না দিয়ে ঋণাত্মক সারি হিসেবে গণনা — দ্বিতীয় দিনে আপনি নিশ্চিত করেছেন" },
      { en: "The 2022 file was dropped: you said the shop only reconciles two years back", bn: "২০২২ সালের ফাইল বাদ: আপনি বলেছেন দোকান দুই বছরের বেশি পেছনে হিসাব মেলায় না" },
    ],
  },
  {
    taskId: "t19",
    files: [
      { name: "campaign-brief-final.pdf", size: { en: "1.4 MB · 9 pages", bn: "১.৪ এমবি · ৯ পৃষ্ঠা" } },
      { name: "posts-bangla-english.zip", size: { en: "18 files", bn: "১৮টি ফাইল" } },
    ],
    note: {
      en: "Twelve posts in both languages, plus two spare captions for the Eid week. The Bangla copy is typeset, not pasted, so the text stays editable.",
      bn: "দুই ভাষায় বারোটি পোস্ট, সাথে ঈদ সপ্তাহের জন্য দুটি বাড়তি ক্যাপশন। বাংলা লেখা পেস্ট করা নয়, টাইপসেট করা — তাই টেক্সট এডিটযোগ্য থাকে।",
    },
    agreedInChat: [
      { en: "No prices in the artwork — you asked for a separate price card instead", bn: "আর্টওয়ার্কে কোনো দাম নয় — আপনি বদলে আলাদা প্রাইস কার্ড চেয়েছেন" },
    ],
  },
];

export const deliverableOf = (taskId: string) => DELIVERABLES.find((d) => d.taskId === taskId);
