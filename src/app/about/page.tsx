import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import About from "@/components/marketing/About";
import Roadmap from "@/components/home/Roadmap";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = { title: "About & roadmap" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={{ en: "About", bn: "আমাদের কথা" }}
        title={{
          en: "Seven hundred thousand graduates a year, and roughly three hundred thousand jobs",
          bn: "বছরে সাত লাখ গ্র্যাজুয়েট, আর চাকরি প্রায় তিন লাখ",
        }}
        desc={{
          en: "That gap is not a statistic. It is thousands of young people every day holding a certificate that no company is willing to bet on — not because the talent is missing, but because nobody has any evidence either way.",
          bn: "এই ফারাকটা শুধু একটা পরিসংখ্যান না। এটা প্রতিদিন হাজার হাজার তরুণ-তরুণীর হাতে এমন একটা সার্টিফিকেট, যার ওপর কোনো কোম্পানি বাজি ধরতে সাহস পায় না — মেধা নেই বলে নয়, কারও কাছে কোনো প্রমাণ নেই বলে।",
        }}
      />
      <About />
      <Roadmap />
      <CTA />
    </>
  );
}
