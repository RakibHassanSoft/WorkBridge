import type { Dispute, SupportTicket } from "./types";

/* ────────────────────────────────────────────────────────────────
   Disputes and support — both land on the moderator's desk.

   A dispute is about money already held in escrow. A support ticket is
   about anything else. The two are kept apart because only one of them
   can move funds.
   ──────────────────────────────────────────────────────────────── */

export const DISPUTES: Dispute[] = [
  {
    id: "d1",
    ref: "DSP-118",
    taskId: "t13",
    raisedBy: "client",
    raisedByName: { en: "Shopno Agro", bn: "স্বপ্ন এগ্রো" },
    openedLabel: { en: "Opened 2 days ago", bn: "২ দিন আগে খোলা" },
    status: "evidence",
    amount: 1500,
    claim: {
      en: "The recommendation note lists twenty farmers to call, but four of them stopped buying from us more than a year ago. That is not a call list I can use.",
      bn: "সুপারিশ নোটে কল করার জন্য বিশজন কৃষকের নাম আছে, কিন্তু এর চারজন এক বছরেরও বেশি আগে আমাদের কাছ থেকে কেনা বন্ধ করেছেন। এটা এমন কল লিস্ট নয় যা আমি ব্যবহার করতে পারি।",
    },
    counterClaim: {
      en: "The segment rule the client signed off on defined 'lapsed' as no purchase in two seasons. Those four fall inside that rule. I flagged them in the notes as long-lapsed and low priority.",
      bn: "ক্লায়েন্ট যে সেগমেন্ট নিয়ম অনুমোদন করেছিলেন সেখানে 'নিষ্ক্রিয়' মানে দুই মৌসুমে কেনাকাটা নেই। ওই চারজন সেই নিয়মের ভেতরেই পড়েন। আমি নোটে তাদের দীর্ঘ-নিষ্ক্রিয় ও কম অগ্রাধিকার হিসেবে চিহ্নিত করেছি।",
    },
    evidence: {
      en: [
        "সেগমেন্ট নিয়ম, ক্লায়েন্ট অনুমোদিত — ৯ দিন আগে",
        "ডেলিভার করা নোটের পৃষ্ঠা ২: চারজন 'দীর্ঘ-নিষ্ক্রিয়' চিহ্নিত",
        "গ্রহণযোগ্যতার শর্ত: 'আগামী মৌসুমে ক্লায়েন্ট নিজেই নিয়ম চালাতে পারবেন'",
      ],
      bn: [
        "সেগমেন্ট নিয়ম, ক্লায়েন্ট অনুমোদিত — ৯ দিন আগে",
        "ডেলিভার করা নোটের পৃষ্ঠা ২: চারজন 'দীর্ঘ-নিষ্ক্রিয়' চিহ্নিত",
        "গ্রহণযোগ্যতার শর্ত: 'আগামী মৌসুমে ক্লায়েন্ট নিজেই নিয়ম চালাতে পারবেন'",
      ],
    },
  },
  {
    id: "d2",
    ref: "DSP-121",
    taskId: "x12",
    raisedBy: "student",
    raisedByName: { en: "Sadia Islam", bn: "সাদিয়া ইসলাম" },
    openedLabel: { en: "Opened yesterday", bn: "গতকাল খোলা" },
    status: "open",
    amount: 3600,
    claim: {
      en: "I shot and delivered all thirty products. The client is now asking for eight more products that arrived after the brief was written, at the same fee.",
      bn: "আমি তিরিশটি প্রোডাক্টই শুট করে দিয়েছি। ক্লায়েন্ট এখন একই ফি-তে আরও আটটি প্রোডাক্ট চাইছেন, যেগুলো ব্রিফ লেখার পরে এসেছে।",
    },
    counterClaim: {
      en: "The new pieces are from the same season and I assumed they were included. I am not trying to get free work — I did not realise the count was fixed.",
      bn: "নতুন পিসগুলো একই সিজনের, আমি ভেবেছিলাম এগুলোও অন্তর্ভুক্ত। আমি বিনামূল্যে কাজ নিতে চাইছি না — বুঝিনি যে সংখ্যাটা নির্দিষ্ট ছিল।",
    },
    evidence: {
      en: [
        "ব্রিফে স্পষ্ট: '৩০টি প্যাকেজিং এসকেইউ'",
        "গ্রহণযোগ্যতার শর্ত: '৩০টিতেই সামঞ্জস্যপূর্ণ হোয়াইট ব্যালান্স'",
        "শিক্ষার্থীর ডেলিভারি: ৩০টি প্রোডাক্ট, ওয়েব ও প্রিন্ট দুই ফরম্যাটে",
      ],
      bn: [
        "ব্রিফে স্পষ্ট: '৩০টি প্যাকেজিং এসকেইউ'",
        "গ্রহণযোগ্যতার শর্ত: '৩০টিতেই সামঞ্জস্যপূর্ণ হোয়াইট ব্যালান্স'",
        "শিক্ষার্থীর ডেলিভারি: ৩০টি প্রোডাক্ট, ওয়েব ও প্রিন্ট দুই ফরম্যাটে",
      ],
    },
  },
  {
    id: "d3",
    ref: "DSP-109",
    taskId: "x11",
    raisedBy: "client",
    raisedByName: { en: "Nokshi Threads", bn: "নকশী থ্রেডস" },
    openedLabel: { en: "Opened 3 weeks ago", bn: "৩ সপ্তাহ আগে খোলা" },
    status: "resolved",
    amount: 4800,
    claim: {
      en: "The drawings never arrived. Two extensions were missed and the sheets that came had no code reference.",
      bn: "ড্রয়িং কখনো আসেনি। দুটি সম্প্রসারণ বাদ পড়েছে আর যে শিটগুলো এসেছে সেগুলোতে কোনো কোড রেফারেন্স নেই।",
    },
    counterClaim: {
      en: "I could not get site access on two of the agreed days and did not tell anyone in time.",
      bn: "সম্মত দুটি দিনে সাইটে ঢুকতে পারিনি আর সময়মতো কাউকে জানাইনি।",
    },
    evidence: {
      en: ["সাইট অ্যাক্সেসের কোনো লিখিত রেকর্ড নেই", "মেন্টর রিভিউ কখনো বুক করা হয়নি", "শিক্ষার্থী দায় স্বীকার করেছেন"],
      bn: ["সাইট অ্যাক্সেসের কোনো লিখিত রেকর্ড নেই", "মেন্টর রিভিউ কখনো বুক করা হয়নি", "শিক্ষার্থী দায় স্বীকার করেছেন"],
    },
    resolution: {
      en: "ক্লায়েন্টকে সম্পূর্ণ টাকা ফেরত দেওয়া হয়েছে। শিক্ষার্থীর পয়েন্টে −১ বসেছে, কারণ নির্বাচিত হয়ে মূল কাজ শেষ করতে পারেননি। অ্যাকাউন্ট বন্ধ হয়নি — একটি ব্যর্থতা মানে শেষ নয়, কিন্তু রেকর্ডে থাকবে।",
      bn: "ক্লায়েন্টকে সম্পূর্ণ টাকা ফেরত দেওয়া হয়েছে। শিক্ষার্থীর পয়েন্টে −১ বসেছে, কারণ নির্বাচিত হয়ে মূল কাজ শেষ করতে পারেননি। অ্যাকাউন্ট বন্ধ হয়নি — একটি ব্যর্থতা মানে শেষ নয়, কিন্তু রেকর্ডে থাকবে।",
    },
    outcome: { en: "সম্পূর্ণ রিফান্ড · শিক্ষার্থীর পয়েন্ট −১", bn: "সম্পূর্ণ রিফান্ড · শিক্ষার্থীর পয়েন্ট −১" },
  },
];

export const TICKETS: SupportTicket[] = [
  {
    id: "s1",
    ref: "SUP-402",
    fromRole: "student",
    fromName: { en: "Imran Kabir", bn: "ইমরান কবির" },
    subject: { en: "bKash payout has not arrived", bn: "বিকাশ পেআউট আসেনি" },
    body: {
      en: "The task was signed off three days ago but nothing has come to my bKash. The number on my profile is the same one I have always used.",
      bn: "তিন দিন আগে টাস্ক সাইন-অফ হয়েছে কিন্তু আমার বিকাশে কিছু আসেনি। প্রোফাইলে যে নম্বর আছে সেটাই আমি সবসময় ব্যবহার করি।",
    },
    openedLabel: { en: "5 hours ago", bn: "৫ ঘণ্টা আগে" },
    status: "new",
    priority: "high",
  },
  {
    id: "s2",
    ref: "SUP-399",
    fromRole: "client",
    fromName: { en: "Chaap Ghor", bn: "চাপ ঘর" },
    subject: { en: "Can I add work to a task already running?", bn: "চলমান টাস্কে কি কাজ যোগ করা যায়?" },
    body: {
      en: "The content calendar is going well and I want ten more posts. Do I open a new task or can it be added to this one?",
      bn: "কনটেন্ট ক্যালেন্ডারটা ভালো চলছে, আমি আরও দশটা পোস্ট চাই। নতুন টাস্ক খুলব নাকি এটার সাথেই যোগ করা যাবে?",
    },
    openedLabel: { en: "Yesterday", bn: "গতকাল" },
    status: "answered",
    priority: "normal",
    reply: {
      en: "নতুন টাস্ক খুলতে হবে। চলমান টাস্কের স্কোপ বাড়ানো যায় না — কারণ ফি ও গ্রহণযোগ্যতার শর্ত শুরুতেই সম্মত হয়েছে, আর সেটাই শিক্ষার্থীর সুরক্ষা। একই শিক্ষার্থীকে সরাসরি নতুন টাস্কে ডাকতে পারবেন।",
      bn: "নতুন টাস্ক খুলতে হবে। চলমান টাস্কের স্কোপ বাড়ানো যায় না — কারণ ফি ও গ্রহণযোগ্যতার শর্ত শুরুতেই সম্মত হয়েছে, আর সেটাই শিক্ষার্থীর সুরক্ষা। একই শিক্ষার্থীকে সরাসরি নতুন টাস্কে ডাকতে পারবেন।",
    },
  },
  {
    id: "s3",
    ref: "SUP-396",
    fromRole: "student",
    fromName: { en: "Farzana Akter", bn: "ফারজানা আক্তার" },
    subject: { en: "Why did I get +1 when I was not selected?", bn: "নির্বাচিত হইনি, তবু +১ পেলাম কেন?" },
    body: {
      en: "I did the trial task and someone else got the job, but my points went up by one. Is that a mistake?",
      bn: "আমি ট্রায়াল টাস্ক করেছি আর কাজটা অন্য কেউ পেয়েছে, কিন্তু আমার পয়েন্ট এক বেড়েছে। এটা কি ভুল?",
    },
    openedLabel: { en: "2 days ago", bn: "২ দিন আগে" },
    status: "answered",
    priority: "normal",
    reply: {
      en: "ভুল নয়। ট্রায়াল টাস্ক করা মানে আপনি সময় দিয়েছেন এবং কাজটা করে দেখিয়েছেন — সেটার মূল্য আছে, নির্বাচিত হন বা না হন। তাই ট্রায়াল করে নির্বাচিত না হলে +১। যিনি নির্বাচিত হন তিনি ০ পান, আর মূল কাজে ব্যর্থ হলে −১। অর্থাৎ চেষ্টা করাটা কখনো ক্ষতির কারণ নয়।",
      bn: "ভুল নয়। ট্রায়াল টাস্ক করা মানে আপনি সময় দিয়েছেন এবং কাজটা করে দেখিয়েছেন — সেটার মূল্য আছে, নির্বাচিত হন বা না হন। তাই ট্রায়াল করে নির্বাচিত না হলে +১। যিনি নির্বাচিত হন তিনি ০ পান, আর মূল কাজে ব্যর্থ হলে −১। অর্থাৎ চেষ্টা করাটা কখনো ক্ষতির কারণ নয়।",
    },
  },
  {
    id: "s4",
    ref: "SUP-405",
    fromRole: "student",
    fromName: { en: "Shamim Reza", bn: "শামীম রেজা" },
    subject: { en: "Rubric does not fit a photography task", bn: "ফটোগ্রাফি টাস্কে রুব্রিক মিলছে না" },
    body: {
      en: "The design rubric asks about 'file handover quality' which is fine, but there is nothing about consistency across a set. That is the whole job on a 30-product shoot.",
      bn: "ডিজাইন রুব্রিকে 'ফাইল হ্যান্ডওভারের মান' আছে, ঠিক আছে, কিন্তু একটি সেট জুড়ে সামঞ্জস্য নিয়ে কিছু নেই। ৩০ প্রোডাক্টের শুটে ওটাই তো পুরো কাজ।",
    },
    openedLabel: { en: "3 hours ago", bn: "৩ ঘণ্টা আগে" },
    status: "new",
    priority: "normal",
  },
];

export const disputeById = (id: string) => DISPUTES.find((d) => d.id === id);
export const OPEN_DISPUTES = DISPUTES.filter((d) => d.status !== "resolved").length;
export const NEW_TICKETS = TICKETS.filter((t) => t.status === "new").length;
