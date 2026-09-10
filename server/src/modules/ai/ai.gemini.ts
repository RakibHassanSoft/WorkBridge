import { env } from "@/config/env";
import type { ScopeResult, AttemptEvaluation } from "./ai.engine";
import { RATE_FLOOR } from "./ai.engine";

/**
 * Gemini-backed AI. Talks to the Generative Language REST API with the
 * project's key. Every function returns null on any failure (no key, network,
 * bad JSON) so the caller can fall back to the deterministic engine — the app
 * never hard-depends on the model being reachable.
 */

const KNOWN_SECTORS = Object.keys(RATE_FLOOR).concat("content"); // floors cover all 9

export const geminiEnabled = (): boolean => Boolean(env.geminiApiKey);

async function callGemini<T>(prompt: string, timeoutMs = 12000): Promise<T | null> {
  if (!env.geminiApiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Ask Gemini to scope a brief. Returns a partial we merge/validate in the service. */
export async function geminiScope(
  brief: string,
  opts: { budget?: number } = {}
): Promise<Partial<ScopeResult> | null> {
  const prompt = `You are the scoping engine for WorkBridge, a verified-work platform in Bangladesh that connects small businesses with university students.
Read this client brief and return STRICT JSON only, no prose.

Brief: """${brief}"""
${opts.budget ? `Client budget (BDT): ${opts.budget}` : ""}

Return JSON with exactly these keys:
{
  "sectorId": one of ${JSON.stringify(KNOWN_SECTORS)},
  "title": short task title,
  "desc": one-sentence description,
  "summary": 1-2 sentence plain-language restatement,
  "complexity": "Low" | "Medium" | "High",
  "estHours": integer hours of work,
  "suggestedFee": integer BDT (roughly estHours * a fair hourly rate for the sector),
  "skills": array of 3-5 skills,
  "risks": array of 2-3 risks the brief leaves unresolved,
  "acceptance": array of 3-5 acceptance criteria,
  "trial": { "title": string, "brief": string, "minutes": integer 25-60, "mirrors": string explaining what part of the real task this tests, "acceptance": array of 3 criteria }
}
The trial must be a small copy of the real task (same skills, a fraction of the volume, under an hour) with one deliberate ambiguity the applicant should flag rather than guess.`;

  const out = await callGemini<Partial<ScopeResult>>(prompt);
  if (!out || !out.sectorId || !KNOWN_SECTORS.includes(out.sectorId)) return null;
  return out;
}

/** Ask Gemini to score a trial attempt. */
export async function geminiEvaluateAttempt(input: {
  trialTitle: string;
  trialBrief: string;
  trialMirrors: string;
  summary: string;
  minutesTaken: number;
}): Promise<AttemptEvaluation | null> {
  const prompt = `You are the evaluator for a WorkBridge trial task. Students apply to real work by doing a small trial. Score this attempt.
Return STRICT JSON only.

Trial title: ${input.trialTitle}
Trial brief: ${input.trialBrief}
What the trial is really testing: ${input.trialMirrors}
The applicant's submission: """${input.summary}"""
Minutes they took: ${input.minutesTaken}

Reward doing the work AND flagging the deliberate ambiguity rather than guessing past it. Return JSON:
{
  "score": integer 0-100,
  "verdict": one sentence shown to everyone explaining the score,
  "coaching": one sentence of private advice for this student only,
  "breakdown": [ { "dim": string, "score": integer, "max": 5 }, ... 3-4 items ]
}`;

  const out = await callGemini<AttemptEvaluation>(prompt);
  if (!out || typeof out.score !== "number") return null;
  out.score = Math.max(0, Math.min(100, Math.round(out.score)));
  if (!Array.isArray(out.breakdown)) out.breakdown = [];
  return out;
}
