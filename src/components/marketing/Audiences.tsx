"use client";

import { Briefcase, GraduationCap, UserCog } from "lucide-react";
import { Reveal, SectionHead } from "@/components/ui";
import { useLang } from "@/lib/i18n";

const AUDIENCES = [
  {
    icon: Briefcase,
    who: { en: "For businesses & SMEs", bn: "ব্যবসা ও এসএমই-দের জন্য" },
    line: { en: "Not just tech companies.", bn: "শুধু টেক কোম্পানি না।" },
    body: {
      en: "A boutique, a restaurant chain, an accounting firm, an agri-startup, a design studio — every SME has small recurring work that does not justify a full-time hire, but somebody still has to do it.",
      bn: "একটা বুটিক, একটা রেস্তোরাঁ চেইন, একটা অ্যাকাউন্টিং ফার্ম, একটা এগ্রি-স্টার্টআপ, একটা ডিজাইন স্টুডিও — প্রতিটি এসএমই-র এমন ছোট নিয়মিত কাজ থাকে যার জন্য ফুল-টাইম কর্মী লাগে না, কিন্তু কাউকে না কাউকে করতেই হয়।",
    },
    points: {
      en: [
        "Affordable work without the usual quality anxiety — every task is mentor-supervised",
        "Risk-free testing: start with one micro-task instead of a hiring decision",
        "Try before you hire — give a candidate real work instead of interview questions",
        "Trust through bodies you already know: a BASIS or DCCI reference makes paying a new platform far easier",
      ],
      bn: [
        "সাশ্রয়ী কাজ, কিন্তু কোয়ালিটি নিয়ে চেনা দুশ্চিন্তা ছাড়াই — প্রতিটি টাস্ক মেন্টর-সুপারভাইজড",
        "ঝুঁকিমুক্ত পরীক্ষা: নিয়োগের সিদ্ধান্তের বদলে একটা মাইক্রো-টাস্ক দিয়ে শুরু",
        "হায়ার করার আগে যাচাই — ইন্টারভিউ প্রশ্নের বদলে candidate-কে বাস্তব কাজ দিন",
        "চেনা সংগঠনের মাধ্যমে বিশ্বাস: বেসিস বা ডিসিসিআই-এর রেফারেন্স থাকলে নতুন প্ল্যাটফর্মে টাকা দেওয়া অনেক সহজ",
      ],
    },
  },
  {
    icon: GraduationCap,
    who: { en: "For students & graduates", bn: "শিক্ষার্থী ও গ্র্যাজুয়েটদের জন্য" },
    line: { en: "Any subject. Not just CSE.", bn: "যেকোনো বিষয়। শুধু সিএসই না।" },
    body: {
      en: "BBA, English, Marketing, Fine Arts, Engineering, Agriculture, Social Science — every discipline gets work that matches it. At this layer your degree is not a barrier, it is an extra dimension of opportunity.",
      bn: "বিবিএ, ইংরেজি, মার্কেটিং, ফাইন আর্টস, ইঞ্জিনিয়ারিং, কৃষি, সোশ্যাল সায়েন্স — প্রতিটি ডিসিপ্লিনের জন্য মানানসই কাজ আছে। এই স্তরে আপনার ডিগ্রি বাধা না, বরং সুযোগের একটা বাড়তি মাত্রা।",
    },
    points: {
      en: [
        "Proven experience: 'I did it, and a real client signed it off' is a different sentence to 'I can'",
        "A first income — the amount is small, the confidence is not",
        "Real feedback from a client, not a grade from a teacher",
        "Referral and hiring priority: strong performers enter the pipeline directly",
        "Low risk, your own pace — start with one small project, no commitment",
      ],
      bn: [
        "প্রমাণিত অভিজ্ঞতা: 'আমি করেছি, আর real ক্লায়েন্ট সাইন-অফ করেছেন' আর 'আমি পারি' — এক বাক্য নয়",
        "প্রথম আয় — অঙ্কটা ছোট, আত্মবিশ্বাসটা নয়",
        "শিক্ষকের নম্বর নয়, ক্লায়েন্টের বাস্তব ফিডব্যাক",
        "রেফারেল ও হায়ারিং প্রায়োরিটি: ভালো পারফর্মাররা সরাসরি পাইপলাইনে ঢোকেন",
        "কম ঝুঁকি, নিজের গতিতে — একটা ছোট প্রজেক্ট দিয়ে শুরু, কোনো কমিটমেন্ট নেই",
      ],
    },
  },
  {
    icon: UserCog,
    who: { en: "For mentors", bn: "মেন্টরদের জন্য" },
    line: { en: "The part most programmes get wrong.", bn: "যে জায়গায় বেশিরভাগ প্রোগ্রাম ভুল করে।" },
    body: {
      en: "Mentors are the quality layer, and unpaid goodwill is not a supply strategy. Multiple similar programmes have watched mentor supply dry up because there was nothing in it for the mentor.",
      bn: "মেন্টররাই কোয়ালিটি লেয়ার, আর বিনা পারিশ্রমিকের সদিচ্ছা কোনো সাপ্লাই কৌশল নয়। একাধিক সমজাতীয় প্রোগ্রামে মেন্টর সাপ্লাই শুকিয়ে গেছে, কারণ মেন্টরের জন্য এতে কিছু ছিল না।",
    },
    points: {
      en: [
        "Referral rights and hiring priority from day one",
        "Stipends as soon as revenue exists — stated up front, not implied",
        "A structured rubric, so review takes minutes rather than an evening",
        "First access to the strongest graduates you have personally verified",
      ],
      bn: [
        "প্রথম দিন থেকেই রেফারেল ও হায়ারিং প্রায়োরিটি",
        "রেভিনিউ এলেই স্টাইপেন্ড — শুরুতেই স্পষ্ট করে বলা, ইঙ্গিতে নয়",
        "স্ট্রাকচার্ড রুব্রিক, যাতে রিভিউ পুরো সন্ধ্যা নয়, কয়েক মিনিটে হয়",
        "আপনি নিজে যাচাই করেছেন এমন সেরা গ্র্যাজুয়েটদের কাছে সবার আগে পৌঁছানো",
      ],
    },
  },
];

export default function Audiences() {
  const { t, tl } = useLang();
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={{ en: "Three sides", bn: "তিন পক্ষ" }}
            title={{ en: "Everyone has to get something real out of it", bn: "প্রত্যেককে এখান থেকে বাস্তব কিছু পেতে হবে" }}
            desc={{
              en: "A marketplace holds together only when each side would still show up if the other two were slower than promised.",
              bn: "একটা মার্কেটপ্লেস তখনই টেকে, যখন বাকি দুই পক্ষ প্রতিশ্রুতির চেয়ে ধীর হলেও প্রত্যেকে আসতে রাজি থাকে।",
            }}
          />
        </Reveal>

        <div className="mt-14 space-y-4">
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.who.en} delay={i * 70}>
              <div className="grid gap-8 rounded-[20px] border border-line bg-white p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:p-10">
                <div>
                  <span className="grid size-11 place-items-center rounded-[12px] bg-brand-600 text-white">
                    <a.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.025em] text-ink">{t(a.who)}</h3>
                  <p className="mt-1.5 text-[14px] font-medium text-brand-600">{t(a.line)}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-ink-3">{t(a.body)}</p>
                </div>
                <ul className="grid gap-x-8 gap-y-3.5 self-center sm:grid-cols-2">
                  {tl(a.points).map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-2">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
