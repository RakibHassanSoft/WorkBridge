"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, FileText, Paperclip, Send, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui";
import { chatForTask } from "@/data/trials";
import { T, useLang, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Sent = { id: number; body: string; at: string };

/**
 * The client ↔ student thread on a live task.
 *
 * It exists because a brief can never contain everything: the student
 * needs one more number, one more file, one decision the client never
 * thought to write down. The moderator can see every thread, and a
 * decision made here is written into the acceptance criteria so it
 * cannot be argued about later.
 *
 * Design notes: messages are grouped by day and by consecutive sender,
 * so a run of three replies reads as one turn rather than three
 * disconnected cards. The moderator's messages are not bubbles at all —
 * they are notices, because they are not part of the conversation.
 */
export default function Thread({
  taskId,
  me,
  meName,
  fill = false,
}: {
  taskId: string;
  me: "client" | "student";
  meName?: string;
  /** Fill the parent instead of capping at a panel height. */
  fill?: boolean;
}) {
  const { t } = useLang();
  const messages = chatForTask(taskId);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Sent[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sent.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [sent.length]);

  const other = messages.find((m) => m.from !== me && m.from !== "moderator");
  const myName: L = { en: "You", bn: "আপনি" };
  const myInitials = meName ?? "You";

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setSent((s) => [...s, { id: Date.now(), body, at: t({ en: "Just now", bn: "এইমাত্র" }) }]);
    setDraft("");
  };

  /* Group consecutive messages from the same author. */
  type Row =
    | { kind: "note"; id: string; body: L; author: L; time: L }
    | { kind: "group"; id: string; mine: boolean; author: L; items: { id: string; body: L; time: L; attachment?: L }[] };

  const rows: Row[] = [];
  for (const m of messages) {
    if (m.from === "moderator") {
      rows.push({ kind: "note", id: m.id, body: m.body, author: m.authorName, time: m.timeLabel });
      continue;
    }
    const mine = m.from === me;
    const last = rows[rows.length - 1];
    if (last && last.kind === "group" && last.mine === mine) {
      last.items.push({ id: m.id, body: m.body, time: m.timeLabel, attachment: m.attachment });
    } else {
      rows.push({
        kind: "group",
        id: m.id,
        mine,
        author: mine ? myName : m.authorName,
        items: [{ id: m.id, body: m.body, time: m.timeLabel, attachment: m.attachment }],
      });
    }
  }

  return (
    <div className={cn("flex flex-col", fill && "h-full min-h-0")}>
      {/* who you are talking to */}
      {other && !fill && (
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <Avatar name={other.authorName.en} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-ink">{t(other.authorName)}</p>
            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
              <span className="size-1.5 rounded-full bg-brand-500" />
              <T v={{ en: "on this task", bn: "এই টাস্কে আছেন" }} />
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-canvas-2 px-2.5 py-1 text-[11px] text-ink-4 ring-1 ring-line sm:inline-flex">
            <ShieldCheck className="size-3" />
            <T v={{ en: "Moderator can read this", bn: "মডারেটর পড়তে পারেন" }} />
          </span>
        </div>
      )}

      {/* the conversation */}
      <div className={cn("space-y-4 overflow-y-auto px-5 py-5", fill ? "min-h-0 flex-1" : "max-h-[460px]")}>
        {rows.map((row) =>
          row.kind === "note" ? (
            <div key={row.id} className="flex items-start gap-2.5 rounded-[12px] border border-line bg-canvas-2/70 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="text-[12.5px] leading-relaxed text-ink-2">{t(row.body)}</p>
                <p className="mt-1 text-[11px] text-ink-4">
                  {t(row.author)} · {t(row.time)}
                </p>
              </div>
            </div>
          ) : (
            <div key={row.id} className={cn("flex gap-2.5", row.mine && "flex-row-reverse")}>
              <Avatar name={row.mine ? myInitials : row.author.en} size={30} />
              <div className={cn("flex min-w-0 max-w-[80%] flex-col gap-1", row.mine && "items-end")}>
                {!row.mine && <span className="px-1 text-[11.5px] font-medium text-ink-3">{t(row.author)}</span>}
                {row.items.map((it, i) => (
                  <div key={it.id} className={cn("flex flex-col", row.mine ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "px-3.5 py-2.5 text-left text-[13px] leading-relaxed",
                        row.mine ? "bg-ink text-white" : "bg-canvas-2 text-ink-2 ring-1 ring-line",
                        // squared-off corner on the side the tail would be, only on the last of a run
                        row.mine
                          ? cn("rounded-[16px]", i === row.items.length - 1 && "rounded-br-[5px]")
                          : cn("rounded-[16px]", i === row.items.length - 1 && "rounded-bl-[5px]")
                      )}
                    >
                      {t(it.body)}
                    </div>

                    {it.attachment && (
                      <a
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2 text-[12px] text-ink-2 transition-colors hover:border-brand-300",
                          row.mine && "flex-row-reverse"
                        )}
                      >
                        <FileText className="size-3.5 shrink-0 text-ink-4" />
                        <span className="en">{t(it.attachment)}</span>
                      </a>
                    )}

                    {i === row.items.length - 1 && (
                      <span className={cn("mt-1 flex items-center gap-1 px-1 text-[10.5px] text-ink-4", row.mine && "flex-row-reverse")}>
                        {t(it.time)}
                        {row.mine && <CheckCheck className="size-3 text-brand-500" />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {sent.map((s) => (
          <div key={s.id} className="flex flex-row-reverse gap-2.5">
            <Avatar name={myInitials} size={30} />
            <div className="flex max-w-[80%] flex-col items-end gap-1">
              <div className="rounded-[16px] rounded-br-[5px] bg-ink px-3.5 py-2.5 text-left text-[13px] leading-relaxed text-white">{s.body}</div>
              <span className="mt-0.5 flex flex-row-reverse items-center gap-1 px-1 text-[10.5px] text-ink-4">
                {s.at}
                <Check className="size-3" />
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="border-t border-line p-4">
        <div className="flex items-end gap-2 rounded-[14px] border border-line bg-canvas-2/40 p-2 transition-colors focus-within:border-brand-300 focus-within:bg-white">
          <button
            className="grid size-9 shrink-0 place-items-center rounded-[10px] text-ink-4 transition-colors hover:bg-canvas-2 hover:text-ink-2"
            aria-label={t({ en: "Attach a file", bn: "ফাইল সংযুক্ত করুন" })}
          >
            <Paperclip className="size-4" />
          </button>
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t({
              en: me === "student" ? "Ask for what the brief did not say…" : "Answer them…",
              bn: me === "student" ? "ব্রিফে যা বলা নেই তা জিজ্ঞেস করুন…" : "উত্তর দিন…",
            })}
            className="min-h-[36px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-4"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-30"
            aria-label={t({ en: "Send", bn: "পাঠান" })}
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2.5 px-1 text-[11px] leading-relaxed text-ink-4">
          <T
            v={{
              en: "A moderator can see this thread. Anything agreed here is written into the acceptance criteria, so neither side can argue about it later.",
              bn: "একজন মডারেটর এই কথোপকথন দেখতে পান। এখানে যা সম্মত হয়, তা গ্রহণযোগ্যতার শর্তে লেখা হয় — যাতে পরে কোনো পক্ষ এটা নিয়ে তর্ক করতে না পারে।",
            }}
          />
        </p>
      </div>
    </div>
  );
}
