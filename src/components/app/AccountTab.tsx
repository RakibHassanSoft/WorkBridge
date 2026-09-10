"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  FileX2,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { Panel } from "./parts";
import { Button } from "@/components/ui";
import { CLIENT_ONBOARDING, PAYMENTS, methodsOfClient, type PayMethodKind } from "@/data/admin";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const ICON: Record<PayMethodKind, typeof Wallet> = {
  bkash: Smartphone,
  nagad: Smartphone,
  bank: Building2,
  card: CreditCard,
};

/**
 * A client's entire account. Two steps and a payment method — that is
 * the whole of it.
 *
 * Asking a nine-person tailoring business for a trade licence, a TIN
 * certificate and the owner's NID before they can try a ৳1,500 task is
 * how you end up with an empty platform. The business is not the party
 * whose name goes on a permanent public record; the student is. So the
 * student is checked, and the business is trusted exactly as far as its
 * deposit clears.
 */
export default function AccountTab({ clientId, clientName }: { clientId: string; clientName: L }) {
  const { t } = useLang();
  const n = useNum();
  const [methods, setMethods] = useState(() => methodsOfClient(clientId));
  const [adding, setAdding] = useState(false);

  const deposits = PAYMENTS.filter((p) => p.clientId === clientId);
  const cleared = deposits.filter((p) => p.status !== "failed");

  return (
    <div className="space-y-4">
      {/* ── the two steps ─────────────────────────────────────── */}
      <Panel
        title={{ en: "Your account", bn: "আপনার অ্যাকাউন্ট" }}
        desc={{ en: "Two steps. That is the whole of it.", bn: "দুটি ধাপ। এটুকুই সব।" }}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-medium text-brand-700 ring-1 ring-brand-100">
            <CheckCircle2 className="size-3" />
            <T v={{ en: "Ready to post", bn: "পোস্ট করার জন্য প্রস্তুত" }} />
          </span>
        }
      >
        <div className="grid gap-px bg-line sm:grid-cols-2">
          {CLIENT_ONBOARDING.map((step, i) => (
            <div key={step.key} className="bg-white p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-[10px] bg-brand-600 text-white">
                  <CheckCircle2 className="size-4" />
                </span>
                <span className="num text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Step", bn: "ধাপ" }} /> {n(i + 1)}
                </span>
              </div>
              <h4 className="mt-3 text-[14px] font-medium text-ink">{t(step.title)}</h4>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-4">{t(step.detail)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 border-t border-line bg-canvas-2/50 p-5">
          <FileX2 className="mt-0.5 size-4 shrink-0 text-ink-4" />
          <div>
            <h4 className="text-[12.5px] font-medium text-ink">
              <T v={{ en: "What we never ask a business for", bn: "ব্যবসার কাছে যা আমরা কখনো চাই না" }} />
            </h4>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
              <T
                v={{
                  en: "No trade licence. No TIN certificate. No owner's NID. No company documents of any kind. If a shop owner has to find four papers before trying a ৳1,500 task, they simply never try it — and the point of this phase is to find out whether they would pay at all.",
                  bn: "ট্রেড লাইসেন্স নয়। টিআইএন সার্টিফিকেট নয়। মালিকের এনআইডি নয়। কোনো ধরনের কোম্পানির কাগজপত্রই নয়। ৳১,৫০০ টাকার একটা কাজ চেষ্টা করার আগে যদি একজন দোকানমালিককে চারটা কাগজ খুঁজতে হয়, তিনি আর চেষ্টাই করেন না — অথচ এই ফেজের উদ্দেশ্যই হলো জানা, তিনি আদৌ টাকা দেবেন কিনা।",
                }}
              />
            </p>
          </div>
        </div>
      </Panel>

      {/* ── payment methods ───────────────────────────────────── */}
      <Panel
        title={{ en: "Payment methods", bn: "পেমেন্ট মেথড" }}
        desc={{ en: "Used to deposit a task fee before the work starts", bn: "কাজ শুরুর আগে টাস্কের ফি জমা দিতে ব্যবহৃত" }}
        action={
          <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
            <T v={{ en: "Add a method", bn: "মেথড যোগ" }} />
          </Button>
        }
      >
        <div className="divide-y divide-line">
          {methods.map((m) => {
            const Icon = ICON[m.kind];
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-4 p-5">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-[11px] ring-1",
                    m.state === "failing" ? "bg-warn-bg text-warn ring-warn/15" : "bg-canvas-2 text-ink-2 ring-line"
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-ink">{t(m.label)}</span>
                    {m.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-brand-100">
                        <Star className="size-3" />
                        <T v={{ en: "Default", bn: "ডিফল্ট" }} />
                      </span>
                    )}
                  </div>
                  <p className="num mt-0.5 text-[12.5px] text-ink-3">{t(m.detail)}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">{t(m.addedLabel)}</p>
                  {m.note && <p className="mt-1.5 text-[12px] leading-snug text-ink-3">{t(m.note)}</p>}
                </div>

                {!m.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMethods((list) => list.map((x) => ({ ...x, isDefault: x.id === m.id })))}
                  >
                    <T v={{ en: "Make default", bn: "ডিফল্ট করুন" }} />
                  </Button>
                )}
              </div>
            );
          })}

          {adding && (
            <div className="bg-canvas-2/40 p-5">
              <h4 className="text-[13px] font-medium text-ink">
                <T v={{ en: "Add a payment method", bn: "পেমেন্ট মেথড যোগ করুন" }} />
              </h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {(
                  [
                    { k: "bkash" as const, l: { en: "bKash", bn: "বিকাশ" } },
                    { k: "nagad" as const, l: { en: "Nagad", bn: "নগদ" } },
                    { k: "bank" as const, l: { en: "Bank account", bn: "ব্যাংক অ্যাকাউন্ট" } },
                    { k: "card" as const, l: { en: "Card", bn: "কার্ড" } },
                  ]
                ).map((o) => {
                  const Icon = ICON[o.k];
                  return (
                    <button
                      key={o.k}
                      onClick={() => setAdding(false)}
                      className="flex items-center gap-2.5 rounded-[12px] border border-line bg-white p-3.5 text-left text-[13px] text-ink transition-colors hover:border-brand-300"
                    >
                      <Icon className="size-4 shrink-0 text-ink-4" />
                      {t(o.l)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
                <T
                  v={{
                    en: "The platform stores the last four digits and the account name only. Nothing else about the account is kept.",
                    bn: "প্ল্যাটফর্ম কেবল শেষ চারটি অঙ্ক ও অ্যাকাউন্টের নাম রাখে। অ্যাকাউন্টের আর কিছুই রাখা হয় না।",
                  }}
                />
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* ── what verification actually means here ─────────────── */}
      <Panel title={{ en: "What is actually verified", bn: "আসলে কী যাচাই হয়" }}>
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            {
              icon: Wallet,
              t: { en: "Your deposit", bn: "আপনার জমা" },
              d: { en: "Money that arrives is harder to fake than a scanned licence. A cleared deposit is the only proof the platform needs from you.", bn: "স্ক্যান করা লাইসেন্সের চেয়ে সত্যিই আসা টাকা নকল করা কঠিন। আপনার কাছ থেকে প্ল্যাটফর্মের একমাত্র প্রমাণ — একটি সফল জমা।" },
              tone: "brand",
            },
            {
              icon: ShieldCheck,
              t: { en: "The student, not you", bn: "শিক্ষার্থী, আপনি নন" },
              d: { en: "Recommendation letter, student ID, NID and payout account — all checked by a coordinator before they can take your task.", bn: "সুপারিশপত্র, স্টুডেন্ট আইডি, এনআইডি ও পেআউট অ্যাকাউন্ট — আপনার কাজ নেওয়ার আগে কোঅর্ডিনেটর সবই যাচাই করেন।" },
              tone: "flat",
            },
            {
              icon: Banknote,
              t: { en: "The work, before you pay", bn: "টাকা দেওয়ার আগে কাজটি" },
              d: { en: "A coordinator scores it and you sign it off. Nothing is released until both happen — so a weak account was never the risk worth guarding against.", bn: "কোঅর্ডিনেটর স্কোর দেন, আপনি সাইন-অফ করেন। দুটোর আগে কিছুই ছাড়া হয় না — তাই দুর্বল অ্যাকাউন্ট কখনোই আসল ঝুঁকি ছিল না।" },
              tone: "flat",
            },
          ].map((c) => (
            <div key={c.t.en} className="bg-white p-5">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-[10px] ring-1",
                  c.tone === "brand" ? "bg-brand-50 text-brand-700 ring-brand-100" : "bg-canvas-2 text-ink-3 ring-line"
                )}
              >
                <c.icon className="size-4" />
              </span>
              <h4 className="mt-3 text-[13px] font-medium text-ink">{t(c.t)}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-4">{t(c.d)}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── deposit history ───────────────────────────────────── */}
      <Panel
        title={{ en: "Deposit history", bn: "জমার ইতিহাস" }}
        desc={{
          en: `${cleared.length} of ${deposits.length} cleared · ${t(clientName)}`,
          bn: `${deposits.length}টির মধ্যে ${cleared.length}টি সফল · ${t(clientName)}`,
        }}
      >
        <div className="divide-y divide-line">
          {deposits.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="num text-[11px] font-medium text-ink-4">{d.ref}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-2">{t(d.method)}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-4">{t(d.dateLabel)}</p>
              </div>
              <span className="num text-[14px] font-semibold text-ink">৳{n(d.amount.toLocaleString("en-US"))}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset",
                  d.status === "failed" ? "bg-canvas-2 text-ink-4 ring-line" : "bg-brand-50 text-brand-700 ring-brand-100"
                )}
              >
                {d.status === "failed" ? (
                  <T v={{ en: "Did not clear", bn: "সফল হয়নি" }} />
                ) : (
                  <T v={{ en: "Cleared", bn: "সফল" }} />
                )}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
