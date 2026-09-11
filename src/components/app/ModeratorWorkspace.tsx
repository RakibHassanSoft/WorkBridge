"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Cpu,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Reply,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { EmptyState, Fact, LoadingRows, Notice, Panel, StatCard, StatusBadge, WelcomeBanner, inputCls, taka, useAction, when } from "./parts";
import { Bar, Button } from "@/components/ui";
import { ApiError, type Role } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { L } from "@/lib/i18n";
import { useApi, useWorkspaceUser } from "@/lib/workspace";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

/* Response shapes of the moderator API (see server/src/modules/moderator). */
type Named = { id: string; name: string; email?: string; role?: string } | null;
type Trial = { title: string; brief: string; minutes: number; mirrors?: string | null } | null;
type ScopeJob = {
  id: string;
  ref: string;
  title: string;
  brief: string;
  budget: number;
  createdAt: string;
  aiSummary?: string;
  aiComplexity?: string;
  aiConfidence?: number;
  aiEstHours?: number;
  aiSuggestedFee?: number;
  aiRisks?: string[];
  client?: Named;
  sector?: { id: string; name: string } | null;
  tasks: { id: string; fee: number; hours: number; trial?: Trial; trialCheck?: { status: string } | null; payment?: { status: string } | null }[];
};
type Attempt = { id: string; studentId: string; aiScore: number; aiVerdict?: string; summary?: string; minutesTaken?: number; submittedAt?: string; student?: Named };
type SelectTask = { id: string; title: string; fee: number; trial?: Trial; job?: { ref: string; client?: Named } | null; attempts: Attempt[] };
type ReviewTask = { id: string; title: string; fee: number; submissionNote?: string | null; submittedAt?: string | null; acceptance?: string[]; assignee?: Named; job?: { ref: string } | null };
type Kyc = { id: string; status: string; createdAt: string; documents: { label: string; detail: string; ok?: boolean }[]; subject?: Named };
type Payment = { id: string; taskId: string; amount: number; status: string; note?: string | null; method?: string | null; updatedAt: string; task?: { id: string; title: string; status: string } | null; client?: Named };
type Dispute = { id: string; ref: string; status: string; amount: number; claim: string; evidence?: string[]; outcome?: string | null; resolution?: string | null; raisedByRole: string; createdAt: string; task?: { id: string; title: string } | null; raisedBy?: Named };
type Ticket = { id: string; ref: string; subject: string; body: string; priority: string; status: string; reply?: string | null; createdAt: string; from?: Named };
type Account = { id: string; name: string; email: string; role: Role; isActive: boolean; createdAt: string; studentProfile?: { university?: string | null; kycStatus?: string } | null; clientProfile?: { businessName?: string; city?: string | null } | null };
type Controls = { rateFloors: Record<string, number>; rules: { key: string; label: string; locked: boolean }[] };

type Data = { scopes: ScopeJob[]; select: SelectTask[]; reviews: ReviewTask[]; kyc: Kyc[]; payments: Payment[]; disputes: Dispute[]; support: Ticket[]; users: Account[] };
const EMPTY: Data = { scopes: [], select: [], reviews: [], kyc: [], payments: [], disputes: [], support: [], users: [] };

const NAV_BASE: NavItem[] = [
  { key: "overview", label: L("Overview", "ওভারভিউ"), icon: LayoutDashboard },
  { key: "scopes", label: L("Scope review", "স্কোপ রিভিউ"), icon: Cpu },
  { key: "select", label: L("Select student", "শিক্ষার্থী নির্বাচন"), icon: UserCheck },
  { key: "reviews", label: L("Score work", "কাজ মূল্যায়ন"), icon: ShieldCheck },
  { key: "kyc", label: L("Verify students", "শিক্ষার্থী যাচাই"), icon: IdCard },
  { key: "payments", label: L("Payments", "পেমেন্ট"), icon: Banknote },
  { key: "disputes", label: L("Disputes", "বিরোধ"), icon: Scale },
  { key: "support", label: L("Support", "সহায়তা"), icon: LifeBuoy },
  { key: "directory", label: L("Directory", "ডিরেক্টরি"), icon: Users },
  { key: "controls", label: L("Controls", "নিয়ন্ত্রণ"), icon: SlidersHorizontal },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview", "ওভারভিউ"), subtitle: L("The human gate the whole model rests on") },
  scopes: { title: L("Scope review", "স্কোপ রিভিউ"), subtitle: L("Nothing reaches a student until you release it") },
  select: { title: L("Select the student", "শিক্ষার্থী নির্বাচন"), subtitle: L("The AI ranks the trials; you decide") },
  reviews: { title: L("Score work", "কাজ মূল্যায়ন"), subtitle: L("Score delivered work against the rubric before the client signs off") },
  kyc: { title: L("Verify students", "শিক্ষার্থী যাচাই"), subtitle: L("Read the letter, confirm by phone") },
  payments: { title: L("Payments", "পেমেন্ট"), subtitle: L("Money in, held, released or refunded") },
  disputes: { title: L("Disputes", "বিরোধ"), subtitle: L("The only route by which held money moves without a sign-off") },
  support: { title: L("Support", "সহায়তা"), subtitle: L("Everything the product didn't anticipate") },
  directory: { title: L("Clients & students", "ক্লায়েন্ট ও শিক্ষার্থী"), subtitle: L("Every account, and who can act") },
  controls: { title: L("Platform controls", "প্ল্যাটফর্ম নিয়ন্ত্রণ"), subtitle: L("Some rules are deliberately locked") },
};

export default function ModeratorWorkspace() {
  const api = useApi();
  const user = useWorkspaceUser();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<Data>(EMPTY);
  const [controls, setControls] = useState<Controls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [scopes, select, reviews, kyc, payments, disputes, support, users, ctrl] = await Promise.all([
        api.moderator.scopes() as Promise<ScopeJob[]>,
        api.moderator.selectRounds() as Promise<SelectTask[]>,
        api.moderator.reviews() as Promise<ReviewTask[]>,
        api.moderator.kyc() as Promise<Kyc[]>,
        api.moderator.payments() as Promise<Payment[]>,
        api.moderator.disputes() as Promise<Dispute[]>,
        api.moderator.tickets() as Promise<Ticket[]>,
        api.moderator.users() as Promise<Account[]>,
        api.moderator.controls() as Promise<Controls>,
      ]);
      setData({ scopes, select, reviews, kyc, payments, disputes, support, users });
      setControls(ctrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the console");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openDisputes = data.disputes.filter((x) => x.status !== "RESOLVED").length;
  const unanswered = data.support.filter((x) => !x.reply).length;
  const counts: Record<string, number> = {
    scopes: data.scopes.length,
    select: data.select.length,
    reviews: data.reviews.length,
    kyc: data.kyc.length,
    disputes: openDisputes,
    support: unanswered,
  };
  const nav = NAV_BASE.map((n) => (counts[n.key] ? { ...n, badge: counts[n.key] } : n));

  return (
    <AppShell
      roleLabel={L("Moderator console", "মডারেটর কনসোল")}
      userName={user?.name ?? "Coordinator"}
      userMeta={L("Platform coordinator", "প্ল্যাটফর্ম কোঅর্ডিনেটর")}
      nav={nav}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
    >
      {error && (
        <Notice tone="error" className="mb-5 flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" /> {error}
        </Notice>
      )}
      {loading ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          {tab === "overview" && <Overview name={user?.name ?? "there"} data={data} counts={counts} go={setTab} />}
          {tab === "scopes" && <Scopes items={data.scopes} floors={controls?.rateFloors ?? {}} onChange={reload} />}
          {tab === "select" && <Select items={data.select} onChange={reload} />}
          {tab === "reviews" && <Reviews items={data.reviews} onChange={reload} />}
          {tab === "kyc" && <KycQueue items={data.kyc} onChange={reload} />}
          {tab === "payments" && <Payments items={data.payments} onChange={reload} />}
          {tab === "disputes" && <Disputes items={data.disputes} onChange={reload} />}
          {tab === "support" && <Support items={data.support} onChange={reload} />}
          {tab === "directory" && <Directory items={data.users} me={user?.id} onChange={reload} />}
          {tab === "controls" && <ControlsView controls={controls} />}
        </>
      )}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

const QUEUES: { key: string; icon: LucideIcon; label: string; cta: string }[] = [
  { key: "scopes", icon: Cpu, label: "AI scopes waiting to be released", cta: "Review scopes" },
  { key: "select", icon: UserCheck, label: "Trial rounds waiting for a selection", cta: "Select students" },
  { key: "reviews", icon: ShieldCheck, label: "Delivered work waiting for a score", cta: "Score work" },
  { key: "kyc", icon: IdCard, label: "Students waiting for verification", cta: "Verify students" },
  { key: "disputes", icon: Scale, label: "Disputes waiting for a ruling", cta: "Rule on disputes" },
  { key: "support", icon: LifeBuoy, label: "Support tickets without a reply", cta: "Answer support" },
];

function Overview({ name, data, counts, go }: { name: string; data: Data; counts: Record<string, number>; go: (k: string) => void }) {
  const waiting = Object.values(counts).reduce((a, b) => a + b, 0);
  const held = data.payments.filter((p) => p.status === "HELD").reduce((a, p) => a + p.amount, 0);
  const first = QUEUES.find((q) => counts[q.key]);
  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={name}
        eyebrow="Moderator console"
        headline={waiting ? `${waiting} item${waiting === 1 ? " is" : "s are"} waiting on a coordinator.` : "Every queue is clear."}
        action={first ? <Button variant="secondary" onClick={() => go(first.key)}>{first.cta}</Button> : undefined}
      >
        Every AI decision is a draft until you release it. Selections, scores, verifications and rulings here are what make the record trustworthy.
      </WelcomeBanner>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Cpu} label={L("Scopes to review")} value={String(counts.scopes)} hint={L("awaiting release")} />
        <StatCard icon={UserCheck} label={L("Selections due")} value={String(counts.select)} hint={L("trial rounds")} tone="brand" />
        <StatCard icon={Banknote} label={L("Held in escrow")} value={taka(held)} hint={L("across all tasks")} />
        <StatCard icon={Scale} label={L("Open disputes")} value={String(counts.disputes)} hint={L("need a ruling")} tone="ink" />
      </div>
      <Panel title={L("Needs you now")} desc={L("Every queue that is waiting on a coordinator")}>
        <ul className="divide-y divide-line">
          {QUEUES.map((q) => (
            <li key={q.key}>
              <button onClick={() => go(q.key)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-canvas-2/60">
                <span className="flex min-w-0 items-center gap-3">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-[9px]", counts[q.key] ? "bg-brand-50 text-brand-700" : "bg-canvas-2 text-ink-4")}>
                    <q.icon className="size-4" />
                  </span>
                  <span className="truncate text-[13.5px] text-ink">{q.label}</span>
                </span>
                <span className={cn("num rounded-full px-2.5 py-0.5 text-[12px] font-semibold", counts[q.key] ? "bg-brand-600 text-white" : "bg-canvas-3 text-ink-4")}>{counts[q.key]}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ── Scope review ─────────────────────────────────────────────── */

function Scopes({ items, floors, onChange }: { items: ScopeJob[]; floors: Record<string, number>; onChange: () => void }) {
  if (items.length === 0) return <EmptyState icon={Cpu} title="No scopes waiting" text="New problems appear here after the AI scopes them. Nothing reaches a student until you release it." />;
  return <div className="space-y-5">{items.map((job) => <ScopeCard key={job.id} job={job} floors={floors} onChange={onChange} />)}</div>;
}

function ScopeCard({ job, floors, onChange }: { job: ScopeJob; floors: Record<string, number>; onChange: () => void }) {
  const api = useApi();
  const task = job.tasks[0];
  const [fee, setFee] = useState(String(task?.fee ?? job.budget));
  const [hours, setHours] = useState(String(task?.hours ?? job.aiEstHours ?? 1));
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const { busy, err, run } = useAction(onChange);

  const floor = floors[job.sector?.id ?? ""] ?? 300;
  const rate = Number(hours) > 0 ? Math.round(Number(fee) / Number(hours)) : 0;
  const gap = floor > 0 ? Math.round(((floor - rate) / floor) * 100) : 0;
  const level = rate >= floor ? "ok" : gap >= 25 ? "blocked" : "low";
  const edited = Number(fee) !== task?.fee || Number(hours) !== task?.hours;

  const approve = () =>
    run(() => api.moderator.approveScope(job.id, edited ? { fee: Number(fee), hours: Number(hours), note: "Re-scoped by coordinator" } : {}));

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{job.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{job.ref} · {job.client?.name ?? "—"} · {job.sector?.name ?? "—"} · {when(job.createdAt)}</p>
        </div>
        <div className="flex gap-1.5">
          {task?.trialCheck && <StatusBadge status={task.trialCheck.status} />}
          {task?.payment && <StatusBadge status={task.payment.status} />}
        </div>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[12px] border border-line bg-canvas-2/40 p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">The client&apos;s words</p>
            <p className="mt-1 text-[13px] italic leading-relaxed text-ink-2">&ldquo;{job.brief}&rdquo;</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-700"><Cpu className="size-3.5" /> AI scope · {job.aiComplexity ?? "—"} complexity{job.aiConfidence ? ` · ${Math.round(job.aiConfidence * (job.aiConfidence <= 1 ? 100 : 1))}% confident` : ""}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{job.aiSummary}</p>
          </div>
          {!!job.aiRisks?.length && (
            <ul className="space-y-1.5">
              {job.aiRisks.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-3"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" /> {r}</li>
              ))}
            </ul>
          )}
          {task?.trial && (
            <div className="rounded-[12px] border border-line p-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Trial · {task.trial.minutes} min</p>
              <p className="mt-1 text-[13px] font-medium text-ink">{task.trial.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-4">{task.trial.brief}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Fee (৳)</span>
              <input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Hours</span>
              <input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
            </label>
          </div>
          <Notice tone={level === "ok" ? "success" : level === "blocked" ? "error" : "warn"}>
            <span className="font-semibold">Fair-price check: </span>
            {taka(rate)}/hour against the {taka(floor)} floor for {job.sector?.name ?? "this sector"}
            {level === "ok" ? " — cleared." : level === "low" ? ` — ${gap}% under; it will be slow to match.` : ` — ${gap}% under; the client will not be able to fund it.`}
          </Notice>
          {edited && <p className="text-[12px] text-ink-4">You are re-scoping this: AI suggested {taka(task?.fee ?? 0)} for {task?.hours} h.</p>}
          {rejecting ? (
            <div className="space-y-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why is this out of scope? The client sees this." className={cn(inputCls, "resize-none")} />
              <div className="flex gap-2">
                <Button size="sm" variant="dark" disabled={busy || reason.trim().length < 3} onClick={() => run(() => api.moderator.rejectScope(job.id, reason.trim()))}>Reject problem</Button>
                <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !Number(fee) || !Number(hours)} onClick={approve} icon={<CheckCircle2 className="size-4" />}>
                {edited ? "Re-scope & release" : "Approve & release"}
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(true)} icon={<XCircle className="size-4" />}>Reject</Button>
            </div>
          )}
          {err && <Notice tone="error">{err}</Notice>}
        </div>
      </div>
    </section>
  );
}

/* ── Select the student ───────────────────────────────────────── */

function Select({ items, onChange }: { items: SelectTask[]; onChange: () => void }) {
  if (items.length === 0) return <EmptyState icon={UserCheck} title="No trial rounds waiting" text="When students have done a live task's trial, the AI's ranking appears here for you to choose from." />;
  return <div className="space-y-5">{items.map((task) => <SelectCard key={task.id} task={task} onChange={onChange} />)}</div>;
}

function SelectCard({ task, onChange }: { task: SelectTask; onChange: () => void }) {
  const api = useApi();
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { busy, err, run } = useAction(onChange);
  const chosen = task.attempts.find((a) => a.studentId === picked);

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{task.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{task.job?.ref} · {task.job?.client?.name ?? "—"} · {taka(task.fee)} · {task.attempts.length} applicant{task.attempts.length === 1 ? "" : "s"}</p>
        </div>
        <StatusBadge status="MATCHING" />
      </div>
      <div className="space-y-3 p-5">
        <p className="text-[12px] text-ink-4">Ranked by the AI. The selected student gets the task (0 points until delivered); everyone else earns +1.</p>
        {task.attempts.map((a, i) => (
          <button
            key={a.id}
            onClick={() => { setPicked(a.studentId); setReason(`Best trial: ${a.aiScore}/100`); }}
            aria-pressed={picked === a.studentId}
            className={cn("w-full rounded-[14px] border p-4 text-left transition-all", picked === a.studentId ? "border-brand-500 bg-brand-50/60 shadow-[0_0_0_3px_rgba(26,155,102,.1)]" : "border-line hover:border-brand-200")}
          >
            <div className="flex items-center gap-3">
              <span className={cn("num grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", i === 0 ? "bg-amber-100 text-amber-700" : "bg-canvas-3 text-ink-3")}>
                {i === 0 ? <Trophy className="size-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13.5px] font-medium text-ink">{a.student?.name ?? "Student"}</p>
                  <span className="num text-[13px] font-semibold text-ink">{a.aiScore}/100</span>
                </div>
                <div className="mt-1.5"><Bar value={a.aiScore} /></div>
              </div>
            </div>
            {a.aiVerdict && <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-3">{a.aiVerdict}</p>}
            {a.summary && <p className="mt-1.5 rounded-[10px] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-ink-4">&ldquo;{a.summary}&rdquo;{a.minutesTaken ? ` — ${a.minutesTaken} min` : ""}</p>}
          </button>
        ))}
        {chosen && (
          <div className="space-y-2 rounded-[14px] border border-line p-4">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Why {chosen.student?.name ?? "this student"}? <span className="font-normal text-ink-4">(kept on the record)</span></span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
            </label>
            <Button disabled={busy || reason.trim().length < 3} onClick={() => run(() => api.moderator.selectStudent(task.id, chosen.studentId, reason.trim()))} icon={<UserCheck className="size-4" />}>
              Select {chosen.student?.name ?? "student"}
            </Button>
          </div>
        )}
        {err && <Notice tone="error">{err}</Notice>}
      </div>
    </section>
  );
}

/* ── Score delivered work ─────────────────────────────────────── */

const DIMS = ["Quality", "Completeness", "Communication"];

function Reviews({ items, onChange }: { items: ReviewTask[]; onChange: () => void }) {
  if (items.length === 0) return <EmptyState icon={ShieldCheck} title="Nothing to score" text="Delivered work lands here before the client is asked to sign off." />;
  return <div className="space-y-5">{items.map((task) => <ReviewCard key={task.id} task={task} onChange={onChange} />)}</div>;
}

function ReviewCard({ task, onChange }: { task: ReviewTask; onChange: () => void }) {
  const api = useApi();
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(DIMS.map((d) => [d, 4])));
  const [note, setNote] = useState("");
  const { busy, err, run } = useAction(onChange);
  const total = DIMS.reduce((a, d) => a + scores[d], 0);

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{task.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{task.assignee?.name ?? "—"} · {task.job?.ref} · {taka(task.fee)} · submitted {when(task.submittedAt)}</p>
        </div>
        <StatusBadge status="IN_REVIEW" />
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">What was delivered</p>
          <p className="rounded-[12px] border border-line bg-canvas-2/40 p-3.5 text-[13px] leading-relaxed text-ink-2">{task.submissionNote || "No note was added."}</p>
          {!!task.acceptance?.length && (
            <ul className="space-y-1.5">
              {task.acceptance.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[12.5px] text-ink-3"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" /> {a}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Rubric</p>
          {DIMS.map((d) => (
            <div key={d} className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-ink-2">{d}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={d}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={scores[d] === n}
                    onClick={() => setScores((s) => ({ ...s, [d]: n }))}
                    className={cn("num grid size-8 place-items-center rounded-[8px] text-[12.5px] font-medium ring-1 transition-colors", scores[d] >= n ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink-4 ring-line hover:ring-brand-300")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="A note for the client and the student (optional)" className={cn(inputCls, "resize-none")} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-ink-3">Total <span className="num font-semibold text-ink">{total}/{DIMS.length * 5}</span></span>
            <Button disabled={busy} onClick={() => run(() => api.moderator.scoreWork(task.id, DIMS.map((d) => ({ dim: d, score: scores[d], max: 5 })), note.trim() || undefined))} icon={<ShieldCheck className="size-4" />}>
              Score &amp; send to client
            </Button>
          </div>
          {err && <Notice tone="error">{err}</Notice>}
        </div>
      </div>
    </section>
  );
}

/* ── Verify students ──────────────────────────────────────────── */

function KycQueue({ items, onChange }: { items: Kyc[]; onChange: () => void }) {
  if (items.length === 0) return <EmptyState icon={IdCard} title="No verifications pending" text="Students who submit their documents appear here." />;
  return <div className="grid gap-5 lg:grid-cols-2">{items.map((sub) => <KycCard key={sub.id} sub={sub} onChange={onChange} />)}</div>;
}

function KycCard({ sub, onChange }: { sub: Kyc; onChange: () => void }) {
  const api = useApi();
  const [note, setNote] = useState("");
  const { busy, err, run } = useAction(onChange);
  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[14.5px] font-semibold text-ink">{sub.subject?.name ?? "Student"}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{sub.subject?.email} · submitted {when(sub.createdAt)}</p>
        </div>
        <StatusBadge status={sub.status} />
      </div>
      <div className="space-y-3.5 p-5">
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {sub.documents.map((d, i) => (
            <li key={i} className="px-4 py-2.5">
              <p className="text-[13px] text-ink">{d.label}</p>
              <p className="text-[11.5px] text-ink-4">{d.detail}</p>
            </li>
          ))}
        </ul>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to the student (required to reject or ask again)" className={inputCls} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => run(() => api.moderator.decideKyc(sub.id, "approve", note.trim() || undefined))} icon={<CheckCircle2 className="size-4" />}>Verify</Button>
          <Button size="sm" variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => run(() => api.moderator.decideKyc(sub.id, "resubmit", note.trim()))}>Ask to resubmit</Button>
          <Button size="sm" variant="ghost" disabled={busy || note.trim().length < 3} onClick={() => run(() => api.moderator.decideKyc(sub.id, "reject", note.trim()))}>Reject</Button>
        </div>
        {err && <Notice tone="error">{err}</Notice>}
      </div>
    </section>
  );
}

/* ── Payments ─────────────────────────────────────────────────── */

function Payments({ items, onChange }: { items: Payment[]; onChange: () => void }) {
  const api = useApi();
  const [filter, setFilter] = useState("ALL");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { busy, err, run } = useAction(onChange);
  const shown = filter === "ALL" ? items : items.filter((p) => p.status === filter);
  const sum = (s: string) => items.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label={L("Held in escrow")} value={taka(sum("HELD"))} hint={L("waiting for sign-off or a ruling")} />
        <StatCard icon={Banknote} label={L("Released")} value={taka(sum("RELEASED"))} hint={L("paid to students")} tone="ink" />
        <StatCard icon={Scale} label={L("Refunded")} value={taka(sum("REFUNDED"))} hint={L("returned to clients")} tone="brand" />
      </div>
      <Panel
        title={L("Payment ledger")}
        desc={L("Escrow across every task")}
        action={<FilterPills value={filter} onChange={setFilter} options={["ALL", "AWAITING", "HELD", "RELEASED", "REFUNDED"]} />}
      >
        {shown.length === 0 ? (
          <div className="p-5"><EmptyState icon={Banknote} title="No payments here" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-ink-4">
                  <th className="px-5 py-3 font-semibold">Task</th>
                  <th className="px-3 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{p.task?.title ?? "Task"}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{p.note} · {when(p.updatedAt)}</p>
                      {refunding === p.id && (
                        <div className="mt-2 flex gap-2">
                          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the refund" className={cn(inputCls, "py-2")} />
                          <Button size="sm" variant="dark" disabled={busy || reason.trim().length < 3} onClick={async () => { if (await run(() => api.moderator.refund(p.taskId ?? p.task?.id ?? "", reason.trim()))) { setRefunding(null); setReason(""); } }}>Refund</Button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-ink-3">{p.client?.name ?? "—"}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="num px-3 py-3.5 text-right font-semibold text-ink">{taka(p.amount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === "HELD" && refunding !== p.id && (
                        <Button size="sm" variant="ghost" onClick={() => { setRefunding(p.id); setReason(""); }}>Refund…</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {err && <div className="p-4"><Notice tone="error">{err}</Notice></div>}
      </Panel>
    </div>
  );
}

/* ── Disputes ─────────────────────────────────────────────────── */

function Disputes({ items, onChange }: { items: Dispute[]; onChange: () => void }) {
  const [filter, setFilter] = useState("OPEN");
  const shown = filter === "ALL" ? items : filter === "OPEN" ? items.filter((d) => d.status !== "RESOLVED") : items.filter((d) => d.status === "RESOLVED");
  return (
    <div className="space-y-5">
      <FilterPills value={filter} onChange={setFilter} options={["OPEN", "RESOLVED", "ALL"]} />
      {shown.length === 0 ? (
        <EmptyState icon={Scale} title={filter === "OPEN" ? "No open disputes" : "Nothing here"} text="Either side can open a dispute on a task in progress or in review." />
      ) : (
        shown.map((dp) => <DisputeCard key={dp.id} dp={dp} onChange={onChange} />)
      )}
    </div>
  );
}

function DisputeCard({ dp, onChange }: { dp: Dispute; onChange: () => void }) {
  const api = useApi();
  const [resolution, setResolution] = useState("");
  const { busy, err, run } = useAction(onChange);
  const rule = (outcome: "client" | "student" | "split") => run(() => api.moderator.ruleDispute(dp.id, outcome, resolution.trim()));
  const ok = resolution.trim().length >= 3;

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{dp.task?.title ?? "Task"}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{dp.ref} · raised by {dp.raisedBy?.name ?? dp.raisedByRole.toLowerCase()} ({dp.raisedByRole.toLowerCase()}) · {when(dp.createdAt)}</p>
        </div>
        <StatusBadge status={dp.status} />
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="rounded-[12px] border border-line bg-canvas-2/40 p-3.5 text-[13px] leading-relaxed text-ink-2">&ldquo;{dp.claim}&rdquo;</p>
          <Fact label="Amount in dispute" value={taka(dp.amount ?? 0)} className="w-fit min-w-[160px]" />
          {!!dp.evidence?.length && (
            <ul className="space-y-1">
              {dp.evidence.map((e) => <li key={e} className="text-[12.5px] text-ink-3">• {e}</li>)}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          {dp.status === "RESOLVED" ? (
            <Notice tone="success">
              <span className="font-semibold">{dp.outcome}</span>
              {dp.resolution && <span className="mt-1 block text-ink-3">{dp.resolution}</span>}
            </Notice>
          ) : (
            <>
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Your ruling, in a sentence both sides will read" className={cn(inputCls, "resize-none")} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy || !ok} onClick={() => rule("client")}>Refund client</Button>
                <Button size="sm" disabled={busy || !ok} onClick={() => rule("student")}>Release to student</Button>
                <Button size="sm" variant="ghost" disabled={busy || !ok} onClick={() => rule("split")}>Split</Button>
              </div>
              <p className="text-[11.5px] text-ink-4">Refunding the client counts as a failed delivery: the student&apos;s point for this task becomes −1.</p>
            </>
          )}
          {err && <Notice tone="error">{err}</Notice>}
        </div>
      </div>
    </section>
  );
}

/* ── Support ──────────────────────────────────────────────────── */

function Support({ items, onChange }: { items: Ticket[]; onChange: () => void }) {
  const [filter, setFilter] = useState("NEW");
  const shown = filter === "ALL" ? items : filter === "NEW" ? items.filter((t) => !t.reply) : items.filter((t) => !!t.reply);
  return (
    <div className="space-y-5">
      <FilterPills value={filter} onChange={setFilter} options={["NEW", "ANSWERED", "ALL"]} />
      {shown.length === 0 ? (
        <EmptyState icon={LifeBuoy} title={filter === "NEW" ? "No unanswered tickets" : "Nothing here"} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">{shown.map((tk) => <TicketCard key={tk.id} tk={tk} onChange={onChange} />)}</div>
      )}
    </div>
  );
}

function TicketCard({ tk, onChange }: { tk: Ticket; onChange: () => void }) {
  const api = useApi();
  const [reply, setReply] = useState("");
  const { busy, err, run } = useAction(onChange);
  return (
    <section className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-ink">{tk.subject}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{tk.ref} · {tk.from?.name ?? "—"} · {when(tk.createdAt)}</p>
        </div>
        <div className="flex gap-1.5">
          {tk.priority === "HIGH" && <StatusBadge status="HIGH" />}
          {tk.from?.role && <StatusBadge status={tk.from.role} />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{tk.body}</p>
        {tk.reply ? (
          <div className="mt-auto rounded-[12px] border border-brand-100 bg-brand-50/60 p-3 text-[12.5px] leading-relaxed text-ink-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">Your reply</span>
            <p className="mt-1 whitespace-pre-wrap">{tk.reply}</p>
          </div>
        ) : (
          <div className="mt-auto space-y-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Answer in the language they wrote in…" className={cn(inputCls, "resize-none")} />
            <Button size="sm" disabled={busy || !reply.trim()} onClick={() => run(() => api.moderator.replyTicket(tk.id, reply.trim()))} icon={<Reply className="size-4" />}>Send reply</Button>
          </div>
        )}
        {err && <Notice tone="error">{err}</Notice>}
      </div>
    </section>
  );
}

/* ── Directory ────────────────────────────────────────────────── */

function Directory({ items, me, onChange }: { items: Account[]; me?: string; onChange: () => void }) {
  const api = useApi();
  const [role, setRole] = useState("ALL");
  const [q, setQ] = useState("");
  const { busy, err, run } = useAction(onChange);
  const shown = useMemo(
    () =>
      items.filter(
        (u) => (role === "ALL" || u.role === role) && (!q.trim() || `${u.name} ${u.email} ${u.clientProfile?.businessName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [items, role, q]
  );

  return (
    <Panel
      title={L("Accounts")}
      desc={L(`${shown.length} of ${items.length}`)}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search accounts" className={cn(inputCls, "w-52 py-2 pl-8")} />
          </div>
          <FilterPills value={role} onChange={setRole} options={["ALL", "CLIENT", "STUDENT", "MODERATOR"]} />
        </div>
      }
    >
      {shown.length === 0 ? (
        <div className="p-5"><EmptyState icon={Users} title="No accounts match" /></div>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-ink">
                  {u.name} <StatusBadge status={u.role} />
                  {u.studentProfile?.kycStatus && <StatusBadge status={u.studentProfile.kycStatus} />}
                  {!u.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">Restricted</span>}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-4">
                  {u.email}
                  {u.clientProfile?.city ? ` · ${u.clientProfile.city}` : ""}
                  {u.studentProfile?.university ? ` · ${u.studentProfile.university}` : ""} · joined {when(u.createdAt)}
                </p>
              </div>
              {u.id !== me && u.role !== "MODERATOR" && (
                <Button size="sm" variant={u.isActive ? "ghost" : "secondary"} disabled={busy} onClick={() => run(() => api.moderator.setUserActive(u.id, !u.isActive))}>
                  {u.isActive ? "Restrict" : "Reactivate"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {err && <div className="p-4"><Notice tone="error">{err}</Notice></div>}
    </Panel>
  );
}

/* ── Controls ─────────────────────────────────────────────────── */

function ControlsView({ controls }: { controls: Controls | null }) {
  if (!controls) return <LoadingRows rows={2} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title={L("Platform rules")} desc={L("These protect students and clients alike")}>
        <ul className="divide-y divide-line">
          {controls.rules.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 px-5 py-4">
              <span className="text-[13px] text-ink">{r.label}</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium", r.locked ? "bg-ink text-white" : "bg-canvas-3 text-ink-3")}>
                {r.locked && <Lock className="size-3" />}
                {r.locked ? "Locked" : "Editable"}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={L("Sector rate floors")} desc={L("The fair-price minimum per hour — a brief more than 25% under is blocked")}>
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
          {Object.entries(controls.rateFloors).map(([k, v]) => (
            <li key={k} className="bg-white px-4 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.06em] text-ink-4">{k}</p>
              <p className="num mt-0.5 text-[16px] font-semibold text-ink">{taka(v)}<span className="text-[11px] font-normal text-ink-4">/h</span></p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ── Shared ───────────────────────────────────────────────────── */

const FILTER_LABEL: Record<string, string> = {
  ALL: "All",
  OPEN: "Open",
  RESOLVED: "Resolved",
  NEW: "Unanswered",
  ANSWERED: "Answered",
  AWAITING: "Awaiting",
  HELD: "Held",
  RELEASED: "Released",
  REFUNDED: "Refunded",
  CLIENT: "Clients",
  STUDENT: "Students",
  MODERATOR: "Moderators",
};

function FilterPills({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1" role="group">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn("rounded-full px-3 py-1.5 text-[12px] ring-1 transition-colors", value === o ? "bg-ink text-white ring-ink" : "bg-white text-ink-3 ring-line hover:text-ink")}
        >
          {FILTER_LABEL[o] ?? o}
        </button>
      ))}
    </div>
  );
}
