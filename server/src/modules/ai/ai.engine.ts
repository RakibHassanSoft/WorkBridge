/**
 * Deterministic scoping engine — a server-side port of the frontend
 * src/lib/engine.ts. No model call, no network: it reads a plain-language
 * brief, detects the sector from weighted keyword signals, estimates hours and
 * a fee, builds a short trial that mirrors the real work, and runs the
 * fair-price check. Shapes match the frontend so the UI needs no change; a
 * real model can replace this later behind the same interface.
 */

import { Attachment } from "./attachments";
import { planTrial, judgeAttempt, mergeModelJudgement, ChecklistItem, SHORTLIST_BAR, isFaultBrief, IT_BUILD_CATCH } from "./ai.judge";

export { SHORTLIST_BAR };

export type Complexity = "Low" | "Medium" | "High";
export type PriceLevel = "ok" | "low" | "blocked";
export type TaskLevelStr = "micro" | "standard" | "advanced";

export interface PriceVerdict {
  rate: number;
  floor: number;
  fair: boolean;
  shortfall: number;
  gapPct: number;
  level: PriceLevel;
  message: string;
}

export interface BuiltTrial {
  title: string;
  brief: string;
  minutes: number;
  mirrors: string;
  acceptance: string[];
}

export interface ScopeResult {
  sectorId: string;
  summary: string;
  complexity: Complexity;
  confidence: number;
  estHours: number;
  suggestedFee: number;
  level: TaskLevelStr;
  skills: string[];
  risks: string[];
  acceptance: string[];
  title: string;
  desc: string;
  signals: { label: string; weight: number }[];
  trial: BuiltTrial;
  price: PriceVerdict;
}

// ── Sector detection signals (weighted keyword regexes) ──
interface Signal {
  sector: string;
  weight: number;
  label: string;
  re: RegExp;
}

const SIGNALS: Signal[] = [
  { sector: "it", weight: 3, label: "website / storefront", re: /\b(website|site|web|store|storefront|ecommerce|e-commerce|app)\b/i },
  { sector: "it", weight: 4, label: "checkout / payment failure", re: /\b(checkout|payment|gateway|bkash|nagad|cart|order fail\w*)\b/i },
  { sector: "it", weight: 3, label: "dashboard / reporting", re: /\b(dashboard|report|analytics|automat\w*|integration|api)\b/i },
  { sector: "mkt", weight: 4, label: "social media / campaign", re: /\b(social|facebook|instagram|tiktok|campaign|ads?|marketing|agency)\b/i },
  { sector: "mkt", weight: 2, label: "leads / customers", re: /\b(lead|customer|crm|funnel|conversion)\b/i },
  { sector: "biz", weight: 4, label: "accounts / bookkeeping", re: /\b(account\w*|bookkeep\w*|ledger|vat|tax|invoice|costing|budget)\b/i },
  { sector: "biz", weight: 3, label: "financial model / pricing", re: /\b(profit|margin|pricing|forecast|model|cash ?flow)\b/i },
  { sector: "content", weight: 4, label: "writing / translation", re: /\b(write|writing|copy|content|blog|article|translat\w*|edit\w*|script)\b/i },
  { sector: "design", weight: 4, label: "design / branding", re: /\b(design|logo|brand\w*|packag\w*|label|poster|banner|photo)\b/i },
  { sector: "eng", weight: 4, label: "drawing / site work", re: /\b(drawing|autocad|boq|structur\w*|site|construction|load|survey plan)\b/i },
  { sector: "agri", weight: 4, label: "farm / crop data", re: /\b(farm\w*|crop|seed|fertilis\w*|fertiliz\w*|yield|agri\w*)\b/i },
  { sector: "social", weight: 3, label: "field research / interviews", re: /\b(survey|interview\w*|baseline|community|ngo|m&e|research)\b/i },
  { sector: "admin", weight: 4, label: "paper records / data entry", re: /\b(data ?entry|register|paper|digiti[sz]\w*|spreadsheet|excel|transcri\w*|list)\b/i },
  { sector: "admin", weight: 2, label: "duplicates / messy data", re: /\b(duplicate|messy|clean\w*|inconsistent)\b/i },
];

const URGENCY = /\b(urgent|asap|immediately|this week)\b/i;
const SCALE = /\b(\d{3,})\b/;

// ── Per-sector reference data ──
export const RATE_FLOOR: Record<string, number> = {
  it: 480,
  eng: 460,
  biz: 400,
  design: 380,
  social: 360,
  agri: 340,
  content: 330,
  mkt: 320,
  admin: 200,
};

// Base hours/rate per sector for the single-task scope. The rate sits above the
// floor so a suggested fee is always fair; a client's low budget can still fail
// the price check.
const SECTOR_BASE: Record<string, { hours: number; rate: number; name: string }> = {
  it: { hours: 12, rate: 620, name: "IT & Software" },
  eng: { hours: 12, rate: 600, name: "Engineering" },
  biz: { hours: 9, rate: 520, name: "Business, Finance & Accounting" },
  design: { hours: 8, rate: 500, name: "Graphic Design & Multimedia" },
  social: { hours: 10, rate: 470, name: "Social Science & Development" },
  agri: { hours: 10, rate: 450, name: "Agriculture & Environment" },
  content: { hours: 7, rate: 430, name: "Content, Journalism & English" },
  mkt: { hours: 7, rate: 420, name: "Digital Marketing & Sales" },
  admin: { hours: 6, rate: 280, name: "General Admin & Data Support" },
};

const SECTOR_SKILLS: Record<string, string[]> = {
  it: ["Debugging", "APIs", "Frontend", "Testing"],
  eng: ["AutoCAD", "BOQ", "Estimation", "Site survey"],
  biz: ["Bookkeeping", "Excel modelling", "VAT basics", "Reconciliation"],
  design: ["Figma", "Layout", "Branding", "Export handoff"],
  social: ["Survey design", "Interviewing", "Data coding", "Reporting"],
  agri: ["Field survey", "Data entry", "Bangla reporting", "Analysis"],
  content: ["Copywriting", "Editing", "EN⇄BN translation", "SEO"],
  mkt: ["Content strategy", "Campaign setup", "Copy", "Analytics"],
  admin: ["Data entry", "Excel", "Formatting", "Accuracy checks"],
};

const SECTOR_RISK: Record<string, string> = {
  it: "The fault may not reproduce on the first pass; the diagnostic step is scoped and paid before any fix is built.",
  eng: "Drawings and site measurements can disagree; the estimate assumes the drawings are authoritative.",
  biz: "Source records may be incomplete; unreconciled entries are listed rather than forced to match.",
  design: "Brand assets or exact copy may be missing; placeholders are used until the client confirms.",
  social: "Field access and consent can slow interviews; the timeline assumes cooperative respondents.",
  agri: "Field evidence can be thin; findings state where the data is insufficient.",
  content: "Source facts may need checking; every claim carries a source rather than filler.",
  mkt: "Ad-account access and historical data may be limited at the start.",
  admin: "Some source records are hard to read; ambiguous entries are flagged, never guessed.",
};

const SECTOR_ACCEPTANCE: Record<string, string[]> = {
  it: ["The reported fault no longer occurs", "Steps to reproduce documented", "No regression in the working flow"],
  eng: ["Rate basis stated for every line", "Quantities traceable to the drawings", "Contingency shown separately"],
  biz: ["Every entry reconciled or listed as an exception", "Totals tie to the source statement", "Method documented"],
  design: ["Editable source files delivered", "Two sizes exported", "Prices/text in their own editable layer"],
  social: ["Respondents' own words preserved", "Identifying details separated", "Consent terms honoured"],
  agri: ["Findings sourced to the sample", "Assumptions stated", "Data sheet delivered"],
  content: ["Every factual claim carries a source", "Within 10% of the agreed length", "No AI-generated filler"],
  mkt: ["Targeting rationale stated", "Assets delivered in required sizes", "Metrics to track defined"],
  admin: ["Every record entered into the agreed columns", "Unreadable items flagged, not guessed", "Format consistent"],
};

// The trial: same features, a fraction of the volume, one deliberate ambiguity,
// and the sector's proof of work (written so the judge can check it in the files).
export const TRIAL_PROOF: Record<string, string> = {
  it: "include a README that says how to run or test it",
  design: "export the design at both sizes and include the editable source file",
  content: "cite the source for every fact you state",
  admin: "use one row per record under a header row of the agreed columns",
  agri: "tie each finding to figures from the sample and state your assumptions",
  biz: "show the totals and list every entry that does not reconcile",
  eng: "state the quantity and the rate basis for every line",
  social: "quote each respondent's own words under the theme you coded",
  mkt: "state the target audience and the metric you would track",
};

export const TRIAL_SHAPE: Record<string, { what: string; catch_: string }> = {
  it: {
    what: "reproduce the fault once and write down exactly what you saw",
    catch_: "one of the steps will not reproduce — say so rather than inventing a cause",
  },
  design: {
    what: "lay out one section at two different sizes",
    catch_: "the prices must sit in their own editable layer, because they will change",
  },
  content: {
    what: "write three entries to the voice already on the site",
    catch_: "one item's name differs between the tag and the site — ask, do not choose",
  },
  admin: {
    what: "enter twelve records into the agreed columns",
    catch_: "three are hard to read — flag them, never guess",
  },
  agri: {
    what: "read one season of the sample and write two findings",
    catch_: "the evidence is thin — say where you are guessing",
  },
  biz: {
    what: "reconcile one week against the sample statement",
    catch_: "two entries will not reconcile — list them instead of forcing a match",
  },
  eng: {
    what: "quantify one section from the sample drawing",
    catch_: "one dimension is missing — flag it rather than assuming a value",
  },
  social: {
    what: "code three sample interview responses into the agreed themes",
    catch_: "one response fits no theme — note it instead of forcing a fit",
  },
  mkt: {
    what: "draft one ad and the targeting for a single segment",
    catch_: "the segment data is partial — state what you would confirm first",
  },
};
export const TRIAL_FALLBACK = TRIAL_SHAPE.admin;

export function trialSize(hours: number): number {
  // Capped at one hour, never more than an eighth of the job, rounded to 5.
  return Math.max(25, Math.min(60, Math.round((hours * 60) / 8 / 5) * 5));
}

/** Map estimated hours to a task level string. */
export function toTaskLevelStr(hours: number): TaskLevelStr {
  return hours <= 5 ? "micro" : hours <= 14 ? "standard" : "advanced";
}

export function priceCheck(
  totalFee: number,
  totalHours: number,
  sectorId: string
): PriceVerdict {
  const floor = RATE_FLOOR[sectorId] ?? 300;
  const rate = totalHours > 0 ? Math.round(totalFee / totalHours) : 0;
  const shortfall = Math.max(0, Math.round((floor - rate) * totalHours));
  const gapPct = floor > 0 ? Math.round(((floor - rate) / floor) * 100) : 0;
  const level: PriceLevel = rate >= floor ? "ok" : gapPct >= 25 ? "blocked" : "low";

  let message: string;
  if (level === "ok") {
    message = `৳${rate} an hour, at or above the ৳${floor} floor for this sector. Cleared for release.`;
  } else if (level === "low") {
    message = `৳${rate} an hour sits ${gapPct}% under the ৳${floor} floor. Releasable, but it will sit unmatched — raise it by about ৳${shortfall} or cut scope.`;
  } else {
    message = `৳${rate} an hour is ${gapPct}% under the ৳${floor} floor. Blocked from release: heavy work cannot be posted at a light rate. Raise the budget by ৳${shortfall} or cut the scope.`;
  }

  return { rate, floor, fair: level === "ok", shortfall, gapPct, level, message };
}

/**
 * Build the trial as a small copy of the real task: the brief's own features at
 * trial volume (see ai.judge planTrial), the sector's proof of work, and the
 * deliberate ambiguity. `note` is a client's change request when rebuilding.
 */
export function buildTrial(sectorId: string, hours: number, brief = "", note?: string): BuiltTrial {
  const shape = TRIAL_SHAPE[sectorId] ?? TRIAL_FALLBACK;
  const plan = planTrial({
    brief,
    hours,
    minutes: trialSize(hours),
    what: shape.what,
    catch_: sectorId === "it" && brief && !isFaultBrief(brief) ? IT_BUILD_CATCH : shape.catch_,
    proof: TRIAL_PROOF[sectorId] ?? TRIAL_PROOF.admin,
    note,
  });
  return {
    title: plan.title,
    brief: plan.brief,
    minutes: plan.minutes,
    mirrors: plan.mirrors,
    acceptance: plan.requirements,
  };
}

export interface ScopeOptions {
  sectorId?: string;
  budget?: number;
}

/** Scope a brief into one priced task plus its trial. */
export function scopeOne(brief: string, opts: ScopeOptions = {}): ScopeResult {
  const text = (brief ?? "").trim();
  const hits = SIGNALS.filter((s) => s.re.test(text));

  const tally = new Map<string, number>();
  for (const h of hits) tally.set(h.sector, (tally.get(h.sector) ?? 0) + h.weight);

  const sectorId =
    opts.sectorId ??
    [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "admin";

  const base = SECTOR_BASE[sectorId] ?? SECTOR_BASE.admin;

  const scaleMatch = text.match(SCALE);
  const scale = scaleMatch ? Math.min(2, 1 + Number(scaleMatch[1]) / 4000) : 1;
  const urgent = URGENCY.test(text);

  const estHours = Math.max(2, Math.round(base.hours * scale));
  const suggestedFee =
    Math.round((estHours * base.rate * (urgent ? 1.15 : 1)) / 100) * 100;

  // The fee actually posted: the client's budget if given, else the suggestion.
  const fee = opts.budget && opts.budget > 0 ? opts.budget : suggestedFee;

  const level: TaskLevelStr =
    estHours <= 5 ? "micro" : estHours <= 14 ? "standard" : "advanced";
  const complexity: Complexity =
    estHours > 34 ? "High" : estHours > 20 ? "Medium" : "Low";

  const words = text.split(/\s+/).filter(Boolean).length;
  const evidence = [...tally.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.max(
    58,
    Math.min(95, 52 + evidence * 5 + Math.min(18, Math.floor(words / 6)))
  );

  const primary = hits[0]?.label ?? "general support work";
  const title = titleCase(primary);
  const desc = `Work in ${base.name}: ${primary}. Priced as one task with one fee, so the cost is known before anyone starts.`;
  const summary = `Detected a single strand of work in ${base.name} (${primary}). Scoped as one task at ${estHours}h so the cost is agreed up front.${urgent ? " The brief signals urgency — a 15% expedite premium is applied." : ""}`;

  const risks = [
    SECTOR_RISK[sectorId] ?? SECTOR_RISK.admin,
    "The brief may omit a detail that changes the work; anything agreed in chat is added to the acceptance criteria.",
  ];
  if (urgent) {
    risks.push(
      "Urgency is flagged — the sequence cannot be shortened without dropping a verification step."
    );
  }

  return {
    sectorId,
    summary,
    complexity,
    confidence,
    estHours,
    suggestedFee,
    level,
    skills: SECTOR_SKILLS[sectorId] ?? SECTOR_SKILLS.admin,
    risks,
    acceptance: SECTOR_ACCEPTANCE[sectorId] ?? SECTOR_ACCEPTANCE.admin,
    title,
    desc,
    signals: hits.slice(0, 6).map((h) => ({ label: h.label, weight: h.weight })),
    trial: buildTrial(sectorId, estHours, text),
    price: priceCheck(fee, estHours, sectorId),
  };
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ── Trial-attempt evaluation ──

export interface AttemptEvaluation {
  score: number; // 0..100 quality
  completion: number; // 0..100 share of the trial's requirements delivered
  shortlisted: boolean; // completion >= SHORTLIST_BAR -> sent to the moderator
  checklist: ChecklistItem[];
  flags: string[];
  verdict: string; // public reasoning (shown to the moderator and client)
  coaching: string; // private, for this student only
  breakdown: { dim: string; score: number; max: number }[];
  source: "engine" | "model";
}

export interface AttemptInput {
  trialTitle: string;
  trialBrief: string;
  requirements: string[];
  trialMinutes: number;
  summary: string;
  minutesTaken: number;
  attachments?: Attachment[];
  taskAcceptance?: string[];
  peers?: string[]; // other students' readable work on the same task (copy check)
}

/**
 * Deterministic evaluation of a trial attempt — used when no model is
 * configured. Every requirement of the trial is checked against the uploaded
 * files (see ai.judge), giving a completion % and a per-requirement checklist.
 */
export function evaluateAttemptDeterministic(input: AttemptInput): AttemptEvaluation {
  return judgeAttempt(input);
}

/** Fold a model's per-requirement judgement into the engine's integrity facts. */
export function evaluateWithModel(
  input: AttemptInput,
  model: Parameters<typeof mergeModelJudgement>[1]
): AttemptEvaluation {
  return mergeModelJudgement(input, model);
}
