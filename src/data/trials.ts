import type { L } from "@/lib/i18n";
import type { ChatMessage, PointEntry, Suggestion, Trial, TrialAttempt, TrialCheck } from "./types";

/* ────────────────────────────────────────────────────────────────
   The trial layer.

   Applying for a task does not mean writing a pitch. It means doing a
   small version of the actual work — a mirror the AI builds from the
   real task, sized to under an hour. The AI scores every attempt and
   ranks them; the moderator picks the person from that ranking.

   Points, exactly as the model requires:
     · a student who did the trial but was not selected  →  +1
     · the selected student who then fails the main task →  −1
     · the selected student who delivers                 →   0
   ──────────────────────────────────────────────────────────────── */

export const TRIALS: Trial[] = [
  {
    id: "tr-x3",
    taskId: "x3",
    title: { en: "Transcribe 12 delivery slips into the agreed sheet", bn: "১২টি ডেলিভারি স্লিপ নির্ধারিত শিটে লিখুন" },
    brief: {
      en: "Twelve scanned slips are attached — three of them are deliberately hard to read. Enter them into the columns given, flag anything you cannot read instead of guessing, and note how long it took you.",
      bn: "বারোটি স্ক্যান করা স্লিপ সংযুক্ত — এর তিনটি ইচ্ছাকৃতভাবে পড়া কঠিন। দেওয়া কলামে সেগুলো এন্ট্রি করুন, যা পড়তে পারছেন না তা অনুমান না করে চিহ্নিত করুন, আর কত সময় লাগল লিখে দিন।",
    },
    mirrors: {
      en: "The real task is 500 slips. This trial copies the one thing that decides the whole job — what you do with an entry you cannot read.",
      bn: "আসল টাস্ক ৫০০টি স্লিপ। এই ট্রায়াল সেই একটি জিনিসই নকল করে, যা পুরো কাজের ভাগ্য ঠিক করে — যে এন্ট্রি পড়া যায় না, তা নিয়ে আপনি কী করেন।",
    },
    minutes: 40,
    acceptance: {
      en: ["All twelve slips entered", "Illegible entries flagged, not guessed", "Time taken recorded honestly"],
      bn: ["বারোটি স্লিপই এন্ট্রি করা", "অস্পষ্ট এন্ট্রি অনুমান নয়, চিহ্নিত", "সময় সৎভাবে লেখা"],
    },
    aiNote: {
      en: "Speed and accuracy both matter here, but honesty about the illegible entries matters more — a guessed row is worse than a blank one, because nobody knows it is wrong.",
      bn: "এখানে গতি ও নির্ভুলতা দুটোই দরকার, কিন্তু অস্পষ্ট এন্ট্রি নিয়ে সততা বেশি জরুরি — অনুমান করা সারি ফাঁকা সারির চেয়েও খারাপ, কারণ সেটা যে ভুল তা কেউ জানে না।",
    },
  },
  {
    id: "tr-x1",
    taskId: "x1",
    title: { en: "Lay out one menu section at two board sizes", bn: "একটি মেনু সেকশন দুটি বোর্ড সাইজে সাজান" },
    brief: {
      en: "Take the six items given and lay them out for a 24×36 inch board and an A3 board. Prices must sit in their own editable layer. Bangla and English both typeset.",
      bn: "দেওয়া ছয়টি আইটেম নিয়ে ২৪×৩৬ ইঞ্চি বোর্ড ও এ৩ বোর্ডের জন্য লেআউট করুন। দাম আলাদা এডিটযোগ্য লেয়ারে থাকতে হবে। বাংলা ও ইংরেজি দুটোই টাইপসেট।",
    },
    mirrors: {
      en: "The real task is a full menu at four sizes. This trial copies the constraint that actually breaks the job — prices changing at the last minute.",
      bn: "আসল টাস্ক চারটি সাইজে পূর্ণ মেনু। এই ট্রায়াল সেই সীমাবদ্ধতাই নকল করে যা আসলে কাজ ভাঙে — শেষ মুহূর্তে দাম বদলানো।",
    },
    minutes: 50,
    acceptance: {
      en: ["Both sizes exported with bleed", "Prices on a separate text layer", "Bangla type properly set, not pasted"],
      bn: ["দুই সাইজেই ব্লিডসহ এক্সপোর্ট", "দাম আলাদা টেক্সট লেয়ারে", "বাংলা টাইপ ঠিকভাবে সাজানো, পেস্ট করা নয়"],
    },
    aiNote: {
      en: "Anyone can make one size look good. The trial checks whether the layout survives being resized and re-priced.",
      bn: "একটি সাইজ সুন্দর করা সবাই পারেন। ট্রায়াল দেখে লেআউটটি সাইজ ও দাম বদলের পরেও টেকে কিনা।",
    },
  },
  {
    id: "tr-x8",
    taskId: "x8",
    title: { en: "Run two practice interviews and log them", bn: "দুটি অনুশীলন সাক্ষাৎকার নিয়ে লগ করুন" },
    brief: {
      en: "Interview two farmers using the draft questionnaire attached. Record consent before each. Log anything that did not work about the questions themselves.",
      bn: "সংযুক্ত খসড়া প্রশ্নপত্র দিয়ে দুইজন কৃষকের সাক্ষাৎকার নিন। প্রতিটির আগে সম্মতি রেকর্ড করুন। প্রশ্নগুলোর মধ্যে যা কাজ করেনি তা লগ করুন।",
    },
    mirrors: {
      en: "The real task is forty interviews. This trial copies the part that cannot be faked from a desk — actually going out and getting consent.",
      bn: "আসল টাস্ক চল্লিশটি সাক্ষাৎকার। এই ট্রায়াল সেই অংশ নকল করে যা টেবিলে বসে বানানো যায় না — সত্যিই বেরিয়ে গিয়ে সম্মতি নেওয়া।",
    },
    minutes: 60,
    acceptance: {
      en: ["Consent recorded for both", "Field notes in the respondent's own words", "At least one problem with the questionnaire reported"],
      bn: ["দুজনেরই সম্মতি রেকর্ড", "উত্তরদাতার নিজের ভাষায় ফিল্ড নোট", "প্রশ্নপত্রের অন্তত একটি সমস্যা জানানো"],
    },
    aiNote: {
      en: "A student who reports a flaw in the questionnaire is worth more than one who runs it perfectly without noticing the flaw.",
      bn: "যে শিক্ষার্থী প্রশ্নপত্রের ত্রুটি ধরিয়ে দেন, তিনি সেই শিক্ষার্থীর চেয়ে মূল্যবান যিনি ত্রুটি না দেখে নিখুঁতভাবে চালিয়ে যান।",
    },
  },
];

/* ── Attempts, already scored by the AI ───────────────────────── */

const DIMS = {
  accuracy: { en: "Accuracy", bn: "নির্ভুলতা" },
  honesty: { en: "Honesty about gaps", bn: "ঘাটতি নিয়ে সততা" },
  speed: { en: "Speed", bn: "গতি" },
  instructions: { en: "Following the brief", bn: "ব্রিফ অনুসরণ" },
  craft: { en: "Craft", bn: "নিখুঁততা" },
};

export const ATTEMPTS: TrialAttempt[] = [
  {
    id: "at1", trialId: "tr-x3", taskId: "x3", studentId: "s6",
    submittedLabel: { en: "Submitted 6 hours ago", bn: "৬ ঘণ্টা আগে জমা" },
    minutesTaken: 38,
    summary: {
      en: "All twelve entered. Flagged the three hard slips in a separate column with a note on what was unreadable in each. Logged 38 minutes.",
      bn: "বারোটিই এন্ট্রি করা। কঠিন তিনটি স্লিপ আলাদা কলামে চিহ্নিত, প্রতিটিতে কী পড়া যায়নি তার নোটসহ। ৩৮ মিনিট লগ করা।",
    },
    aiScore: 92,
    aiBreakdown: [
      { dim: DIMS.accuracy, score: 5, max: 5 },
      { dim: DIMS.honesty, score: 5, max: 5 },
      { dim: DIMS.speed, score: 4, max: 5 },
      { dim: DIMS.instructions, score: 4, max: 5 },
    ],
    aiVerdict: {
      en: "Flagged all three unreadable slips instead of guessing, and wrote what was unreadable in each. That is the behaviour the real task needs across 500 slips.",
      bn: "তিনটি অস্পষ্ট স্লিপই অনুমান না করে চিহ্নিত করেছেন, আর প্রতিটিতে কী পড়া যায়নি তা লিখেছেন। ৫০০ স্লিপের আসল কাজে ঠিক এই আচরণটাই দরকার।",
    },
    aiCoaching: {
      en: "Your flagging discipline is the strongest thing you do. Say so in your profile — clients cannot see it until they have already hired you.",
      bn: "চিহ্নিত করার এই শৃঙ্খলাই আপনার সবচেয়ে শক্তিশালী দিক। প্রোফাইলে লিখে রাখুন — নিয়োগ না দেওয়া পর্যন্ত ক্লায়েন্ট এটা দেখতেই পান না।",
    },
    rank: 1, outcome: "selected", points: 0,
    pointsReason: { en: "নির্বাচিত এবং মূল কাজ চলছে — ফল না আসা পর্যন্ত ০", bn: "নির্বাচিত এবং মূল কাজ চলছে — ফল না আসা পর্যন্ত ০" },
  },
  {
    id: "at2", trialId: "tr-x3", taskId: "x3", studentId: "s8",
    submittedLabel: { en: "Submitted 5 hours ago", bn: "৫ ঘণ্টা আগে জমা" },
    minutesTaken: 29,
    summary: {
      en: "All twelve entered in 29 minutes — the fastest attempt. Filled in the three hard slips with best-guess values, no flag column.",
      bn: "২৯ মিনিটে বারোটিই এন্ট্রি — সবচেয়ে দ্রুত। কঠিন তিনটি স্লিপে অনুমান করে মান বসানো, কোনো চিহ্নিতকরণ কলাম নেই।",
    },
    aiScore: 71,
    aiBreakdown: [
      { dim: DIMS.accuracy, score: 4, max: 5 },
      { dim: DIMS.honesty, score: 2, max: 5 },
      { dim: DIMS.speed, score: 5, max: 5 },
      { dim: DIMS.instructions, score: 3, max: 5 },
    ],
    aiVerdict: {
      en: "Fastest by a wide margin and clean on the nine readable slips. But the three hard ones were guessed, and the brief asked for them to be flagged.",
      bn: "অনেক ব্যবধানে সবচেয়ে দ্রুত, আর নয়টি পড়ার মতো স্লিপে পরিষ্কার। কিন্তু কঠিন তিনটিতে অনুমান করা হয়েছে, যেখানে ব্রিফে চিহ্নিত করতে বলা ছিল।",
    },
    aiCoaching: {
      en: "You are quick, and that is real. But a guessed row costs a client more than a slow one, because nobody knows it is wrong. Next time leave it blank and say why — it takes ten seconds and it is the whole difference.",
      bn: "আপনি দ্রুত, সেটা সত্যিই মূল্যবান। কিন্তু অনুমান করা সারি ধীর কাজের চেয়ে ক্লায়েন্টের বেশি ক্ষতি করে, কারণ সেটা যে ভুল তা কেউ জানে না। পরেরবার ফাঁকা রেখে কারণ লিখুন — দশ সেকেন্ডের কাজ, আর পুরো পার্থক্য এটাই।",
    },
    rank: 2, outcome: "not_shortlisted", points: 1,
    pointsReason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" },
  },
  {
    id: "at3", trialId: "tr-x3", taskId: "x3", studentId: "s2",
    submittedLabel: { en: "Submitted 4 hours ago", bn: "৪ ঘণ্টা আগে জমা" },
    minutesTaken: 52,
    summary: {
      en: "Eleven of twelve entered — one slip left out entirely with no note. Flag column used correctly for the other two hard slips.",
      bn: "বারোটির মধ্যে এগারোটি এন্ট্রি — একটি স্লিপ পুরোপুরি বাদ, কোনো নোট নেই। বাকি দুটি কঠিন স্লিপে চিহ্নিতকরণ কলাম ঠিকভাবে ব্যবহৃত।",
    },
    aiScore: 64,
    aiBreakdown: [
      { dim: DIMS.accuracy, score: 4, max: 5 },
      { dim: DIMS.honesty, score: 4, max: 5 },
      { dim: DIMS.speed, score: 2, max: 5 },
      { dim: DIMS.instructions, score: 3, max: 5 },
    ],
    aiVerdict: {
      en: "Good instincts on the flag column, but one slip was dropped silently. On 500 slips a silent drop is the same problem as a guess.",
      bn: "চিহ্নিতকরণ কলামে ভালো বোধ, কিন্তু একটি স্লিপ নীরবে বাদ পড়েছে। ৫০০ স্লিপে নীরবে বাদ দেওয়া আর অনুমান করা একই সমস্যা।",
    },
    aiCoaching: {
      en: "You had the right instinct and lost on completeness. Before submitting, count your rows against the source count — a thirty-second check would have moved you to first.",
      bn: "আপনার বোধটা ঠিক ছিল, হেরেছেন সম্পূর্ণতায়। জমা দেওয়ার আগে সোর্সের সংখ্যার সাথে নিজের সারি গুনে দেখুন — ত্রিশ সেকেন্ডের যাচাই আপনাকে প্রথম করত।",
    },
    rank: 3, outcome: "not_shortlisted", points: 1,
    pointsReason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" },
  },
  {
    id: "at4", trialId: "tr-x1", taskId: "x1", studentId: "s5",
    submittedLabel: { en: "Submitted yesterday", bn: "গতকাল জমা" },
    minutesTaken: 46,
    summary: {
      en: "Both sizes delivered from one master file, prices on their own layer, Bangla type set rather than pasted from an image.",
      bn: "একটি মাস্টার ফাইল থেকে দুই সাইজ, দাম আলাদা লেয়ারে, বাংলা টাইপ ছবি থেকে পেস্ট নয় — সত্যিই সাজানো।",
    },
    aiScore: 95,
    aiBreakdown: [
      { dim: DIMS.craft, score: 5, max: 5 },
      { dim: DIMS.instructions, score: 5, max: 5 },
      { dim: DIMS.accuracy, score: 5, max: 5 },
      { dim: DIMS.speed, score: 4, max: 5 },
    ],
    aiVerdict: {
      en: "One master, two exports, prices isolated. Exactly the structure the real four-size job needs. Bangla typesetting is genuine, not an image.",
      bn: "এক মাস্টার, দুই এক্সপোর্ট, দাম আলাদা। আসল চার-সাইজের কাজে ঠিক এই কাঠামোই দরকার। বাংলা টাইপসেটিং সত্যিকারের, ছবি নয়।",
    },
    aiCoaching: {
      en: "Nothing to fix. Keep the master-file approach visible in your submission notes — it is why you won this one.",
      bn: "ঠিক করার কিছু নেই। সাবমিশন নোটে মাস্টার-ফাইল পদ্ধতিটা দেখিয়ে রাখুন — এজন্যই আপনি এটি জিতেছেন।",
    },
    rank: 1, outcome: "shortlisted", points: 0,
    pointsReason: { en: "মডারেটরের সিদ্ধান্তের অপেক্ষায়", bn: "মডারেটরের সিদ্ধান্তের অপেক্ষায়" },
  },
  {
    id: "at5", trialId: "tr-x1", taskId: "x1", studentId: "s3",
    submittedLabel: { en: "Submitted 2 days ago", bn: "২ দিন আগে জমা" },
    minutesTaken: 55,
    summary: {
      en: "Both sizes look good, but each was built as a separate file and the prices are flattened into the artwork.",
      bn: "দুই সাইজই দেখতে ভালো, কিন্তু প্রতিটি আলাদা ফাইলে বানানো আর দাম আর্টওয়ার্কে মিশে গেছে।",
    },
    aiScore: 68,
    aiBreakdown: [
      { dim: DIMS.craft, score: 5, max: 5 },
      { dim: DIMS.instructions, score: 2, max: 5 },
      { dim: DIMS.accuracy, score: 4, max: 5 },
      { dim: DIMS.speed, score: 3, max: 5 },
    ],
    aiVerdict: {
      en: "The design itself is the better looking of the two. But flattened prices mean the whole job is redone the week before Ramadan — which is the exact problem the client described.",
      bn: "ডিজাইনটি দুটোর মধ্যে দেখতে বেশি সুন্দর। কিন্তু দাম মিশে যাওয়া মানে রমজানের আগের সপ্তাহে পুরো কাজ আবার করতে হবে — ক্লায়েন্ট ঠিক এই সমস্যাটার কথাই বলেছিলেন।",
    },
    aiCoaching: {
      en: "Your craft is not the problem — reading the constraint is. The client said prices are never final until the last week. That sentence was the brief. Read the complaint, not just the request.",
      bn: "আপনার নিখুঁততা সমস্যা নয় — সীমাবদ্ধতা পড়াটা সমস্যা। ক্লায়েন্ট বলেছিলেন দাম শেষ সপ্তাহের আগে চূড়ান্ত হয় না। ওই বাক্যটাই ছিল ব্রিফ। শুধু অনুরোধ নয়, অভিযোগটা পড়ুন।",
    },
    rank: 2, outcome: "not_shortlisted", points: 1,
    pointsReason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" },
  },
];

/* ── Points ledger ────────────────────────────────────────────── */

export const POINTS: PointEntry[] = [
  { id: "p1", studentId: "s1", taskId: "t2", delta: 0, reason: { en: "Selected and delivered the main task — 0", bn: "নির্বাচিত হয়ে মূল কাজ সফলভাবে শেষ — ০" }, dateLabel: { en: "4 days ago", bn: "৪ দিন আগে" } },
  { id: "p2", studentId: "s1", taskId: "x5", delta: 1, reason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" }, dateLabel: { en: "9 days ago", bn: "৯ দিন আগে" } },
  { id: "p3", studentId: "s1", taskId: "x2", delta: 1, reason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" }, dateLabel: { en: "12 days ago", bn: "১২ দিন আগে" } },
  { id: "p4", studentId: "s1", taskId: "t4", delta: 0, reason: { en: "Selected, main task in progress — 0", bn: "নির্বাচিত, মূল কাজ চলছে — ০" }, dateLabel: { en: "3 days ago", bn: "৩ দিন আগে" } },
  { id: "p5", studentId: "s2", taskId: "x3", delta: 1, reason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" }, dateLabel: { en: "4 hours ago", bn: "৪ ঘণ্টা আগে" } },
  { id: "p6", studentId: "s4", taskId: "x11", delta: -1, reason: { en: "Selected but did not finish the main task — −1", bn: "নির্বাচিত হয়ে মূল কাজে ব্যর্থ — −১" }, dateLabel: { en: "3 weeks ago", bn: "৩ সপ্তাহ আগে" } },
  { id: "p7", studentId: "s8", taskId: "x3", delta: 1, reason: { en: "Did the trial, was not selected — +1", bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — +১" }, dateLabel: { en: "5 hours ago", bn: "৫ ঘণ্টা আগে" } },
];

/* ── Client ↔ student chat on a live task ─────────────────────── */

export const CHAT: ChatMessage[] = [
  {
    id: "c1", taskId: "t4", from: "student",
    authorName: { en: "Nusrat Jahan", bn: "নুসরাত জাহান" },
    body: {
      en: "Assalamu alaikum. Before I build the dashboard — when a customer returns an item, should that order still count in the week's sales, or come out of it?",
      bn: "আসসালামু আলাইকুম। ড্যাশবোর্ড বানানোর আগে জানতে চাই — কোনো কাস্টমার আইটেম ফেরত দিলে সেই অর্ডারটা কি সপ্তাহের বিক্রিতে থাকবে, নাকি বাদ যাবে?",
    },
    timeLabel: { en: "Yesterday, 10:14", bn: "গতকাল, ১০:১৪" },
  },
  {
    id: "c2", taskId: "t4", from: "client",
    authorName: { en: "Nokshi Threads", bn: "নকশী থ্রেডস" },
    body: {
      en: "Come out of it. Otherwise the number looks good and the cash box does not match. We get maybe 4 or 5 returns a week.",
      bn: "বাদ যাবে। নাহলে সংখ্যাটা ভালো দেখায় আর ক্যাশ বাক্সের সাথে মেলে না। সপ্তাহে ৪-৫টা ফেরত আসে।",
    },
    timeLabel: { en: "Yesterday, 11:02", bn: "গতকাল, ১১:০২" },
  },
  {
    id: "c3", taskId: "t4", from: "student",
    authorName: { en: "Nusrat Jahan", bn: "নুসরাত জাহান" },
    body: {
      en: "Understood. Then I will show two numbers — gross and net of returns — so you can see the size of the gap. Also, can you send last month's stock export? I want to check my totals against something real before I show you anything.",
      bn: "বুঝেছি। তাহলে দুটি সংখ্যা দেখাব — মোট এবং ফেরত বাদ দিয়ে — যাতে ফারাকটা কত সেটা আপনি দেখতে পান। আর গত মাসের স্টক এক্সপোর্টটা পাঠাতে পারবেন? আপনাকে কিছু দেখানোর আগে বাস্তব কিছুর সাথে আমার হিসাব মিলিয়ে নিতে চাই।",
    },
    timeLabel: { en: "Yesterday, 11:20", bn: "গতকাল, ১১:২০" },
  },
  {
    id: "c4", taskId: "t4", from: "client",
    authorName: { en: "Nokshi Threads", bn: "নকশী থ্রেডস" },
    body: { en: "Sent. It is the file from the 1st to the 30th.", bn: "পাঠিয়েছি। ১ তারিখ থেকে ৩০ তারিখ পর্যন্ত ফাইল।" },
    timeLabel: { en: "Yesterday, 14:41", bn: "গতকাল, ১৪:৪১" },
    attachment: { en: "stock-export-march.xlsx", bn: "stock-export-march.xlsx" },
  },
  {
    id: "c5", taskId: "t4", from: "moderator",
    authorName: { en: "Coordinator", bn: "কোঅর্ডিনেটর" },
    body: {
      en: "Noting for the record: returns are excluded from weekly sales, agreed here on the 12th. This is now part of the acceptance criteria.",
      bn: "রেকর্ডের জন্য: সাপ্তাহিক বিক্রি থেকে ফেরত বাদ যাবে, ১২ তারিখে এখানে সম্মত হয়েছে। এটি এখন গ্রহণযোগ্যতার শর্তের অংশ।",
    },
    timeLabel: { en: "Yesterday, 15:05", bn: "গতকাল, ১৫:০৫" },
  },
  {
    id: "c6", taskId: "t4", from: "student",
    authorName: { en: "Nusrat Jahan", bn: "নুসরাত জাহান" },
    body: {
      en: "Thank you. Totals match the export for all four weeks. I will send the first version tomorrow.",
      bn: "ধন্যবাদ। চার সপ্তাহেই এক্সপোর্টের সাথে হিসাব মিলেছে। আগামীকাল প্রথম ভার্সন পাঠাব।",
    },
    timeLabel: { en: "Today, 09:30", bn: "আজ, ০৯:৩০" },
  },
  {
    id: "c7", taskId: "x3", from: "moderator",
    authorName: { en: "Sabbir Rahman, coordinator", bn: "সাব্বির রহমান, কোঅর্ডিনেটর" },
    body: {
      en: "Imran did the trial best and is my suggestion for this task. The two of you can talk from here. Anything you agree goes into the acceptance criteria.",
      bn: "ইমরান ট্রায়ালটা সবচেয়ে ভালো করেছেন, এই টাস্কের জন্য তাঁকেই সাজেস্ট করছি। আপনারা দুজন এখান থেকে কথা বলতে পারেন। যা সম্মত হবেন তা গ্রহণযোগ্যতার শর্তে যাবে।",
    },
    timeLabel: { en: "Today, 09:05", bn: "আজ, ০৯:০৫" },
  },
  {
    id: "c8", taskId: "x3", from: "student",
    authorName: { en: "Imran Kabir", bn: "ইমরান কবির" },
    body: {
      en: "Thank you. Two things before I start: are the slips in one box or spread across months, and where should I put the ones I cannot read — a separate sheet, or a colour in the same sheet?",
      bn: "ধন্যবাদ। শুরুর আগে দুটি বিষয়: স্লিপগুলো কি এক বাক্সে, নাকি মাসে মাসে ভাগ করা? আর যেগুলো পড়তে পারব না সেগুলো কোথায় রাখব — আলাদা শিটে, নাকি একই শিটে রঙ দিয়ে?",
    },
    timeLabel: { en: "Today, 09:40", bn: "আজ, ০৯:৪০" },
  },
  {
    id: "c9", taskId: "x3", from: "client",
    authorName: { en: "Nokshi Threads", bn: "নকশী থ্রেডস" },
    body: {
      en: "Spread across months, in twelve envelopes. Separate sheet please — my accountant will go through those by hand.",
      bn: "মাসে মাসে ভাগ করা, বারোটা খামে। আলাদা শিটেই দিন — আমার হিসাবরক্ষক ওগুলো হাতে দেখবেন।",
    },
    timeLabel: { en: "Today, 10:15", bn: "আজ, ১০:১৫" },
    attachment: { en: "envelope-labels.jpg", bn: "envelope-labels.jpg" },
  },
  {
    id: "c10", taskId: "t19", from: "client",
    authorName: { en: "Nokshi Threads", bn: "নকশী থ্রেডস" },
    body: {
      en: "The descriptions are live. Two customers have already quoted the fabric line back to us — thank you.",
      bn: "বর্ণনাগুলো সাইটে উঠেছে। দুইজন কাস্টমার ইতিমধ্যে কাপড়ের লাইনটা আমাদেরই ফিরিয়ে বলেছেন — ধন্যবাদ।",
    },
    timeLabel: { en: "Mon, 16:20", bn: "সোম, ১৬:২০" },
  },
  {
    id: "c11", taskId: "t19", from: "student",
    authorName: { en: "Afsana Mim", bn: "আফসানা মিম" },
    body: {
      en: "That is good to hear. If you add more items in the same season, the template file is in the handover folder — anyone can follow it.",
      bn: "শুনে ভালো লাগল। একই সিজনে আরও আইটেম যোগ করলে টেমপ্লেট ফাইলটি হ্যান্ডওভার ফোল্ডারে আছে — যে কেউ সেটা অনুসরণ করতে পারবেন।",
    },
    timeLabel: { en: "Mon, 17:05", bn: "সোম, ১৭:০৫" },
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */

export const trialForTask = (taskId: string) => TRIALS.find((t) => t.taskId === taskId);
export const attemptsForTask = (taskId: string) =>
  ATTEMPTS.filter((a) => a.taskId === taskId).sort((a, b) => a.rank - b.rank);
export const attemptsForStudent = (studentId: string) => ATTEMPTS.filter((a) => a.studentId === studentId);
export const pointsForStudent = (studentId: string) => POINTS.filter((p) => p.studentId === studentId);
export const pointTotal = (studentId: string) =>
  POINTS.filter((p) => p.studentId === studentId).reduce((a, p) => a + p.delta, 0);
export const chatForTask = (taskId: string) => CHAT.filter((c) => c.taskId === taskId);

/* ── Conversation list ────────────────────────────────────────

   A chat screen is a list of people first and a thread second. These
   helpers turn the flat message log into that list, newest first.
   ──────────────────────────────────────────────────────────── */

export type Conversation = {
  taskId: string;
  withName: L;
  last: ChatMessage;
  unread: boolean;
};

/** Every thread the given side can see, most recent first. */
export function conversationsFor(me: "client" | "student"): Conversation[] {
  const ids = Array.from(new Set(CHAT.map((c) => c.taskId)));
  const rows = ids
    .map((taskId) => {
      const msgs = chatForTask(taskId);
      const last = msgs[msgs.length - 1];
      const counterpart = [...msgs].reverse().find((m) => m.from !== me && m.from !== "moderator");
      if (!last || !counterpart) return null;
      return { taskId, withName: counterpart.authorName, last, unread: last.from !== me };
    })
    .filter((x): x is Conversation => x !== null);
  // Newest conversation first: "Today" beats "Mon".
  const rank = (c: Conversation) => (/today|আজ/i.test(c.last.timeLabel.en + c.last.timeLabel.bn) ? 0 : /yesterday|গতকাল/i.test(c.last.timeLabel.en + c.last.timeLabel.bn) ? 1 : 2);
  return rows.sort((a, b) => rank(a) - rank(b));
}

/** Tasks that currently have a trial round open for the moderator to judge. */
export const TRIAL_ROUNDS = TRIALS.map((t) => ({
  trial: t,
  attempts: attemptsForTask(t.taskId),
})).filter((r) => r.attempts.length > 0);


/* ── The client's check on the trial ──────────────────────────

   A trial the client has not looked at is the AI grading people
   against its own idea of the job. So the AI writes it, the client
   confirms it is genuinely a piece of their work, and only then does
   the task go on the board.
   ──────────────────────────────────────────────────────────── */

export const TRIAL_CHECKS: TrialCheck[] = [
  {
    taskId: "x3",
    status: "approved",
    askedLabel: { en: "Sent to the client 3 days ago", bn: "৩ দিন আগে ক্লায়েন্টের কাছে পাঠানো" },
    decidedLabel: { en: "Approved by the client 3 days ago", bn: "৩ দিন আগে ক্লায়েন্ট অনুমোদন করেছেন" },
  },
  {
    taskId: "x1",
    status: "awaiting_client",
    askedLabel: { en: "Waiting for you since yesterday", bn: "গতকাল থেকে আপনার জন্য অপেক্ষায়" },
  },
  {
    taskId: "x8",
    status: "changes_asked",
    askedLabel: { en: "Sent to the client 5 days ago", bn: "৫ দিন আগে ক্লায়েন্টের কাছে পাঠানো" },
    decidedLabel: { en: "Change requested 4 days ago — the AI rewrote it", bn: "৪ দিন আগে বদলাতে বলা হয়েছে — এআই নতুন করে লিখেছে" },
    clientNote: {
      en: "Two interviews is not enough to see whether someone can handle a farmer who does not want to talk. Make it three, and one of them has to be someone who refuses at first.",
      bn: "দুটি সাক্ষাৎকারে বোঝা যায় না, যে কৃষক কথা বলতে চান না তাঁকে কেউ সামলাতে পারবেন কিনা। তিনটি করুন, আর একজনকে এমন হতে হবে যিনি প্রথমে রাজি হন না।",
    },
  },
];

export const checkForTask = (taskId: string) => TRIAL_CHECKS.find((c) => c.taskId === taskId);
export const AWAITING_CLIENT = TRIAL_CHECKS.filter((c) => c.status === "awaiting_client").length;

/* ── The moderator's single suggestion ────────────────────────

   Not a shortlist. One person, with a reason — and the chat opens
   only once that name exists.
   ──────────────────────────────────────────────────────────── */

export const SUGGESTIONS: Suggestion[] = [
  {
    taskId: "x3",
    studentId: "s6",
    attemptId: "at1",
    reason: {
      en: "Highest score of the three, but that is not why. He flagged all three unreadable slips and wrote down what was unreadable in each — across 500 slips that habit is the difference between a usable file and a quietly wrong one.",
      bn: "তিনজনের মধ্যে সর্বোচ্চ স্কোর, তবে কারণটা সেটা নয়। তিনি তিনটি অস্পষ্ট স্লিপই চিহ্নিত করেছেন এবং প্রতিটিতে কী পড়া যায়নি লিখেছেন — ৫০০ স্লিপে এই অভ্যাসটাই ব্যবহারযোগ্য ফাইল আর নীরবে ভুল ফাইলের মধ্যে পার্থক্য গড়ে দেয়।",
    },
    suggestedLabel: { en: "Suggested 2 hours ago", bn: "২ ঘণ্টা আগে সাজেস্ট করা" },
    triedCount: 3,
  },
];

export const suggestionForTask = (taskId: string) => SUGGESTIONS.find((s) => s.taskId === taskId);
