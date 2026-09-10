import type { L } from "@/lib/i18n";

/* ────────────────────────────────────────────────────────────────
   Moderator / coordinator demo data.

   The coordinator is the human gate the whole model rests on: no AI
   scope reaches a student without passing through here, and no work
   becomes a permanent record without both signatures being checked.
   ──────────────────────────────────────────────────────────────── */

/* ── Payments & escrow ────────────────────────────────────────── */

export type PayStatus = "awaiting" | "held" | "released" | "refunded" | "failed";
export type PayDirection = "in" | "out";

export type Payment = {
  id: string;
  ref: string;
  direction: PayDirection;
  clientId: string;
  jobId: string;
  taskId?: string;
  studentId?: string;
  amount: number;
  method: L;
  status: PayStatus;
  dateLabel: L;
  note?: L;
};

export const PAYMENTS: Payment[] = [
  {
    id: "p1", ref: "PAY-4417", direction: "in", clientId: "c1", jobId: "j1", taskId: "t2",
    amount: 6000, method: { en: "bKash merchant", bn: "বিকাশ মার্চেন্ট" }, status: "released",
    studentId: "s1", dateLabel: { en: "4 days ago", bn: "৪ দিন আগে" },
    note: { en: "Released after the coordinator score and the client sign-off", bn: "কোঅর্ডিনেটরের স্কোর ও ক্লায়েন্ট সাইন-অফের পর ছাড়া হয়েছে" },
  },
  {
    id: "p2", ref: "PAY-4429", direction: "in", clientId: "c1", jobId: "j1", taskId: "t3",
    amount: 3000, method: { en: "bKash merchant", bn: "বিকাশ মার্চেন্ট" }, status: "held",
    studentId: "s2", dateLabel: { en: "2 days ago", bn: "২ দিন আগে" },
    note: { en: "Work delivered, awaiting client sign-off", bn: "কাজ ডেলিভার হয়েছে, ক্লায়েন্ট সাইন-অফের অপেক্ষায়" },
  },
  {
    id: "p3", ref: "PAY-4431", direction: "in", clientId: "c3", jobId: "j3", taskId: "t12",
    amount: 2500, method: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" }, status: "held",
    studentId: "s2", dateLabel: { en: "2 days ago", bn: "২ দিন আগে" },
    note: { en: "Scored 23/25, client sign-off pending", bn: "২৩/২৫ স্কোর, ক্লায়েন্টের সাইন-অফ বাকি" },
  },
  {
    id: "p4", ref: "PAY-4436", direction: "in", clientId: "c2", jobId: "j2",
    amount: 11400, method: { en: "Nagad", bn: "নগদ" }, status: "awaiting",
    dateLabel: { en: "Today, 11:20", bn: "আজ, ১১:২০" },
    note: { en: "Client has approved the scope; funding link sent", bn: "ক্লায়েন্ট স্কোপ অনুমোদন করেছেন; ফান্ডিং লিংক পাঠানো হয়েছে" },
  },
  {
    id: "p5", ref: "PAY-4440", direction: "in", clientId: "c3", jobId: "j3", taskId: "t13",
    amount: 1500, method: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" }, status: "held",
    studentId: "s6", dateLabel: { en: "Yesterday", bn: "গতকাল" },
    note: { en: "Client requested a revision — funds stay held, not refunded", bn: "ক্লায়েন্ট রিভিশন চেয়েছেন — টাকা আটকে থাকছে, ফেরত নয়" },
  },
  {
    id: "p6", ref: "PAY-4402", direction: "in", clientId: "c1", jobId: "j5", taskId: "t19",
    amount: 4500, method: { en: "bKash merchant", bn: "বিকাশ মার্চেন্ট" }, status: "released",
    studentId: "s3", dateLabel: { en: "9 days ago", bn: "৯ দিন আগে" },
  },
  {
    id: "p7", ref: "PAY-4395", direction: "in", clientId: "c2", jobId: "j2",
    amount: 2000, method: { en: "Nagad", bn: "নগদ" }, status: "failed",
    dateLabel: { en: "6 days ago", bn: "৬ দিন আগে" },
    note: { en: "Gateway timeout — client retried successfully on PAY-4436", bn: "গেটওয়ে টাইমআউট — ক্লায়েন্ট PAY-4436-এ আবার সফল হয়েছেন" },
  },
  {
    id: "p8", ref: "PAY-4388", direction: "in", clientId: "c3", jobId: "j3", taskId: "t10",
    amount: 1500, method: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" }, status: "released",
    studentId: "s6", dateLabel: { en: "12 days ago", bn: "১২ দিন আগে" },
  },
];

/* ── Client payment methods ───────────────────────────────────

   The whole of a client's onboarding. Two steps, no documents:
   open an account, add a way to pay. Everything else the platform
   needs to know about a business it learns from money that actually
   arrives and work it actually signs off.
   ──────────────────────────────────────────────────────────── */

export type PayMethodKind = "bkash" | "nagad" | "bank" | "card";

export type PayMethod = {
  id: string;
  clientId: string;
  kind: PayMethodKind;
  label: L;
  detail: L;          // masked account, never a full number
  addedLabel: L;
  isDefault: boolean;
  state: "ok" | "failing";
  note?: L;
};

export const PAY_METHODS: PayMethod[] = [
  {
    id: "pm1", clientId: "c1", kind: "bkash",
    label: { en: "bKash merchant", bn: "বিকাশ মার্চেন্ট" },
    detail: { en: "•••• 4471 · Nokshi Threads", bn: "•••• ৪৪৭১ · নকশী থ্রেডস" },
    addedLabel: { en: "Added 5 months ago", bn: "৫ মাস আগে যোগ" },
    isDefault: true, state: "ok",
  },
  {
    id: "pm2", clientId: "c1", kind: "bank",
    label: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" },
    detail: { en: "•••• 8820 · City Bank, Gulshan", bn: "•••• ৮৮২০ · সিটি ব্যাংক, গুলশান" },
    addedLabel: { en: "Added 2 months ago", bn: "২ মাস আগে যোগ" },
    isDefault: false, state: "ok",
    note: { en: "Used for deposits above ৳25,000", bn: "৳২৫,০০০-এর বেশি জমার জন্য ব্যবহৃত" },
  },
  {
    id: "pm3", clientId: "c2", kind: "nagad",
    label: { en: "Nagad", bn: "নগদ" },
    detail: { en: "•••• 6103 · Chaap Ghor", bn: "•••• ৬১০৩ · চাপ ঘর" },
    addedLabel: { en: "Added 3 weeks ago", bn: "৩ সপ্তাহ আগে যোগ" },
    isDefault: true, state: "ok",
  },
  {
    id: "pm4", clientId: "c3", kind: "bank",
    label: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" },
    detail: { en: "•••• 3355 · Sonali Bank, Bogura", bn: "•••• ৩৩৫৫ · সোনালী ব্যাংক, বগুড়া" },
    addedLabel: { en: "Added 4 months ago", bn: "৪ মাস আগে যোগ" },
    isDefault: true, state: "failing",
    note: { en: "Two deposits rejected by the bank — new posts paused until this works or another method is added", bn: "ব্যাংক দুইবার জমা ফিরিয়ে দিয়েছে — এটি ঠিক না হওয়া বা নতুন মেথড যোগ না করা পর্যন্ত নতুন পোস্ট থামানো" },
  },
];

export const methodsOfClient = (clientId: string) => PAY_METHODS.filter((m) => m.clientId === clientId);

/** The two steps that make up a client account. Nothing else is asked for. */
export const CLIENT_ONBOARDING: { key: string; title: L; detail: L }[] = [
  {
    key: "account",
    title: { en: "Create the account", bn: "অ্যাকাউন্ট খুলুন" },
    detail: { en: "Business name, a phone number and an email. Under a minute, no documents.", bn: "ব্যবসার নাম, একটি ফোন নম্বর ও ইমেইল। এক মিনিটের কম, কোনো ডকুমেন্ট নয়।" },
  },
  {
    key: "payment",
    title: { en: "Add a payment method", bn: "পেমেন্ট মেথড যোগ করুন" },
    detail: { en: "bKash, Nagad, a bank account or a card. This is the only thing the platform verifies about a business — and it verifies it by taking a real deposit, not by reading a licence.", bn: "বিকাশ, নগদ, ব্যাংক অ্যাকাউন্ট বা কার্ড। ব্যবসা সম্পর্কে প্ল্যাটফর্ম কেবল এটাই যাচাই করে — লাইসেন্স পড়ে নয়, সত্যিকারের একটি জমা নিয়ে।" },
  },
];

/* ── Verification ─────────────────────────────────────────────

   Only students are document-checked, because it is their name that
   goes on a permanent public record. A client is never asked for a
   trade licence.
   A client opens an account, adds a payment method, and the deposit
   clearing is the only proof the platform needs — money that arrives is
   harder to fake than a scanned licence, and asking an SME owner for
   paperwork was the single biggest reason they never posted at all.
   ──────────────────────────────────────────────────────────── */

export type KycKind = "student";
export type KycStatus = "pending" | "verified" | "rejected" | "resubmit";

export type KycRequest = {
  id: string;
  kind: KycKind;
  subjectId: string;
  name: L;
  context: L;
  submittedLabel: L;
  status: KycStatus;
  risk: "low" | "medium" | "high";
  documents: { label: L; detail: L; ok: boolean }[];
  flags: L[];
};

export const KYC: KycRequest[] = [
  {
    id: "k0", kind: "student", subjectId: "s1",
    name: { en: "Nusrat Jahan", bn: "নুসরাত জাহান" },
    context: { en: "Computer Science & Engineering, 4th year · Jahangirnagar University", bn: "কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং, ৪র্থ বর্ষ · জাহাঙ্গীরনগর বিশ্ববিদ্যালয়" },
    submittedLabel: { en: "Submitted 5 months ago", bn: "৫ মাস আগে জমা" },
    status: "verified", risk: "low",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "Department head, on letterhead, signed and sealed", bn: "বিভাগীয় প্রধান, লেটারহেডে, স্বাক্ষর ও সিলসহ" }, ok: true },
      { label: { en: "Student ID card", bn: "স্টুডেন্ট আইডি কার্ড" }, detail: { en: "Valid to 2027, photo and expiry both legible", bn: "২০২৭ পর্যন্ত বৈধ, ছবি ও মেয়াদ দুটোই স্পষ্ট" }, ok: true },
      { label: { en: "NID", bn: "এনআইডি" }, detail: { en: "Name and date of birth match the student ID", bn: "নাম ও জন্মতারিখ স্টুডেন্ট আইডির সাথে মেলে" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, account name matches", bn: "বিকাশ পার্সোনাল, অ্যাকাউন্টের নাম মেলে" }, ok: true },
    ],
    flags: [],
  },
  {
    id: "k1", kind: "student", subjectId: "s9",
    name: { en: "Sabina Yeasmin", bn: "সাবিনা ইয়াসমিন" },
    context: { en: "Statistics, final year · Jahangirnagar University", bn: "পরিসংখ্যান, শেষ বর্ষ · জাহাঙ্গীরনগর বিশ্ববিদ্যালয়" },
    submittedLabel: { en: "Submitted 2 days ago", bn: "২ দিন আগে জমা" },
    status: "pending", risk: "low",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "Department letterhead, signed and sealed", bn: "বিভাগীয় লেটারহেড, স্বাক্ষর ও সিলসহ" }, ok: true },
      { label: { en: "Student ID card", bn: "স্টুডেন্ট আইডি কার্ড" }, detail: { en: "Valid to 2027, photo clear", bn: "২০২৭ পর্যন্ত বৈধ, ছবি স্পষ্ট" }, ok: true },
      { label: { en: "NID", bn: "এনআইডি" }, detail: { en: "Name matches the student ID", bn: "স্টুডেন্ট আইডির নামের সাথে মেলে" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, name matches", bn: "বিকাশ পার্সোনাল, নাম মেলে" }, ok: true },
    ],
    flags: [],
  },
  {
    id: "k2", kind: "student", subjectId: "s7",
    name: { en: "Mehedi Hasan", bn: "মেহেদী হাসান" },
    context: { en: "Software Engineering, 3rd year · Daffodil International University", bn: "সফটওয়্যার ইঞ্জিনিয়ারিং, ৩য় বর্ষ · ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি" },
    submittedLabel: { en: "Submitted 5 hours ago", bn: "৫ ঘণ্টা আগে জমা" },
    status: "pending", risk: "medium",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "Signed by the department head, letterhead and seal both present", bn: "বিভাগীয় প্রধানের স্বাক্ষরিত, লেটারহেড ও সিল দুটোই আছে" }, ok: true },
      { label: { en: "Student ID card", bn: "স্টুডেন্ট আইডি কার্ড" }, detail: { en: "Photo legible, expiry not visible", bn: "ছবি স্পষ্ট, মেয়াদ দেখা যাচ্ছে না" }, ok: false },
      { label: { en: "Department confirmation", bn: "বিভাগীয় নিশ্চয়তা" }, detail: { en: "Emailed from a university domain", bn: "বিশ্ববিদ্যালয়ের ডোমেইন থেকে ইমেইল" }, ok: true },
      { label: { en: "NID / birth certificate", bn: "এনআইডি / জন্ম নিবন্ধন" }, detail: { en: "NID, name matches the student ID", bn: "এনআইডি, স্টুডেন্ট আইডির নামের সাথে মেলে" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, name matches", bn: "বিকাশ পার্সোনাল, নাম মেলে" }, ok: true },
    ],
    flags: [{ en: "ID card expiry is cropped out of the photo — ask for a re-upload before the first payout", bn: "আইডি কার্ডের মেয়াদ ছবিতে কাটা পড়েছে — প্রথম পেআউটের আগে আবার আপলোড চান" }],
  },
  {
    id: "k3", kind: "student", subjectId: "s8",
    name: { en: "Farzana Akter", bn: "ফারজানা আক্তার" },
    context: { en: "Marketing graduate · National University — Govt. Titumir College", bn: "মার্কেটিং গ্র্যাজুয়েট · জাতীয় বিশ্ববিদ্যালয় — সরকারি তিতুমীর কলেজ" },
    submittedLabel: { en: "Submitted yesterday", bn: "গতকাল জমা" },
    status: "pending", risk: "low",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "From a college teacher — phone number on the letter answered, identity confirmed", bn: "কলেজ শিক্ষকের কাছ থেকে — চিঠির নম্বরে ফোন ধরা হয়েছে, পরিচয় নিশ্চিত" }, ok: true },
      { label: { en: "Certificate / transcript", bn: "সার্টিফিকেট / ট্রান্সক্রিপ্ট" }, detail: { en: "Provisional certificate, registration number legible", bn: "প্রভিশনাল সার্টিফিকেট, রেজিস্ট্রেশন নম্বর স্পষ্ট" }, ok: true },
      { label: { en: "NID", bn: "এনআইডি" }, detail: { en: "Name and date of birth match", bn: "নাম ও জন্মতারিখ মেলে" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, name matches", bn: "বিকাশ পার্সোনাল, নাম মেলে" }, ok: true },
    ],
    flags: [{ en: "National University cohort — the group with the highest unemployment and the least access to proof", bn: "জাতীয় বিশ্ববিদ্যালয়ের দল — যাদের বেকারত্ব সর্বোচ্চ ও প্রমাণের সুযোগ সর্বনিম্ন" }],
  },
  {
    id: "k4", kind: "student", subjectId: "s7",
    name: { en: "Mehedi Hasan — re-upload", bn: "মেহেদী হাসান — পুনরায় আপলোড" },
    context: { en: "Software Engineering, 3rd year · Daffodil International University", bn: "সফটওয়্যার ইঞ্জিনিয়ারিং, ৩য় বর্ষ · ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি" },
    submittedLabel: { en: "Re-submitted 3 days ago", bn: "৩ দিন আগে আবার জমা" },
    status: "resubmit", risk: "medium",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "Signed, but the department seal is missing", bn: "স্বাক্ষর আছে, তবে বিভাগীয় সিল নেই" }, ok: false },
      { label: { en: "Student ID card", bn: "স্টুডেন্ট আইডি কার্ড" }, detail: { en: "Expiry now visible, valid to 2027", bn: "মেয়াদ এখন দেখা যাচ্ছে, ২০২৭ পর্যন্ত বৈধ" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, name matches", bn: "বিকাশ পার্সোনাল, নাম মেলে" }, ok: true },
    ],
    flags: [{ en: "Ask for the sealed copy — an unsealed letter is the one document anyone could type themselves", bn: "সিলসহ কপি চান — সিল ছাড়া চিঠিই একমাত্র ডকুমেন্ট যা যে কেউ নিজে টাইপ করে ফেলতে পারেন" }],
  },
  {
    id: "k5", kind: "student", subjectId: "s5",
    name: { en: "Sadia Islam", bn: "সাদিয়া ইসলাম" },
    context: { en: "Fine Arts — Graphic Design · University of Development Alternative", bn: "ফাইন আর্টস — গ্রাফিক ডিজাইন · ইউনিভার্সিটি অফ ডেভেলপমেন্ট অল্টারনেটিভ" },
    submittedLabel: { en: "Submitted 6 days ago", bn: "৬ দিন আগে জমা" },
    status: "verified", risk: "low",
    documents: [
      { label: { en: "Recommendation letter", bn: "সুপারিশপত্র" }, detail: { en: "Department head, letterhead and seal both present", bn: "বিভাগীয় প্রধান, লেটারহেড ও সিল দুটোই আছে" }, ok: true },
      { label: { en: "Certificate", bn: "সার্টিফিকেট" }, detail: { en: "Provisional certificate, registration number legible", bn: "প্রভিশনাল সার্টিফিকেট, রেজিস্ট্রেশন নম্বর স্পষ্ট" }, ok: true },
      { label: { en: "NID", bn: "এনআইডি" }, detail: { en: "Name and date of birth match", bn: "নাম ও জন্মতারিখ মেলে" }, ok: true },
      { label: { en: "Payout account", bn: "পেআউট অ্যাকাউন্ট" }, detail: { en: "bKash personal, name matches", bn: "বিকাশ পার্সোনাল, নাম মেলে" }, ok: true },
    ],
    flags: [],
  },

];

/* ── AI scope review — the human gate ─────────────────────────── */

export type ScopeReview = {
  id: string;
  jobId: string;
  submittedLabel: L;
  aiFlags: L[];
  suggestion: L;
  priority: "high" | "normal";
};

export const SCOPE_REVIEWS: ScopeReview[] = [
  {
    id: "sr1", jobId: "j4",
    submittedLabel: { en: "Scoped 40 minutes ago", bn: "৪০ মিনিট আগে স্কোপ করা" },
    priority: "high",
    aiFlags: [
      { en: "Confidence 89% — below the 92% threshold for design briefs", bn: "কনফিডেন্স ৮৯% — ডিজাইন ব্রিফের ৯২% সীমার নিচে" },
      { en: "Task 1 depends on a supplier phone call the platform cannot verify", bn: "টাস্ক ১ এমন একটি সরবরাহকারী কলের ওপর নির্ভর করে যা প্ল্যাটফর্ম যাচাই করতে পারে না" },
    ],
    suggestion: {
      en: "Scope looks sound but the fee on task 2 is 15% under comparable packaging work. Consider raising it before release, or the task will sit unmatched.",
      bn: "স্কোপ ঠিক আছে, তবে টাস্ক ২-এর ফি তুলনীয় প্যাকেজিং কাজের চেয়ে ১৫% কম। ছাড়ার আগে বাড়ানোর কথা ভাবুন, নইলে টাস্কটি ম্যাচ ছাড়াই পড়ে থাকবে।",
    },
  },
  {
    id: "sr2", jobId: "j6",
    submittedLabel: { en: "Scoped 3 hours ago", bn: "৩ ঘণ্টা আগে স্কোপ করা" },
    priority: "normal",
    aiFlags: [
      { en: "Confidence 84% — the brief mixes a data problem with a management problem", bn: "কনফিডেন্স ৮৪% — ব্রিফে ডেটার সমস্যা ও ব্যবস্থাপনার সমস্যা মিশে আছে" },
    ],
    suggestion: {
      en: "The AI kept all three tasks in one job. Task 3 is a process recommendation, not data work — consider splitting it out so it can be priced and matched separately.",
      bn: "এআই তিনটি টাস্কই এক জবে রেখেছে। টাস্ক ৩ ডেটার কাজ নয়, প্রক্রিয়া-সুপারিশ — আলাদা করে দাম ও ম্যাচিং করার কথা ভাবুন।",
    },
  },
  {
    id: "sr3", jobId: "j2",
    submittedLabel: { en: "Scoped yesterday", bn: "গতকাল স্কোপ করা" },
    priority: "normal",
    aiFlags: [
      { en: "Client has one failed payment on record (PAY-4395, gateway timeout)", bn: "ক্লায়েন্টের রেকর্ডে একটি ব্যর্থ পেমেন্ট আছে (PAY-4395, গেটওয়ে টাইমআউট)" },
    ],
    suggestion: {
      en: "Scope is clean. Hold release until the funding on PAY-4436 clears, so no student starts work against an unfunded job.",
      bn: "স্কোপ পরিষ্কার। PAY-4436-এর ফান্ডিং নিশ্চিত হওয়া পর্যন্ত ছাড়া আটকে রাখুন, যাতে কোনো শিক্ষার্থী ফান্ড ছাড়া জবে কাজ শুরু না করেন।",
    },
  },
];

/* ── Verification audit — dual sign-off checks ────────────────── */

export type VerificationCheck = {
  id: string;
  evaluationId: string;
  taskId: string;
  reviewerOk: boolean;
  clientOk: boolean;
  note: L;
  state: "clean" | "attention";
};

export const VERIFICATION_CHECKS: VerificationCheck[] = [
  {
    id: "v1", evaluationId: "e1", taskId: "t2", reviewerOk: true, clientOk: true,
    state: "clean",
    note: { en: "Both signatures present, and the score matches the evidence attached to the submission. Recorded.", bn: "দুটি স্বাক্ষরই আছে, আর সাবমিশনের সাথে দেওয়া প্রমাণের সাথে স্কোর মেলে। রেকর্ড হয়েছে।" },
  },
  {
    id: "v2", evaluationId: "e2", taskId: "t11", reviewerOk: true, clientOk: true,
    state: "clean",
    note: { en: "Verification sample of 118 rows re-checked at random. Accuracy claim holds.", bn: "১১৮টি সারির যাচাই নমুনা এলোমেলোভাবে পুনঃপরীক্ষা করা হয়েছে। নির্ভুলতার দাবি টিকেছে।" },
  },
  {
    id: "v3", evaluationId: "e3", taskId: "t19", reviewerOk: true, clientOk: true,
    state: "attention",
    note: {
      en: "The coordinator who scored it and the client are linked to the same business group. Not disqualifying, but the entry is marked so the relationship is visible on the passport.",
      bn: "যিনি স্কোর দিয়েছেন সেই কোঅর্ডিনেটর ও ক্লায়েন্ট একই ব্যবসায়িক গ্রুপের সাথে যুক্ত। এতে বাতিল হয় না, তবে এন্ট্রিটি চিহ্নিত করা হয়েছে যাতে সম্পর্কটি পাসপোর্টে দৃশ্যমান থাকে।",
    },
  },
];

/* ── Platform controls ────────────────────────────────────────── */

export type Control = {
  key: string;
  label: L;
  desc: L;
  on: boolean;
  locked?: L;
};

export const CONTROLS: Control[] = [
  {
    key: "ai_gate",
    label: { en: "Require human approval on every AI scope", bn: "প্রতিটি এআই স্কোপে মানুষের অনুমোদন বাধ্যতামূলক" },
    desc: {
      en: "No AI-generated breakdown reaches a student or a client until a coordinator approves it.",
      bn: "কোঅর্ডিনেটর অনুমোদন না করা পর্যন্ত কোনো এআই-জেনারেটেড ভাগ শিক্ষার্থী বা ক্লায়েন্টের কাছে যায় না।",
    },
    on: true,
    locked: {
      en: "Locked on until Phase 2 exit criteria are met — this constraint is written into the roadmap, not left to judgement.",
      bn: "ফেজ ২-এর শর্ত পূরণ না হওয়া পর্যন্ত স্থায়ীভাবে চালু — এই সীমা রোডম্যাপেই লেখা, বিচারবুদ্ধির ওপর ছাড়া নয়।",
    },
  },
  {
    key: "dual_signoff",
    label: { en: "Require a coordinator score and the client's sign-off", bn: "কোঅর্ডিনেটরের স্কোর ও ক্লায়েন্টের সাইন-অফ বাধ্যতামূলক" },
    desc: {
      en: "No self-claim ever becomes a verified record. Both signatures, or the work does not count.",
      bn: "কোনো self-claim কখনো ভেরিফায়েড রেকর্ড হয় না। দুটি স্বাক্ষর, নাহলে কাজ গণনা হয় না।",
    },
    on: true,
    locked: { en: "Locked on permanently — removing it would empty the record of meaning.", bn: "স্থায়ীভাবে চালু — সরালে রেকর্ডের অর্থই থাকে না।" },
  },
  {
    key: "escrow",
    label: { en: "Hold funds until sign-off", bn: "সাইন-অফ পর্যন্ত টাকা আটকে রাখা" },
    desc: {
      en: "Client money is held by the platform, never advanced to the student, and never spent while work is in flight.",
      bn: "ক্লায়েন্টের টাকা প্ল্যাটফর্মে আটকে থাকে, শিক্ষার্থীকে আগাম দেওয়া হয় না, আর কাজ চলাকালীন খরচও হয় না।",
    },
    on: true,
  },
  {
    key: "cold_start",
    label: { en: "Reserve cold-start slots on micro-tasks", bn: "মাইক্রো-টাস্কে কোল্ড-স্টার্ট স্লট সংরক্ষণ" },
    desc: {
      en: "Keeps a first task reachable for a graduate with no history at all. Without it the platform only ever serves people who already have proof.",
      bn: "কোনো ইতিহাস নেই এমন গ্র্যাজুয়েটের জন্যও প্রথম টাস্ক নাগালে রাখে। এটা না থাকলে প্ল্যাটফর্ম কেবল তাদেরই সেবা দেয় যাদের ইতিমধ্যে প্রমাণ আছে।",
    },
    on: true,
  },
  {
    key: "team_projects",
    label: { en: "Allow team-based projects", bn: "টিম-বেসড প্রজেক্ট চালু" },
    desc: {
      en: "Individual and pair work only until Phase 3. Team coordination collapsing early is a known failure mode.",
      bn: "ফেজ ৩ পর্যন্ত কেবল individual ও pair কাজ। শুরুতেই টিম কোঅর্ডিনেশন ভেঙে পড়া একটি পরিচিত ব্যর্থতা।",
    },
    on: false,
  },
  {
    key: "auto_match",
    label: { en: "Auto-release match shortlists", bn: "ম্যাচ শর্টলিস্ট স্বয়ংক্রিয় প্রকাশ" },
    desc: {
      en: "When off, a coordinator releases each shortlist by hand. Matching is human behind the scenes whatever the interface suggests.",
      bn: "বন্ধ থাকলে কোঅর্ডিনেটর প্রতিটি শর্টলিস্ট হাতে প্রকাশ করেন। ইন্টারফেস যা-ই দেখাক, ম্যাচিং পেছনে মানুষই করে।",
    },
    on: false,
  },
  {
    key: "new_sectors",
    label: { en: "Open sectors beyond the pilot vertical", bn: "পাইলট ভার্টিকালের বাইরে সেক্টর খোলা" },
    desc: {
      en: "All nine rubrics are written, but sectors switch on one at a time so validation stays honest.",
      bn: "নয়টি রুব্রিকই লেখা আছে, তবে যাচাই সৎ রাখতে সেক্টর একবারে একটি করে চালু হয়।",
    },
    on: false,
  },
];

/* ── Activity log ─────────────────────────────────────────────── */

export type Activity = {
  id: string;
  kind: "scope" | "payment" | "verify" | "user" | "control";
  actor: L;
  action: L;
  timeLabel: L;
};

export const ACTIVITY: Activity[] = [
  {
    id: "a1", kind: "payment", actor: { en: "Coordinator", bn: "কোঅর্ডিনেটর" },
    action: { en: "Released ৳6,000 to Nusrat Jahan on PAY-4417", bn: "PAY-4417-এ নুসরাত জাহানকে ৳৬,০০০ ছাড়া হয়েছে" },
    timeLabel: { en: "4 days ago", bn: "৪ দিন আগে" },
  },
  {
    id: "a2", kind: "scope", actor: { en: "Coordinator", bn: "কোঅর্ডিনেটর" },
    action: { en: "Re-split WB-2481 from 4 tasks into 5 before release", bn: "প্রকাশের আগে WB-2481 ৪টি টাস্ক থেকে ৫টিতে ভাগ করা হয়েছে" },
    timeLabel: { en: "6 days ago", bn: "৬ দিন আগে" },
  },
  {
    id: "a3", kind: "verify", actor: { en: "System", bn: "সিস্টেম" },
    action: { en: "Flagged e3 — the reviewing coordinator and the client share a business group", bn: "e3 চিহ্নিত — রিভিউকারী কোঅর্ডিনেটর ও ক্লায়েন্ট একই ব্যবসায়িক গ্রুপের" },
    timeLabel: { en: "9 days ago", bn: "৯ দিন আগে" },
  },
  {
    id: "a4", kind: "user", actor: { en: "Coordinator", bn: "কোঅর্ডিনেটর" },
    action: { en: "Paused new job posts from Shopno Agro — two deposits failed at the gateway", bn: "স্বপ্ন এগ্রোর নতুন জব পোস্ট থামানো — গেটওয়েতে দুইবার জমা ব্যর্থ" },
    timeLabel: { en: "3 days ago", bn: "৩ দিন আগে" },
  },
  {
    id: "a5", kind: "control", actor: { en: "Coordinator", bn: "কোঅর্ডিনেটর" },
    action: { en: "Kept auto-release of match shortlists off for another cycle", bn: "আরও এক চক্রের জন্য ম্যাচ শর্টলিস্টের স্বয়ংক্রিয় প্রকাশ বন্ধ রাখা হয়েছে" },
    timeLabel: { en: "Last week", bn: "গত সপ্তাহে" },
  },
];

/* ── Account status ───────────────────────────────────────────── */

export type AccountState = "active" | "review" | "restricted" | "new";

export const CLIENT_STATE: Record<string, { state: AccountState; note: L }> = {
  c1: { state: "active", note: { en: "6 repeat hires, no disputes", bn: "৬টি পুনরায় নিয়োগ, কোনো বিরোধ নেই" } },
  c2: { state: "active", note: { en: "Payment method added, first deposit cleared", bn: "পেমেন্ট মেথড যোগ, প্রথম জমা সফল" } },
  c3: { state: "restricted", note: { en: "New posts paused — two deposits failed, no working payment method", bn: "নতুন পোস্ট থামানো — দুইবার জমা ব্যর্থ, কার্যকর পেমেন্ট মেথড নেই" } },
};

export const STUDENT_STATE: Record<string, { state: AccountState; note: L }> = {
  s1: { state: "active", note: { en: "Referral priority unlocked", bn: "রেফারেল প্রায়োরিটি চালু" } },
  s2: { state: "active", note: { en: "100% on-time record", bn: "১০০% সময়মতো রেকর্ড" } },
  s3: { state: "active", note: { en: "Highest rubric average on the pilot", bn: "পাইলটে সর্বোচ্চ রুব্রিক গড়" } },
  s4: { state: "active", note: { en: "One late delivery, explained and accepted", bn: "একটি দেরি, ব্যাখ্যা দেওয়া ও গৃহীত" } },
  s5: { state: "active", note: { en: "Portfolio entirely from paid work", bn: "পোর্টফোলিও পুরোটাই পেইড কাজ থেকে" } },
  s6: { state: "active", note: { en: "Only active student outside Dhaka", bn: "ঢাকার বাইরে একমাত্র সক্রিয় শিক্ষার্থী" } },
  s7: { state: "review", note: { en: "Student ID re-upload requested", bn: "স্টুডেন্ট আইডি আবার আপলোড চাওয়া হয়েছে" } },
  s8: { state: "new", note: { en: "Verified today, awaiting first match", bn: "আজ যাচাই হয়েছে, প্রথম ম্যাচের অপেক্ষায়" } },
};

export const paymentById = (id: string) => PAYMENTS.find((p) => p.id === id);

/** A student's own verification record — the gate before they can do any trial. */
export const kycForSubject = (subjectId: string) => KYC.find((k) => k.subjectId === subjectId);

/** The three steps that make up a student account. */
export const STUDENT_ONBOARDING: { key: string; title: L; detail: L }[] = [
  {
    key: "account",
    title: { en: "Create the account", bn: "অ্যাকাউন্ট খুলুন" },
    detail: { en: "Name, university, discipline and the skills you want to be matched on.", bn: "নাম, বিশ্ববিদ্যালয়, বিষয় আর যেসব স্কিলে ম্যাচ চান।" },
  },
  {
    key: "documents",
    title: { en: "Upload your recommendation letter", bn: "সুপারিশপত্র আপলোড করুন" },
    detail: { en: "A letter from your department or a teacher, on letterhead, signed and sealed — plus your student ID, NID and a payout account.", bn: "বিভাগ বা কোনো শিক্ষকের চিঠি, লেটারহেডে, স্বাক্ষর ও সিলসহ — সাথে স্টুডেন্ট আইডি, এনআইডি ও একটি পেআউট অ্যাকাউন্ট।" },
  },
  {
    key: "verified",
    title: { en: "A coordinator verifies it", bn: "কোঅর্ডিনেটর যাচাই করেন" },
    detail: { en: "They read the letter and call the number on it. Until that is done you can browse tasks but you cannot do a trial.", bn: "তাঁরা চিঠিটি পড়েন আর তাতে দেওয়া নম্বরে ফোন করেন। এটা শেষ না হওয়া পর্যন্ত আপনি টাস্ক দেখতে পারবেন, কিন্তু ট্রায়াল করতে পারবেন না।" },
  },
];
