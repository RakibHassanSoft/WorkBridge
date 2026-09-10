import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Pricing from "@/components/marketing/Pricing";
import Faq from "@/components/marketing/Faq";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow={{ en: "Pricing", bn: "মূল্য" }}
        title={{ en: "Fixed prices, agreed before the work starts", bn: "নির্ধারিত দাম, কাজ শুরুর আগেই সম্মত" }}
        desc={{
          en: "Nobody negotiates mid-project, nobody bids against each other, and nobody discovers the cost at the end. Every task carries its fee, its hours and its acceptance criteria before a single person is matched to it.",
          bn: "কেউ প্রজেক্টের মাঝপথে দরকষাকষি করে না, কেউ একে অন্যের বিরুদ্ধে বিড করে না, আর শেষে গিয়ে কেউ খরচ জানতে পারে না। কাউকে ম্যাচ করার আগেই প্রতিটি টাস্কে ফি, সময় ও গ্রহণযোগ্যতার শর্ত লেখা থাকে।",
        }}
      />
      <Pricing />
      <Faq />
      <CTA />
    </>
  );
}
