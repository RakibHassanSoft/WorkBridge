"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Search,
  ClipboardCheck,
  ClipboardList,
  BadgeCheck,
  Banknote,
  IdCard,
  AlertTriangle,
  Star,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard, Money } from "./parts";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useLang, type L } from "@/lib/i18n";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

type Task = {
  id: string;
  title: string;
  desc: string;
  fee: number;
  hours: number;
  status: string;
  applied?: boolean;
  sector?: { name: string } | null;
  trial?: { title: string; brief: string; minutes: number } | null;
  job?: { ref: string; brief: string } | null;
  progress?: number;
};

const NAV: NavItem[] = [
  { key: "overview", label: L("Overview"), icon: LayoutDashboard },
  { key: "find", label: L("Find tasks"), icon: Search },
  { key: "trials", label: L("Trials & points"), icon: ClipboardCheck },
  { key: "active", label: L("Active task"), icon: ClipboardList },
  { key: "record", label: L("Verified record"), icon: BadgeCheck },
  { key: "earnings", label: L("Earnings"), icon: Banknote },
  { key: "account", label: L("Account & verification"), icon: IdCard },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview"), subtitle: L("Where you are, and what happens next") },
  find: { title: L("Find tasks"), subtitle: L("Apply by doing the trial, not by writing a pitch") },
  trials: { title: L("Trials & points"), subtitle: L("Trying never costs you") },
  active: { title: L("Active task"), subtitle: L("The task you were selected for") },
  record: { title: L("Verified record"), subtitle: L("Signed by a coordinator and the business") },
  earnings: { title: L("Earnings"), subtitle: L("Released on sign-off") },
  account: { title: L("Account & verification"), subtitle: L("Verification unlocks trials") },
};

export default function StudentWorkspace() {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("overview");
  const [kyc, setKyc] = useState<{ status: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [points, setPoints] = useState<{ total: number; entries: any[] }>({ total: 0, entries: [] });
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [record, setRecord] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<{ total: number; payments: any[] }>({ total: 0, payments: [] });
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [k, tk, tr, pt, ac, rc, ea] = await Promise.all([
        api.student.kyc() as Promise<{ status: string }>,
        api.student.browse() as Promise<Task[]>,
        api.student.trials() as Promise<any[]>,
        api.student.points() as Promise<{ total: number; entries: any[] }>,
        api.student.active() as Promise<Task[]>,
        api.student.record() as Promise<any[]>,
        api.student.earnings() as Promise<{ total: number; payments: any[] }>,
      ]);
      setKyc(k);
      setTasks(tk);
      setTrials(tr);
      setPoints(pt);
      setActiveTasks(ac);
      setRecord(rc);
      setEarnings(ea);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your data");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const verified = kyc?.status === "VERIFIED";

  return (
    <AppShell
      role="student"
      roleLabel={L("Student workspace")}
      userName={user?.name ?? "Student"}
      userMeta={L(user?.email ?? "")}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-warn/20 bg-warn-bg px-4 py-3 text-[13px] text-warn">
          <AlertTriangle className="size-4" /> {error}
        </div>
      )}
      {!verified && tab !== "account" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] border border-warn/20 bg-warn-bg px-4 py-3 text-[13px] text-warn">
          <span>Your account isn&apos;t verified yet — you can browse, but applying needs verification.</span>
          <Button size="sm" variant="ghost" onClick={() => setTab("account")}>Verify</Button>
        </div>
      )}

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BadgeCheck} label={L("Verified")} value={verified ? "Yes" : "No"} hint={L("account status")} tone={verified ? "brand" : "default"} />
          <StatCard icon={Star} label={L("Points")} value={String(points.total)} hint={L("+1 per trial tried")} />
          <StatCard icon={ClipboardList} label={L("Active tasks")} value={String(activeTasks.length)} hint={L("assigned to you")} />
          <StatCard icon={Banknote} label={L("Earned")} value={`৳${earnings.total.toLocaleString("en-US")}`} hint={L("released to you")} tone="ink" />
        </div>
      )}

      {tab === "find" && <FindTasks tasks={tasks} verified={verified} onChange={reload} />}
      {tab === "trials" && <Trials trials={trials} points={points} />}
      {tab === "active" && <Active tasks={activeTasks} onChange={reload} />}
      {tab === "record" && <Record record={record} />}
      {tab === "earnings" && <Earnings earnings={earnings} />}
      {tab === "account" && <Verify kyc={kyc} onChange={reload} />}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="grid place-items-center rounded-[16px] border border-dashed border-line bg-white py-16 text-center text-[13px] text-ink-4">{text}</div>;
}

function FindTasks({ tasks, verified, onChange }: { tasks: Task[]; verified: boolean; onChange: () => void }) {
  if (tasks.length === 0) return <Empty text="No open tasks right now. Check back soon." />;
  return (
    <div className="space-y-4">
      {tasks.map((tk) => (
        <TaskApply key={tk.id} task={tk} verified={verified} onChange={onChange} />
      ))}
    </div>
  );
}

function TaskApply({ task, verified, onChange }: { task: Task; verified: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [mins, setMins] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply() {
    setBusy(true);
    setErr(null);
    try {
      await api.student.apply(task.id, summary, Number(mins) || task.trial?.minutes || 30);
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not apply");
      setBusy(false);
    }
  }

  return (
    <Panel title={L(task.title)} desc={L(`${task.sector?.name ?? "—"} · ৳${task.fee.toLocaleString("en-US")} · ${task.hours}h`)}>
      <div className="space-y-3 p-5">
        <p className="text-[13px] leading-relaxed text-ink-3">{task.desc}</p>
        {task.trial && (
          <div className="rounded-[12px] border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">The trial you would do ({task.trial.minutes} min)</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{task.trial.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-4">{task.trial.brief}</p>
          </div>
        )}
        {task.applied ? (
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-700">Applied</span>
        ) : !verified ? (
          <p className="text-[12.5px] text-warn">Verify your account to apply.</p>
        ) : !open ? (
          <Button size="sm" onClick={() => setOpen(true)}>Do the trial to apply</Button>
        ) : (
          <div className="space-y-2.5">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="Describe what you produced, and flag anything unclear rather than guessing…" className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none focus:border-brand-300 focus:bg-white" />
            <div className="flex items-center gap-2.5">
              <input value={mins} onChange={(e) => setMins(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Minutes taken" className="w-40 rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none focus:border-brand-300" />
              <Button size="sm" onClick={apply} disabled={busy || summary.trim().length < 10}>{busy ? "Submitting…" : "Submit trial"}</Button>
            </div>
            {err && <p className="text-[12.5px] text-warn">{err}</p>}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Trials({ trials, points }: { trials: any[]; points: { total: number; entries: any[] } }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Star} label={L("Points balance")} value={String(points.total)} hint={L("+1 tried · 0 selected · -1 failed")} tone="brand" />
        <StatCard icon={ClipboardCheck} label={L("Trials done")} value={String(trials.length)} hint={L("applications by trial")} />
      </div>
      <Panel title={L("Your trials")} desc={L("The AI's score and reasoning")}>
        {trials.length === 0 ? (
          <div className="p-5"><Empty text="No trials yet. Find a task and apply by doing its trial." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {trials.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13.5px] font-medium text-ink">{a.task?.title ?? "Task"}</p>
                  <span className="num rounded-full bg-canvas-2 px-2.5 py-1 text-[12px] font-semibold text-ink">{a.aiScore}/100</span>
                </div>
                {a.aiVerdict && <p className="mt-1 text-[12.5px] text-ink-4">{a.aiVerdict}</p>}
                <p className="mt-1 text-[11.5px] text-ink-4">Outcome: {String(a.outcome).toLowerCase()} · {a.points >= 0 ? `+${a.points}` : a.points} pts</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Active({ tasks, onChange }: { tasks: Task[]; onChange: () => void }) {
  if (tasks.length === 0) return <Empty text="No active task. Once a coordinator selects you, it appears here." />;
  return (
    <div className="space-y-4">
      {tasks.map((tk) => (
        <ActiveCard key={tk.id} task={tk} onChange={onChange} />
      ))}
    </div>
  );
}

function ActiveCard({ task, onChange }: { task: Task; onChange: () => void }) {
  const [note, setNote] = useState("");
  const [prog, setProg] = useState(String(task.progress ?? 0));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
      setBusy(false);
    }
  };

  return (
    <Panel title={L(task.title)} desc={L(`${task.job?.ref ?? ""} · ${task.status.replace(/_/g, " ").toLowerCase()}`)}>
      <div className="space-y-3 p-5">
        <p className="text-[13px] leading-relaxed text-ink-3">{task.desc}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <input value={prog} onChange={(e) => setProg(e.target.value.replace(/[^0-9]/g, ""))} className="w-28 rounded-[12px] border border-line bg-canvas-2/40 p-2.5 text-[13px] text-ink outline-none" placeholder="% done" />
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.student.progress(task.id, Number(prog) || 0))}>Update progress</Button>
        </div>
        {task.status !== "IN_REVIEW" && (
          <div className="space-y-2.5">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What are you delivering? (links, notes)" className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none focus:border-brand-300 focus:bg-white" />
            <Button size="sm" disabled={busy || note.trim().length < 5} onClick={() => act(() => api.student.submit(task.id, note))}>Submit for review</Button>
          </div>
        )}
        {task.status === "IN_REVIEW" && <p className="text-[12.5px] text-ink-4">Submitted — awaiting scoring and the client&apos;s sign-off.</p>}
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Record({ record }: { record: any[] }) {
  if (record.length === 0) return <Empty text="No verified work yet. Completed, signed-off tasks appear here — this is your passport." />;
  return (
    <Panel title={L("Verified record")} desc={L("Proof that follows you")}>
      <ul className="divide-y divide-line">
        {record.map((r) => (
          <li key={r.id} className="px-5 py-4">
            <p className="text-[13.5px] font-medium text-ink">{r.title}</p>
            <p className="mt-0.5 text-[12px] text-ink-4">{r.sector?.name ?? ""} · {r.job?.ref ?? ""}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Earnings({ earnings }: { earnings: { total: number; payments: any[] } }) {
  return (
    <div className="space-y-5">
      <StatCard icon={Banknote} label={L("Total earned")} value={`৳${earnings.total.toLocaleString("en-US")}`} hint={L("released on sign-off")} tone="brand" />
      <Panel title={L("Payments")} desc={L("Released to you")}>
        {earnings.payments.length === 0 ? (
          <div className="p-5"><Empty text="No earnings yet." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {earnings.payments.map((p, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-4">
                <span className="text-[13.5px] text-ink">{p.task?.title ?? "Task"}</span>
                <Money value={p.amount} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

const DOC_LABELS = ["Recommendation letter", "Student ID card", "Transcript / certificate", "NID", "Payout account"];

function Verify({ kyc, onChange }: { kyc: { status: string } | null; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const status = kyc?.status ?? "PENDING";

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await api.student.submitKyc(DOC_LABELS.map((label) => ({ label, detail: "Uploaded for review" })));
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit");
      setBusy(false);
    }
  }

  return (
    <Panel title={L("Verification")} desc={L("The recommendation letter is the gate")}>
      <div className="space-y-4 p-5">
        <div className={`rounded-[12px] border p-4 text-[13px] ${status === "VERIFIED" ? "border-brand-200 bg-brand-50/60 text-brand-800" : "border-warn/20 bg-warn-bg text-warn"}`}>
          Status: <span className="font-semibold">{status.toLowerCase()}</span>
          {status === "VERIFIED" && " — you can apply to tasks."}
          {status === "PENDING" && " — submit your documents for a coordinator to review."}
          {status === "REJECTED" && " — your submission was rejected; you can submit again."}
        </div>
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {DOC_LABELS.map((d) => (
            <li key={d} className="px-4 py-3 text-[13px] text-ink">{d}</li>
          ))}
        </ul>
        {status !== "VERIFIED" && (
          <Button size="sm" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</Button>
        )}
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}
