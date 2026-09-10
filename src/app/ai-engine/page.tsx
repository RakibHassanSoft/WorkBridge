import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Playground from "@/components/engine/Playground";
import EngineExplainer from "@/components/engine/EngineExplainer";
import Intake from "@/components/engine/Intake";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = { title: "AI Engine" };

export default function AiEnginePage() {
  return (
    <>
      <PageHero
        eyebrow={{ en: "AI Engine", bn: "এআই ইঞ্জিন" }}
        title={{
          en: "Watch a plain-language problem become one priced task and the trial that tests for it",
          bn: "সহজ ভাষার একটা সমস্যা কীভাবে একটি নির্ধারিত দামের কাজ আর তার পরীক্ষার ট্রায়াল হয় — দেখুন",
        }}
        desc={{
          en: "Write anything a Bangladeshi business owner might actually write — in Bangla or English — and run it through the scoping engine. Every output below is held for human review before it would ever reach a student.",
          bn: "একজন বাংলাদেশি ব্যবসায়ী বাস্তবে যা লিখতে পারেন তেমন কিছু লিখুন — বাংলা বা ইংরেজিতে — আর স্কোপিং ইঞ্জিনে চালান। নিচের প্রতিটি আউটপুট কোনো শিক্ষার্থীর কাছে যাওয়ার আগে মানুষের রিভিউয়ের জন্য অপেক্ষমাণ থাকে।",
        }}
      />
      <Playground />
      <Intake />
      <EngineExplainer />
      <CTA />
    </>
  );
}
