import { env } from "@/config/env";
import type { ScopeResult } from "./ai.engine";
import { RATE_FLOOR } from "./ai.engine";
import { Attachment } from "./attachments";
import { SHORTLIST_BAR } from "./ai.judge";

/**
 * Gemini-backed AI. Talks to the Generative Language REST API with the
 * project's key. Every function returns null on any failure (no key, network,
 * bad JSON) so the caller falls back to the deterministic engine — the app
 * never hard-depends on the model being reachable.
 */

const KNOWN_SECTORS = Object.keys(RATE_FLOOR); // floors cover all 9 sectors

export const geminiEnabled = (): boolean => Boolean(env.geminiApiKey);

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

async function callGemini<T>(parts: Part[], opts: { timeoutMs?: number; temperature?: number; retries?: number } = {}): Promise<T | null> {
  if (!env.geminiApiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`;
  const attempts = 1 + (opts.retries ?? 1);

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.geminiApiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json", temperature: opts.temperature ?? 0.2 },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // 4xx other than rate limiting will not get better on a retry.
        if (res.status !== 429 && res.status < 500) return null;
        continue;
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) continue;
      return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
    } catch {
      /* network / abort / bad JSON — retry, then give up */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

const TRIAL_RULES = `The trial must be a SMALL COPY of the real task: the same features and the same kind of deliverable, a fraction of the volume, doable in 25-60 minutes. It must contain exactly one deliberate ambiguity the applicant should flag rather than guess.
"requirements" is the checklist an evaluator will tick against the files the student uploads. Write 4-6 short, concrete, checkable requirements:
- one per trial feature, each naming the concrete thing that must be in the files, with any count (e.g. "Produce, at trial size: 12 records entered in the agreed columns");
- one proof-of-work requirement for the sector (e.g. a README with how to run it, the source file, a cited source);
- exactly one that starts with "Flag the unclear point instead of guessing:" followed by the planted ambiguity;
- the last one exactly: "Upload the files you produced (not only a description)".`;

type GeminiTrial = { title?: string; brief?: string; minutes?: number; mirrors?: string; requirements?: string[] };

/** Ask Gemini to scope a brief. Returns a partial we merge/validate in the service. */
export async function geminiScope(
  brief: string,
  opts: { budget?: number } = {}
): Promise<(Partial<ScopeResult> & { trialPlan?: GeminiTrial; features?: string[] }) | null> {
  const prompt = `You are the scoping engine for WorkBridge, a verified-work platform in Bangladesh that connects small businesses with university students.
Read this client brief (and any attached documents) and return STRICT JSON only, no prose.

Brief: """${brief.slice(0, 30000)}"""
${opts.budget ? `Client budget (BDT): ${opts.budget}` : ""}

Return JSON with exactly these keys:
{
  "sectorId": one of ${JSON.stringify(KNOWN_SECTORS)},
  "title": short task title,
  "desc": one-sentence description,
  "summary": 1-2 sentence plain-language restatement,
  "features": array of the distinct pieces of work the brief asks for (2-6 short phrases),
  "complexity": "Low" | "Medium" | "High",
  "estHours": integer hours of work,
  "suggestedFee": integer BDT (roughly estHours * a fair hourly rate for the sector),
  "skills": array of 3-5 skills,
  "risks": array of 2-3 risks the brief leaves unresolved,
  "acceptance": array of 3-5 acceptance criteria for the real task,
  "trial": { "title": string, "brief": string (what to do, at trial size, in 2-4 sentences), "minutes": integer 25-60, "mirrors": string explaining which features of the real task this copies, "requirements": array of strings }
}
${TRIAL_RULES}`;

  const out = await callGemini<Partial<ScopeResult> & { features?: string[]; trial?: GeminiTrial }>([{ text: prompt }], { temperature: 0.3 });
  if (!out || !out.sectorId || !KNOWN_SECTORS.includes(out.sectorId)) return null;
  const { trial, ...rest } = out;
  return { ...rest, trialPlan: normaliseTrial(trial) ?? undefined };
}

/** Rebuild the trial after the client asked for changes. */
export async function geminiRebuildTrial(input: {
  brief: string;
  sectorName: string;
  hours: number;
  current: { title: string; brief: string; requirements: string[] };
  note: string;
}): Promise<GeminiTrial | null> {
  const prompt = `You wrote a trial task for WorkBridge applicants; the client asked for changes. Rewrite the trial so it follows the client's instruction while still being a small copy of their real task. Return STRICT JSON only.

Real task brief: """${input.brief.slice(0, 20000)}"""
Sector: ${input.sectorName}. Real task: about ${input.hours} hours.
Current trial title: ${input.current.title}
Current trial brief: ${input.current.brief}
Current requirements:
- ${input.current.requirements.join("\n- ")}
Client's change request: """${input.note}"""

Return: { "title": string, "brief": string, "minutes": integer 25-60, "mirrors": string, "requirements": array of strings }
${TRIAL_RULES}
The client's instruction must be reflected in the brief and in at least one requirement.`;
  return normaliseTrial(await callGemini<GeminiTrial>([{ text: prompt }], { temperature: 0.3 }));
}

function normaliseTrial(t: GeminiTrial | null | undefined): GeminiTrial | null {
  if (!t || typeof t !== "object" || !t.title || !t.brief) return null;
  let reqs = Array.isArray(t.requirements) ? t.requirements.map((r) => String(r).trim()).filter(Boolean).slice(0, 7) : [];
  const UPLOAD = "Upload the files you produced (not only a description)";
  reqs = reqs.filter((r) => !/^upload\b/i.test(r));
  if (!reqs.some((r) => /^flag the unclear point/i.test(r))) reqs.push("Flag the unclear point instead of guessing: anything the sample leaves unclear");
  reqs.push(UPLOAD);
  if (reqs.length < 3) return null;
  return {
    title: String(t.title).slice(0, 200),
    brief: String(t.brief).slice(0, 2000) + ` Upload the files you produce; the AI checks every requirement against them and ${SHORTLIST_BAR}% completion sends you to the moderator.`,
    minutes: typeof t.minutes === "number" ? t.minutes : undefined,
    mirrors: t.mirrors ? String(t.mirrors).slice(0, 600) : undefined,
    requirements: reqs,
  };
}

// ── Evaluation ──

const MAX_INLINE_BYTES = 12 * 1024 * 1024; // keep the request well under Gemini's inline limit
const MAX_INLINE_FILES = 8;
const VISUAL = /^(image\/(png|jpeg|jpg|webp|heic|heif)|application\/pdf)$/i;

export interface ModelJudgement {
  checklist: { status: string; evidence: string }[];
  quality: number;
  verdict: string;
  coaching: string;
  flags: string[];
}

/** Ask Gemini to judge a trial attempt requirement by requirement, looking at the files. */
export async function geminiJudgeAttempt(input: {
  trialTitle: string;
  trialBrief: string;
  requirements: string[];
  trialMinutes: number;
  summary: string;
  minutesTaken: number;
  attachments?: Attachment[];
}): Promise<ModelJudgement | null> {
  const files = (input.attachments ?? []).flatMap((a) => a.files ?? []);
  const textBlocks: string[] = [];
  const inline: Part[] = [];
  let inlineBytes = 0;
  let textBudget = 60000;

  for (const f of files) {
    const header = `### FILE: ${f.name} (${f.mime || "unknown type"}, ${f.size} bytes)`;
    if (f.content && f.content.trim()) {
      const body = f.content.slice(0, Math.max(0, Math.min(20000, textBudget)));
      textBudget -= body.length;
      textBlocks.push(`${header}\n${body}${body.length < f.content.length ? "\n[…truncated]" : ""}`);
    } else if (f.data && VISUAL.test(f.mime) && inline.length < MAX_INLINE_FILES && inlineBytes + f.data.length <= MAX_INLINE_BYTES) {
      inlineBytes += f.data.length;
      textBlocks.push(`${header}\n[attached below as ${f.mime} — look at it]`);
      inline.push({ text: `The next part is the file "${f.name}":` }, { inline_data: { mime_type: f.mime.toLowerCase().replace("image/jpg", "image/jpeg"), data: f.data } });
    } else {
      textBlocks.push(`${header}\n[binary file — content not available; judge only from its name, type and size]`);
    }
  }

  const prompt = `You are the strict, fair evaluator for a WorkBridge trial. Students apply for paid work by doing this small trial; your judgement decides whether their attempt reaches the ${SHORTLIST_BAR}% completion bar and is sent to a human moderator. Return STRICT JSON only.

TRIAL: ${input.trialTitle}
TRIAL BRIEF: ${input.trialBrief}
TIME BUDGET: ${input.trialMinutes} min; the student reports ${input.minutesTaken} min.

REQUIREMENTS (judge each one, in this order):
${input.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

STUDENT'S NOTE: """${(input.summary ?? "").slice(0, 4000)}"""

UPLOADED FILES (${files.length}):
${textBlocks.join("\n\n") || "(no files uploaded)"}

Rules:
- Judge the FILES, not the note. The note can explain; it is not evidence that work was done.
- "met" = the files clearly contain that work, complete, at the size asked. "partial" = started, incomplete, wrong count, or low quality. "missing" = not in the files.
- Text that only repeats the brief or the requirement, placeholder text (lorem ipsum, TODO), gibberish, or empty files count as missing.
- For images/PDFs attached below, look at them and judge what they actually show.
- The "Flag the unclear point" requirement is met only if the student explicitly raised that ambiguity (in the files or the note) instead of silently choosing.
- Evidence must cite the file name and what you saw in it (quote a few words), or say exactly what is missing.

Return:
{
  "checklist": [ { "status": "met" | "partial" | "missing", "evidence": string } ... exactly ${input.requirements.length} items, same order ],
  "quality": integer 0-100 for the quality of the work that was delivered,
  "verdict": one or two sentences for the moderator and the client,
  "coaching": one or two sentences of private, specific advice for this student,
  "flags": array of integrity problems you noticed (empty array if none)
}`;

  const out = await callGemini<ModelJudgement>([{ text: prompt }, ...inline], { timeoutMs: inline.length ? 45000 : 30000, temperature: 0.1 });
  if (!out || !Array.isArray(out.checklist) || out.checklist.length === 0) return null;
  return {
    checklist: out.checklist.slice(0, input.requirements.length).map((c) => ({ status: String(c?.status ?? ""), evidence: String(c?.evidence ?? "") })),
    quality: Number(out.quality),
    verdict: String(out.verdict ?? ""),
    coaching: String(out.coaching ?? ""),
    flags: Array.isArray(out.flags) ? out.flags.map(String) : [],
  };
}
