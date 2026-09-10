import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Pipeline from "@/components/home/Pipeline";
import Audiences from "@/components/marketing/Audiences";
import Faq from "@/components/marketing/Faq";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow={{ en: "How it works", bn: "কীভাবে কাজ করে" }}
        title={{
          en: "A problem in plain language goes in. Verified, paid, signed-off work comes out.",
          bn: "সহজ ভাষায় একটা সমস্যা ঢোকে। ভেরিফায়েড, পেইড, সাইন-অফ করা কাজ বেরোয়।",
        }}
        desc={{
          en: "No one on either side has to become an expert in scoping, pricing or contracts. The platform does that part — and a human checks it before it reaches anybody.",
          bn: "কোনো পক্ষকেই স্কোপিং, প্রাইসিং বা চুক্তির বিশেষজ্ঞ হতে হয় না। প্ল্যাটফর্ম সেই অংশটা করে — আর কারও কাছে পৌঁছানোর আগে একজন মানুষ সেটা যাচাই করেন।",
        }}
      />
      <Pipeline />
      <Audiences />
      <Faq />
      <CTA />
    </>
  );
}
