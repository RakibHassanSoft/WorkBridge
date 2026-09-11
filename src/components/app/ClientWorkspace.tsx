"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Cpu,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Receipt,
  Scale,
  Send,
  ShieldCheck,
  Timer,
  Wallet,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import TaskChat from "./TaskChat";
import ProfilePhotoCard from "./ProfilePhoto";
import SectorIcon from "@/components/SectorIcon";
import { sectorById } from "@/data/sectors";
import SupportPanel from "./SupportPanel";
import { AttachmentList, AttachmentPicker, EmptyState, Fact, LoadingRows, Notice, Panel, StatCard, StatusBadge, WelcomeBanner, inputCls, taka, useAction, when } from "./parts";
import { Bar, Button } from "@/components/ui";
import { ApiError, type Attachment } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { L } from "@/lib/i18n";
import { useApi, useWorkspaceUser } from "@/lib/workspace";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

/* Response shapes of the client API (see server/src/modules/client). */
type Payment = { id?: string; status: string; amount: number; note?: string | null; method?: string | null; updatedAt?: string; createdAt?: string };
type Evaluation = { scores: { dim: string; score: number; max: number }[]; reviewerNote?: string | null; clientSignoff: boolean; clientNote?: string | null };
type Task = {
  id: string;
  title: string;
  desc: string;
  fee: number;
  hours: number;
  status: string;
  progress?: number;
  skills?: string[];
  acceptance: string[];
  submissionNote?: string | null;
  submissionFiles?: Attachment[] | null;
  payment?: Payment | null;
  trialCheck?: { status: string; clientNote?: string | null } | null;
  trial?: { title: string; brief: string; minutes: number; mirrors?: string | null; acceptance?: string[]; revision?: number } | null;
  trialStats?: { applicants: number; shortlisted: number } | null;
  evaluation?: Evaluation | null;
  assignee?: { id: string; name: string } | null;
};
type Job = {
  id: string;
  ref: string;
  title: string;
  brief: string;
  status: string;
  budget: number;
  scopeApproved?: boolean;
  createdAt?: string;
  aiSummary?: string;
  aiComplexity?: string;
  aiEstHours?: number;
  aiSuggestedFee?: number;
  aiRisks?: string[];
  aiSkills?: string[];
  sector?: { id: string; name: string } | null;
  attachments?: Attachment[] | null;
  tasks: Task[];
};
type PriceVerdict = { level: "ok" | "low" | "blocked"; message: string; rate?: number; floor?: number };
type SpendRow = Payment & { task?: { id: string; title: string; status: string } | null };
type Method = { id: string; kind: string; label: string; isDefault?: boolean };

const NAV_BASE: NavItem[] = [
  { key: "overview", label: L("Overview", "ওভারভিউ"), icon: LayoutDashboard },
  { key: "post", label: L("Post a problem", "সমস্যা পোস্ট করুন"), icon: Plus },
  { key: "jobs", label: L("My problems", "আমার সমস্যা"), icon: Briefcase },
  { key: "review", label: L("Needs your action", "আপনার করণীয়"), icon: ClipboardCheck },
  { key: "spend", label: L("Spend", "খরচ"), icon: Receipt },
  { key: "account", label: L("Payment methods", "পেমেন্ট পদ্ধতি"), icon: Wallet },
  { key: "help", label: L("Help & support", "সহায়তা"), icon: LifeBuoy },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview", "ওভারভিউ"), subtitle: L("Everything that needs you, and nothing that doesn't") },
  post: { title: L("Post a problem", "সমস্যা পোস্ট করুন"), subtitle: L("Write it in your own words. One problem, one price.") },
  jobs: { title: L("My problems", "আমার সমস্যা"), subtitle: L("Each problem, its AI scope, and where it stands") },
  review: { title: L("Needs your action", "আপনার করণীয়"), subtitle: L("Approve the AI's trials, fund escrow and sign off finished work") },
  spend: { title: L("Spend", "খরচ"), subtitle: L("Held in escrow until you sign off") },
  account: { title: L("Payment methods", "পেমেন্ট পদ্ধতি"), subtitle: L("How you fund escrow") },
  help: { title: L("Help & support", "সহায়তা"), subtitle: L("Ask a coordinator anything") },
};

/** What, if anything, the client has to do on this task right now. */
function actionFor(t?: Task) {
  if (!t) return null;
  if (t.status === "CANCELLED") return null;
  if (t.trialCheck?.status === "AWAITING_CLIENT" || t.trialCheck?.status === "CHANGES_ASKED") return "trial";
  if (t.payment?.status === "AWAITING") return "fund";
  if (t.status === "IN_REVIEW" && t.evaluation && !t.evaluation.clientSignoff) return "signoff";
  return null;
}

const ACTION_LABEL: Record<string, string> = { trial: "Check the trial", fund: "Fund escrow", signoff: "Sign off the work" };

export default function ClientWorkspace() {
  const api = useApi();
  const user = useWorkspaceUser();
  const [tab, setTab] = useState("overview");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [payments, setPayments] = useState<SpendRow[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [j, p, m] = await Promise.all([
        api.client.listJobs() as Promise<Job[]>,
        api.client.payments() as Promise<SpendRow[]>,
        api.client.paymentMethods() as Promise<Method[]>,
      ]);
      setJobs(j);
      setPayments(p);
      setMethods(m);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  const todo = jobs.filter((j) => actionFor(j.tasks[0]));
  const nav = NAV_BASE.map((n) => (n.key === "review" ? { ...n, badge: todo.length || undefined } : n));

  return (
    <AppShell
      roleLabel={L("Client workspace", "ক্লায়েন্ট ওয়ার্কস্পেস")}
      userName={user?.name ?? "Client"}
      userMeta={L(user?.email ?? "")}
      nav={nav}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
      actions={
        tab !== "post" ? (
          <Button size="sm" onClick={() => setTab("post")} icon={<Plus className="size-4" />}>
            Post a problem
          </Button>
        ) : undefined
      }
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
          {tab === "overview" && <Overview name={user?.name ?? "there"} jobs={jobs} payments={payments} todo={todo} go={setTab} />}
          {tab === "post" && <PostProblem onPosted={() => { reload(); setTab("review"); }} />}
          {tab === "jobs" && <JobList jobs={jobs} methods={methods} onChange={reload} onPost={() => setTab("post")} />}
          {tab === "review" && (
            todo.length ? (
              <div className="space-y-5">
                {todo.map((j) => <JobCard key={j.id} job={j} methods={methods} onChange={reload} defaultOpen />)}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title="Nothing needs you right now" text="New trials to check, escrow to fund and finished work to sign off will appear here." />
            )
          )}
          {tab === "spend" && <Spend payments={payments} />}
          {tab === "account" && (
            <div className="space-y-4">
              <ProfilePhotoCard name={user?.name ?? "You"} currentUrl={user?.avatarUrl} />
              <Methods methods={methods} onChange={reload} />
            </div>
          )}
          {tab === "help" && <SupportPanel />}
        </>
      )}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({ name, jobs, payments, todo, go }: { name: string; jobs: Job[]; payments: SpendRow[]; todo: Job[]; go: (t: string) => void }) {
  const live = jobs.filter((j) => !["DELIVERED", "CANCELLED"].includes(j.status)).length;
  const delivered = jobs.filter((j) => j.status === "DELIVERED").length;
  const paid = payments.filter((p) => p.status === "RELEASED").reduce((a, p) => a + p.amount, 0);
  const held = payments.filter((p) => p.status === "HELD").reduce((a, p) => a + p.amount, 0);
  const labels = { trial: "Check the AI's trial", fund: "Fund the escrow", signoff: "Sign off delivered work" } as const;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={name}
        eyebrow="Client workspace"
        headline={todo.length ? `${todo.length} thing${todo.length === 1 ? " needs" : "s need"} you.` : "Nothing is waiting on you."}
        action={
          <>
            {todo.length > 0 && <Button variant="secondary" onClick={() => go("review")}>Review now</Button>}
            <Button onClick={() => go("post")} icon={<Plus className="size-4" />}>Post a problem</Button>
          </>
        }
      >
        Describe a problem in plain words — it is saved at once. The AI prices it and builds a small trial of the same work; approve the trial and it goes live. The AI checks every student&apos;s files and only 90%+ work reaches a coordinator. Your money is released only when you sign off.
      </WelcomeBanner>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label={L("Live problems")} value={String(live)} hint={L("scoping, matching or in progress")} />
        <StatCard icon={CheckCircle2} label={L("Delivered")} value={String(delivered)} hint={L("signed off and paid")} tone="brand" />
        <StatCard icon={ShieldCheck} label={L("Held in escrow")} value={taka(held)} hint={L("released on your sign-off")} />
        <StatCard icon={Receipt} label={L("Paid to date")} value={taka(paid)} hint={L("released to students")} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Panel title={L("Needs your action")} desc={L("Oldest first")} action={todo.length ? <Button size="sm" variant="ghost" onClick={() => go("review")}>Open all</Button> : undefined}>
          {todo.length === 0 ? (
            <p className="p-5 text-[13px] text-ink-4">All clear. We will flag anything that needs a decision from you.</p>
          ) : (
            <ul className="divide-y divide-line">
              {todo.map((j) => (
                <li key={j.id}>
                  <button onClick={() => go("review")} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-canvas-2/60">
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{j.title}</span>
                      <span className="mt-0.5 block text-[12px] text-brand-700">{labels[actionFor(j.tasks[0])!]}</span>
                    </span>
                    <CircleDot className="size-4 shrink-0 text-warn" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={L("Your problems")} desc={L("Latest first")} action={<Button size="sm" variant="ghost" onClick={() => go("jobs")}>See all</Button>}>
          {jobs.length === 0 ? (
            <div className="p-5"><EmptyState icon={Briefcase} title="No problems posted yet" text="Post your first problem and the AI will scope it." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {jobs.slice(0, 5).map((j) => {
                const t = j.tasks[0];
                return (
                  <li key={j.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-ink">{j.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-4">{j.ref} · {j.sector?.name ?? "—"} · {taka(t?.fee ?? j.budget)}</p>
                    </div>
                    <StatusBadge status={t?.status === "OPEN" ? j.status : t?.status ?? j.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Post a problem ───────────────────────────────────────────── */

function PostProblem({ onPosted }: { onPosted: () => void }) {
  const api = useApi();
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [result, setResult] = useState<{ job: Job; price: PriceVerdict } | null>(null);
  const { busy, err, run } = useAction();

  const submit = () =>
    run(async () => {
      const res = (await api.client.postJob({ brief: brief.trim(), title: title.trim() || undefined, budget: budget ? Number(budget) : undefined, attachments: files.length ? files : undefined })) as {
        job: Job;
        price: PriceVerdict;
      };
      setResult(res);
    });

  if (result) {
    const task = result.job.tasks[0];
    const price = result.price;
    return (
      <div className="space-y-5">
        <Notice tone="success" className="flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" /> Saved as {result.job.ref} — no approval needed. Check the AI&apos;s trial below; approving it puts your task live on the board.
        </Notice>
        <Panel title={L("The AI's scope")} desc={L("Your brief, organised into one task and a small trial of the same work")} action={<StatusBadge status={result.job.status} />}>
          <div className="space-y-4 p-5">
            <div className="rounded-[14px] border border-brand-100 bg-brand-50/50 p-4">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-700">
                <Cpu className="size-3.5" /> What the AI understood
              </p>
              <p className="mt-1.5 text-[14px] font-medium text-ink">{task.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{result.job.aiSummary}</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-4">
              <Fact label="Fee" value={taka(task.fee)} />
              <Fact label="Estimate" value={`${task.hours} h`} />
              <Fact label="Complexity" value={result.job.aiComplexity ?? "—"} />
              <Fact label="Sector" value={<span className="text-[13px]">{result.job.sector?.name ?? "—"}</span>} />
            </div>
            {!!result.job.attachments?.length && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Documents you attached (read by the AI)</p>
                <div className="mt-2"><AttachmentList attachments={result.job.attachments} /></div>
              </div>
            )}
            {!!result.job.aiRisks?.length && (
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Risks the AI could not resolve</p>
                <ul className="mt-2 space-y-1.5">
                  {result.job.aiRisks.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-3">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {task.trial && <TrialBox trial={task.trial} />}
          </div>
        </Panel>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onPosted}>Check the trial</Button>
          <Button variant="ghost" onClick={() => { setResult(null); setBrief(""); setTitle(""); setBudget(""); }}>Post another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Panel title={L("Describe the problem")} desc={L("Plain words, Bangla or English. Attach any brief, spec or document — the AI reads it, organises it into one task and writes a trial.")}>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 flex justify-between text-[12.5px] font-medium text-ink-2">
              What is going wrong? <span className="font-normal text-ink-4">{brief.trim().length}/10+ characters</span>
            </span>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={7}
              placeholder="e.g. People add items to the basket on our website but the checkout payment keeps failing at the last step…"
              className={cn(inputCls, "resize-none leading-relaxed")}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Title <span className="font-normal text-ink-4">(optional)</span></span>
              <input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="The AI writes one if blank" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Budget in ৳ <span className="font-normal text-ink-4">(optional)</span></span>
              <input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Leave blank for the AI's price" className={inputCls} />
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Attach documents <span className="font-normal text-ink-4">(optional — PDF, Word, spreadsheets, notes)</span></span>
            <AttachmentPicker value={files} onChange={setFiles} />
          </div>
          <Button onClick={submit} disabled={busy || brief.trim().length < 10} icon={<Cpu className="size-4" />}>
            {busy ? "Organising…" : "Organise it with AI"}
          </Button>
          {err && <Notice tone="error">{err}</Notice>}
        </div>
      </Panel>
      <div className="space-y-3 rounded-[16px] border border-line bg-white p-5">
        <p className="text-[13px] font-semibold text-ink">What happens next</p>
        {[
          ["It is saved at once", "No approval step — the AI scopes it into one task with a fixed fee and hours."],
          ["The AI builds a small trial", "The same features as your task at a fraction of the size. Approve it, or ask for changes and the AI rebuilds it."],
          ["Students do the trial; the AI checks their files", "Every requirement is checked. Only students at 90%+ completion are sent to a coordinator."],
          ["Fund escrow; a coordinator picks the student", "The money is held — not paid — and you chat with the student directly."],
          ["You sign off", "Only then is the student paid."],
        ].map(([h, d], i) => (
          <div key={h} className="flex gap-3">
            <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">{i + 1}</span>
            <div>
              <p className="text-[12.5px] font-medium text-ink-2">{h}</p>
              <p className="text-[12px] leading-relaxed text-ink-4">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrialBox({ trial }: { trial: NonNullable<Task["trial"]> }) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-4">
      <p className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">
        <Timer className="size-3.5" /> The trial applicants will do · {trial.minutes} min
        {(trial.revision ?? 1) > 1 && <span className="rounded-full bg-brand-50 px-2 py-0.5 normal-case tracking-normal text-brand-700">Rebuilt · v{trial.revision}</span>}
      </p>
      <p className="mt-1.5 text-[13.5px] font-medium text-ink">{trial.title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{trial.brief}</p>
      {!!trial.acceptance?.length && (
        <div className="mt-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">What the AI checks in each student&apos;s files</p>
          <ol className="mt-1.5 space-y-1">
            {trial.acceptance.map((a, i) => (
              <li key={a} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                <span className="num mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-canvas-3 text-[10px] font-semibold text-ink-3">{i + 1}</span> {a}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11.5px] text-ink-4">A student needs 90% of these done to be sent to a coordinator.</p>
        </div>
      )}
      {trial.mirrors && <p className="mt-2 text-[12px] leading-relaxed text-ink-4"><span className="font-medium text-ink-3">Why this trial: </span>{trial.mirrors}</p>}
    </div>
  );
}

/* ── Jobs ─────────────────────────────────────────────────────── */

function JobList({ jobs, methods, onChange, onPost }: { jobs: Job[]; methods: Method[]; onChange: () => void; onPost: () => void }) {
  if (jobs.length === 0)
    return <EmptyState icon={Briefcase} title="No problems yet" text="Post one and the AI will scope it into a single, fairly priced task." action={<Button size="sm" onClick={onPost}>Post a problem</Button>} />;
  return (
    <div className="space-y-4">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} methods={methods} onChange={onChange} />
      ))}
    </div>
  );
}

const STEPS = ["Trial approved", "Students shortlisted", "Escrow funded", "Student selected", "Work delivered", "Signed off"];
function progressSteps(_job: Job, t: Task) {
  return [
    t.trialCheck?.status === "APPROVED",
    (t.trialStats?.shortlisted ?? 0) > 0 || !!t.assignee,
    ["HELD", "RELEASED"].includes(t.payment?.status ?? ""),
    !!t.assignee,
    ["IN_REVIEW", "APPROVED"].includes(t.status) || !!t.submissionNote,
    t.status === "APPROVED",
  ];
}

function JobCard({ job, methods, onChange, defaultOpen = false }: { job: Job; methods: Method[]; onChange: () => void; defaultOpen?: boolean }) {
  const api = useApi();
  const task = job.tasks[0];
  const [open, setOpen] = useState(defaultOpen);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState<"changes" | "revision" | "dispute" | null>(null);
  const [methodId, setMethodId] = useState(methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? "");
  const { busy, err, run } = useAction(onChange);

  if (!task) return null;
  const tc = task.trialCheck?.status;
  const pay = task.payment?.status;
  const act = actionFor(task);
  const steps = progressSteps(job, task);
  const doneCount = steps.filter(Boolean).length;
  const nextIdx = steps.findIndex((x) => !x);
  const sec = job.sector?.id ? sectorById(job.sector.id) : undefined;
  const cancelled = task.status === "CANCELLED" || job.status === "CANCELLED";
  // Actions that needed a written note close their form once they succeed.
  const followUp = async (fn: () => Promise<unknown>) => {
    if (await run(fn)) {
      setAsking(null);
      setNote("");
    }
  };

  return (
    <section className={cn("overflow-hidden rounded-[16px] border bg-white transition-shadow", act ? "border-brand-200 shadow-[0_0_0_3px_rgba(26,155,102,.06)]" : "border-line")}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-4 text-left">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-[13px] text-white shadow-sm"
          style={{ background: sec?.accent ?? "#0f7f52" }}
          aria-hidden
        >
          {sec ? <SectorIcon name={sec.icon} className="size-5" /> : <Briefcase className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink">{job.title}</h2>
            {act && !cancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                {ACTION_LABEL[act]}
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink-4">
            <span className="num">{job.ref}</span>
            <span>·</span>
            <span>{job.sector?.name ?? "—"}</span>
            <span>·</span>
            <span className="num font-medium text-ink-3">{taka(task.fee)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">posted {when(job.createdAt)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pay && pay !== "RELEASED" && <StatusBadge status={pay} className="hidden sm:inline-flex" />}
          <StatusBadge status={task.status === "OPEN" ? job.status : task.status} />
          <ChevronDown className={cn("size-4 text-ink-4 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {!cancelled && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s}
                title={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  steps[i] ? "bg-brand-500" : i === nextIdx ? "bg-brand-200" : "bg-canvas-3"
                )}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-4">
              <span className="num font-semibold text-ink-3">{doneCount}/{STEPS.length}</span> ·{" "}
              {nextIdx === -1 ? "Signed off & paid" : `Next: ${STEPS[nextIdx]}`}
            </p>
            {task.assignee && <p className="truncate text-[11px] text-ink-4">{task.assignee.name}</p>}
          </div>
        </div>
      )}

      {open && (
        <div className="space-y-5 border-t border-line p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-[12px] border border-line bg-canvas-2/40 p-3.5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Your words</p>
                <p className="mt-1 text-[13px] italic leading-relaxed text-ink-2">&ldquo;{job.brief}&rdquo;</p>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-3">{job.aiSummary}</p>
              <div className="grid grid-cols-3 gap-2.5">
                <Fact label="Fee" value={taka(task.fee)} />
                <Fact label="Estimate" value={`${task.hours} h`} />
                <Fact label="Escrow" value={<StatusBadge status={pay ?? "AWAITING"} />} />
              </div>
              {!!task.acceptance?.length && (
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Done means</p>
                  <ul className="mt-2 space-y-1.5">
                    {task.acceptance.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-[12.5px] text-ink-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" /> {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* 1. trial check — approving puts the task live; changes make the AI rebuild it */}
              {task.trial && (tc === "AWAITING_CLIENT" || tc === "CHANGES_ASKED") && !cancelled && (
                <div className="space-y-3 rounded-[14px] border border-warn/25 bg-warn-bg/40 p-4">
                  <p className="text-[13px] font-medium text-ink">Check the AI&apos;s trial — does it test the same work as your task?</p>
                  <TrialBox trial={task.trial} />
                  {(task.trial.revision ?? 1) > 1 && task.trialCheck?.clientNote && (
                    <Notice tone="info">The AI rebuilt the trial from your note: &ldquo;{task.trialCheck.clientNote}&rdquo;. Approve it when it is right.</Notice>
                  )}
                  {asking === "changes" ? (
                    <div className="space-y-2">
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What should the trial test instead? The AI rebuilds it from your note." className={cn(inputCls, "resize-none")} />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || note.trim().length < 3} onClick={() => followUp(() => api.client.reviewTrial(task.id, "changes", note.trim()))}>{busy ? "Rebuilding…" : "Rebuild the trial"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => run(() => api.client.reviewTrial(task.id, "approve"))} icon={<CheckCircle2 className="size-4" />}>Approve &amp; go live</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAsking("changes")}>Ask for changes</Button>
                    </div>
                  )}
                </div>
              )}

              {/* live on the board: the AI's shortlist, counts only */}
              {task.status === "MATCHING" && (
                <div className="rounded-[14px] border border-brand-200 bg-brand-50/40 p-4">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-ink"><Cpu className="size-4 text-brand-600" /> Live on the task board</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
                    {task.trialStats?.applicants
                      ? `${task.trialStats.applicants} student${task.trialStats.applicants === 1 ? " has" : "s have"} done the trial. The AI checked their files: ${task.trialStats.shortlisted} reached 90%+ and ${task.trialStats.shortlisted === 1 ? "is" : "are"} with a coordinator.`
                      : "Students are doing the trial now. The AI checks every upload and sends only 90%+ work to a coordinator."}
                  </p>
                </div>
              )}

              {/* 2. fund escrow */}
              {pay === "AWAITING" && !cancelled && (
                <div className="space-y-3 rounded-[14px] border border-line p-4">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-ink"><ShieldCheck className="size-4 text-brand-600" /> Fund the escrow — {taka(task.fee)}</p>
                  <p className="text-[12px] leading-relaxed text-ink-4">A coordinator can assign a student only once this is funded. The money is held by the platform and released to the student only when you sign off.</p>
                  {methods.length > 0 && (
                    <select value={methodId} onChange={(e) => setMethodId(e.target.value)} className={cn(inputCls, "py-2")} aria-label="Pay with">
                      {methods.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.kind})</option>)}
                    </select>
                  )}
                  <Button size="sm" disabled={busy} onClick={() => run(() => api.client.deposit(task.id, methodId || undefined))} icon={<Wallet className="size-4" />}>
                    Fund {taka(task.fee)}
                  </Button>
                </div>
              )}

              {/* in progress */}
              {task.assignee && ["IN_PROGRESS", "REVISION", "IN_REVIEW"].includes(task.status) && (
                <div className="rounded-[14px] border border-line p-4">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-ink-2">{task.assignee.name} is working on it</span>
                    <span className="num text-ink-4">{task.progress ?? 0}%</span>
                  </div>
                  <div className="mt-2"><Bar value={task.progress ?? 0} /></div>
                </div>
              )}

              {/* 3. sign off */}
              {task.status === "IN_REVIEW" && task.evaluation && !task.evaluation.clientSignoff && (
                <div className="space-y-3 rounded-[14px] border border-brand-200 bg-brand-50/40 p-4">
                  <p className="text-[13px] font-medium text-ink">Delivered — scored by a coordinator</p>
                  {task.submissionNote && <p className="rounded-[10px] bg-white px-3 py-2 text-[12.5px] leading-relaxed text-ink-3">&ldquo;{task.submissionNote}&rdquo;</p>}
                  {!!task.submissionFiles?.length && <AttachmentList attachments={task.submissionFiles} />}
                  <div className="space-y-1.5">
                    {task.evaluation.scores.map((s) => (
                      <div key={s.dim} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-[12px] text-ink-3">
                        <span>{s.dim}</span><Bar value={(s.score / s.max) * 100} /><span className="num text-right">{s.score}/{s.max}</span>
                      </div>
                    ))}
                  </div>
                  {task.evaluation.reviewerNote && <p className="text-[12px] leading-relaxed text-ink-4">Coordinator: &ldquo;{task.evaluation.reviewerNote}&rdquo;</p>}
                  {asking === "revision" ? (
                    <div className="space-y-2">
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What needs to change? The escrow stays held." className={cn(inputCls, "resize-none")} />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || note.trim().length < 3} onClick={() => followUp(() => api.client.signOff(task.id, "revision", note.trim()))}>Request revision</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => run(() => api.client.signOff(task.id, "accept"))} icon={<CheckCircle2 className="size-4" />}>Accept &amp; release {taka(task.fee)}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAsking("revision")}>Request revision</Button>
                    </div>
                  )}
                </div>
              )}

              {task.status === "APPROVED" && <Notice tone="success">Signed off — {taka(task.fee)} released to {task.assignee?.name ?? "the student"}.</Notice>}
              {cancelled && <Notice tone="info">This problem was cancelled. Any held escrow was refunded.</Notice>}

              {err && <Notice tone="error">{err}</Notice>}
            </div>
          </div>

          {task.assignee && !cancelled && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <TaskChat taskId={task.id} as="client" />
              {["IN_PROGRESS", "IN_REVIEW", "REVISION"].includes(task.status) && (
                <div className="self-start rounded-[14px] border border-line p-4">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-ink"><Scale className="size-4 text-ink-4" /> Problem with the delivery?</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-4">A coordinator reads both sides and rules on the escrow. Try the chat first.</p>
                  {asking === "dispute" ? (
                    <div className="mt-3 space-y-2">
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What is wrong, specifically?" className={cn(inputCls, "resize-none")} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="dark" disabled={busy || note.trim().length < 5} onClick={() => followUp(() => api.client.dispute(task.id, note.trim(), task.fee))}>Open dispute</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAsking("dispute")}>Raise a dispute</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Spend & payment methods ─────────────────────────────────── */

function Spend({ payments }: { payments: SpendRow[] }) {
  const sum = (s: string) => payments.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label={L("Held in escrow")} value={taka(sum("HELD"))} hint={L("waiting for your sign-off")} />
        <StatCard icon={Receipt} label={L("Released")} value={taka(sum("RELEASED"))} hint={L("paid to students")} tone="ink" />
        <StatCard icon={Wallet} label={L("Awaiting deposit")} value={taka(sum("AWAITING"))} hint={L("fund so a student can be assigned")} tone="brand" />
      </div>
      <Panel title={L("Escrow ledger")} desc={L("Every task and where its money is")}>
        {payments.length === 0 ? (
          <div className="p-5"><EmptyState icon={Receipt} title="No spend yet" text="Fund a task and it appears here." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-ink-4">
                  <th className="px-5 py-3 font-semibold">Task</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p, i) => (
                  <tr key={p.id ?? i}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{p.task?.title ?? "Task"}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-4">{p.note} · {when(p.updatedAt ?? p.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-3.5 text-ink-3">{p.method ?? "—"}</td>
                    <td className="num px-5 py-3.5 text-right font-semibold text-ink">{taka(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Methods({ methods, onChange }: { methods: Method[]; onChange: () => void }) {
  const api = useApi();
  const [kind, setKind] = useState("bkash");
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const { busy, err, run } = useAction(onChange);

  const add = async () => {
    if (await run(() => api.client.addPaymentMethod({ kind, label: label.trim(), isDefault }))) {
      setLabel("");
      setIsDefault(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Panel title={L("Your payment methods")} desc={L("Used when you fund escrow")}>
        {methods.length === 0 ? (
          <div className="p-5"><EmptyState icon={CreditCard} title="No payment method yet" text="Add bKash, Nagad, a bank account or a card." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-canvas-3 text-ink-3"><CreditCard className="size-4" /></span>
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{m.label}</p>
                    <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{m.kind}</p>
                  </div>
                </div>
                {m.isDefault && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">Default</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={L("Add a method")} desc={L("bKash, Nagad, bank or card")}>
        <div className="space-y-3.5 p-5">
          <div className="grid grid-cols-4 gap-1.5">
            {[["bkash", "bKash"], ["nagad", "Nagad"], ["bank", "Bank"], ["card", "Card"]].map(([k, n]) => (
              <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={cn("rounded-[10px] py-2 text-[12.5px] ring-1 transition-colors", kind === k ? "bg-ink text-white ring-ink" : "bg-white text-ink-3 ring-line hover:text-ink")}>
                {n}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. bKash merchant 01XXXXXXXXX" className={inputCls} />
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 accent-brand-600" />
            Make this my default
          </label>
          <Button onClick={add} disabled={busy || label.trim().length < 2} icon={<Send className="size-4" />}>{busy ? "Adding…" : "Add method"}</Button>
          {err && <Notice tone="error">{err}</Notice>}
        </div>
      </Panel>
    </div>
  );
}
