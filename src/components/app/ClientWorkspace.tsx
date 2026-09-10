"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Briefcase,
  ClipboardCheck,
  Receipt,
  Wallet,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard, Money } from "./parts";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useLang, type L } from "@/lib/i18n";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

/* Live data types (loose — the API is the source of truth). */
type Payment = { status: string; amount: number; note?: string };
type TrialCheck = { status: string };
type Task = {
  id: string;
  title: string;
  desc: string;
  fee: number;
  hours: number;
  status: string;
  acceptance: string[];
  payment?: Payment | null;
  trialCheck?: TrialCheck | null;
  trial?: { title: string; brief: string; minutes: number; mirrors?: string } | null;
  evaluation?: { id: string; clientSignoff: boolean } | null;
};
type Job = {
  id: string;
  ref: string;
  title: string;
  brief: string;
  status: string;
  budget: number;
  aiSummary?: string;
  aiComplexity?: string;
  aiEstHours?: number;
  aiSuggestedFee?: number;
  aiRisks?: string[];
  aiSkills?: string[];
  sector?: { id: string; name: string } | null;
  tasks: Task[];
};

const NAV: NavItem[] = [
  { key: "overview", label: L("Overview", "ওভারভিউ"), icon: LayoutDashboard },
  { key: "post", label: L("Post a problem", "সমস্যা পোস্ট করুন"), icon: Plus },
  { key: "jobs", label: L("My problems", "আমার সমস্যা"), icon: Briefcase },
  { key: "review", label: L("Trial & sign-off", "ট্রায়াল ও সাইন-অফ"), icon: ClipboardCheck },
  { key: "spend", label: L("Spend", "খরচ"), icon: Receipt },
  { key: "account", label: L("Account & payment", "অ্যাকাউন্ট ও পেমেন্ট"), icon: Wallet },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview"), subtitle: L("Everything that needs you, and nothing that doesn't") },
  post: { title: L("Post a problem"), subtitle: L("Write it in your own words. One problem, one price.") },
  jobs: { title: L("My problems"), subtitle: L("Each problem, its AI scope, and where it stands") },
  review: { title: L("Trial & sign-off"), subtitle: L("Check the AI's trial, and sign off finished work") },
  spend: { title: L("Spend"), subtitle: L("Per task, held in escrow until you sign off") },
  account: { title: L("Account & payment"), subtitle: L("An account and a way to pay") },
};

export default function ClientWorkspace() {
  const { user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState("overview");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [payments, setPayments] = useState<{ status: string; amount: number; task?: { title: string } }[]>([]);
  const [methods, setMethods] = useState<{ id: string; kind: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [j, p, m] = await Promise.all([
        api.client.listJobs() as Promise<Job[]>,
        api.client.payments() as Promise<typeof payments>,
        api.client.paymentMethods() as Promise<typeof methods>,
      ]);
      setJobs(j);
      setPayments(p);
      setMethods(m);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const active = jobs.filter((j) => !["DELIVERED", "CANCELLED"].includes(j.status)).length;
  const delivered = jobs.filter((j) => j.status === "DELIVERED").length;
  const paid = payments.filter((p) => p.status === "RELEASED").reduce((a, p) => a + p.amount, 0);
  const held = payments.filter((p) => p.status === "HELD").reduce((a, p) => a + p.amount, 0);

  return (
    <AppShell
      role="client"
      roleLabel={L("Client workspace", "ক্লায়েন্ট ওয়ার্কস্পেস")}
      userName={user?.name ?? "Client"}
      userMeta={L(user?.email ?? "")}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
      actions={
        tab !== "post" ? (
          <Button size="sm" onClick={() => setTab("post")} icon={<Plus className="size-4" />}>
            {t(L("Post a problem"))}
          </Button>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-warn/20 bg-warn-bg px-4 py-3 text-[13px] text-warn">
          <AlertTriangle className="size-4" /> {error}
        </div>
      )}

      {tab === "overview" && (
        <Overview loading={loading} active={active} delivered={delivered} paid={paid} held={held} jobs={jobs} onGo={setTab} />
      )}
      {tab === "post" && <PostProblem onPosted={() => { reload(); setTab("jobs"); }} />}
      {tab === "jobs" && <Jobs loading={loading} jobs={jobs} onChange={reload} />}
      {tab === "review" && <Jobs loading={loading} jobs={jobs} onChange={reload} reviewOnly />}
      {tab === "spend" && <Spend loading={loading} payments={payments} />}
      {tab === "account" && <Account methods={methods} onChange={reload} />}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-[16px] border border-dashed border-line bg-white py-16 text-center text-[13px] text-ink-4">
      {text}
    </div>
  );
}

function Overview({
  loading,
  active,
  delivered,
  paid,
  held,
  jobs,
  onGo,
}: {
  loading: boolean;
  active: number;
  delivered: number;
  paid: number;
  held: number;
  jobs: Job[];
  onGo: (t: string) => void;
}) {
  const n = (x: number) => String(x);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label={L("Active problems")} value={n(active)} hint={L("in progress right now")} />
        <StatCard icon={CheckCircle2} label={L("Delivered")} value={n(delivered)} hint={L("signed off and paid")} tone="brand" />
        <StatCard icon={Wallet} label={L("Held in escrow")} value={`৳${held.toLocaleString("en-US")}`} hint={L("released on sign-off")} />
        <StatCard icon={Receipt} label={L("Paid to date")} value={`৳${paid.toLocaleString("en-US")}`} hint={L("released to students")} tone="ink" />
      </div>
      <Panel title={L("Your problems")} desc={L("Latest first")} action={<Button size="sm" variant="ghost" onClick={() => onGo("post")}>Post a problem</Button>}>
        {loading ? (
          <div className="p-6 text-[13px] text-ink-4">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-5"><Empty text="No problems posted yet. Post your first problem and the AI will scope it." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {jobs.slice(0, 5).map((j) => (
              <li key={j.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{j.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-4">{j.ref} · {j.sector?.name ?? "—"}</p>
                </div>
                <StatusTag status={j.tasks[0]?.status ?? j.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function PostProblem({ onPosted }: { onPosted: () => void }) {
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<{ job: Job; price: any } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = (await api.client.postJob({
        brief,
        budget: budget ? Number(budget) : undefined,
      })) as { job: Job; price: any };
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const task = result.job.tasks[0];
    const price = result.price;
    return (
      <div className="space-y-5">
        <Panel title={L("The AI's scope")} desc={L("One task, one price — check it before you fund")}>
          <div className="space-y-4 p-5">
            <div className="rounded-[12px] border border-brand-100 bg-brand-50/50 p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">
                <Cpu className="size-3.5" /> AI restatement
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{result.job.aiSummary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Fee" value={`৳${task.fee.toLocaleString("en-US")}`} />
              <MiniStat label="Estimate" value={`${task.hours}h`} />
              <MiniStat label="Complexity" value={result.job.aiComplexity ?? "—"} />
            </div>
            <div
              className={`rounded-[12px] border p-4 text-[12.5px] ${
                price?.level === "blocked"
                  ? "border-warn/30 bg-warn-bg text-warn"
                  : price?.level === "low"
                    ? "border-warn/20 bg-warn-bg/60 text-warn"
                    : "border-brand-100 bg-brand-50/40 text-ink-3"
              }`}
            >
              <span className="font-semibold">Fair-price check: </span>
              {price?.message}
            </div>
            {task.trial && (
              <div className="rounded-[12px] border border-line p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">The trial applicants will do</p>
                <p className="mt-1 text-[13px] font-medium text-ink">{task.trial.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-4">{task.trial.brief}</p>
              </div>
            )}
          </div>
        </Panel>
        <div className="flex gap-3">
          <Button onClick={onPosted}>Go to my problems</Button>
          <Button variant="ghost" onClick={() => { setResult(null); setBrief(""); setBudget(""); }}>Post another</Button>
        </div>
      </div>
    );
  }

  return (
    <Panel title={L("Describe the problem")} desc={L("Plain words. The AI will price it and write a trial.")}>
      <div className="space-y-4 p-5">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={6}
          placeholder="e.g. People add items to the basket on our website but the checkout payment keeps failing…"
          className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-4 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Budget in ৳ (optional)"
            className="w-56 rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13.5px] text-ink outline-none focus:border-brand-300 focus:bg-white"
          />
          <Button onClick={submit} disabled={busy || brief.trim().length < 10}>
            {busy ? "Scoping…" : "Scope it"}
          </Button>
        </div>
        {error && <p className="text-[12.5px] text-warn">{error}</p>}
      </div>
    </Panel>
  );
}

function Jobs({
  loading,
  jobs,
  onChange,
  reviewOnly,
}: {
  loading: boolean;
  jobs: Job[];
  onChange: () => void;
  reviewOnly?: boolean;
}) {
  const shown = reviewOnly
    ? jobs.filter((j) => {
        const t = j.tasks[0];
        return (
          t &&
          (t.trialCheck?.status === "AWAITING_CLIENT" ||
            t.payment?.status === "AWAITING" ||
            (t.status === "IN_REVIEW" && t.evaluation))
        );
      })
    : jobs;

  if (loading) return <div className="p-2 text-[13px] text-ink-4">Loading…</div>;
  if (shown.length === 0)
    return <Empty text={reviewOnly ? "Nothing needs your attention right now." : "No problems yet — post one to get started."} />;

  return (
    <div className="space-y-4">
      {shown.map((j) => (
        <JobCard key={j.id} job={j} onChange={onChange} />
      ))}
    </div>
  );
}

function JobCard({ job, onChange }: { job: Job; onChange: () => void }) {
  const task = job.tasks[0];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      onChange();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Action failed");
      setBusy(false);
    }
  };

  if (!task) return null;
  const tc = task.trialCheck?.status;
  const pay = task.payment?.status;

  return (
    <Panel
      title={L(job.title)}
      desc={L(`${job.ref} · ${job.sector?.name ?? "—"}`)}
      action={<StatusTag status={task.status} />}
    >
      <div className="space-y-4 p-5">
        <p className="text-[13px] leading-relaxed text-ink-3">{job.aiSummary}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Fee" value={`৳${task.fee.toLocaleString("en-US")}`} />
          <MiniStat label="Estimate" value={`${task.hours}h`} />
          <MiniStat label="Escrow" value={pay ?? "—"} />
        </div>

        {task.trial && tc === "AWAITING_CLIENT" && (
          <div className="rounded-[12px] border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">Check the trial</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{task.trial.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-4">{task.trial.brief}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {tc === "AWAITING_CLIENT" && (
            <>
              <Button size="sm" disabled={busy} onClick={() => act(() => api.client.reviewTrial(task.id, "approve"))}>
                Approve trial
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.client.reviewTrial(task.id, "changes", "Please adjust"))}>
                Ask for changes
              </Button>
            </>
          )}
          {pay === "AWAITING" && (
            <Button size="sm" disabled={busy} onClick={() => act(() => api.client.deposit(task.id))}>
              Fund escrow (৳{task.fee.toLocaleString("en-US")})
            </Button>
          )}
          {task.status === "IN_REVIEW" && task.evaluation && (
            <>
              <Button size="sm" disabled={busy} onClick={() => act(() => api.client.signOff(task.id, "accept"))}>
                Accept & release
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.client.signOff(task.id, "revision", "Please revise"))}>
                Request revision
              </Button>
            </>
          )}
          {["IN_PROGRESS", "IN_REVIEW", "REVISION"].includes(task.status) && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.client.dispute(task.id, "Issue with delivery", task.fee))}>
              Raise dispute
            </Button>
          )}
        </div>
        {err && <p className="text-[12.5px] text-warn">{err}</p>}
      </div>
    </Panel>
  );
}

function Spend({ loading, payments }: { loading: boolean; payments: { status: string; amount: number; task?: { title: string } }[] }) {
  if (loading) return <div className="p-2 text-[13px] text-ink-4">Loading…</div>;
  if (payments.length === 0) return <Empty text="No spend yet. Fund a task and it appears here." />;
  return (
    <Panel title={L("Escrow & payments")} desc={L("Held on funding, released on sign-off")}>
      <ul className="divide-y divide-line">
        {payments.map((p, i) => (
          <li key={i} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">{p.task?.title ?? "Task"}</p>
              <p className="mt-0.5 text-[12px] text-ink-4">{p.status}</p>
            </div>
            <Money value={p.amount} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Account({ methods, onChange }: { methods: { id: string; kind: string; label: string }[]; onChange: () => void }) {
  const [kind, setKind] = useState("bkash");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!label.trim()) return;
    setBusy(true);
    try {
      await api.client.addPaymentMethod({ kind, label });
      setLabel("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={L("Payment methods")} desc={L("How the platform collects and holds your deposits")}>
      <div className="space-y-4 p-5">
        {methods.length === 0 ? (
          <Empty text="No payment method added yet." />
        ) : (
          <ul className="divide-y divide-line rounded-[12px] border border-line">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-ink">{m.label}</span>
                <span className="text-[11.5px] uppercase text-ink-4">{m.kind}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none">
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
          </select>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. bKash merchant)" className="flex-1 rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[13px] text-ink outline-none focus:border-brand-300 focus:bg-white" />
          <Button size="sm" onClick={add} disabled={busy || !label.trim()}>Add</Button>
        </div>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-canvas-2/40 p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-4">{label}</p>
      <p className="num mt-1 text-[15px] font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-canvas-3 text-ink-2",
    MATCHING: "bg-info-bg text-info",
    IN_PROGRESS: "bg-brand-50 text-brand-700",
    IN_REVIEW: "bg-warn-bg text-warn",
    REVISION: "bg-warn-bg text-warn",
    APPROVED: "bg-brand-600 text-white",
    DELIVERED: "bg-brand-600 text-white",
    CANCELLED: "bg-canvas-3 text-ink-4",
    SCOPING: "bg-canvas-3 text-ink-2",
  };
  const label = status.replace(/_/g, " ").toLowerCase();
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ring-line ${map[status] ?? "bg-canvas-3 text-ink-3"}`}>
      {label}
    </span>
  );
}
