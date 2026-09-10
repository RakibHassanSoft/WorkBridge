import {
  scopeOne,
  priceCheck,
  evaluateAttemptDeterministic,
  ScopeResult,
  PriceVerdict,
  ScopeOptions,
  AttemptEvaluation,
  toTaskLevelStr,
} from "./ai.engine";
import { geminiScope, geminiEvaluateAttempt, geminiEnabled } from "./ai.gemini";

/**
 * Public AI module API. Uses Gemini when GEMINI_API_KEY is set and the call
 * succeeds; otherwise falls back to the deterministic engine. Callers depend
 * only on this service, so the backend swaps implementations transparently.
 *
 * The fair-price check is ALWAYS computed server-side from the numbers — the
 * model never decides whether a fee clears the sector floor.
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
        return {
          ...base,
          sectorId,
          title: g.title ?? base.title,
          desc: g.desc ?? base.desc,
          summary: g.summary ?? base.summary,
          complexity: g.complexity ?? base.complexity,
          estHours,
          suggestedFee,
          level: toTaskLevelStr(estHours),
          skills: nonEmptyArr(g.skills, base.skills),
          risks: nonEmptyArr(g.risks, base.risks),
          acceptance: nonEmptyArr(g.acceptance, base.acceptance),
          trial: g.trial
            ? {
                title: g.trial.title ?? base.trial.title,
                brief: g.trial.brief ?? base.trial.brief,
                minutes: clampInt(g.trial.minutes, base.trial.minutes, 25, 60),
                mirrors: g.trial.mirrors ?? base.trial.mirrors,
                acceptance: nonEmptyArr(g.trial.acceptance, base.trial.acceptance),
              }
            : base.trial,
          price: priceCheck(fee, estHours, sectorId), // authoritative
        };
      }
    }
    return base;
  },

  checkPrice(fee: number, hours: number, sectorId: string): PriceVerdict {
    return priceCheck(fee, hours, sectorId);
  },

  async evaluateAttempt(input: {
    trialTitle: string;
    trialBrief: string;
    trialMirrors: string;
    trialMinutes: number;
    summary: string;
    minutesTaken: number;
  }): Promise<AttemptEvaluation> {
    if (geminiEnabled()) {
      const g = await geminiEvaluateAttempt(input);
      if (g) return g;
    }
    return evaluateAttemptDeterministic({
      summary: input.summary,
      minutesTaken: input.minutesTaken,
      trialMinutes: input.trialMinutes,
    });
  },
};

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(min, Math.min(max, n));
}
function nonEmptyArr(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) && v.length ? (v as string[]) : fallback;
}

export type AiService = typeof aiService;
