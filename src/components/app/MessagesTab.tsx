"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui";
import Thread from "@/components/chat/Thread";
import { conversationsFor } from "@/data/trials";
import { anyTaskById } from "@/data/marketplace";
import { T, useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * The chat screen, laid out the way every messaging app is: people on
 * the left, the conversation on the right.
 *
 * The workspace nav moves to a bar across the top while this is open,
 * because a 252px sidebar plus a 320px list plus a thread leaves nothing
 * for the thread on a laptop — and because a chat screen should feel
 * like a chat screen, not like a panel inside a dashboard.
 */
export default function MessagesTab({ me, meName }: { me: "client" | "student"; meName: string }) {
  const { t } = useLang();
  const rows = conversationsFor(me);
  const [openId, setOpenId] = useState<string | null>(rows[0]?.taskId ?? null);
  // The conversation that opens first is, by definition, read.
  const [read, setRead] = useState<string[]>(() => (rows[0] ? [rows[0].taskId] : []));

  const current = rows.find((r) => r.taskId === openId) ?? null;
  const task = current ? anyTaskById(current.taskId) : null;

  if (rows.length === 0) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <MessageSquare className="mx-auto size-6 text-ink-4" />
          <p className="mt-3 text-[14px] font-medium text-ink">
            <T v={{ en: "No conversations yet", bn: "এখনো কোনো কথোপকথন নেই" }} />
          </p>
          <p className="mt-1 text-[12.5px] text-ink-4">
            <T
              v={{
                en: "A chat opens once a coordinator puts one person forward for a task.",
                bn: "কোনো টাস্কে কোঅর্ডিনেটর একজনকে সামনে আনলেই চ্যাট খোলে।",
              }}
            />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── people ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-line md:w-[320px]",
          openId && "hidden md:flex"
        )}
      >
        <div className="border-b border-line p-3">
          <div className="flex h-9 items-center gap-2 rounded-[10px] border border-line bg-canvas-2/60 px-3 text-[12.5px] text-ink-4">
            <Search className="size-3.5 shrink-0" />
            <T v={{ en: "Search messages…", bn: "মেসেজ খুঁজুন…" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rows.map((c) => {
            const on = c.taskId === openId;
            const unread = c.unread && !read.includes(c.taskId);
            const rowTask = anyTaskById(c.taskId);
            return (
              <button
                key={c.taskId}
                onClick={() => {
                  setOpenId(c.taskId);
                  setRead((r) => (r.includes(c.taskId) ? r : [...r, c.taskId]));
                }}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-line px-4 py-3.5 text-left transition-colors",
                  on ? "bg-brand-50/60" : "hover:bg-canvas-2/60"
                )}
              >
                <Avatar name={c.withName.en} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn("truncate text-[13.5px]", unread ? "font-semibold text-ink" : "font-medium text-ink-2")}>
                      {t(c.withName)}
                    </span>
                    <span className="ml-auto shrink-0 text-[10.5px] text-ink-4">{t(c.last.timeLabel)}</span>
                  </span>
                  {rowTask && <span className="mt-0.5 block truncate text-[11px] text-ink-4">{t(rowTask.title)}</span>}
                  <span className={cn("mt-1 block truncate text-[12px]", unread ? "text-ink-2" : "text-ink-4")}>
                    {c.last.from === me && <T v={{ en: "You: ", bn: "আপনি: " }} />}
                    {t(c.last.body)}
                  </span>
                </span>
                {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── the conversation ────────────────────────────────────── */}
      <section className={cn("flex min-w-0 flex-1 flex-col", !openId && "hidden md:flex")}>
        {current && task ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 md:hidden">
              <button onClick={() => setOpenId(null)} className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <ArrowLeft className="size-4" />
                <T v={{ en: "All messages", bn: "সব মেসেজ" }} />
              </button>
            </div>
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <Avatar name={current.withName.en} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{t(current.withName)}</p>
                <p className="truncate text-[11.5px] text-ink-4">
                  <T v={{ en: "About", bn: "যে কাজ নিয়ে" }} />: {t(task.title)}
                </p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11px] text-ink-4 ring-1 ring-line sm:inline-flex">
                <ShieldCheck className="size-3" />
                <T v={{ en: "Moderator can read this", bn: "মডারেটর পড়তে পারেন" }} />
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Thread key={current.taskId} taskId={current.taskId} me={me} meName={meName} fill />
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <MessageSquare className="mx-auto size-6 text-ink-4" />
              <p className="mt-3 text-[13px] text-ink-4">
                <T v={{ en: "Pick a conversation on the left", bn: "বাঁ পাশ থেকে একটি কথোপকথন বেছে নিন" }} />
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
