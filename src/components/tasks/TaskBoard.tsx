"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Clock3,
  Filter,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Timer,
  Users,
  X,
} from "lucide-react";
import SectorIcon from "@/components/SectorIcon";
import { Reveal } from "@/components/ui";
import { SECTORS, sectorById } from "@/data/sectors";
import { api } from "@/lib/api";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * Public task board (/tasks). Real tasks straight from the database via the
 * public GET /tasks endpoint — no demo data. Empty until a client posts a task
 * and approves its trial. Sector display metadata (icon, colour, bilingual
 * name) still comes from the static SECTORS list, keyed by the shared sector id.
 */

interface BoardTask {
  id: string;
  jobId: string;
  title: string;
  desc: string;
  sectorId: string | null;
  fee: number;
  hours: number;
  skills: string[];
  status: string;
  acceptance: string[];
  createdAt: string;
  sector: { id: string; name: string } | null;
  trial: { title: string; minutes: number; mirrors: string | null } | null;
  job: {
    ref: string;
    title: string;
    brief: string;
    aiSummary: string | null;
    createdAt: string;
    client: {
      id: string;
      name: string;
      clientProfile: { businessName: string; city: string | null; industry: string | null } | null;
    } | null;
  } | null;
  _count?: { attempts: number };
}

type StatusFilter = "open" | "ongoing" | "completed" | "all";

const STATUS_TABS: { key: StatusFilter; label: L; match: (s: string) => boolean }[] = [
  { key: "open", label: { en: "Open", bn: "খোলা" }, match: (s) => s === "OPEN" || s === "MATCHING" },
  { key: "ongoing", label: { en: "Ongoing", bn: "চলমান" }, match: (s) => s === "IN_PROGRESS" || s === "IN_REVIEW" || s === "REVISION" },
  { key: "completed", label: { en: "Completed", bn: "সম্পন্ন" }, match: (s) => s === "APPROVED" },
  { key: "all", label: { en: "All", bn: "সব" }, match: () => true },
];

type Sort = "latest" | "fee" | "competition";

function clientLabel(t: BoardTask): string | null {
  const c = t.job?.client;
  if (!c) return null;
  return c.clientProfile?.businessName || c.name || null;
}

function relativeTime(iso: string): { en: string; bn: string } {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return { en: "recently", bn: "সম্প্রতি" };
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return { en: `${mins}m ago`, bn: `${mins} মিনিট আগে` };
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return { en: `${hrs}h ago`, bn: `${hrs} ঘণ্টা আগে` };
  const days = Math.round(hrs / 24);
  return { en: `${days}d ago`, bn: `${days} দিন আগে` };
}

export default function TaskBoard() {
  const { t } = useLang();
  const n = useNum();
  const params = useSearchParams();

  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("open");
  const [sector, setSector] = useState<string>("all");
  const [skills, setSkills] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  const [open, setOpen] = useState<BoardTask | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .board()
      .then((rows) => {
        if (alive) {
          setTasks(rows as BoardTask[]);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the task board");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // /tasks?sector=design comes from the sectors page
  useEffect(() => {
    const s = params?.get("sector");
    if (s && SECTORS.some((x) => x.id === s)) setSector(s);
  }, [params]);

  // Skill chips are derived from the real tasks on the board.
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    for (const tk of tasks) for (const s of tk.skills ?? []) set.add(s);
    return [...set].sort();
  }, [tasks]);

  const results = useMemo(() => {
    const tab = STATUS_TABS.find((x) => x.key === status)!;
    let out = tasks.filter((task) => tab.match(task.status));

    if (sector !== "all") out = out.filter((x) => x.sectorId === sector);
    if (skills.length) out = out.filter((x) => (x.skills ?? []).some((s) => skills.includes(s)));

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((x) => {
        const hay = [x.title, x.desc, x.job?.brief ?? "", x.job?.aiSummary ?? "", clientLabel(x) ?? "", ...(x.skills ?? [])]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...out];
    if (sort === "fee") sorted.sort((a, b) => b.fee - a.fee);
    else if (sort === "competition") sorted.sort((a, b) => (a._count?.attempts ?? 0) - (b._count?.attempts ?? 0));
    else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [tasks, status, sector, skills, query, sort]);

  const activeFilters = (sector !== "all" ? 1 : 0) + skills.length + (query.trim() ? 1 : 0);
  const clear = () => {
    setSector("all");
    setSkills([]);
    setQuery("");
  };

  return (
    <section className="pb-20">
      <div className="shell">
        {/* ── Controls ─────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 -mx-5 border-b border-line bg-canvas/85 px-5 py-4 backdrop-blur-md md:-mx-8 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 py-2.5 focus-within:border-brand-300">
              <Search className="size-4 shrink-0 text-ink-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ en: "Search briefs, skills, businesses…", bn: "ব্রিফ, স্কিল, ব্যবসা খুঁজুন…" })}
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-4"
              />
              {query && (
                <button onClick={() => setQuery("")} className="shrink-0 text-ink-4 hover:text-ink" aria-label="Clear search">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-[12px] border px-3.5 py-2.5 text-[13px] transition-colors",
                showFilters || activeFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-3 hover:text-ink"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <T v={{ en: "Filters", bn: "ফিল্টার" }} />
              {activeFilters > 0 && <span className="num rounded-full bg-brand-600 px-1.5 text-[10.5px] font-semibold text-white">{n(activeFilters)}</span>}
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-brand-300"
            >
              <option value="latest">{t({ en: "Latest first", bn: "নতুন আগে" })}</option>
              <option value="fee">{t({ en: "Highest fee", bn: "সর্বোচ্চ ফি" })}</option>
              <option value="competition">{t({ en: "Fewest applicants", bn: "সবচেয়ে কম আবেদন" })}</option>
            </select>
          </div>

          {/* status tabs */}
          <div className="no-scrollbar mt-3 flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const count = tasks.filter((x) => tab.match(x.status)).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] transition-colors",
                    status === tab.key ? "bg-ink text-white" : "text-ink-3 hover:bg-canvas-2 hover:text-ink"
                  )}
                >
                  {t(tab.label)}
                  <span className={cn("num text-[11px]", status === tab.key ? "text-white/50" : "text-ink-4")}>{n(count)}</span>
                </button>
              );
            })}
          </div>

          {/* expanded filters */}
          <div className="grid transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]" style={{ gridTemplateRows: showFilters ? "1fr" : "0fr" }}>
            <div className="overflow-hidden">
              <div className="mt-4 rounded-[14px] border border-line bg-white p-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Sector", bn: "সেক্টর" }} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <FilterChip on={sector === "all"} onClick={() => setSector("all")}>
                    {t({ en: "All sectors", bn: "সব সেক্টর" })}
                  </FilterChip>
                  {SECTORS.map((s) => (
                    <FilterChip key={s.id} on={sector === s.id} onClick={() => setSector(s.id)}>
                      {t(s.name)}
                    </FilterChip>
                  ))}
                </div>

                {allSkills.length > 0 && (
                  <>
                    <div className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                      <T v={{ en: "Skills", bn: "স্কিল" }} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {allSkills.map((s) => (
                        <FilterChip
                          key={s}
                          on={skills.includes(s)}
                          onClick={() => setSkills((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}
                        >
                          {s}
                        </FilterChip>
                      ))}
                    </div>
                  </>
                )}

                {activeFilters > 0 && (
                  <button onClick={clear} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600">
                    <X className="size-3.5" />
                    <T v={{ en: "Clear filters", bn: "ফিল্টার মুছুন" }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] text-ink-3">
            <span className="num font-semibold text-ink">{n(results.length)}</span>{" "}
            <T v={{ en: "tasks", bn: "টাস্ক" }} />
          </p>
          <p className="text-[12px] text-ink-4">
            <T v={{ en: "Briefs are shown exactly as the business wrote them", bn: "ব্যবসা যেভাবে লিখেছে ঠিক সেভাবেই ব্রিফ দেখানো হয়" }} />
          </p>
        </div>

        {loading ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-2 bg-canvas-2/40 p-12 text-[13px] text-ink-4">
            <Loader2 className="size-4 animate-spin" />
            <T v={{ en: "Loading the board…", bn: "বোর্ড লোড হচ্ছে…" }} />
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[18px] border border-dashed border-warn/30 bg-warn-bg/40 p-12 text-center">
            <p className="text-[15px] font-medium text-ink">
              <T v={{ en: "Could not load the task board", bn: "টাস্ক বোর্ড লোড করা যায়নি" }} />
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-4">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-5 rounded-[18px] border border-dashed border-line-2 bg-canvas-2/40 p-12 text-center">
            <Filter className="mx-auto size-5 text-ink-4" />
            <p className="mt-3 text-[15px] font-medium text-ink">
              {tasks.length === 0 ? (
                <T v={{ en: "No tasks posted yet", bn: "এখনও কোনো টাস্ক নেই" }} />
              ) : (
                <T v={{ en: "Nothing matches those filters", bn: "এই ফিল্টারে কিছু মেলেনি" }} />
              )}
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-4">
              {tasks.length === 0 ? (
                <T v={{ en: "Tasks appear here as soon as a business posts one and approves its trial.", bn: "কোনো ব্যবসা টাস্ক পোস্ট করে ট্রায়াল অনুমোদন করলেই তা এখানে দেখা যাবে।" }} />
              ) : (
                <T v={{ en: "Try clearing the filters or widening the sector.", bn: "ফিল্টার মুছে দেখুন, বা সেক্টর বাড়ান।" }} />
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {results.map((task, i) => (
              <Reveal key={task.id} delay={(i % 3) * 50} className="h-full">
                <TaskCard task={task} onOpen={() => setOpen(task)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <TaskDrawer task={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-[12px] ring-1 transition-all",
        on ? "bg-ink text-white ring-ink" : "bg-canvas-2 text-ink-3 ring-line hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-brand-50 text-brand-700 ring-brand-100",
  MATCHING: "bg-brand-50 text-brand-700 ring-brand-100",
  IN_PROGRESS: "bg-warn-bg text-warn ring-warn/20",
  IN_REVIEW: "bg-warn-bg text-warn ring-warn/20",
  REVISION: "bg-warn-bg text-warn ring-warn/20",
  APPROVED: "bg-canvas-2 text-ink-3 ring-line",
  CANCELLED: "bg-canvas-2 text-ink-4 ring-line",
};
const STATUS_LABEL: Record<string, L> = {
  OPEN: { en: "Open", bn: "খোলা" },
  MATCHING: { en: "Open", bn: "খোলা" },
  IN_PROGRESS: { en: "In progress", bn: "চলমান" },
  IN_REVIEW: { en: "In review", bn: "পর্যালোচনায়" },
  REVISION: { en: "Revision", bn: "সংশোধন" },
  APPROVED: { en: "Completed", bn: "সম্পন্ন" },
  CANCELLED: { en: "Cancelled", bn: "বাতিল" },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", STATUS_STYLE[status] ?? "bg-canvas-2 text-ink-3 ring-line")}>
      {t(STATUS_LABEL[status] ?? { en: status, bn: status })}
    </span>
  );
}

function TaskCard({ task, onOpen }: { task: BoardTask; onOpen: () => void }) {
  const { t } = useLang();
  const n = useNum();
  const sector = sectorById(task.sectorId ?? "");
  const client = clientLabel(task);
  const applicants = task._count?.attempts ?? 0;
  const summary = task.job?.aiSummary || task.desc || task.job?.brief || "";

  return (
    <button
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-line bg-white text-left transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(10,14,12,.05),0_22px_44px_-24px_rgba(10,14,12,.22)]"
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas-2 py-1 pl-1 pr-2.5 text-[11px] font-medium text-ink-3 ring-1 ring-inset ring-line">
          <span className="grid size-5 place-items-center rounded-full text-white" style={{ background: sector.accent }}>
            <SectorIcon name={sector.icon} className="size-3" />
          </span>
          {t(sector.name)}
        </span>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-ink group-hover:text-brand-800">{task.title}</h3>

        {client && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-4">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{client}</span>
            {task.job?.ref && (
              <>
                <span>·</span>
                <span className="num shrink-0">{task.job.ref}</span>
              </>
            )}
          </p>
        )}

        {summary && <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{summary}</p>}

        {(task.skills ?? []).length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {task.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-canvas-2 px-2 py-1 text-[11px] text-ink-3 ring-1 ring-line">
                {s}
              </span>
            ))}
            {task.skills.length > 3 && <span className="rounded-md bg-canvas-2 px-2 py-1 text-[11px] text-ink-4 ring-1 ring-line">+{n(task.skills.length - 3)}</span>}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4" style={{ marginTop: "1.25rem" }}>
          <div>
            <span className="num block text-[19px] font-semibold leading-none text-ink">৳{n(task.fee.toLocaleString("en-US"))}</span>
            <span className="num mt-1 flex items-center gap-1 text-[11px] text-ink-4">
              <Timer className="size-3" />
              {n(task.hours)}h estimate
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11.5px] text-ink-4">
            <span className="num flex items-center gap-1">
              <Users className="size-3" />
              {applicants === 0 ? t({ en: "Be first", bn: "প্রথম হোন" }) : `${n(applicants)} ${t({ en: "applied", bn: "আবেদন" })}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" />
              {t(relativeTime(task.createdAt))}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Lightweight right slide-over showing the real task detail from the DB. */
function TaskDrawer({ task, onClose }: { task: BoardTask | null; onClose: () => void }) {
  const { t } = useLang();
  const n = useNum();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (task) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;
  const sector = sectorById(task.sectorId ?? "");
  const client = clientLabel(task);
  const city = task.job?.client?.clientProfile?.city ?? null;
  const applicants = task._count?.attempts ?? 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-y-auto border-l border-line bg-canvas shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-canvas/90 px-6 py-4 backdrop-blur-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas-2 py-1 pl-1 pr-2.5 text-[11px] font-medium text-ink-3 ring-1 ring-inset ring-line">
            <span className="grid size-5 place-items-center rounded-full text-white" style={{ background: sector.accent }}>
              <SectorIcon name={sector.icon} className="size-3" />
            </span>
            {t(sector.name)}
          </span>
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-4 hover:bg-canvas-2 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink">{task.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-4">
            {client && (
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {client}
              </span>
            )}
            {city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {city}
              </span>
            )}
            {task.job?.ref && <span className="num">{task.job.ref}</span>}
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {t(relativeTime(task.createdAt))}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label={{ en: "Fee", bn: "ফি" }} value={`৳${n(task.fee.toLocaleString("en-US"))}`} />
            <Stat label={{ en: "Estimate", bn: "আনুমানিক" }} value={`${n(task.hours)}h`} />
            <Stat label={{ en: "Applicants", bn: "আবেদন" }} value={n(applicants)} />
          </div>

          {task.job?.aiSummary && (
            <Section title={{ en: "What the AI understood", bn: "এআই যা বুঝেছে" }}>
              <p className="text-[13px] leading-relaxed text-ink-2">{task.job.aiSummary}</p>
            </Section>
          )}

          {task.job?.brief && (
            <Section title={{ en: "The business's own words", bn: "ব্যবসার নিজের ভাষায়" }}>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{task.job.brief}</p>
            </Section>
          )}

          {(task.acceptance ?? []).length > 0 && (
            <Section title={{ en: "Acceptance criteria", bn: "গ্রহণযোগ্যতার শর্ত" }}>
              <ul className="space-y-1.5">
                {task.acceptance.map((a, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(task.skills ?? []).length > 0 && (
            <Section title={{ en: "Skills", bn: "স্কিল" }}>
              <div className="flex flex-wrap gap-1.5">
                {task.skills.map((s) => (
                  <span key={s} className="rounded-md bg-canvas-2 px-2 py-1 text-[11.5px] text-ink-3 ring-1 ring-line">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {task.trial && (
            <Section title={{ en: "The trial", bn: "ট্রায়াল" }}>
              <p className="text-[13px] font-medium text-ink">{task.trial.title}</p>
              {task.trial.mirrors && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-4">{task.trial.mirrors}</p>}
              <p className="num mt-2 text-[12px] text-ink-4">{n(task.trial.minutes)} min</p>
            </Section>
          )}

          <p className="mt-6 rounded-[12px] border border-line bg-canvas-2/50 px-4 py-3 text-[12px] leading-relaxed text-ink-4">
            <T v={{ en: "To apply, sign in as a verified student and complete the trial from your workspace.", bn: "আবেদন করতে ভেরিফায়েড শিক্ষার্থী হিসেবে সাইন ইন করে আপনার ওয়ার্কস্পেস থেকে ট্রায়াল সম্পন্ন করুন।" }} />
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: L; value: string | number }) {
  const { t } = useLang();
  return (
    <div className="rounded-[12px] border border-line bg-white px-3 py-2.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">{t(label)}</div>
      <div className="num mt-1 text-[16px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: L; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">{t(title)}</div>
      {children}
    </div>
  );
}
