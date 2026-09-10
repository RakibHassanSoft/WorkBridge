"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const QA = [
  {
    q: { en: "Is the AI making decisions about who gets work?", bn: "কে কাজ পাবে সেই সিদ্ধান্ত কি এআই নিচ্ছে?" },
    a: {
      en: "No. The AI drafts a scope and produces an explained shortlist. A human coordinator approves, edits or rejects both before anything reaches a student or a client. Until enough real completed projects exist as calibration data, AI output is treated as a draft — that is a deliberate constraint, not a temporary limitation.",
      bn: "না। এআই একটি স্কোপের খসড়া করে এবং ব্যাখ্যাসহ শর্টলিস্ট দেয়। কোনো শিক্ষার্থী বা ক্লায়েন্টের কাছে যাওয়ার আগে একজন human coordinator দুটোই অনুমোদন, সম্পাদনা বা বাতিল করেন। যথেষ্ট বাস্তব সম্পন্ন প্রজেক্ট ক্যালিব্রেশন ডেটা হিসেবে না জমা পর্যন্ত এআই-এর আউটপুট খসড়া হিসেবেই গণ্য — এটি ইচ্ছাকৃত সীমা, সাময়িক সীমাবদ্ধতা নয়।",
    },
  },
  {
    q: { en: "What stops a student from claiming work they didn't do?", bn: "একজন শিক্ষার্থী নিজের না করা কাজ দাবি করলে কী আটকাবে?" },
    a: {
      en: "Nothing enters the record on a self-claim. A coordinator scores the work against a sector rubric and the paying client signs it off. Both, or it does not count. Commit counts and activity metrics are deliberately not used — they are trivially gamed and say nothing about who contributed what.",
      bn: "self-claim দিয়ে কিছুই রেকর্ডে ঢোকে না। একজন মেন্টর সেক্টর রুব্রিকে কাজটি মূল্যায়ন করেন এবং টাকা দেওয়া ক্লায়েন্ট সাইন-অফ করেন। দুটোই, নাহলে গণনা হয় না। কমিট কাউন্ট বা অ্যাক্টিভিটি মেট্রিক ইচ্ছাকৃতভাবে ব্যবহার করা হয় না — সেগুলো সহজেই গেম করা যায় এবং কে কী করেছে তা বলে না।",
    },
  },
  {
    q: { en: "Why start with only one sector if the design covers nine?", bn: "ডিজাইন যদি নয়টি সেক্টর ঢাকে, তবে একটি দিয়ে শুরু কেন?" },
    a: {
      en: "Because validation has to be honest. Starting everywhere at once means never learning which part actually worked. The rubric, profile and matching logic are vertical-agnostic from day one, so expanding in Phase 3 is a rollout, not a rebuild.",
      bn: "কারণ যাচাইটা সৎ হতে হবে। সব জায়গায় একসাথে শুরু করলে কোন অংশটা আসলে কাজ করেছে তা কখনো জানা যায় না। রুব্রিক, প্রোফাইল ও ম্যাচিং লজিক প্রথম দিন থেকেই vertical-agnostic, তাই ফেজ ৩-এ সম্প্রসারণ মানে নতুন করে বানানো নয়, কেবল চালু করা।",
    },
  },
  {
    q: { en: "How do you handle payment trust?", bn: "পেমেন্ট ট্রাস্ট কীভাবে সামলানো হয়?" },
    a: {
      en: "Trust and payment are the problem to solve before anything else, which is why Phase 0 takes small real fees manually before a platform exists. Fees are fixed per task and agreed up front, so nobody negotiates mid-project. Industry-body references do the rest of the work that a brand name would normally do.",
      bn: "সবার আগে সমাধান করার সমস্যাই হলো trust আর payment — তাই প্ল্যাটফর্ম তৈরির আগেই ফেজ ০-তে ম্যানুয়ালি ছোট বাস্তব ফি নেওয়া হয়। প্রতি টাস্কে ফি নির্ধারিত এবং আগেই সম্মত, তাই প্রজেক্টের মাঝপথে কেউ দরকষাকষি করে না। একটা ব্র্যান্ড নাম যে কাজটা করত, বাকিটা ইন্ডাস্ট্রি বডির রেফারেন্স করে দেয়।",
    },
  },
  {
    q: { en: "What happens after someone gets hired?", bn: "কেউ চাকরি পাওয়ার পরে কী হয়?" },
    a: {
      en: "This is the part almost every platform ignores. Getting hired is not the same as staying hired. 30, 60 and 90-day check-ins, honest salary information, and exit reasons fed back into future matching are added gradually — so success means 'still there and doing well', not 'got placed'.",
      bn: "প্রায় সব প্ল্যাটফর্ম এই অংশটা উপেক্ষা করে। চাকরি পাওয়া আর চাকরিতে টিকে থাকা এক জিনিস নয়। ৩০, ৬০ ও ৯০ দিনের চেক-ইন, বেতন সম্পর্কে বাস্তব তথ্য, আর কেউ ছেড়ে দিলে তার আসল কারণ ভবিষ্যতের ম্যাচিংয়ে যুক্ত করা — এগুলো ধাপে ধাপে যোগ হবে, যাতে সাফল্য মানে হয় 'টিকে আছে এবং ভালো করছে', 'প্লেসড হয়েছে' নয়।",
    },
  },
  {
    q: { en: "Is this a competitor to Bdjobs or Upwork?", bn: "এটা কি Bdjobs বা Upwork-এর প্রতিদ্বন্দ্বী?" },
    a: {
      en: "No — it is designed to plug into them. A 'verified project completed' badge on a job-board profile is more useful to everyone than another listing site. We are not building another list; we are building the proof that goes on the lists that already exist.",
      bn: "না — এটা তাদের সাথে যুক্ত হওয়ার জন্যই তৈরি। জব বোর্ড প্রোফাইলে 'ভেরিফায়েড প্রজেক্ট সম্পন্ন' ব্যাজ সবার জন্যই আরেকটা লিস্টিং সাইটের চেয়ে বেশি কাজের। আমরা আরেকটা তালিকা বানাচ্ছি না; আমরা সেই প্রমাণ বানাচ্ছি, যা ইতিমধ্যে থাকা তালিকাগুলোতে বসবে।",
    },
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLang();

  return (
    <section className="border-y border-line bg-canvas-2/60 py-20 md:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead
            eyebrow={{ en: "Questions", bn: "প্রশ্ন" }}
            title={{ en: "The objections worth answering", bn: "যে আপত্তিগুলোর উত্তর দেওয়া দরকার" }}
          />
        </Reveal>

        <Reveal delay={80} className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q.en}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 px-7 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={cn("text-[15.5px] font-medium leading-snug transition-colors", isOpen ? "text-brand-700" : "text-ink")}>
                    {t(item.q)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-all duration-400",
                      isOpen && "rotate-45 border-brand-300 bg-brand-50 text-brand-600"
                    )}
                  >
                    <Plus className="size-3.5" />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-7 pb-6 pr-16 text-[14px] leading-relaxed text-ink-3">{t(item.a)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
