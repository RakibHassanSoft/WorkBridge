import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectorList from "@/components/marketing/SectorList";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = { title: "Sectors" };

export default function SectorsPage() {
  return (
    <>
      <PageHero
        eyebrow={{ en: "Sectors", bn: "সেক্টর" }}
        title={{
          en: "A marketing task and a coding task do not share a definition of done",
          bn: "একটা মার্কেটিং টাস্ক আর একটা কোডিং টাস্কের 'সম্পন্ন'-এর সংজ্ঞা এক নয়",
        }}
        desc={{
          en: "So each sector carries its own verification rubric. The templates are drafted together in Phase 1 and switched on one sector at a time — the graduate unemployment problem in Bangladesh was never only an IT problem.",
          bn: "তাই প্রতিটি সেক্টরের নিজস্ব ভেরিফিকেশন রুব্রিক আছে। টেমপ্লেটগুলো ফেজ ১-এ একসাথে তৈরি হয়, চালু হয় একবারে একটি করে — বাংলাদেশের গ্র্যাজুয়েট বেকারত্ব কখনোই কেবল আইটির সমস্যা ছিল না।",
        }}
      />
      <SectorList />
      <CTA />
    </>
  );
}
