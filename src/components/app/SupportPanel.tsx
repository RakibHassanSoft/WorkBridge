"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EmptyState, LoadingRows, Notice, Panel, StatusBadge, inputCls, useAction, when } from "./parts";
import { useApi } from "@/lib/workspace";

type Ticket = { id: string; ref: string; subject: string; body: string; priority: string; status: string; reply: string | null; createdAt: string };

const L = (en: string) => ({ en, bn: en });

/** Help & support for clients and students: open a ticket, and read the coordinator's answers. */
export default function SupportPanel() {
  const api = useApi();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setTickets((await api.support.listMine()) as Ticket[]);
      setLoadErr(null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Could not load your tickets");
    }
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);

  const { busy, err, run } = useAction(load);
  const valid = subject.trim().length >= 3 && body.trim().length >= 5;

  const submit = async () => {
    const ok = await run(() => api.support.create({ subject: subject.trim(), body: body.trim(), priority: urgent ? "high" : "normal" }));
    if (ok) {
      setSubject("");
      setBody("");
      setUrgent(false);
      setSent(true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Panel title={L("Ask the coordinators")} desc={L("A person replies, usually within a working day")}>
        <div className="space-y-3.5 p-5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Subject</span>
            <input value={subject} onChange={(e) => { setSubject(e.target.value); setSent(false); }} placeholder="e.g. Change my payout method" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">What do you need?</span>
            <textarea value={body} onChange={(e) => { setBody(e.target.value); setSent(false); }} rows={5} placeholder="Write in Bangla or English — whichever is easier." className={cn(inputCls, "resize-none leading-relaxed")} />
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="size-4 accent-brand-600" />
            It&apos;s urgent — money or a deadline is at stake
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={busy || !valid} icon={<Send className="size-4" />}>
              {busy ? "Sending…" : "Send to support"}
            </Button>
            {!valid && (subject || body) && <span className="text-[12px] text-ink-4">Add a subject and a few words</span>}
          </div>
          {err && <Notice tone="error">{err}</Notice>}
          {sent && <Notice tone="success">Sent. You&apos;ll see the coordinator&apos;s reply here.</Notice>}
        </div>
      </Panel>

      <Panel title={L("Your tickets")} desc={L("Newest first")}>
        <div className="p-5">
          {loadErr ? (
            <Notice tone="error">{loadErr}</Notice>
          ) : tickets === null ? (
            <LoadingRows rows={2} />
          ) : tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets yet" text="Questions about a task, a payment or your account go here." />
          ) : (
            <ul className="space-y-3">
              {tickets.map((tk) => (
                <li key={tk.id} className="rounded-[14px] border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium text-ink">{tk.subject}</p>
                    <div className="flex gap-1.5">
                      {tk.priority === "HIGH" && <StatusBadge status="HIGH" />}
                      <StatusBadge status={tk.status} />
                    </div>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">{tk.ref} · {when(tk.createdAt)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-3">{tk.body}</p>
                  {tk.reply && (
                    <div className="mt-3 rounded-[12px] border border-brand-100 bg-brand-50/60 p-3 text-[13px] leading-relaxed text-ink-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">Coordinator</span>
                      <p className="mt-1 whitespace-pre-wrap">{tk.reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
