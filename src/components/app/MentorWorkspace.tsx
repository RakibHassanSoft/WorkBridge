"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Gift,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRoundCheck,
  Users,
} from "lucide-react";
import AppShell, { type NavItem } from "./AppShell";
import { Panel, StatCard, StatusPill } from "./parts";
import { Avatar, Bar, Button } from "@/components/ui";
import SectorIcon from "@/components/SectorIcon";
import { TASKS, jobById } from "@/data/work";
import { MENTORS, STUDENTS, clientById, studentById } from "@/data/people";
import { SECTORS, sectorById } from "@/data/sectors";
import { T, useLang, useNum, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const ME = MENTORS[0];

/** Tasks sitting in review or revision are the mentor's queue. */
const QUEUE = TASKS.filter((t) => t.status === "in_review" || t.status === "revision");

const NAV: NavItem[] = [
  { key: "overview", label: { en: "Overview", bn: "ওভারভিউ" }, icon: LayoutDashboard },
  { key: "queue", label: { en: "Review queue", bn: "রিভিউ কিউ" }, icon: Inbox, badge: QUEUE.length },
  { key: "rubrics", label: { en: "Sector rubrics", bn: "সেক্টর রুব্রিক" }, icon: ListChecks },
  { key: "people", label: { en: "People I've verified", bn: "যাদের আমি যাচাই করেছি" }, icon: Users },
  { key: "why", label: { en: "What mentors get", bn: "মেন্টররা যা পান" }, icon: Gift },
];

const TITLES: Record<string, { title: L; subtitle: L }> = {
  overview: { title: { en: "Overview", bn: "ওভারভিউ" }, subtitle: { en: "Review is minutes, not an evening", bn: "রিভিউ মানে কয়েক মিনিট, পুরো সন্ধ্যা নয়" } },
  queue: { title: { en: "Review queue", bn: "রিভিউ কিউ" }, subtitle: { en: "Score against the sector rubric, then it goes to the client", bn: "সেক্টর রুব্রিকে স্কোর দিন, তারপর এটি ক্লায়েন্টের কাছে যায়" } },
  rubrics: { title: { en: "Sector rubrics", bn: "সেক্টর রুব্রিক" }, subtitle: { en: "Done means something different in every sector", bn: "প্রতিটি সেক্টরে 'সম্পন্ন'-এর মানে আলাদা" } },
  people: { title: { en: "People I've verified", bn: "যাদের আমি যাচাই করেছি" }, subtitle: { en: "Referral rights on every one of them", bn: "প্রত্যেকের ওপর রেফারেল অধিকার" } },
  why: { title: { en: "What mentors get", bn: "মেন্টররা যা পান" }, subtitle: { en: "Stated up front, because goodwill is not a supply strategy", bn: "শুরুতেই স্পষ্ট, কারণ সদিচ্ছা কোনো সাপ্লাই কৌশল নয়" } },
};

export default function MentorWorkspace() {
  const [tab, setTab] = useState("overview");
  const { t } = useLang();

  return (
    <AppShell
      role="mentor"
      roleLabel={{ en: "Mentor console", bn: "মেন্টর কনসোল" }}
      userName={t(ME.name)}
      userMeta={ME.org}
      nav={NAV}
      active={tab}
      onSelect={setTab}
      title={TITLES[tab].title}
      subtitle={TITLES[tab].subtitle}
    >
      {tab === "overview" && <Overview onGo={setTab} />}
      {tab === "queue" && <Queue />}
      {tab === "rubrics" && <Rubrics />}
      {tab === "people" && <People />}
      {tab === "why" && <Why />}
    </AppShell>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */

function Overview({ onGo }: { onGo: (k: string) => void }) {
  const { t } = useLang();
  const n = useNum();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Inbox} label={{ en: "Waiting on you", bn: "আপনার অপেক্ষায়" }} value={n(QUEUE.length)} hint={{ en: "the student is not paid until you score", bn: "আপনি স্কোর না দিলে শিক্ষার্থী টাকা পান না" }} tone="brand" />
        <StatCard icon={BadgeCheck} label={{ en: "Reviews completed", bn: "সম্পন্ন রিভিউ" }} value={n(ME.reviews)} hint={{ en: "since the Phase 0 pilot", bn: "ফেজ ০ পাইলট থেকে" }} />
        <StatCard icon={Timer} label={{ en: "Your turnaround", bn: "আপনার সময়" }} value={t({ en: "18h", bn: "১৮ঘ" })} hint={ME.avgTurnaround} />
        <StatCard icon={UserRoundCheck} label={{ en: "Referral rights held", bn: "রেফারেল অধিকার" }} value={n(9)} hint={{ en: "graduates you personally verified", bn: "আপনি নিজে যাচাই করেছেন এমন গ্র্যাজুয়েট" }} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel
          title={{ en: "Next in your queue", bn: "আপনার কিউয়ে পরবর্তী" }}
          desc={{ en: "Five scored dimensions, one note, done", bn: "পাঁচটি স্কোরড ডাইমেনশন, একটি নোট, শেষ" }}
          action={
            <Button size="sm" variant="secondary" onClick={() => onGo("queue")} icon={<ArrowRight className="size-3.5" />}>
              <T v={{ en: "Open queue", bn: "কিউ খুলুন" }} />
            </Button>
          }
        >
          <div className="divide-y divide-line">
            {QUEUE.map((task) => {
              const job = jobById(task.jobId)!;
              const student = task.assignee ? studentById(task.assignee) : null;
              const sector = sectorById(task.sectorId);
              return (
                <div key={task.id} className="flex flex-wrap items-center gap-4 p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: sector.accent }}>
                    <SectorIcon name={sector.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug text-ink">{t(task.title)}</p>
                    <p className="mt-1 text-[11.5px] text-ink-4">
                      {t(clientById(job.clientId)!.name)} · {job.ref}
                    </p>
                  </div>
                  {student && (
                    <span className="flex items-center gap-2">
                      <Avatar name={student.name.en} size={26} />
                      <span className="hidden text-[12px] text-ink-3 sm:block">{t(student.name)}</span>
                    </span>
                  )}
                  <StatusPill status={task.status} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={{ en: "Why this layer exists", bn: "এই লেয়ার কেন আছে" }}>
          <div className="p-5">
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              <T
                v={{
                  en: "Commit counts and activity metrics are trivially gamed, and they say nothing about who actually contributed what inside a team. Verification has to be a person, looking at the work, against criteria written before it started.",
                  bn: "কমিট কাউন্ট আর অ্যাক্টিভিটি মেট্রিক সহজেই গেম করা যায়, আর টিমের ভেতরে কে আসলে কী করেছে তা বলে না। ভেরিফিকেশন মানে একজন মানুষ, কাজটা দেখছেন, শুরুর আগে লেখা শর্তের বিপরীতে।",
                }}
              />
            </p>
            <div className="mt-5 space-y-2.5 border-t border-line pt-4">
              {[
                { en: "You score. The client signs. Neither alone counts.", bn: "আপনি স্কোর দেন। ক্লায়েন্ট সাইন করেন। একা কোনোটিই গণনা হয় না।" },
                { en: "A revision is recorded beside the result, never hidden.", bn: "রিভিশন ফলাফলের পাশে রেকর্ড থাকে, কখনো লুকানো হয় না।" },
                { en: "The AI layer plays no part in verification at all.", bn: "ভেরিফিকেশনে এআই লেয়ারের কোনো ভূমিকা নেই।" },
              ].map((x) => (
                <p key={x.en} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  {t(x)}
                </p>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── Queue with scoring ───────────────────────────────────────── */

function Queue() {
  const { t, tl } = useLang();
  const n = useNum();
  const [activeId, setActiveId] = useState(QUEUE[0]?.id);
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({});
  const [sent, setSent] = useState<string[]>([]);

  const task = QUEUE.find((x) => x.id === activeId)!;
  const sector = sectorById(task.sectorId);
  const dims = tl(sector.rubric);
  const student = task.assignee ? studentById(task.assignee) : null;
  const job = jobById(task.jobId)!;
  const client = clientById(job.clientId)!;

  const mine = scores[task.id] ?? {};
  const filled = Object.keys(mine).length;
  const total = Object.values(mine).reduce((a, b) => a + b, 0);
  const isSent = sent.includes(task.id);

  const setScore = (i: number, v: number) =>
    setScores((s) => ({ ...s, [task.id]: { ...(s[task.id] ?? {}), [i]: v } }));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="space-y-2">
        {QUEUE.map((q) => {
          const s = q.assignee ? studentById(q.assignee) : null;
          const sec = sectorById(q.sectorId);
          const on = q.id === activeId;
          return (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[14px] border p-4 text-left transition-all",
                on ? "border-ink bg-white shadow-[0_1px_2px_rgba(10,14,12,.06),0_14px_28px_-18px_rgba(10,14,12,.25)]" : "border-line bg-white hover:border-line-2"
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: sec.accent }}>
                <SectorIcon name={sec.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-snug text-ink">{t(q.title)}</span>
                <span className="mt-1 block text-[11.5px] text-ink-4">{s ? t(s.name) : "—"}</span>
              </span>
              {sent.includes(q.id) ? <BadgeCheck className="size-4 shrink-0 text-brand-600" /> : <Clock3 className="size-4 shrink-0 text-ink-4" />}
            </button>
          );
        })}

        <div className="rounded-[14px] border border-line bg-canvas-2/50 p-4">
          <p className="text-[11.5px] leading-relaxed text-ink-4">
            <T
              v={{
                en: "Reviews are meant to take minutes. If a task needs more than that, the scope was wrong — flag it and the coordinator re-splits it.",
                bn: "রিভিউ কয়েক মিনিটের কাজ হওয়ার কথা। এর বেশি লাগলে স্কোপটাই ভুল ছিল — চিহ্নিত করুন, কোঅর্ডিনেটর নতুন করে ভাগ করবেন।",
              }}
            />
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Panel title={{ en: "The submission", bn: "জমা দেওয়া কাজ" }}>
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(task.title)}</h3>
                <p className="mt-1.5 text-[12px] text-ink-4">
                  {t(client.name)} · {job.ref} · <span className="num">৳{n(task.fee.toLocaleString("en-US"))}</span>
                </p>
              </div>
              {student && (
                <div className="flex items-center gap-2.5">
                  <Avatar name={student.name.en} size={32} />
                  <div>
                    <div className="text-[12.5px] font-medium text-ink">{t(student.name)}</div>
                    <div className="num text-[11px] text-ink-4">
                      {n(student.verified)} <T v={{ en: "verified", bn: "ভেরিফায়েড" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-ink-3">{t(task.desc)}</p>

            <div className="mt-5 rounded-[12px] border border-line bg-canvas-2/40 p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
                <T v={{ en: "Criteria agreed before the work started", bn: "কাজ শুরুর আগেই সম্মত শর্ত" }} />
              </div>
              <ul className="mt-2.5 space-y-1.5">
                {tl(task.acceptance).map((a) => (
                  <li key={a} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-2">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel
          title={{ en: "Score against the sector rubric", bn: "সেক্টর রুব্রিকে স্কোর দিন" }}
          desc={sector.name}
          action={
            <span className="num rounded-full bg-canvas-2 px-2.5 py-1 text-[12px] font-semibold text-ink ring-1 ring-line">
              {n(total)}/{n(dims.length * 5)}
            </span>
          }
        >
          <div className="divide-y divide-line">
            {dims.map((dim, i) => (
              <div key={dim} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <span className="text-[13.5px] text-ink">{dim}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => {
                    const on = mine[i] === v;
                    const below = mine[i] !== undefined && v <= mine[i];
                    return (
                      <button
                        key={v}
                        onClick={() => setScore(i, v)}
                        disabled={isSent}
                        className={cn(
                          "num grid size-8 place-items-center rounded-[9px] text-[12.5px] font-medium transition-all disabled:opacity-60",
                          on
                            ? "bg-brand-600 text-white"
                            : below
                            ? "bg-brand-100 text-brand-700"
                            : "bg-canvas-2 text-ink-4 ring-1 ring-line hover:text-ink"
                        )}
                      >
                        {n(v)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line p-5">
            <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <MessageSquareQuote className="size-3" />
              <T v={{ en: "Your note to the student and the client", bn: "শিক্ষার্থী ও ক্লায়েন্টের জন্য আপনার নোট" }} />
            </div>
            <textarea
              rows={3}
              disabled={isSent}
              placeholder={t({
                en: "What was actually good, and the one thing to do differently next time…",
                bn: "সত্যিই কী ভালো হয়েছে, আর পরেরবার একটি জিনিস কীভাবে আলাদা করবেন…",
              })}
              className="w-full resize-none rounded-[12px] border border-line bg-canvas-2/40 p-3.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white disabled:opacity-60"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="min-w-[160px] flex-1">
                <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-ink-4">
                  <T v={{ en: "Dimensions scored", bn: "স্কোর দেওয়া ডাইমেনশন" }} />
                  <span className="num">
                    {n(filled)}/{n(dims.length)}
                  </span>
                </div>
                <Bar value={(filled / dims.length) * 100} />
              </div>

              {isSent ? (
                <span className="inline-flex items-center gap-2 rounded-[12px] bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white">
                  <BadgeCheck className="size-4" />
                  <T v={{ en: "Sent to the client for sign-off", bn: "সাইন-অফের জন্য ক্লায়েন্টের কাছে পাঠানো হয়েছে" }} />
                </span>
              ) : (
                <Button
                  size="md"
                  disabled={filled < dims.length}
                  onClick={() => setSent((s) => [...s, task.id])}
                  icon={<Send className="size-4" />}
                >
                  {filled < dims.length ? (
                    <T v={{ en: "Score every dimension", bn: "প্রতিটি ডাইমেনশনে স্কোর দিন" }} />
                  ) : (
                    <T v={{ en: "Submit score", bn: "স্কোর জমা দিন" }} />
                  )}
                </Button>
              )}
            </div>

            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">
              <T
                v={{
                  en: "Your score alone does not verify anything. It goes to the business that paid, and only their sign-off puts this on the graduate's permanent record.",
                  bn: "আপনার স্কোর একাই কিছু যাচাই করে না। এটি যায় টাকা দেওয়া ব্যবসার কাছে, আর কেবল তাদের সাইন-অফই এটিকে গ্র্যাজুয়েটের স্থায়ী রেকর্ডে বসায়।",
                }}
              />
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── Rubrics ──────────────────────────────────────────────────── */

function Rubrics() {
  const { t, tl } = useLang();
  const n = useNum();
  const [open, setOpen] = useState(SECTORS[0].id);
  const sector = useMemo(() => sectorById(open), [open]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
      <div className="space-y-1.5">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpen(s.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-all",
              s.id === open ? "border-ink bg-white" : "border-line bg-white hover:border-line-2"
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: s.accent }}>
              <SectorIcon name={s.icon} className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{t(s.name)}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Panel title={sector.name} desc={sector.tagline}>
          <div className="p-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "Scored dimensions", bn: "স্কোরড ডাইমেনশন" }} />
            </div>
            <ol className="mt-3 space-y-2">
              {tl(sector.rubric).map((r, i) => (
                <li key={r} className="flex items-center gap-3 rounded-[12px] border border-line bg-canvas-2/40 px-4 py-3">
                  <span className="num grid size-6 shrink-0 place-items-center rounded-md bg-white text-[11px] font-semibold text-brand-700 ring-1 ring-line">
                    {n(i + 1)}
                  </span>
                  <span className="text-[13.5px] text-ink">{r}</span>
                  <span className="num ml-auto text-[11.5px] text-ink-4">1–5</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              <T v={{ en: "Typical work in this sector", bn: "এই সেক্টরের সাধারণ কাজ" }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tl(sector.sampleWork).map((w) => (
                <span key={w} className="rounded-lg bg-canvas-2 px-2.5 py-1.5 text-[12px] text-ink-2 ring-1 ring-line">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex items-start gap-3 rounded-[16px] border border-line bg-white p-5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-500" />
          <p className="text-[12.5px] leading-relaxed text-ink-3">
            <T
              v={{
                en: "All nine rubric templates are drafted together in Phase 1 even though sectors switch on one at a time — because retrofitting a verification standard onto work already done is how a record loses its meaning.",
                bn: "সেক্টর একবারে একটি করে চালু হলেও নয়টি রুব্রিক টেমপ্লেট ফেজ ১-এই একসাথে তৈরি হয় — কারণ ইতিমধ্যে হয়ে যাওয়া কাজের ওপর পরে ভেরিফিকেশন স্ট্যান্ডার্ড বসালে রেকর্ড তার অর্থ হারায়।",
              }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── People ───────────────────────────────────────────────────── */

function People() {
  const { t } = useLang();
  const n = useNum();
  const verified = STUDENTS.filter((s) => s.verified > 0).slice(0, 5);

  return (
    <Panel
      title={{ en: "Graduates you have personally verified", bn: "যাদের আপনি নিজে যাচাই করেছেন" }}
      desc={{ en: "You hold referral rights and first access on every one", bn: "প্রত্যেকের ওপর আপনার রেফারেল অধিকার ও অগ্রাধিকার" }}
    >
      <div className="divide-y divide-line">
        {verified.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-4 p-5">
            <Avatar name={s.name.en} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-medium text-ink">{t(s.name)}</span>
                <BadgeCheck className="size-3.5 text-brand-600" />
              </div>
              <p className="mt-0.5 text-[12px] text-ink-4">
                {t(s.discipline)} · {t(s.university)}
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="num text-[15px] font-semibold text-ink">{n(s.verified)}</div>
                <div className="text-[10.5px] text-ink-4">
                  <T v={{ en: "verified", bn: "ভেরিফায়েড" }} />
                </div>
              </div>
              <div>
                <div className="num text-[15px] font-semibold text-ink">{n(s.rating)}</div>
                <div className="text-[10.5px] text-ink-4">
                  <T v={{ en: "avg score", bn: "গড় স্কোর" }} />
                </div>
              </div>
            </div>
            <Button size="sm" variant="secondary" href={`/passport/${s.slug}`}>
              <T v={{ en: "Passport", bn: "পাসপোর্ট" }} />
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Why ──────────────────────────────────────────────────────── */

function Why() {
  const { t } = useLang();

  const items = [
    {
      icon: UserRoundCheck,
      t: { en: "Referral rights from day one", bn: "প্রথম দিন থেকেই রেফারেল অধিকার" },
      d: {
        en: "You verified them, so you know exactly what they can do. When a client asks for someone, your verified graduates are named first.",
        bn: "আপনি তাদের যাচাই করেছেন, তাই ঠিক কী পারেন তা আপনি জানেন। কোনো ক্লায়েন্ট কাউকে চাইলে আপনার ভেরিফায়েড গ্র্যাজুয়েটদের নামই আগে যায়।",
      },
    },
    {
      icon: Gift,
      t: { en: "Hiring priority for your own organisation", bn: "আপনার নিজের প্রতিষ্ঠানের জন্য হায়ারিং প্রায়োরিটি" },
      d: {
        en: "First access to the strongest graduates on the platform — people whose work you have already read, scored and signed.",
        bn: "প্ল্যাটফর্মের সেরা গ্র্যাজুয়েটদের কাছে সবার আগে পৌঁছানো — যাদের কাজ আপনি ইতিমধ্যে পড়েছেন, স্কোর দিয়েছেন, স্বাক্ষর করেছেন।",
      },
    },
    {
      icon: Timer,
      t: { en: "Reviews measured in minutes", bn: "মিনিটে মাপা রিভিউ" },
      d: {
        en: "A structured rubric and criteria written before the work started. You are not reading an open-ended submission and inventing a standard on the spot.",
        bn: "স্ট্রাকচার্ড রুব্রিক আর কাজ শুরুর আগেই লেখা শর্ত। আপনি কোনো উন্মুক্ত সাবমিশন পড়ে ঘটনাস্থলে মান আবিষ্কার করছেন না।",
      },
    },
    {
      icon: ShieldCheck,
      t: { en: "A stipend as soon as revenue exists", bn: "রেভিনিউ এলেই স্টাইপেন্ড" },
      d: {
        en: "Stated in the plan, not implied. Multiple similar programmes have watched mentor supply dry up because there was nothing in it for the mentor — this one assumes that will happen and prices for it.",
        bn: "পরিকল্পনায় স্পষ্ট করে লেখা, ইঙ্গিতে নয়। একাধিক সমজাতীয় প্রোগ্রামে মেন্টর সাপ্লাই শুকিয়ে গেছে কারণ মেন্টরের জন্য কিছু ছিল না — এই প্রকল্প ধরে নিচ্ছে সেটা ঘটবে, এবং সেই অনুযায়ী দাম রেখেছে।",
      },
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((x) => (
        <div key={x.t.en} className="rounded-[16px] border border-line bg-white p-6">
          <span className="grid size-10 place-items-center rounded-[11px] bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <x.icon className="size-[18px]" />
          </span>
          <h3 className="mt-5 text-[15.5px] font-semibold leading-snug tracking-[-0.02em] text-ink">{t(x.t)}</h3>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-3">{t(x.d)}</p>
        </div>
      ))}
    </div>
  );
}
