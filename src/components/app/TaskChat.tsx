"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Notice, useAction, when } from "./parts";
import { useApi, useWorkspaceUser } from "@/lib/workspace";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  fromRole: string;
  authorId: string;
  author?: { id: string; name: string; role: string } | null;
};

/**
 * The task's chat thread between the client and the selected student (a
 * moderator can read it too). It opens once a student has been selected, and
 * refreshes every few seconds while it is on screen.
 */
export default function TaskChat({ taskId, as }: { taskId: string; as: "client" | "student" }) {
  const api = useApi();
  const user = useWorkspaceUser();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const side = as === "client" ? api.client : api.student;

  const load = useCallback(async () => {
    try {
      setMessages((await side.messages(taskId)) as Message[]);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Could not load the conversation");
    }
  }, [side, taskId]);

  const { busy, err, run } = useAction(load);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    if (await run(() => side.sendMessage(taskId, text))) setDraft("");
  };

  const other = as === "client" ? "the student" : "the client";

  return (
    <div className="overflow-hidden rounded-[14px] border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-canvas-2/50 px-4 py-2.5 text-[12.5px] font-medium text-ink-2">
        <MessageSquare className="size-4 text-ink-4" />
        Conversation with {other}
      </div>
      <div ref={listRef} className="max-h-[320px] min-h-[120px] space-y-3 overflow-y-auto bg-white px-4 py-4">
        {messages === null && !loadErr && <p className="text-[12.5px] text-ink-4">Loading messages…</p>}
        {loadErr && <Notice tone="error">{loadErr}</Notice>}
        {messages?.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-ink-4">No messages yet. Say hello and agree how you will share the work.</p>
        )}
        {messages?.map((m) => {
          const mine = m.authorId === user?.id;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2 text-[13px] leading-relaxed",
                  mine ? "rounded-br-[4px] bg-brand-600 text-white" : m.fromRole === "MODERATOR" ? "rounded-bl-[4px] bg-info-bg text-ink" : "rounded-bl-[4px] bg-canvas-3 text-ink"
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 text-[10.5px] text-ink-4">
                {mine ? "You" : m.author?.name ?? m.fromRole.toLowerCase()} · {when(m.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line bg-canvas-2/40 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={`Message ${other}…`}
            aria-label={`Message ${other}`}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !draft.trim()}
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-45"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
        {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}
      </div>
    </div>
  );
}
