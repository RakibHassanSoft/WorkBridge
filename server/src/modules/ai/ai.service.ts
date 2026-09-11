import {
  scopeOne,
  priceCheck,
  buildTrial,
  evaluateAttemptDeterministic,
  evaluateWithModel,
  ScopeResult,
  PriceVerdict,
  ScopeOptions,
  AttemptEvaluation,
  AttemptInput,
  BuiltTrial,
  toTaskLevelStr,
  trialSize,
} from "./ai.engine";
import { geminiScope, geminiJudgeAttempt, geminiRebuildTrial, geminiEnabled } from "./ai.gemini";

/**
 * Public AI module API. Uses Gemini when GEMINI_API_KEY is set and the call
 * succeeds; otherwise falls back to the deterministic engine. Callers depend
 * only on this service, so the backend swaps implementations transparently.
 *
 * Two things are ALWAYS computed server-side, whatever the model says:
 *   - the fair-price check (from the numbers), and
 *   - the trial completion % (from the per-requirement checklist, with the
 *     engine's integrity caps: no files, empty files, gibberish, pasted brief).
 */
export const aiService = {
  async scope(brief: string, opts: ScopeOptions = {}): Promise<ScopeResult> {
    const base = scopeOne(brief, opts); // deterministic baseline + defaults

    if (geminiEnabled()) {
      const g = await geminiScope(brief, { budget: opts.budget });
      if (g) {
        const sectorId = g.sectorId ?? base.sectorId;
        const estHours = clampInt(g.estHours, base.estHours, 1, 400);
        const suggestedFee = clampInt(g.suggestedFee, base.suggestedFee, 100, 10_000_000);
        const fee = opts.budget && opts.budget > 0 ? opts.budget : suggestedFee;
        const engineTrial = sectorId === base.sectorId && estHours === base.estHours ? base.trial : buildTrial(sectorId, estHours, brief);
        const t = g.trialPlan;
        return {
          ...base,
          sectorId,
          title: str(g.title, base.title),
          desc: str(g.desc, base.desc),
          summary: str(g.summary, base.summary),
          complexity: g.complexity === "Low" || g.complexity === "Medium" || g.complexity === "High" ? g.complexity : base.complexity,
          estHours,
          suggestedFee,
          level: toTaskLevelStr(estHours),
          skills: nonEmptyArr(g.skills, base.skills),
          risks: nonEmptyArr(g.risks, base.risks),
          acceptance: nonEmptyArr(g.acceptance, base.acceptance),
          trial: t
            ? {
                title: str(t.title, engineTrial.title),
                brief: str(t.brief, engineTrial.brief),
                minutes: clampInt(t.minutes, trialSize(estHours), 25, 60),
                mirrors: str(t.mirrors, engineTrial.mirrors),
                acceptance: nonEmptyArr(t.requirements, engineTrial.acceptance),
              }
            : engineTrial,
          price: priceCheck(fee, estHours, sectorId), // authoritative
        };
      }
    }
    return base;
  },

  /** Rebuild a trial after the client asked for changes (their note becomes a requirement). */
  async rebuildTrial(input: {
    brief: string;
    sectorId: string;
    sectorName?: string;
    hours: number;
    current: { title: string; brief: string; requirements: string[] };
    note: string;
  }): Promise<BuiltTrial> {
    const engine = buildTrial(input.sectorId, input.hours, input.brief, input.note);
    if (geminiEnabled()) {
      const t = await geminiRebuildTrial({
        brief: input.brief,
        sectorName: input.sectorName ?? input.sectorId,
        hours: input.hours,
        current: input.current,
        note: input.note,
      });
      if (t) {
        return {
          title: str(t.title, engine.title),
          brief: str(t.brief, engine.brief),
          minutes: clampInt(t.minutes, engine.minutes, 25, 60),
          mirrors: str(t.mirrors, engine.mirrors),
          acceptance: nonEmptyArr(t.requirements, engine.acceptance),
        };
      }
    }
    return engine;
  },

  checkPrice(fee: number, hours: number, sectorId: string): PriceVerdict {
    return priceCheck(fee, hours, sectorId);
  },

  /** Judge a trial attempt: every requirement against the uploaded files -> completion %. */
  async evaluateAttempt(input: AttemptInput): Promise<AttemptEvaluation> {
    if (geminiEnabled()) {
      const g = await geminiJudgeAttempt(input);
      if (g) return evaluateWithModel(input, g);
    }
    return evaluateAttemptDeterministic(input);
  },
};

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(min, Math.min(max, n));
}
function nonEmptyArr(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) && v.length ? (v as unknown[]).map(String).filter(Boolean) : fallback;
}
function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export type AiService = typeof aiService;
