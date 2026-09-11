"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Send,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import TaskChat from "./TaskChat";
import ProfilePhotoCard from "./ProfilePhoto";
import SupportPanel from "./SupportPanel";
import { AttachmentList, AttachmentPicker, AttemptBadge, Checklist, EmptyState, Fact, LoadingRows, Notice, Panel, SHORTLIST_BAR, StatCard, StatusBadge, WelcomeBanner, inputCls, taka, useAction, when, type ChecklistRow } from "./parts";
import { Bar, Button } from "@/components/ui";
import { ApiError, type Attachment } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { L } from "@/lib/i18n";
import { useApi, useWorkspaceUser } from "@/lib/workspace";

const L = (en: string, bn?: string): L => ({ en, bn: bn ?? en });

/* Response shapes of the student API (see server/src/modules/student). */
type Sector = { id: string; name: string } | null;
type Trial = { title: string; brief: string; minutes: number; mirrors?: string | null; acceptance?: string[] } | null;
type Task = {
  id: string;
  title: string;
  desc: string;
  fee: number;
  hours: number;
  level?: string;
  status: string;
  skills?: string[];
  acceptance?: string[];
  applied?: boolean;
  progress?: number;
  submissionNote?: string | null;
  submissionFiles?: Attachment[] | null;
  updatedAt?: string;
  createdAt?: string;
  sector?: Sector;
  trial?: Trial;
  job?: { ref: string; brief?: string } | null;
  payment?: { status: string } | null;
  evaluation?: { scores: { dim: string; score: number; max: number }[]; reviewerNote?: string | null; clientSignoff: boolean; clientNote?: string | null } | null;
};
type Attempt = {
  id: string;
  aiScore: number;
  completion?: number;
  checklist?: ChecklistRow[] | null;
  aiFlags?: string[];
  rank?: number | null;
  aiVerdict?: string;
  aiCoaching?: string;
  outcome: string;
  points: number;
  pointsReason?: string | null;
  minutesTaken: number;
  submittedAt: string;
  attachments?: Attachment[];
  task?: { id: string; title: string; status: string } | null;
};
type PointEntry = { id: string; delta: number; reason: string; createdAt: string; task?: { title: string } | null };
type Kyc = { status: string; submission?: { status: string; note?: string | null; documents?: { label: string; detail: string; ok: boolean }[]; createdAt?: string } | null };
type Earnings = { total: number; payments: { id?: string; amount: number; updatedAt?: string; task?: { title: string } | null }[] };
type Profile = { name: string; email: string; studentProfile?: { university?: string | null; discipline?: string | null; year?: string | null; city?: string | null; skills?: string[]; bio?: string | null; kycStatus?: string } | null };

const NAV_BASE: NavItem[] = [
  { key: "overview", label: L("Overview", "ওভারভিউ"), icon: LayoutDashboard },
  { key: "find", label: L("Find tasks", "টাস্ক খুঁজুন"), icon: Search },
  { key: "trials", label: L("Trials & points", "ট্রায়াল ও পয়েন্ট"), icon: ClipboardCheck },
  { key: "active", label: L("Active work", "চলমান কাজ"), icon: ClipboardList },
  { key: "record", label: L("Verified record", "যাচাইকৃত রেকর্ড"), icon: BadgeCheck },
  { key: "earnings", label: L("Earnings", "আয়"), icon: Banknote },
  { key: "account", label: L("Profile & verification", "প্রোফাইল ও যাচাই"), icon: IdCard },
  { key: "help", label: L("Help & support", "সহায়তা"), icon: LifeBuoy },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: L("Overview", "ওভারভিউ"), subtitle: L("Where you are, and what happens next") },
  find: { title: L("Find tasks", "টাস্ক খুঁজুন"), subtitle: L("Apply by doing a short trial — not by writing a pitch") },
  trials: { title: L("Trials & points", "ট্রায়াল ও পয়েন্ট"), subtitle: L("Trying never costs you: +1 for every trial you are not selected for") },
  active: { title: L("Active work", "চলমান কাজ"), subtitle: L("The tasks you were selected for") },
  record: { title: L("Verified record", "যাচাইকৃত রেকর্ড"), subtitle: L("Scored by a coordinator, signed off by the business") },
  earnings: { title: L("Earnings", "আয়"), subtitle: L("Released to you when the client signs off") },
  account: { title: L("Profile & verification", "প্রোফাইল ও যাচাই"), subtitle: L("Verification unlocks trials") },
  help: { title: L("Help & support", "সহায়তা"), subtitle: L("Ask a coordinator anything") },
};

export default function StudentWorkspace() {
  const api = useApi();
  const user = useWorkspaceUser();
  const [tab, setTab] = useState("overview");
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trials, setTrials] = useState<Attempt[]>([]);
  const [points, setPoints] = useState<{ total: number; entries: PointEntry[] }>({ total: 0, entries: [] });
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [record, setRecord] = useState<Task[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({ total: 0, payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [k, tk, tr, pt, ac, rc, ea] = await Promise.all([
        api.student.kyc() as Promise<Kyc>,
        api.student.browse() as Promise<Task[]>,
        api.student.trials() as Promise<Attempt[]>,
        api.student.points() as Promise<{ total: number; entries: PointEntry[] }>,
        api.student.active() as Promise<Task[]>,
        api.student.record() as Promise<Task[]>,
        api.student.earnings() as Promise<Earnings>,
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
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  const verified = kyc?.status === "VERIFIED";
  const openToApply = tasks.filter((t) => !t.applied).length;
  // Attempts the AI shortlisted that a coordinator has not decided yet.
  const pending = trials.filter((a) => a.outcome === "SHORTLISTED" || a.outcome === "PENDING").length;
  const nav = NAV_BASE.map((n) =>
    n.key === "find" ? { ...n, badge: openToApply || undefined } : n.key === "active" ? { ...n, badge: activeTasks.length || undefined } : n
  );

  return (
    <AppShell
      roleLabel={L("Student workspace", "শিক্ষার্থী ওয়ার্কস্পেস")}
      userName={user?.name ?? "Student"}
      userMeta={L(user?.email ?? "")}
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
          {!verified && tab !== "account" && tab !== "help" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-warn/20 bg-warn-bg px-4 py-3 text-[13px] text-warn">
              <span className="flex items-center gap-2">
                <IdCard className="size-4 shrink-0" />
                {kyc?.submission?.status === "PENDING"
                  ? "Your documents are with a coordinator. You can browse now and apply once you are verified."
                  : "Verify your account to start applying — it takes one recommendation letter."}
              </span>
              {kyc?.submission?.status !== "PENDING" && (
                <Button size="sm" variant="secondary" onClick={() => setTab("account")}>Verify now</Button>
              )}
            </div>
          )}

          {tab === "overview" && (
            <Overview
              name={user?.name ?? "there"}
              verified={verified}
              points={points.total}
              active={activeTasks}
              open={tasks}
              pending={pending}
              earned={earnings.total}
              go={setTab}
            />
          )}
          {tab === "find" && <FindTasks tasks={tasks} verified={verified} onChange={reload} />}
          {tab === "trials" && <Trials trials={trials} points={points} />}
          {tab === "active" && <Active tasks={activeTasks} onChange={reload} onFind={() => setTab("find")} />}
          {tab === "record" && <Record record={record} />}
          {tab === "earnings" && <EarningsView earnings={earnings} />}
          {tab === "account" && <Account kyc={kyc} onChange={reload} />}
          {tab === "help" && <SupportPanel />}
        </>
      )}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({
  name,
  verified,
  points,
  active,
  open,
  pending,
  earned,
  go,
}: {
  name: string;
  verified: boolean;
  points: number;
  active: Task[];
  open: Task[];
  pending: number;
  earned: number;
  go: (k: string) => void;
}) {
  const fresh = open.filter((t) => !t.applied).length;
  const headline = active.length
    ? `You have ${active.length} task${active.length === 1 ? "" : "s"} in progress.`
    : fresh
      ? `${fresh} task${fresh === 1 ? " is" : "s are"} open for a trial.`
      : "You're all caught up.";
  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={name}
        eyebrow="Student workspace"
        headline={headline}
        action={
          active.length ? (
            <Button variant="secondary" onClick={() => go("active")}>Open active work</Button>
          ) : (
            <Button variant="secondary" onClick={() => go("find")}>Find a task</Button>
          )
        }
      >
        Every trial you try earns a point, even when you are not selected. Every delivered task becomes verified proof on your record.
      </WelcomeBanner>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BadgeCheck} label={L("Verification")} value={verified ? "Verified" : "Not yet"} hint={L(verified ? "you can apply to tasks" : "needed before a trial")} tone={verified ? "brand" : "default"} />
        <StatCard icon={Star} label={L("Points")} value={String(points)} hint={L(pending ? `${pending} shortlisted trial${pending === 1 ? "" : "s"} with a coordinator` : "+1 for every trial you try")} />
        <StatCard icon={ClipboardList} label={L("Active work")} value={String(active.length)} hint={L("tasks you were selected for")} />
        <StatCard icon={Banknote} label={L("Earned")} value={taka(earned)} hint={L("released to you")} tone="ink" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={L("Your active work")} desc={L("Keep the client posted as you go")} action={<Button size="sm" variant="ghost" onClick={() => go("active")}>Open</Button>}>
          {active.length === 0 ? (
            <p className="p-5 text-[13px] leading-relaxed text-ink-4">Nothing assigned yet. Do a trial — a coordinator picks from the AI&apos;s ranking.</p>
          ) : (
            <ul className="divide-y divide-line">
              {active.map((tk) => (
                <li key={tk.id} className="space-y-2.5 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13.5px] font-medium text-ink">{tk.title}</p>
                    <StatusBadge status={tk.status} />
                  </div>
                  <Bar value={tk.progress ?? 0} />
                  <p className="text-[12px] text-ink-4">{tk.job?.ref} · {tk.progress ?? 0}% done</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={L("Open tasks to try")} desc={L("Apply by doing a short trial")} action={<Button size="sm" variant="ghost" onClick={() => go("find")}>Find tasks</Button>}>
          {open.length === 0 ? (
            <p className="p-5 text-[13px] text-ink-4">No open tasks right now. New briefs arrive most working days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {open.slice(0, 4).map((tk) => (
                <li key={tk.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{tk.title}</p>
                    <p className="mt-0.5 text-[12px] text-ink-4">{tk.sector?.name ?? "—"} · {taka(tk.fee)} · {tk.hours}h</p>
                  </div>
                  {tk.applied ? <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">Applied</span> : <span className="shrink-0 text-[12px] text-ink-4">{tk.trial?.minutes ?? 30} min trial</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Find tasks ───────────────────────────────────────────────── */

function FindTasks({ tasks, verified, onChange }: { tasks: Task[]; verified: boolean; onChange: () => void }) {
  const [sector, setSector] = useState("all");
  const sectors = useMemo(() => {
    const m = new Map<string, string>();
    tasks.forEach((t) => t.sector && m.set(t.sector.id, t.sector.name));
    return [...m.entries()];
  }, [tasks]);
  const shown = sector === "all" ? tasks : tasks.filter((t) => t.sector?.id === sector);

  if (tasks.length === 0)
    return <EmptyState icon={Search} title="No open tasks right now" text="Tasks appear here once a business has funded them and a coordinator has released the scope." />;

  return (
    <div className="space-y-5">
      {sectors.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {[["all", "All sectors"] as [string, string], ...sectors].map(([id, name]) => (
            <button
              key={id}
              onClick={() => setSector(id)}
              className={cn("rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition-colors", sector === id ? "bg-ink text-white ring-ink" : "bg-white text-ink-3 ring-line hover:text-ink")}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {shown.map((tk) => (
        <TaskApply key={tk.id} task={tk} verified={verified} onChange={onChange} />
      ))}
    </div>
  );
}

function TaskApply({ task, verified, onChange }: { task: Task; verified: boolean; onChange: () => void }) {
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [mins, setMins] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [result, setResult] = useState<Attempt | null>(null);
  const { busy, err, run } = useAction(onChange);
  const minutes = Number(mins) || task.trial?.minutes || 30;
  const submit = () =>
    run(async () => {
      setResult((await api.student.apply(task.id, summary.trim(), Math.min(600, minutes), files)) as Attempt);
    });

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{task.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{task.job?.ref} · {task.sector?.name ?? "—"} · posted {when(task.createdAt)}</p>
        </div>
        {task.applied ? <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">Applied</span> : <StatusBadge status={task.status} />}
      </div>
      <div className="space-y-4 p-5">
        <p className="text-[13.5px] leading-relaxed text-ink-3">{task.desc}</p>
        <div className="grid grid-cols-3 gap-2.5">
          <Fact label="Fee" value={taka(task.fee)} />
          <Fact label="Estimate" value={`${task.hours} h`} />
          <Fact label="Level" value={<span className="capitalize">{(task.level ?? "standard").toLowerCase()}</span>} />
        </div>
        {!!task.skills?.length && (
          <div className="flex flex-wrap gap-1.5">
            {task.skills.map((s) => (
              <span key={s} className="rounded-md bg-canvas-2 px-2 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">{s}</span>
            ))}
          </div>
        )}
        {task.trial && (
          <div className="rounded-[14px] border border-brand-100 bg-brand-50/50 p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-700">
              <Timer className="size-3.5" /> The trial · {task.trial.minutes} minutes
            </p>
            <p className="mt-1.5 text-[13.5px] font-medium text-ink">{task.trial.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{task.trial.brief}</p>
            {!!task.trial.acceptance?.length && (
              <>
                <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">The AI checks each of these in your files</p>
                <ul className="mt-1.5 space-y-1.5">
                  {task.trial.acceptance.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[12.5px] text-ink-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" /> {a}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11.5px] text-ink-4">Reach {SHORTLIST_BAR}% completion and the AI sends your trial to a coordinator, ranked against the others.</p>
              </>
            )}
          </div>
        )}

        {result ? (
          <div className={cn("space-y-3 rounded-[14px] border p-4", result.outcome === "SHORTLISTED" ? "border-brand-200 bg-brand-50/40" : "border-warn/25 bg-warn-bg/40")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-medium text-ink">
                {result.outcome === "SHORTLISTED"
                  ? `Shortlisted${result.rank ? ` — ranked #${result.rank}` : ""}. Your trial is with a coordinator.`
                  : `Below the ${SHORTLIST_BAR}% bar — this trial will not reach a coordinator.`}
              </p>
              <AttemptBadge a={result} />
            </div>
            <Checklist completion={result.completion ?? 0} rows={result.checklist} flags={result.aiFlags} />
            {result.aiCoaching && <p className="rounded-[10px] bg-white px-3 py-2 text-[12px] leading-relaxed text-ink-3"><span className="font-medium text-ink-2">Coaching (only you see this): </span>{result.aiCoaching}</p>}
          </div>
        ) : task.applied ? (
          <Notice tone="success">Trial submitted and checked by the AI — see your completion and checklist in Trials &amp; points.</Notice>
        ) : !verified ? (
          <p className="text-[12.5px] text-warn">Verify your account to apply to this task.</p>
        ) : !open ? (
          <Button onClick={() => setOpen(true)} icon={<Sparkles className="size-4" />}>Do the trial to apply</Button>
        ) : (
          <div className="space-y-3 rounded-[14px] border border-line p-4">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">What did you produce?</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={5}
                placeholder="Describe the work, link to it if you can, and flag anything in the brief that was unclear instead of guessing."
                className={cn(inputCls, "resize-none leading-relaxed")}
              />
            </label>
            <div>
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Upload what you produced <span className="font-normal text-ink-4">— the AI checks every requirement against these files (images and PDFs too)</span></span>
              <AttachmentPicker value={files} onChange={setFiles} />
              {files.length === 0 && <p className="mt-1.5 text-[11.5px] text-warn">Without files a trial cannot reach {SHORTLIST_BAR}% — describing the work is not the work.</p>}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Minutes taken</span>
                <input
                  inputMode="numeric"
                  value={mins}
                  onChange={(e) => setMins(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder={String(task.trial?.minutes ?? 30)}
                  className={cn(inputCls, "w-32")}
                />
              </label>
              <Button onClick={submit} disabled={busy || summary.trim().length < 10} icon={<Send className="size-4" />}>
                {busy ? "The AI is checking your files…" : "Submit trial"}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
            <p className="text-[11.5px] text-ink-4">
              {summary.trim().length < 10 ? "Write at least a sentence. " : ""}One attempt per task. The AI rewards flagging what the brief left unclear instead of guessing.
            </p>
            {err && <Notice tone="error">{err}</Notice>}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Trials & points ─────────────────────────────────────────── */

function Trials({ trials, points }: { trials: Attempt[]; points: { total: number; entries: PointEntry[] } }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Star} label={L("Points balance")} value={String(points.total)} hint={L("+1 tried · 0 selected · −1 not delivered")} tone="brand" />
        <StatCard icon={ClipboardCheck} label={L("Trials done")} value={String(trials.length)} hint={L("applications by trial")} />
        <StatCard icon={TrendingUp} label={L("Shortlisted")} value={trials.length ? `${trials.filter((a) => (a.completion ?? 0) >= SHORTLIST_BAR || a.outcome === "SELECTED").length}/${trials.length}` : "—"} hint={L(`reached the ${SHORTLIST_BAR}% bar`)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={L("Your trials")} desc={L(`What the AI found in your files, and what to do better next time`)}>
          {trials.length === 0 ? (
            <div className="p-5"><EmptyState icon={ClipboardCheck} title="No trials yet" text="Find a task and apply by doing its short trial." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {trials.map((a) => (
                <li key={a.id} className="space-y-2.5 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium text-ink">{a.task?.title ?? "Task"}</p>
                    <AttemptBadge a={a} />
                  </div>
                  {typeof a.completion === "number" && (a.checklist?.length ?? 0) > 0 ? (
                    <Checklist completion={a.completion} rows={a.checklist} flags={a.aiFlags} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><Bar value={a.aiScore} /></div>
                      <span className="num text-[12.5px] font-semibold text-ink">{a.aiScore}/100</span>
                    </div>
                  )}
                  <p className="text-[11.5px] text-ink-4">Quality score {a.aiScore}/100</p>
                  {a.aiVerdict && <p className="text-[12.5px] leading-relaxed text-ink-3">{a.aiVerdict}</p>}
                  {a.aiCoaching && <p className="rounded-[10px] bg-canvas-2 px-3 py-2 text-[12px] leading-relaxed text-ink-3"><span className="font-medium text-ink-2">Coaching: </span>{a.aiCoaching}</p>}
                  {!!a.attachments?.length && <AttachmentList attachments={a.attachments} />}
                  <p className="text-[11.5px] text-ink-4">{a.minutesTaken} min · {when(a.submittedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={L("Points history")} desc={L("Every change, and why")}>
          {points.entries.length === 0 ? (
            <p className="p-5 text-[13px] text-ink-4">Points appear once a coordinator decides a trial round.</p>
          ) : (
            <ul className="divide-y divide-line">
              {points.entries.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink">{p.task?.title ?? "Task"}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-ink-4">{p.reason}</p>
                  </div>
                  <span className={cn("num shrink-0 text-[13px] font-semibold", p.delta > 0 ? "text-brand-600" : p.delta < 0 ? "text-red-600" : "text-ink-3")}>
                    {p.delta > 0 ? `+${p.delta}` : p.delta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Active work ─────────────────────────────────────────────── */

function Active({ tasks, onChange, onFind }: { tasks: Task[]; onChange: () => void; onFind: () => void }) {
  if (tasks.length === 0)
    return (
      <EmptyState
        icon={ClipboardList}
        title="No active work"
        text="When a coordinator selects you from a trial round, the task appears here with a chat to the client."
        action={<Button size="sm" onClick={onFind}>Find tasks</Button>}
      />
    );
  return (
    <div className="space-y-6">
      {tasks.map((tk) => (
        <ActiveCard key={tk.id} task={tk} onChange={onChange} />
      ))}
    </div>
  );
}

function ActiveCard({ task, onChange }: { task: Task; onChange: () => void }) {
  const api = useApi();
  const [note, setNote] = useState(task.submissionNote ?? "");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [prog, setProg] = useState(task.progress ?? 0);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [claim, setClaim] = useState("");
  const progress = useAction(onChange);
  const submit = useAction(onChange);
  const dispute = useAction(onChange);
  const inReview = task.status === "IN_REVIEW";

  return (
    <section className="overflow-hidden rounded-[16px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{task.title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-4">{task.job?.ref} · {task.sector?.name ?? "—"} · {taka(task.fee)} · {task.hours} h</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {task.job?.brief && (
            <div className="rounded-[12px] border border-line bg-canvas-2/40 p-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">The client&apos;s words</p>
              <p className="mt-1 text-[13px] italic leading-relaxed text-ink-2">&ldquo;{task.job.brief}&rdquo;</p>
            </div>
          )}
          <p className="text-[13px] leading-relaxed text-ink-3">{task.desc}</p>
          {!!task.acceptance?.length && (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">Done means</p>
              <ul className="mt-2 space-y-1.5">
                {task.acceptance.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-[12.5px] text-ink-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-500" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.status === "REVISION" && <Notice tone="warn">The client asked for a revision. Update the work, then submit it again.</Notice>}

          {/* progress */}
          {!inReview && (
            <div className="rounded-[14px] border border-line p-4">
              <div className="flex items-center justify-between text-[12.5px] font-medium text-ink-2">
                <span>Progress</span>
                <span className="num">{prog}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={prog}
                onChange={(e) => setProg(Number(e.target.value))}
                aria-label="Progress"
                className="mt-2 w-full accent-brand-600"
              />
              <div className="mt-2 flex items-center gap-3">
                <Button size="sm" variant="secondary" disabled={progress.busy || prog === (task.progress ?? 0)} onClick={() => progress.run(() => api.student.progress(task.id, prog))}>
                  {progress.busy ? "Saving…" : "Update progress"}
                </Button>
                <span className="text-[11.5px] text-ink-4">The client sees this on their dashboard.</span>
              </div>
              {progress.err && <Notice tone="error" className="mt-3">{progress.err}</Notice>}
            </div>
          )}

          {/* submit */}
          {inReview ? (
            <Notice tone="info">
              Submitted {when(task.updatedAt)} — waiting for a coordinator&apos;s score and the client&apos;s sign-off.
              {task.submissionNote && <span className="mt-1 block text-ink-3">&ldquo;{task.submissionNote}&rdquo;</span>}
              {!!task.submissionFiles?.length && <div className="mt-2"><AttachmentList attachments={task.submissionFiles} /></div>}
            </Notice>
          ) : (
            <div className="space-y-2.5 rounded-[14px] border border-line p-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Deliver the work</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What are you delivering? Anything the client and coordinator should check." className={cn(inputCls, "resize-none leading-relaxed")} />
              </label>
              <div>
                <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Upload the deliverable <span className="font-normal text-ink-4">— files</span></span>
                <AttachmentPicker value={files} onChange={setFiles} />
              </div>
              <Button disabled={submit.busy || note.trim().length < 5} onClick={() => submit.run(() => api.student.submit(task.id, note.trim(), files))} icon={<Send className="size-4" />}>
                {submit.busy ? "Submitting…" : "Submit for review"}
              </Button>
              {submit.err && <Notice tone="error">{submit.err}</Notice>}
            </div>
          )}

          {/* dispute */}
          <div>
            {!disputeOpen ? (
              <button onClick={() => setDisputeOpen(true)} className="text-[12px] text-ink-4 underline-offset-2 hover:text-ink hover:underline">
                Something wrong with this task? Raise a dispute
              </button>
            ) : (
              <div className="space-y-2.5 rounded-[14px] border border-red-200 bg-red-50/40 p-4">
                <p className="text-[12.5px] font-medium text-ink-2">Raise a dispute — a coordinator will rule on it</p>
                <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={3} placeholder="What happened? Be specific — the coordinator reads both sides." className={cn(inputCls, "resize-none")} />
                <div className="flex gap-2">
                  <Button size="sm" variant="dark" disabled={dispute.busy || claim.trim().length < 5} onClick={async () => { if (await dispute.run(() => api.student.dispute(task.id, claim.trim(), task.fee))) setDisputeOpen(false); }}>
                    {dispute.busy ? "Sending…" : "Open dispute"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDisputeOpen(false)}>Cancel</Button>
                </div>
                {dispute.err && <Notice tone="error">{dispute.err}</Notice>}
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <TaskChat taskId={task.id} as="student" />
        </div>
      </div>
    </section>
  );
}

/* ── Record & earnings ───────────────────────────────────────── */

function Record({ record }: { record: Task[] }) {
  if (record.length === 0)
    return <EmptyState icon={BadgeCheck} title="No verified work yet" text="Work that is scored by a coordinator and signed off by the client becomes part of your permanent record." />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {record.map((r) => {
        const ev = r.evaluation;
        const total = ev?.scores.reduce((s, x) => s + x.score, 0) ?? 0;
        const max = ev?.scores.reduce((s, x) => s + x.max, 0) ?? 0;
        return (
          <section key={r.id} className="rounded-[16px] border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[14.5px] font-semibold text-ink">{r.title}</h2>
                <p className="mt-0.5 text-[12px] text-ink-4">{r.sector?.name ?? ""} · {r.job?.ref ?? ""}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <BadgeCheck className="size-3" /> Verified
              </span>
            </div>
            {ev && (
              <>
                <div className="mt-4 space-y-2">
                  {ev.scores.map((s) => (
                    <div key={s.dim} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-[12px] text-ink-3">
                      <span>{s.dim}</span>
                      <Bar value={(s.score / s.max) * 100} />
                      <span className="num text-right text-ink-2">{s.score}/{s.max}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-ink-4">Coordinator score <span className="num font-semibold text-ink">{total}/{max}</span></p>
                {ev.reviewerNote && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">&ldquo;{ev.reviewerNote}&rdquo;</p>}
                {ev.clientNote && <p className="mt-2 rounded-[10px] bg-brand-50/70 px-3 py-2 text-[12.5px] text-ink-2"><span className="font-medium">Client: </span>{ev.clientNote}</p>}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EarningsView({ earnings }: { earnings: Earnings }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Banknote} label={L("Total earned")} value={taka(earnings.total)} hint={L("released on client sign-off")} tone="ink" />
        <StatCard icon={CheckCircle2} label={L("Paid tasks")} value={String(earnings.payments.length)} hint={L("each one on your record")} tone="brand" />
      </div>
      <Panel title={L("Payments")} desc={L("Released to you")}>
        {earnings.payments.length === 0 ? (
          <div className="p-5"><EmptyState icon={Banknote} title="No earnings yet" text="The fee is held in escrow while you work and released the moment the client signs off." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {earnings.payments.map((p, i) => (
              <li key={p.id ?? i} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] text-ink">{p.task?.title ?? "Task"}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-4"><Clock3 className="size-3" /> {when(p.updatedAt)}</p>
                </div>
                <span className="num text-[14px] font-semibold text-brand-700">+{taka(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ── Profile & verification ──────────────────────────────────── */

const DOC_LABELS = ["Recommendation letter", "Student ID card", "Transcript / certificate", "NID", "Payout account"];

function Account({ kyc, onChange }: { kyc: Kyc | null; onChange: () => void }) {
  const user = useWorkspaceUser();
  return (
    <div className="space-y-6">
      <ProfilePhotoCard name={user?.name ?? "You"} currentUrl={user?.avatarUrl} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <Verification kyc={kyc} onChange={onChange} />
      </div>
    </div>
  );
}

function ProfileForm() {
  const api = useApi();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ university: "", discipline: "", year: "", city: "", skills: "", bio: "" });
  const [saved, setSaved] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const { busy, err, run } = useAction();

  useEffect(() => {
    (api.student.profile() as Promise<Profile>)
      .then((p) => {
        setProfile(p);
        const sp = p.studentProfile ?? {};
        setForm({ university: sp.university ?? "", discipline: sp.discipline ?? "", year: sp.year ?? "", city: sp.city ?? "", skills: (sp.skills ?? []).join(", "), bio: sp.bio ?? "" });
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "Could not load your profile"));
  }, [api]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };
  const save = async () => {
    const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const ok = await run(() => api.student.updateProfile({ university: form.university, discipline: form.discipline, year: form.year, city: form.city, skills, bio: form.bio }));
    if (ok) setSaved(true);
  };

  return (
    <Panel title={L("Your profile")} desc={L("What clients and coordinators see next to your trials")}>
      <div className="space-y-3.5 p-5">
        {loadErr && <Notice tone="error">{loadErr}</Notice>}
        {!profile && !loadErr ? (
          <LoadingRows rows={2} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["university", "University"],
                  ["discipline", "Discipline"],
                  ["year", "Year"],
                  ["city", "City"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">{label}</span>
                  <input value={form[k]} onChange={set(k)} className={inputCls} />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Skills <span className="font-normal text-ink-4">— separate with commas</span></span>
              <input value={form.skills} onChange={set("skills")} placeholder="e.g. Excel, Bangla copywriting, React" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">About you</span>
              <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={2000} className={cn(inputCls, "resize-none leading-relaxed")} />
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
              {saved && <span className="flex items-center gap-1 text-[12.5px] text-brand-700"><CheckCircle2 className="size-4" /> Saved</span>}
            </div>
            {err && <Notice tone="error">{err}</Notice>}
          </>
        )}
      </div>
    </Panel>
  );
}

function Verification({ kyc, onChange }: { kyc: Kyc | null; onChange: () => void }) {
  const api = useApi();
  const { busy, err, run } = useAction(onChange);
  const status = kyc?.status ?? "PENDING";
  const sub = kyc?.submission;
  // Documents already sent and waiting for a coordinator — nothing to resubmit.
  const inReview = status !== "VERIFIED" && sub?.status === "PENDING";
  const docs = sub?.documents?.length ? sub.documents : DOC_LABELS.map((label) => ({ label, detail: "", ok: false }));

  return (
    <Panel title={L("Verification")} desc={L("A coordinator reads your recommendation letter and confirms by phone")} action={<StatusBadge status={inReview ? "PENDING" : status} />}>
      <div className="space-y-4 p-5">
        <Notice tone={status === "VERIFIED" ? "success" : status === "REJECTED" ? "error" : "warn"}>
          {status === "VERIFIED" && "You are verified — you can apply to any open task."}
          {status === "REJECTED" && "Your last submission was not accepted. Check the note below and submit again."}
          {status !== "VERIFIED" && status !== "REJECTED" && (inReview ? "Your documents are with a coordinator for review." : sub?.status === "RESUBMIT" ? "A coordinator asked you to submit your documents again." : "Submit your documents for a coordinator to review.")}
          {sub?.note && <span className="mt-1 block text-ink-3">Coordinator: &ldquo;{sub.note}&rdquo;</span>}
        </Notice>
        <ul className="divide-y divide-line rounded-[12px] border border-line">
          {docs.map((d) => (
            <li key={d.label} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] text-ink">
              <span>
                {d.label}
                {d.detail && <span className="block text-[11.5px] text-ink-4">{d.detail}</span>}
              </span>
              {d.ok ? <CheckCircle2 className="size-4 text-brand-600" /> : <span className="text-[11.5px] text-ink-4">{inReview ? "In review" : "Needed"}</span>}
            </li>
          ))}
        </ul>
        {status !== "VERIFIED" && !inReview && (
          <Button onClick={() => run(() => api.student.submitKyc(DOC_LABELS.map((label) => ({ label, detail: "Uploaded for review" }))))} disabled={busy} icon={<Send className="size-4" />}>
            {busy ? "Submitting…" : "Submit for verification"}
          </Button>
        )}
        {err && <Notice tone="error">{err}</Notice>}
      </div>
    </Panel>
  );
}
