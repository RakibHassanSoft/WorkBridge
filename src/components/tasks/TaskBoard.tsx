"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Clock3, Filter, Search, SlidersHorizontal, Sparkles, Timer, Users, X } from "lucide-react";
import SectorIcon from "@/components/SectorIcon";
import { StatusPill } from "@/components/app/parts";
import TaskDrawer from "./TaskDrawer";
import { Reveal } from "@/components/ui";
import { BOARD_SKILLS, BOARD_TASKS, anyJobById, metaOf } from "@/data/marketplace";
import { clientById, STUDENTS } from "@/data/people";
import { SECTORS, sectorById } from "@/data/sectors";
import type { Task, TaskStatus } from "@/data/types";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** The signed-in student this demo board is personalised for. */
const ME = STUDENTS[0];

type StatusFilter = "open" | "ongoing" | "completed" | "cancelled" | "all";

const STATUS_TABS: { key: StatusFilter; label: L; match: (s: TaskStatus) => boolean }[] = [
  { key: "open", label: { en: "Open", bn: "খোলা" }, match: (s) => s === "open" || s === "matching" },
  { key: "ongoing", label: { en: "Ongoing", bn: "চলমান" }, match: (s) => s === "in_progress" || s === "in_review" || s === "revision" },
  { key: "completed", label: { en: "Completed", bn: "সম্পন্ন" }, match: (s) => s === "approved" },
  { key: "cancelled", label: { en: "Cancelled", bn: "বাতিল" }, match: (s) => s === "cancelled" },
  { key: "all", label: { en: "All", bn: "সব" }, match: () => true },
];

type Sort = "latest" | "fee" | "competition";

export default function TaskBoard() {
  const { t } = useLang();
  const n = useNum();
  const params = useSearchParams();

  const [status, setStatus] = useState<StatusFilter>("open");
  const [sector, setSector] = useState<string>("all");
  const [skills, setSkills] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [relevant, setRelevant] = useState(true);
  const [sort, setSort] = useState<Sort>("latest");
  const [open, setOpen] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // /tasks?sector=design comes from the sectors page
  useEffect(() => {
    const s = params?.get("sector");
    if (s && SECTORS.some((x) => x.id === s)) {
      setSector(s);
      setRelevant(false);
    }
  }, [params]);

  const fitsMe = (task: Task) => ME.sectorIds.includes(task.sectorId) || task.skills.some((s) => ME.skills.includes(s));

  const { matched, rest } = useMemo(() => {
    const tab = STATUS_TABS.find((x) => x.key === status)!;
    let out = BOARD_TASKS.filter((task) => tab.match(task.status));

    if (sector !== "all") out = out.filter((x) => x.sectorId === sector);
    if (skills.length) out = out.filter((x) => x.skills.some((s) => skills.includes(s)));

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((x) => {
        const meta = metaOf(x.id);
        const hay = [x.title.en, x.title.bn, x.desc.en, x.desc.bn, meta?.clientWords.en ?? "", meta?.clientWords.bn ?? "", ...x.skills]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const order = (list: Task[]) => {
      if (sort === "fee") return [...list].sort((a, b) => b.fee - a.fee);
      if (sort === "competition") return [...list].sort((a, b) => (metaOf(a.id)?.applicants ?? 0) - (metaOf(b.id)?.applicants ?? 0));
      return list;
    };

    if (!relevant) return { matched: order(out), rest: [] as Task[] };

    const mine = order(out.filter(fitsMe));
    // A near-empty board helps nobody: once the profile match runs thin, the
    // remaining tasks are still shown, clearly separated rather than hidden.
    const others = mine.length < 6 ? order(out.filter((x) => !fitsMe(x))) : [];
    return { matched: mine, rest: others };
  }, [status, sector, skills, relevant, query, sort]);

  const results = matched;

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
              const count = BOARD_TASKS.filter((x) => tab.match(x.status)).length;
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

            <button
              onClick={() => setRelevant((v) => !v)}
              className={cn(
                "ml-auto flex shrink-0 items-center gap-2 rounded-[10px] border px-3 py-2 text-[12.5px] transition-colors",
                relevant ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-ink-3 hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "relative h-4 w-7 rounded-full transition-colors",
                  relevant ? "bg-brand-600" : "bg-canvas-3"
                )}
              >
                <span className="absolute top-0.5 size-3 rounded-full bg-white transition-all duration-300" style={{ left: relevant ? 14 : 2 }} />
              </span>
              <T v={{ en: "Matched to my skills", bn: "আমার স্কিলের সাথে মেলে" }} />
            </button>
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

                <div className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                  <T v={{ en: "Skills", bn: "স্কিল" }} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {BOARD_SKILLS.map((s) => {
                    const mine = ME.skills.includes(s);
                    return (
                      <FilterChip
                        key={s}
                        on={skills.includes(s)}
                        onClick={() => setSkills((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}
                      >
                        {s}
                        {mine && <span className="ml-1 text-brand-500">•</span>}
                      </FilterChip>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11.5px] text-ink-4">
                  <span className="text-brand-500">•</span>{" "}
                  <T v={{ en: "marks a skill already on your verified profile", bn: "চিহ্নটি আপনার ভেরিফায়েড প্রোফাইলে থাকা স্কিল বোঝায়" }} />
                </p>

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
            {relevant && (
              <>
                {" · "}
                <T v={{ en: "matched to your profile", bn: "আপনার প্রোফাইলের সাথে মেলানো" }} />
                {rest.length > 0 && (
                  <>
                    {" · "}
                    <span className="num">{n(rest.length)}</span>{" "}
                    <T v={{ en: "more shown below", bn: "আরও নিচে দেখানো" }} />
                  </>
                )}
              </>
            )}
          </p>
          <p className="text-[12px] text-ink-4">
            <T v={{ en: "Briefs are shown exactly as the business wrote them", bn: "ব্যবসা যেভাবে লিখেছে ঠিক সেভাবেই ব্রিফ দেখানো হয়" }} />
          </p>
        </div>

        {results.length === 0 && rest.length === 0 ? (
          <div className="mt-5 rounded-[18px] border border-dashed border-line-2 bg-canvas-2/40 p-12 text-center">
            <Filter className="mx-auto size-5 text-ink-4" />
            <p className="mt-3 text-[15px] font-medium text-ink">
              <T v={{ en: "Nothing matches those filters", bn: "এই ফিল্টারে কিছু মেলেনি" }} />
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-4">
              <T
                v={{
                  en: "Try turning off the skills match, or widen the sector. New briefs are posted most working days.",
                  bn: "স্কিল ম্যাচ বন্ধ করে দেখুন, বা সেক্টর বাড়ান। বেশিরভাগ কর্মদিবসেই নতুন ব্রিফ আসে।",
                }}
              />
            </p>
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {results.map((task, i) => (
                  <Reveal key={task.id} delay={(i % 3) * 50} className="h-full">
                    <TaskCard task={task} onOpen={() => setOpen(task)} matched={relevant} />
                  </Reveal>
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <>
                <div className="mt-10 flex items-center gap-4">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[11.5px] text-ink-4">
                    <T v={{ en: "Outside your profile, but open right now", bn: "আপনার প্রোফাইলের বাইরে, তবে এখন খোলা" }} />
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((task, i) => (
                    <Reveal key={task.id} delay={(i % 3) * 50} className="h-full">
                      <TaskCard task={task} onOpen={() => setOpen(task)} />
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </>
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

function TaskCard({ task, onOpen, matched }: { task: Task; onOpen: () => void; matched?: boolean }) {
  const { t } = useLang();
  const n = useNum();
  const meta = metaOf(task.id);
  const job = anyJobById(task.jobId);
  const client = job ? clientById(job.clientId) : undefined;
  const sector = sectorById(task.sectorId);
  const mine = task.skills.filter((s) => ME.skills.includes(s));

  return (
    <button
      onClick={onOpen}
      className="group flex h-full w-full flex-col rounded-[18px] border border-line bg-white p-5 text-left transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(10,14,12,.05),0_22px_44px_-24px_rgba(10,14,12,.22)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: sector.accent }}>
          <SectorIcon name={sector.icon} className="size-4" />
        </span>
        <div className="flex items-center gap-1.5">
          {matched && mine.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
              <Sparkles className="size-2.5" />
              <T v={{ en: "Your skills", bn: "আপনার স্কিল" }} />
            </span>
          )}
          <StatusPill status={task.status} />
        </div>
      </div>

      <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink">{t(task.title)}</h3>

      {client && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-4">
          <Building2 className="size-3" />
          {t(client.name)}
          <span>·</span>
          <span className="num">{job?.ref}</span>
        </p>
      )}

      {meta && <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{t(meta.aiSimple)}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {task.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] ring-1",
              mine.includes(s) ? "bg-brand-50 text-brand-700 ring-brand-100" : "bg-canvas-2 text-ink-3 ring-line"
            )}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4" style={{ marginTop: "1.25rem" }}>
        <span className="num text-[17px] font-semibold text-ink">৳{n(task.fee.toLocaleString("en-US"))}</span>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-4">
          <span className="num flex items-center gap-1">
            <Timer className="size-3" />
            {n(task.hours)}h
          </span>
          <span className="num flex items-center gap-1">
            <Users className="size-3" />
            {n(meta?.applicants ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" />
            {meta && t(meta.postedLabel)}
          </span>
        </div>
      </div>
    </button>
  );
}
