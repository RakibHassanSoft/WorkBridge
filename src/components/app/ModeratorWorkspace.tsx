"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  UserCheck,
  ShieldCheck,
  Scale,
  LifeBuoy,
  Banknote,
  IdCard,
  Users,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard, Money } from "./parts";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useLang, type L } from "@/lib/i18n";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

const NAV: NavItem[] = [
  { key: "overview", label: L("Overview"), icon: LayoutDashboard },
  { key: "scopes", label: L("Scope review"), icon: Cpu },
  { key: "select", label: L("Select student"), icon: UserCheck },
  { key: "reviews", label: L("Score work"), icon: ShieldCheck },
  { key: "kyc", label: L("Verify students"), icon: IdCard },
  { key: "payments", label: L("Payments"), icon: Banknote },
  { key: "disputes", label: L("Disputes"), icon: Scale },
  { key: "support", label: L("Support"), icon: LifeBuoy },
  { key: "directory", label: L("Directory"), icon: Users },
  { key: "controls", label: L("Controls"), icon: SlidersHorizontal },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview"), subtitle: L("The human gate the whole model rests on") },
  scopes: { title: L("Scope review"), subtitle: L("Nothing reaches a student until you release it") },
  select: { title: L("Select the student"), subtitle: L("The AI ranks; you decide") },
  reviews: { title: L("Score work"), subtitle: L("Score delivered work before the client signs off") },
  kyc: { title: L("Verify students"), subtitle: L("Read the letter, confirm by phone") },
  payments: { title: L("Payments"), subtitle: L("Money in, held, released") },
  disputes: { title: L("Disputes"), subtitle: L("The only route held money moves without a sign-off") },
  support: { title: L("Support"), subtitle: L("Everything the product didn't anticipate") },
  directory: { title: L("Clients & students"), subtitle: L("Every account and what you can do") },
  controls: { title: L("Platform controls"), subtitle: L("Some are deliberately locked") },
};

export default function ModeratorWorkspace() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<Record<string, any[]>>({});
  const [controls, setControls] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [scopes, select, reviews, kyc, payments, disputes, support, users, ctrl] = await Promise.all([
        api.moderator.scopes(), api.moderator.selectRounds(), api.moderator.reviews(),
        api.moderator.kyc(), api.moderator.payments(), api.moderator.disputes(),
        api.moderator.tickets(), api.moderator.users(), api.moderator.controls(),
      ]);
      setData({ scopes, select, reviews, kyc, payments, disputes, support, users } as any);
      setControls(ctrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const d = (k: string) => data[k] ?? [];

  return (
    <AppShell
      role="moderator"
      roleLabel={L("Moderator console")}
      userName={user?.name ?? "Coordinator"}
      userMeta={L("Platform coordinator")}
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

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Cpu} label={L("Scopes to review")} value={String(d("scopes").length)} hint={L("awaiting release")} />
          <StatCard icon={UserCheck} label={L("Selections due")} value={String(d("select").length)} hint={L("trial rounds")} tone="brand" />
          <StatCard icon={IdCard} label={L("KYC pending")} value={String(d("kyc").length)} hint={L("student verifications")} />
          <StatCard icon={Scale} label={L("Open disputes")} value={String(d("disputes").filter((x: any) => x.status !== "RESOLVED").length)} hint={L("need a decision")} tone="ink" />
        </div>
      )}

      {tab === "scopes" && <Scopes items={d("scopes")} onChange={reload} />}
      {tab === "select" && <Select items={d("select")} onChange={reload} />}
      {tab === "reviews" && <Reviews items={d("reviews")} onChange={reload} />}
      {tab === "kyc" && <Kyc items={d("kyc")} onChange={reload} />}
      {tab === "payments" && <Payments items={d("payments")} onChange={reload} />}
      {tab === "disputes" && <Disputes items={d("disputes")} onChange={reload} />}
      {tab === "support" && <Support items={d("support")} onChange={reload} />}
      {tab === "directory" && <Directory items={d("users")} onChange={reload} />}
      {tab === "controls" && <Controls controls={controls} />}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="grid place-items-center rounded-[16px] border border-dashed border-line bg-white py-16 text-center text-[13px] text-ink-4">{text}</div>;
}
function useAct(onChange: () => void) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); onChange(); } catch (e) { setErr(e instanceof ApiError ? e.message : "Failed"); setBusy(false); }
  };
  return { busy, err, act };
}

function Scopes({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No scopes awaiting review." />;
  return <div className="space-y-4">{items.map((job) => <ScopeRow key={job.id} job={job} onChange={onChange} />)}</div>;
}
function ScopeRow({ job, onChange }: { job: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  return (
    <Panel title={L(job.title)} desc={L(`${job.ref} · ${job.client?.name ?? ""} · ${job.sector?.name ?? ""}`)}>
      <div className="space-y-3 p-5">
        <p className="text-[13px] leading-relaxed text-ink-3">{job.aiSummary}</p>
        <p className="text-[12px] text-ink-4">Fee ৳{(job.tasks?.[0]?.fee ?? job.budget).toLocaleString("en-US")} · {job.aiEstHours ?? job.tasks?.[0]?.hours}h · {job.aiComplexity}</p>
        <div className="flex gap-2.5">
          <Button size="sm" disabled={busy} onClick={() => act(() => api.moderator.approveScope(job.id))}>Approve &amp; release</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.rejectScope(job.id, "Out of scope"))}>Reject</Button>
        </div>
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Select({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No trial rounds awaiting a decision." />;
  return <div className="space-y-4">{items.map((task) => <SelectRow key={task.id} task={task} onChange={onChange} />)}</div>;
}
function SelectRow({ task, onChange }: { task: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  return (
    <Panel title={L(task.title)} desc={L(`${task.attempts?.length ?? 0} applicants · ${task.job?.client?.name ?? ""}`)}>
      <div className="space-y-3 p-5">
        {(task.attempts ?? []).map((a: any) => (
          <div key={a.id} className="flex items-center justify-between rounded-[12px] border border-line p-3.5">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{a.student?.name ?? "Student"} · <span className="num">{a.aiScore}/100</span></p>
              {a.aiVerdict && <p className="mt-0.5 truncate text-[12px] text-ink-4">{a.aiVerdict}</p>}
            </div>
            <Button size="sm" disabled={busy} onClick={() => act(() => api.moderator.selectStudent(task.id, a.studentId, `Best trial (${a.aiScore})`))}>Select</Button>
          </div>
        ))}
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Reviews({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No delivered work awaiting scoring." />;
  return <div className="space-y-4">{items.map((task) => <ReviewRow key={task.id} task={task} onChange={onChange} />)}</div>;
}
function ReviewRow({ task, onChange }: { task: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  const scores = [
    { dim: "Quality", score: 4, max: 5 },
    { dim: "Completeness", score: 4, max: 5 },
    { dim: "Communication", score: 4, max: 5 },
  ];
  return (
    <Panel title={L(task.title)} desc={L(`${task.assignee?.name ?? ""} · ${task.job?.ref ?? ""}`)}>
      <div className="space-y-3 p-5">
        {task.submissionNote && <p className="rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[12.5px] text-ink-3">{task.submissionNote}</p>}
        <Button size="sm" disabled={busy} onClick={() => act(() => api.moderator.scoreWork(task.id, scores, "Scored against the sector rubric"))}>
          Score (12/15) &amp; pass to client
        </Button>
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Kyc({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No verifications pending." />;
  return <div className="space-y-4">{items.map((sub) => <KycRow key={sub.id} sub={sub} onChange={onChange} />)}</div>;
}
function KycRow({ sub, onChange }: { sub: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  return (
    <Panel title={L(sub.subject?.name ?? "Student")} desc={L(sub.subject?.email ?? "")}>
      <div className="space-y-3 p-5">
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {(Array.isArray(sub.documents) ? sub.documents : []).map((doc: any, i: number) => (
            <li key={i} className="px-4 py-2.5 text-[12.5px] text-ink">{doc.label} <span className="text-ink-4">— {doc.detail}</span></li>
          ))}
        </ul>
        <div className="flex gap-2.5">
          <Button size="sm" disabled={busy} onClick={() => act(() => api.moderator.decideKyc(sub.id, "approve"))}>Verify</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.decideKyc(sub.id, "reject", "Documents unclear"))}>Reject</Button>
        </div>
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Payments({ items, onChange }: { items: any[]; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  if (items.length === 0) return <Empty text="No payments yet." />;
  return (
    <Panel title={L("Payment ledger")} desc={L("Escrow across every task")}>
      <ul className="divide-y divide-line">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">{p.task?.title ?? "Task"}</p>
              <p className="mt-0.5 text-[12px] text-ink-4">{p.client?.name ?? ""} · {p.status}</p>
            </div>
            <div className="flex items-center gap-3">
              <Money value={p.amount} />
              {p.status === "HELD" && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.refund(p.taskId ?? p.task?.id, "Refunded by coordinator"))}>Refund</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {err && <p className="px-5 py-2 text-[12.5px] text-warn">{err}</p>}
    </Panel>
  );
}

function Disputes({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No disputes." />;
  return <div className="space-y-4">{items.map((dp) => <DisputeRow key={dp.id} dp={dp} onChange={onChange} />)}</div>;
}
function DisputeRow({ dp, onChange }: { dp: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  return (
    <Panel title={L(dp.ref)} desc={L(`${dp.task?.title ?? ""} · raised by ${dp.raisedBy?.name ?? dp.raisedByRole}`)} action={<span className="text-[11px] uppercase text-ink-4">{dp.status}</span>}>
      <div className="space-y-3 p-5">
        <p className="text-[13px] text-ink-3">{dp.claim}</p>
        <p className="text-[12px] text-ink-4">Amount in dispute: ৳{(dp.amount ?? 0).toLocaleString("en-US")}</p>
        {dp.status !== "RESOLVED" ? (
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.ruleDispute(dp.id, "client", "Refunded to client"))}>Refund client</Button>
            <Button size="sm" disabled={busy} onClick={() => act(() => api.moderator.ruleDispute(dp.id, "student", "Released to student"))}>Release to student</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.ruleDispute(dp.id, "split", "Split for partial delivery"))}>Split</Button>
          </div>
        ) : (
          <p className="text-[12.5px] text-brand-700">{dp.outcome}</p>
        )}
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Support({ items, onChange }: { items: any[]; onChange: () => void }) {
  if (items.length === 0) return <Empty text="No support tickets." />;
  return <div className="space-y-4">{items.map((tk) => <SupportRow key={tk.id} tk={tk} onChange={onChange} />)}</div>;
}
function SupportRow({ tk, onChange }: { tk: any; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  const [reply, setReply] = useState("");
  return (
    <Panel title={L(tk.subject)} desc={L(`${tk.ref} · ${tk.from?.name ?? ""} (${tk.from?.role ?? ""}) · ${tk.status}`)}>
      <div className="space-y-3 p-5">
        <p className="text-[13px] text-ink-3">{tk.body}</p>
        {tk.reply ? (
          <p className="rounded-[12px] border border-brand-100 bg-brand-50/40 p-3 text-[12.5px] text-ink-3">Reply: {tk.reply}</p>
        ) : (
          <div className="space-y-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Answer in the language they wrote in…" className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none focus:border-brand-300 focus:bg-white" />
            <Button size="sm" disabled={busy || !reply.trim()} onClick={() => act(() => api.moderator.replyTicket(tk.id, reply))}>Reply</Button>
          </div>
        )}
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Directory({ items, onChange }: { items: any[]; onChange: () => void }) {
  const { busy, err, act } = useAct(onChange);
  if (items.length === 0) return <Empty text="No accounts yet." />;
  return (
    <Panel title={L("Clients & students")} desc={L("Every account and its status")}>
      <ul className="divide-y divide-line">
        {items.map((u) => (
          <li key={u.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">{u.name} <span className="text-[11px] uppercase text-ink-4">{u.role}</span></p>
              <p className="mt-0.5 text-[12px] text-ink-4">{u.email} · {u.isActive ? "active" : "restricted"}</p>
            </div>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.moderator.setUserActive(u.id, !u.isActive))}>
              {u.isActive ? "Restrict" : "Reactivate"}
            </Button>
          </li>
        ))}
      </ul>
      {err && <p className="px-5 py-2 text-[12.5px] text-warn">{err}</p>}
    </Panel>
  );
}

function Controls({ controls }: { controls: any }) {
  if (!controls) return <Empty text="Loading…" />;
  return (
    <div className="space-y-5">
      <Panel title={L("Platform rules")} desc={L("Some are deliberately not yours to turn off")}>
        <ul className="divide-y divide-line">
          {(controls.rules ?? []).map((r: any) => (
            <li key={r.key} className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-ink">{r.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${r.locked ? "bg-ink text-white" : "bg-canvas-3 text-ink-3"}`}>{r.locked ? "Locked" : "Editable"}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={L("Sector rate floors")} desc={L("The fair-price minimum per hour")}>
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
          {Object.entries(controls.rateFloors ?? {}).map(([k, v]) => (
            <li key={k} className="bg-white px-4 py-3">
              <p className="text-[11px] uppercase text-ink-4">{k}</p>
              <p className="num text-[15px] font-semibold text-ink">৳{String(v)}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
