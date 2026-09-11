import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import TaskBoard from "@/components/tasks/TaskBoard";

export const metadata: Metadata = {
  title: "Task board",
};

export default function TasksPage() {
  return (
    <>
      <PageHero
        eyebrow={{
          en: "Task board",
          bn: "টাস্ক বোর্ড",
        }}
        title={{
          en: "Every brief exactly as the business wrote it — with the AI explaining what it actually asks for",
          bn: "ব্যবসা যেভাবে লিখেছে ঠিক সেভাবেই প্রতিটি ব্রিফ — সাথে এআই ব্যাখ্যা করছে আসলে কী চাওয়া হচ্ছে",
        }}
        desc={{
          en: "Filter by your own skills, sector, or fee. Open a task to see the client's own words, a plain-language restatement, a route through the work, and how many people have already applied.",
          bn: "নিজের স্কিল, সেক্টর বা ফি দিয়ে ফিল্টার করুন। কোনো টাস্ক খুললে দেখবেন ক্লায়েন্টের নিজের ভাষা, সহজ ভাষায় ব্যাখ্যা, কাজটি করার একটি পথ, আর কতজন ইতিমধ্যে আবেদন করেছেন।",
        }}
      />

      <Suspense
        fallback={
          <div className="shell py-20 text-[13px] text-ink-4">
            Loading the board…
          </div>
        }
      >
        <TaskBoard />
      </Suspense>
    </>
  );
}