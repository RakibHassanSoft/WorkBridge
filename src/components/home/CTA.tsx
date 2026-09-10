"use client";

import { ArrowRight } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { T } from "@/lib/i18n";

export default function CTA() {
  return (
    <section className="pb-4">
      <div className="shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] border border-line bg-ink px-8 py-16 text-center sm:px-14 md:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="dot-bg absolute inset-0 opacity-[0.12] invert" />
              <div className="absolute left-1/2 top-full h-[340px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/25 blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-[680px]">
              <p className="eyebrow text-brand-300">
                <T v={{ en: "The closing argument", bn: "শেষ কথা" }} />
              </p>
              <h2 className="display-2 mt-4 text-white">
                <T
                  v={{
                    en: "This is not a project to build the next Upwork.",
                    bn: "এটা পরবর্তী Upwork বানানোর প্রজেক্ট না।",
                  }}
                />
              </h2>
              <p className="mt-5 text-[16.5px] leading-relaxed text-white/60">
                <T
                  v={{
                    en: "It is a project to produce one small, credible piece of evidence: that a graduate in Bangladesh — whatever their subject, whatever their sector — can show a proven history of work, not just a degree. That proof is what separates them in the job market, and what keeps them there.",
                    bn: "এটা একটা ছোট কিন্তু বিশ্বাসযোগ্য প্রমাণ তৈরির প্রজেক্ট — যে বাংলাদেশে একজন গ্র্যাজুয়েট, তার বিষয় বা সেক্টর যা-ই হোক, শুধু একটা ডিগ্রি না, একটা প্রমাণিত কাজের ইতিহাস দেখাতে পারে। সেই প্রমাণটাই তাকে চাকরির বাজারে আলাদা করে, আর দীর্ঘমেয়াদে টিকিয়ে রাখে।",
                  }}
                />
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/ai-engine" size="lg" icon={<ArrowRight className="size-4" />}>
                  <T v={{ en: "Try the AI engine", bn: "এআই ইঞ্জিন চালান" }} />
                </Button>
                <Button href="/about" size="lg" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white">
                  <T v={{ en: "Read the full plan", bn: "পুরো পরিকল্পনা পড়ুন" }} />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
