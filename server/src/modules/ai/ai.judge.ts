/**
 * BDFreshers AI judge — the part of the AI layer that
 *   1. turns a client's brief into a SMALL COPY of the real task (same
 *      features, a fraction of the volume) with a checkable requirement list, and
 *   2. evaluates what a student uploads for that trial: every requirement is
 *      checked against the files, a completion % is computed, and the attempt is
 *      shortlisted for the moderator only if completion reaches SHORTLIST_BAR.
 *
 * Pure TypeScript, no imports, no network — the same file lives in the server
 * (server/src/modules/ai/ai.judge.ts) and the frontend demo backend
 * (src/lib/judge.ts). Keep the two copies identical.
 *
 * The deterministic judge is the fallback when no model is configured AND the
 * integrity guard for the model's answer: facts it can prove (nothing uploaded,
 * empty files, gibberish, the brief pasted back) cap the completion whatever
 * the model says.
 */

// ─────────────────────────── Shapes ───────────────────────────

export interface JudgeFile {
  name: string;
  mime: string;
  size: number;
  content: string | null; // extracted text; null for binary
  data?: string | null; // optional base64 of an image/PDF (sent to the model, never stored)
}
export interface JudgeAttachment {
  kind: "file" | "folder";
  name: string;
  files: JudgeFile[];
}

export type ReqStatus = "met" | "partial" | "missing";

export interface ChecklistItem {
  requirement: string;
  status: ReqStatus;
  evidence: string; // why — quotes the file / names the gap
}

export interface JudgeResult {
  score: number; // 0..100 overall quality
  completion: number; // 0..100 share of the trial's requirements actually delivered
  shortlisted: boolean; // completion >= SHORTLIST_BAR
  checklist: ChecklistItem[];
  flags: string[]; // integrity problems found in the upload
  verdict: string; // public, shown to the moderator and the client
  coaching: string; // private, for this student only
  breakdown: { dim: string; score: number; max: number }[];
  source: "engine" | "model";
}

/** Completion a trial attempt needs before the AI sends it to the moderator. */
export const SHORTLIST_BAR = 90;

// ─────────────────────────── Text helpers ───────────────────────────

const STOP = new Set(
  (
    "a an the and or but if then than so of to in on at by for with from into onto over under about as is are was were be been being " +
    "it its this that these those there their them they we our ours you your yours i me my he she his her him us who whom which what " +
    "when where why how all any each every some such no not only own same too very can could should would will shall may might must " +
    "do does did done doing have has had having also just more most other else again once here out up down off per via etc " +
    "please need needs want wants like make makes made get gets got keep keeps let lets use used using want new one two three " +
    "small smaller version copy trial task real work job client student sample attached below above following include includes including " +
    "deliver delivered deliverable file files upload uploaded show showing shows write written build built create created provide provided " +
    "agreed working every already proper properly good clean clear nice well way thing things produce trial-size size-d " +
    "see state states stated simple simply whether list lists don't doesn't didn't won't isn't aren't dont doesnt"
  ).split(/\s+/)
);

// Leading filler that carries no feature information.
const FILLER =
  /^(?:(?:hi|hello|dear)\b[^,]*,\s*)?(?:(?:we|i)\s+(?:would\s+like|want|need|are\s+looking|am\s+looking)\s+(?:to\s+|for\s+)?(?:someone\s+to\s+|a\s+student\s+to\s+|you\s+to\s+)?|(?:can|could)\s+(?:you|someone)\s+|please\s+|looking\s+for\s+(?:someone\s+to\s+)?|help\s+(?:us|me)\s+(?:to\s+)?|i\s+need\s+|we\s+need\s+)/i;

const NUM_WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
};

function stem(w: string): string {
  let s = w.toLowerCase();
  if (s.length > 5 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && /(ches|shes|xes|sses)$/.test(s)) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss") && !s.endsWith("us")) s = s.slice(0, -1);
  // flagged -> flagg -> flag, planning -> plann -> plan
  if (s !== w.toLowerCase() && /([b-df-hj-np-tv-z])\1$/.test(s) && !/(ll|ss|zz)$/.test(s)) s = s.slice(0, -1);
  return s;
}

/** Words match on their stem, or on a shared 5-letter root (package ~ packaging). */
const root = (w: string) => (w.length >= 5 ? "~" + w.slice(0, 5) : w);

/** Content words of a phrase, stemmed, stop-words removed, unique, in order. */
export function keyTerms(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of (text ?? "").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? []) {
    const w = raw.replace(/'s$/, "");
    if (w.length < 3 || STOP.has(w) || /^\d/.test(w) || NUM_WORDS[w]) continue;
    const s = stem(w);
    if (s.length < 3 || STOP.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function stemSet(text: string): Set<string> {
  const set = new Set<string>();
  for (const raw of (text ?? "").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? []) {
    const w = raw.replace(/'s$/, "");
    if (w.length < 3) continue;
    const st = stem(w);
    set.add(st);
    set.add(w);
    set.add(root(st));
  }
  return set;
}

// Small synonym groups so real work in its own words still matches ("stock
// overview page" satisfies "inventory dashboard").
const SYNONYMS: string[][] = [
  ["inventory", "stock"],
  ["dashboard", "panel", "overview", "page", "screen", "view"],
  ["report", "summary", "total", "breakdown"],
  ["record", "row", "entry", "entri"],
  ["spreadsheet", "sheet", "csv", "excel", "xlsx", "table"],
  ["description", "blurb", "copy", "listing"],
  ["translate", "translat", "translation", "bangla", "bengali"],
  ["photo", "photograph", "image", "picture", "shot"],
  ["label", "sticker", "tag"],
  ["fix", "patch", "resolve", "solution", "repair"],
  ["checkout", "payment", "pay", "gateway"],
  ["campaign", "advert", "post", "promotion"],
  ["finding", "insight", "result", "conclusion"],
  ["survey", "questionnaire", "interview"],
  ["price", "cost", "rate", "pric"],
  ["customer", "client", "buyer", "user"],
  ["column", "field", "header"],
  ["plan", "programme", "program", "scheme", "treatment", "strategy"],
  ["delivery", "deliver", "pickup", "dispatch", "shipping", "courier"],
  ["payment", "transaction", "txn", "takings", "receipt", "wallet"],
  ["adequate", "sufficient", "safe", "acceptable", "inadequate", "result", "verdict", "pass", "fail"],
  ["match", "matched", "unmatched", "mismatch", "reconcile", "reconciled"],
  ["status", "state", "progress", "stage"],
  ["fertiliser", "fertilizer", "npk", "urea", "manure", "compost"],
  ["best", "better", "highest", "optimal", "top"],
  ["student", "undergraduate", "university", "campus"],
  ["evidence", "data", "sample"],
  ["thin", "small", "limited", "few", "weak"],
  ["discount", "offer", "sale", "off"],
  ["transcript", "interview", "respondent"],
  ["theme", "category", "code", "coded"],
  ["quantity", "qty", "quantities", "takeoff"],
  ["brickwork", "brick", "masonry"],
  ["plaster", "rendering", "render"],
];
const SYN = new Map<string, string[]>();
for (const g of SYNONYMS) for (const w of g) SYN.set(stem(w), g.map(stem));

function hasTerm(set: Set<string>, term: string): boolean {
  if (set.has(term) || set.has(root(term))) return true;
  const alts = SYN.get(term) ?? SYN.get(stem(term));
  return !!alts && alts.some((a) => set.has(a) || set.has(root(a)));
}

function sentences(text: string): string[] {
  return (text ?? "")
    .replace(/\r/g, "")
    .split(/(?<=[.!?।])\s+|\n+|;\s*/)
    .map((s) => s.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, "").trim())
    .filter((s) => s.length > 0);
}

function capFirst(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:—-]+$/, "") + "…";
}

// ─────────────────────────── 1. Features → trial ───────────────────────────

/**
 * Pull the distinct pieces of work ("features") out of a brief. A feature is a
 * clause that names something to produce or fix; list items and "X and Y"
 * clauses become separate features when both halves carry real content.
 */
// A new piece of work starts with a verb or an article ("…and a daily report",
// "…, then translate them"); anything else continues the previous one
// ("brickwork and plaster", "name, phone, area and date", "Facebook and Instagram").
const STARTS_WORK =
  /^(?:a|an|the|some|any|its|their|also|then|build|create|make|design|redesign|write|rewrite|translate|add|fix|set|list|show|see|enter|record|send|prepare|draw|redraw|measure|analy[sz]e|code|plan|run|test|export|update|clean|reconcile|check|find|calculate|compare|summari[sz]e|publish|post|photograph|edit|review|collect|survey|interview|map|track|report|integrate|connect|migrate|digiti[sz]e|convert|draft|research|organi[sz]e|schedule|manage|optimi[sz]e|implement|develop|produce|provide|include|highlight|identify|estimate|count|label|upload|share|shoot|film|record|train|teach|audit|verify|improve|launch|setup)\b/i;

export function extractFeatures(brief: string, max = 6): string[] {
  const main = (brief ?? "").split(/\n---\s*Attached documents\s*---/i)[0];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const sent of sentences(main)) {
    let s = sent.replace(FILLER, "").replace(/^(?:also|and|then|plus)\s+/i, "").replace(/[.!?।]+$/, "").trim();
    if (!s) continue;
    // Never split inside brackets: "(Facebook post, A4 print)" is one detail.
    const shielded = s.replace(/\([^)]*\)/g, (m) => m.replace(/,/g, "\u0001").replace(/\band\b/gi, "\u0002"));
    // Split into pieces, keeping each piece's separator so a piece that is not a
    // new piece of work can be glued back exactly as it was written.
    const pieces: { sep: string; text: string }[] = [];
    const re = /(,\s*(?:and\s+|then\s+)?|\s+(?:and then|and also|as well as|plus|also|then|and)\s+)/gi;
    let last = 0;
    let sep = "";
    for (let m = re.exec(shielded); m; m = re.exec(shielded)) {
      pieces.push({ sep, text: shielded.slice(last, m.index) });
      sep = m[0];
      last = m.index + m[0].length;
    }
    pieces.push({ sep, text: shielded.slice(last) });

    const merged: string[] = [];
    for (const p of pieces) {
      const part = p.text.trim();
      if (!part) continue;
      const standsAlone = STARTS_WORK.test(part) && keyTerms(part).length >= 2;
      if (merged.length && !standsAlone) merged[merged.length - 1] += `${p.sep}${part}`;
      else merged.push(part);
    }
    for (const raw of merged) {
      const m = raw.replace(/\u0001/g, ",").replace(/\u0002/g, "and").replace(/^(?:also|then)\s+/i, "");
      const terms = keyTerms(m);
      if (terms.length < 2) continue;
      const sig = terms.slice(0, 4).join(" ");
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(m.replace(/\b(?:our|my)\s+/gi, "the ").replace(/\s+/g, " ").trim());
      if (out.length >= max) return out;
    }
  }
  if (!out.length && main.trim()) out.push(clip(main.trim(), 140));
  return out;
}

/** Scale the volume in a feature down to trial size ("800 records" → "12 records"). */
export function scaleDown(feature: string, ratio: number): string {
  const shrink = (n: number) => Math.max(2, Math.min(20, Math.round(n * ratio)));
  return feature
    // Only counts of things are scaled ("800 records"), never a size or a property:
    // "20-foot beam", "15-question survey", "3 storeys", "5 kg", "2 weeks" stay as written.
    .replace(/\b(\d{1,6})\b(?!-|\s*(?:%|am|pm|h\b|hours?|minutes?|mins?|days?|weeks?|months?|years?|tk|bdt|taka|৳|foot|feet|ft|inch(?:es)?|cm|mm|m\b|metres?|meters?|km|kg|g\b|grams?|tons?|tonnes?|storey|storeys|stories|floors?|sq|square|acres?|bighas?|decimals?|litres?|liters?|ml|l\b|pages?|seasons?|sizes?|colou?rs?|questions?))/gi, (m, d) => {
      const n = Number(d);
      return n >= 5 ? String(Math.min(n - 1, shrink(n))) : m;
    })
    .replace(/\b(five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred)\b(?!-|\s+(?:foot|feet|pages?|seasons?|sizes?|questions?|storeys?|floors?|weeks?|days?|months?|years?))/gi, (m) => {
      const n = NUM_WORDS[m.toLowerCase()];
      return String(Math.min(n - 1, shrink(n)));
    });
}

/** Detect the explicit item count a requirement asks for ("2 product descriptions"). */
export function requiredCount(req: string): { n: number; noun: string } | null {
  const m = (req ?? "").match(/\b(\d{1,3}|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)\s+([a-z][a-z-]+)(?:\s+([a-z][a-z-]+))?/i);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUM_WORDS[m[1].toLowerCase()];
  if (!n || n < 2 || n > 200) return null;
  const unit = (m[2] ?? "").toLowerCase();
  // Durations / sizes are not item counts.
  if (/^(minutes?|mins?|hours?|days?|weeks?|months?|years?|sizes?|colou?rs?|px|kb|mb|percent|pages?)$/.test(unit)) return null;
  return { n, noun: stem(m[3] && keyTerms(m[3]).length ? m[3] : unit) };
}

// A brief that describes a fault rather than something to produce.
const PROBLEM = /\b(fail\w*|broken|not working|doesn't work|does not work|error\w*|crash\w*|slow|bug\w*|keeps?\s+\w+ing|stuck|wrong)\b/i;

/** Does the brief describe a fault to fix (rather than something to build)? */
export function isFaultBrief(brief: string): boolean {
  return PROBLEM.test((brief ?? "").split(/\n---\s*Attached documents\s*---/i)[0]);
}

/** For build work (not a fault) in IT, the planted ambiguity is a data problem, not a non-reproducing step. */
export const IT_BUILD_CATCH = "one value in the sample data does not make sense (for example a negative count) — flag it rather than hiding or silently fixing it";
export const IT_BUILD_CATCH_BN = "নমুনা ডেটার একটি মান অর্থহীন (যেমন ঋণাত্মক সংখ্যা) — লুকিয়ে বা চুপচাপ ঠিক না করে চিহ্নিত করুন";

export interface TrialPlan {
  title: string;
  brief: string;
  minutes: number;
  mirrors: string;
  requirements: string[]; // stored as the trial's acceptance list — the judge's checklist
  features: string[];
}

/**
 * Build the trial as a small copy of the real task: the first one or two
 * features of the brief at trial volume, the sector's proof of work, the
 * deliberate ambiguity, and "upload the files".
 */
export function planTrial(input: {
  brief: string;
  hours: number;
  minutes: number;
  what: string; // sector's generic shape, used when the brief names no features
  catch_: string; // the deliberate ambiguity
  proof: string; // how this sector proves the work
  note?: string; // a client's change request, when the trial is being rebuilt
}): TrialPlan {
  const features = extractFeatures(input.brief);
  const ratio = Math.min(0.5, input.minutes / Math.max(60, input.hours * 60));
  const picked = features.slice(0, features.length > 2 ? 2 : features.length).map((f) => scaleDown(f, ratio));
  const core = picked.length ? picked : [input.what];

  const reqs: string[] = core.map((f) => (PROBLEM.test(f) ? `Find the cause and show a fix for: ${f}` : `Produce, at trial size: ${f}`));
  if (input.note?.trim()) reqs.push(`Client's instruction: ${clip(input.note.trim(), 160)}`);
  reqs.push(capFirst(input.proof));
  reqs.push(`Flag the unclear point instead of guessing: ${input.catch_}`);
  reqs.push("Upload the files you produced (not only a description)");

  const featureLine = core.map((f, i) => `(${i + 1}) ${f}`).join("; ");
  const title = `${input.minutes}-minute trial: ${clip(capFirst(core[0]), 90)}`;
  const brief =
    `This is a small copy of the real task — the same features, a fraction of the volume. Do: ${featureLine}. ` +
    `${capFirst(input.proof)}. Be aware: ${input.catch_}. ` +
    (input.note?.trim() ? `The client also asked: "${clip(input.note.trim(), 160)}". ` : "") +
    `Upload the files you produce and record how long it took. The AI checks every requirement below against your files; ${SHORTLIST_BAR}% completion sends you to the moderator.`;
  const mirrors =
    `The real task is about ${input.hours} hours covering ${features.length || 1} feature${features.length === 1 ? "" : "s"}` +
    (features.length ? ` (${features.slice(0, 4).map((f) => clip(f, 60)).join("; ")})` : "") +
    `. The trial copies ${core.length === 1 ? "the core feature" : "the core features"} at trial size, plus the part that decides the whole job: ${input.catch_}.`;

  return { title, brief, minutes: input.minutes, mirrors, requirements: reqs.slice(0, 6), features };
}

// ─────────────────────────── 2. Upload analysis ───────────────────────────

export interface UploadFacts {
  fileCount: number;
  folderCount: number;
  nonEmptyCount: number;
  readableCount: number;
  binaryCount: number; // images / PDFs / other files with no extracted text
  visualCount: number; // images or PDFs a model could look at
  totalBytes: number;
  names: string[];
  text: string; // de-duplicated readable content
  lines: string[];
}

const PLACEHOLDER = /\b(lorem ipsum|dolor sit amet|todo|tbd|fixme|your text here|placeholder|xxx+|asdf|qwerty|test test)\b/gi;

export function analyseUpload(atts?: JudgeAttachment[] | null): UploadFacts {
  const list = Array.isArray(atts) ? atts : [];
  const names: string[] = [];
  const seenLines = new Set<string>();
  const lines: string[] = [];
  let fileCount = 0,
    folderCount = 0,
    nonEmpty = 0,
    readable = 0,
    binary = 0,
    visual = 0,
    bytes = 0;

  for (const a of list) {
    if (a?.kind === "folder") folderCount++;
    for (const f of Array.isArray(a?.files) ? a.files : []) {
      fileCount++;
      const size = Number(f.size) || 0;
      bytes += size;
      names.push(String(f.name ?? ""));
      const content = typeof f.content === "string" ? f.content : "";
      const isVisual = /^image\//.test(f.mime ?? "") || /pdf/.test(f.mime ?? "") || /\.(png|jpe?g|gif|webp|svg|pdf|heic)$/i.test(f.name ?? "");
      if (content.trim()) {
        nonEmpty++;
        readable++;
        for (const raw of content.split(/\r?\n/)) {
          const l = raw.trim();
          if (!l) continue;
          const key = l.toLowerCase().replace(/\s+/g, " ");
          if (seenLines.has(key)) continue; // a line pasted 50 times counts once
          seenLines.add(key);
          lines.push(l);
        }
      } else if (size > 0) {
        nonEmpty++;
        binary++;
        if (isVisual) visual++;
      }
    }
  }
  return {
    fileCount,
    folderCount,
    nonEmptyCount: nonEmpty,
    readableCount: readable,
    binaryCount: binary,
    visualCount: visual,
    totalBytes: bytes,
    names,
    text: lines.join("\n").slice(0, 60000),
    lines,
  };
}

/** Share of word tokens that look like language (not keyboard mash). */
function languageRatio(text: string): number {
  const toks = text.match(/[\p{L}]{3,}/gu) ?? [];
  if (toks.length === 0) return 1;
  let ok = 0;
  for (const t of toks) {
    const w = t.toLowerCase();
    const latin = /^[a-z]+$/.test(w);
    if (!latin) {
      ok++; // Bangla and other scripts: accept
      continue;
    }
    const vowels = (w.match(/[aeiouy]/g) ?? []).length;
    const repeat = /(.)\1\1/.test(w);
    const consonantRun = /[bcdfghjklmnpqrstvwxz]{5,}/.test(w);
    if (vowels > 0 && !repeat && !consonantRun && vowels / w.length >= 0.15) ok++;
  }
  return ok / toks.length;
}

/** Remove lines that merely repeat the trial brief / requirements back. */
function stripCopied(lines: string[], sources: string[]): { kept: string[]; copied: number; total: number } {
  const srcSentences = sources.flatMap(sentences);
  const srcSets = srcSentences.map((s) => new Set(keyTerms(s))).filter((s) => s.size >= 3);
  const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const srcNorm = srcSentences.map(norm).filter((x) => x.length >= 20);
  const all = new Set(srcSets.flatMap((x) => [...x]));
  const kept: string[] = [];
  let copied = 0;
  // Judge sentence by sentence, so a pasted paragraph is caught too.
  const units = lines.flatMap((l) => (l.length > 160 ? l.split(/(?<=[.!?।;])\s+/) : [l]));
  for (const l of units) {
    const t = keyTerms(l);
    const n = norm(l);
    // Long lines: most of their content words come from one brief sentence (or
    // from the brief as a whole). Short lines (a heading like "Packaging label
    // redesign" is legitimate): only a near-verbatim copy counts.
    const words = l.split(/\s+/).filter(Boolean).length;
    const heading = /^\s*(#{1,6}\s|<h[1-6])/.test(l);
    const isCopy =
      (!heading &&
        t.length >= 5 &&
        (srcSets.some((src) => {
          let hit = 0;
          for (const w of t) if (src.has(w)) hit++;
          return hit / t.length >= 0.8;
        }) ||
          (t.length >= 6 && words > 10 && t.filter((w) => all.has(w)).length / t.length >= 0.85))) ||
      (n.length >= 20 && srcNorm.some((src) => src.includes(n) || n.includes(src)));
    if (isCopy) {
      copied++;
      continue;
    }
    kept.push(l);
  }
  return { kept, copied, total: units.length };
}

/** Count the distinct items a deliverable contains (rows, list items, sections, files). */
function countItems(lines: string[], fileCount: number, noun: string): number {
  const csvRows = lines.filter((l) => (l.match(/[,\t|;]/g) ?? []).length >= 2).length;
  const rows = csvRows > 1 ? csvRows - 1 : 0; // minus the header
  const listItems = lines.filter((l) => /^\s*(?:[-*•·]|\d+[.)]|#{1,4}\s)/.test(l)).length;
  const nounHits = noun ? lines.filter((l) => stem(l.toLowerCase()).includes(noun) || l.toLowerCase().includes(noun)).length : 0;
  const paragraphs = lines.filter((l) => l.split(/\s+/).length >= 12).length;
  return Math.max(rows, listItems, nounHits, paragraphs, fileCount);
}


// ─────────────────────────── Evidence concepts ───────────────────────────
// Real work rarely repeats the requirement's words: a data-entry trial is
// satisfied by a CSV with rows, not by the word "spreadsheet". Each concept maps
// requirement words to something checkable in the upload.

interface Evidence {
  text: string;
  names: string[];
  tabularRows: number;
  codeFiles: number;
  imageFiles: number;
  designSource: boolean;
  headings: number;
  numbers: number;
  proseParas: number;
  bangla: boolean;
  quotes: number;
  bullets: number;
  labels: number; // "Budget: …" style labelled lines
  lines: number;
}

function evidenceOf(up: UploadFacts, kept: string[]): Evidence {
  const text = kept.join("\n");
  const tab = kept.filter((l) => (l.match(/[,\t|;]/g) ?? []).length >= 2).length;
  return {
    text,
    names: up.names,
    tabularRows: tab > 1 ? tab - 1 : 0,
    codeFiles: up.names.filter((n) => /\.(html?|css|jsx?|tsx?|mjs|py|java|php|rb|go|cs|cpp|c|sql|sh|vue|svelte|kt|swift)$/i.test(n)).length,
    imageFiles: up.names.filter((n) => /\.(png|jpe?g|gif|webp|svg|heic|tiff?)$/i.test(n)).length,
    designSource: up.names.some((n) => /\.(fig|psd|ai|xd|sketch|svg|indd|cdr|afdesign)$/i.test(n)),
    headings: kept.filter((l) => /^#{1,4}\s|^[A-Z][A-Za-z ]{2,40}:$|^<h[1-4]/.test(l)).length,
    numbers: (text.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []).length,
    proseParas: kept.filter((l) => l.split(/\s+/).length >= 12 && /[a-zঀ-৿]/i.test(l)).length,
    bangla: /[ঀ-৿]{3,}/.test(text),
    quotes: (text.match(/["“”«»']{1}[^"“”«»']{8,}["“”«»']{1}/g) ?? []).length,
    bullets: kept.filter((l) => /^\s*(?:[-*•·]|\d+[.)])\s/.test(l)).length,
    labels: kept.filter((l) => /^[A-Z][A-Za-z /&()-]{1,30}:\s+\S/.test(l)).length,
    lines: kept.length,
  };
}

// `proof: true` concepts are STRUCTURAL — only the real artifact satisfies them
// (rows in a sheet, code files, images, Bangla script, a design source file…).
// The others are satisfied by the work mentioning the idea, so they count
// towards coverage but can never prove on their own that the work exists.
const CONCEPTS: { re: RegExp; ok: (e: Evidence) => boolean; proof: boolean }[] = [
  { re: /^(spreadsheet|sheet|excel|csv|table|row|column|record|entry|entri|register|dataset|database)$/, ok: (e) => e.tabularRows >= 2, proof: true },
  { re: /^(dashboard|website|site|page|landing|app|web|frontend|interface|screen|html|storefront|widget|component|order-track\w*)$/, ok: (e) => e.codeFiles > 0 || /<(html|div|form|table|section|body|main)\b|document\.|useState|addEventListener/i.test(e.text), proof: true },
  { re: /^(code|script|function|fix|patch|bug|api|endpoint|callback|gateway|integration|automat\w*|backend|query)$/, ok: (e) => e.codeFiles > 0 || /\b(function|const|def |class |import |return|SELECT)\b|=>/.test(e.text), proof: true },
  { re: /^(readme|instruction|setup|install)$/, ok: (e) => e.names.some((n) => /readme|install|setup|instructions?/i.test(n)), proof: true },
  { re: /^(readme|run|test|instruction|setup|install|steps|reproduce|repro)$/, ok: (e) => /\b(how to run|to run|to test|npm |node |python |open [\w.]+ in|steps? to|reproduc|run the|test(ed|s)? |double-click)/i.test(e.text), proof: false },
  { re: /^(translat|translate|bangla|bengali|bn)$/, ok: (e) => e.bangla, proof: true },
  { re: /^(export|size|png|jpg|image|photo|photograph|picture|visual|mockup|render|shot|poster|banner|flyer|design|label|logo)$/, ok: (e) => e.imageFiles >= 1, proof: true },
  { re: /^(sizes)$/, ok: (e) => e.imageFiles >= 2, proof: true },
  { re: /^(editable|figma|psd|vector)$/, ok: (e) => e.designSource, proof: true },
  { re: /^(source|editable|layer|figma|psd|vector)$/, ok: (e) => /\b(layer|editable|source file)\b|data-editable|<g id=/i.test(e.text), proof: false },
  { re: /^(cite|citation|sourc|reference|fact)$/, ok: (e) => /\b(source|sources|ref|reference|according to|cited?)\b|https?:\/\/|www\./i.test(e.text), proof: false },
  { re: /^(report|analysis|analyse|analyze|total|figure|breakdown)$/, ok: (e) => e.numbers >= 3 && (e.headings >= 1 || e.tabularRows >= 2 || e.proseParas >= 1), proof: true },
  { re: /^(summary|finding|conclusion|result|insight)$/, ok: (e) => e.proseParas >= 1, proof: true },
  { re: /^(description|copy|article|blog|post|caption|content|voice|tone|brand|story|email|letter)$/, ok: (e) => e.proseParas >= 2 || (e.proseParas >= 1 && e.headings >= 2), proof: true },
  { re: /^(plan|campaign|strategy|schedule|calendar)$/, ok: (e) => e.headings + e.bullets + e.labels >= 3 && e.numbers >= 2, proof: true },
  { re: /^(campaign|advert|segment|audience|target|targeting|persona)$/, ok: (e) => /\b(audiences?|segments?|target\w*|aged? \d+|interest\w*|locations?|placements?|personas?|who)\b/i.test(e.text), proof: false },
  { re: /^(metric|kpi|track|ctr|reach|conversion|engagement)$/, ok: (e) => /\b(ctr|reach|impressions?|conversions?|cpc|cpm|metrics?|kpis?|engagement|clicks?)\b/i.test(e.text), proof: false },
  { re: /^(reconcil\w*|ledger|invoice|vat|statement|bookkeep\w*|account\w*)$/, ok: (e) => e.numbers >= 5 && (e.tabularRows >= 2 || /\b(total|balance|debit|credit|vat|invoice)\b/i.test(e.text)), proof: true },
  { re: /^(quantit\w*|rate|boq|bill|estimat\w*|cost|costing|price|pricing|brickwork|plaster)$/, ok: (e) => e.numbers >= 5 && (e.tabularRows >= 2 || e.headings >= 1), proof: true },
  { re: /^(theme|respond\w*|interview\w*|quote|verbatim|survey|transcript|code|coded)$/, ok: (e) => e.quotes >= 1, proof: true },
  { re: /^(stock|inventory|yield|season|farmer)$/, ok: (e) => e.numbers >= 3 && (e.tabularRows >= 2 || e.codeFiles > 0), proof: true },
];

function conceptHit(term: string, e: Evidence): boolean {
  return CONCEPTS.some((c) => c.re.test(term) && c.ok(e));
}
/** Does the requirement name a kind of artifact, and is one of those artifacts really in the upload? */
function proofOf(terms: string[], e: Evidence, text = ""): { needs: boolean; ok: boolean; all: boolean } {
  const kinds = CONCEPTS.filter((c) => c.proof && terms.some((t) => c.re.test(t)));
  const results = kinds.map((c) => c.ok(e));
  // "two sizes" / "both sizes" means two exported images, not one.
  if (/\b(two|both|2)\s+(sizes?|formats?|versions?)\b/i.test(text) && kinds.some((c) => c.re.test("size"))) results.push(e.imageFiles >= 2);
  const passed = results.filter(Boolean).length;
  return {
    needs: kinds.length > 0,
    ok: passed > 0,
    // every kind of artifact the requirement names is really there (or nearly all, for a long list)
    all: kinds.length > 0 && (passed === results.length || (results.length >= 3 && passed >= results.length - 1)),
  };
}

// Raising the planted ambiguity. "I assumed X" is the opposite (guessing past it), so
// "assumed" is deliberately NOT here; stating assumptions is judged by the proof requirement.
const FLAG_RE =
  /\b(flag(?:ged)?|unclear|unsure|not sure|ambigu\w*|cannot|can't|could not|couldn't|missing|confirm|clarif\w*|question|illegible|unreadable|need(?:s)? to check|don't match|doesn't match|did not match|mismatch|discrepan\w*|inconsisten\w*|did not guess|not guess|guessing|does not fit|doesn't fit|fits no|no theme|outlier|caveat|evidence is thin|too few|small sample|limited data)\b|\?/i;

// ─────────────────────────── 3. The deterministic judge ───────────────────────────

export interface JudgeInput {
  trialTitle: string;
  trialBrief: string;
  requirements: string[]; // the trial's checklist
  trialMinutes: number;
  summary: string; // the student's written note
  minutesTaken: number;
  attachments?: JudgeAttachment[] | null;
  taskAcceptance?: string[];
  peers?: string[]; // readable text of OTHER students' attempts on the same task (copy check)
}

/** 5-word shingles of a text, for near-duplicate detection. */
function shingles(text: string): Set<string> {
  const w = (text ?? "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const out = new Set<string>();
  for (let i = 0; i + 5 <= w.length; i++) out.add(w.slice(i, i + 5).join(" "));
  return out;
}

/** Highest share of this work's shingles found in any one peer's work (0..1). */
export function similarityToPeers(text: string, peers: string[] = []): number {
  const mine = shingles(text);
  if (mine.size < 12) return 0; // too little text to call it a copy
  let best = 0;
  for (const p of peers) {
    const theirs = shingles(p);
    if (!theirs.size) continue;
    let hit = 0;
    for (const s of mine) if (theirs.has(s)) hit++;
    best = Math.max(best, hit / mine.size);
  }
  return best;
}

function reqKind(req: string): "flag" | "upload" | "time" | "content" {
  const r = req.toLowerCase();
  if (/^upload\b|upload the files|attach the files/.test(r)) return "upload";
  if (/flag the unclear|instead of guessing|rather than guess|flag\b.*\b(unclear|ambigu)/.test(r)) return "flag";
  if (/record(ed)? (how long|the time)|time taken/.test(r)) return "time";
  return "content";
}

export function judgeAttempt(input: JudgeInput): JudgeResult {
  const reqs = (input.requirements?.length ? input.requirements : ["Deliver the trial work", "Upload the files you produced (not only a description)"]).slice(0, 8);
  const up = analyseUpload(input.attachments);
  const summary = (input.summary ?? "").trim();
  const flags: string[] = [];

  // Integrity: remove anything that is the brief pasted back.
  const sources = [input.trialBrief, input.trialTitle, ...reqs, ...(input.taskAcceptance ?? [])];
  const fileLines = stripCopied(up.lines, sources);
  const workText = fileLines.kept.join("\n");
  const noteText = summary; // the note may restate the task — that is normal, it is just not proof
  const ev = evidenceOf(up, fileLines.kept);
  const workSet = stemSet(workText);
  const noteSet = stemSet(noteText);
  const nameSet = stemSet(up.names.join(" ").replace(/[._/\\-]+/g, " "));

  if (up.fileCount === 0) flags.push("No files were uploaded — the trial needs the actual work, not a description.");
  else if (up.nonEmptyCount === 0) flags.push("Every uploaded file is empty.");
  if (fileLines.total >= 2 && fileLines.copied / fileLines.total >= 0.5) flags.push("Most of the uploaded text repeats the trial brief instead of doing the work.");
  const lang = languageRatio(workText + "\n" + noteText);
  const wordCount = (workText + " " + noteText).split(/\s+/).filter(Boolean).length;
  const fileWords = (workText.match(/[\p{L}]{3,}/gu) ?? []).length;
  if ((fileWords >= 6 && languageRatio(workText) < 0.6) || (wordCount >= 15 && lang < 0.6)) flags.push("The content reads as random characters, not real work.");
  const placeholders = (workText.match(PLACEHOLDER) ?? []).length;
  if (placeholders >= 2 || (placeholders >= 1 && wordCount < 60)) flags.push("The files contain placeholder text (lorem ipsum / TODO) where the work should be.");
  // A list of loose keywords is not work: most lines are 1-3 words, with no table, code or sentences.
  const lineWords = fileLines.kept.map((l) => l.split(/\s+/).filter(Boolean).length);
  const shortShare = lineWords.length ? lineWords.filter((n) => n <= 3).length / lineWords.length : 0;
  const structured = fileLines.kept.filter((l) => (l.match(/[,\t|;]/g) ?? []).length >= 2).length >= 2 || up.names.some((n) => /\.(html?|css|jsx?|tsx?|py|java|php|sql|svg|dxf)$/i.test(n));
  if (lineWords.length >= 4 && shortShare >= 0.7 && !structured) flags.push("The upload is a list of loose keywords, not finished work.");
  // Copying: most of the work also appears, word for word, in another student's attempt.
  const copied = similarityToPeers(up.text, input.peers);
  if (copied >= 0.7) flags.push(`About ${Math.round(copied * 100)}% of this work is word-for-word the same as another student's submission for this task.`);
  if (up.fileCount > 0 && up.readableCount === 0 && up.binaryCount > 0)
    flags.push("The upload is images/PDF only — without a vision model its content is judged from names and the note; a moderator should open it.");

  const hasRealFiles = up.nonEmptyCount > 0;

  const checklist: ChecklistItem[] = reqs.map((requirement) => {
    const kind = reqKind(requirement);

    if (kind === "upload") {
      if (!up.fileCount) return { requirement, status: "missing", evidence: "Nothing was uploaded." };
      if (!hasRealFiles) return { requirement, status: "missing", evidence: "The uploaded files are empty." };
      const substantive = up.readableCount > 0 ? workText.length >= 80 : up.totalBytes >= 5000;
      return substantive
        ? { requirement, status: "met", evidence: `${up.fileCount} file${up.fileCount === 1 ? "" : "s"} uploaded (${up.names.slice(0, 4).join(", ")}${up.names.length > 4 ? ", …" : ""}).` }
        : { requirement, status: "partial", evidence: "Files were uploaded but they hold almost no work." };
    }

    if (kind === "time") {
      return input.minutesTaken > 0
        ? { requirement, status: "met", evidence: `Recorded ${input.minutesTaken} min.` }
        : { requirement, status: "missing", evidence: "No time recorded." };
    }

    if (kind === "flag") {
      const GENERIC = /^(flag|guess|never|instead|ask|choose|unclear|say|rather|point|them|hide|sure)$/;
      const topic = keyTerms(requirement.split(/:\s*/).slice(1).join(" ") || requirement).filter((t) => !GENERIC.test(t));
      const inFiles = FLAG_RE.test(workText);
      const inNote = FLAG_RE.test(noteText);
      const lowered = `${workText}\n${noteText}`.toLowerCase();
      const topical = topic.some((t) => hasTerm(workSet, t) || hasTerm(noteSet, t) || (t.length >= 4 && lowered.includes(t)));
      const where = inFiles ? "in the files" : "in the note";
      if ((inFiles || inNote) && (topical || topic.length === 0))
        return { requirement, status: "met", evidence: `Raised the unclear point ${where} rather than guessing.` };
      if (inFiles || inNote)
        return { requirement, status: "partial", evidence: `Raised a question ${where}, but not about the point the trial planted.` };
      return { requirement, status: "missing", evidence: "Did not flag the planted ambiguity — it was guessed past or ignored." };
    }

    // Content requirement: its key terms must show up in the WORK (files), not
    // just in the note; an explicit item count must be reached.
    const body = requirement.replace(/^(produce, at trial size|find the cause and show a fix for|deliver a working small version of|deliver|client's instruction)\s*:\s*/i, "");
    const terms = keyTerms(body);
    const inWork = terms.filter((t) => hasTerm(workSet, t) || conceptHit(t, ev));
    const inNote = terms.filter((t) => hasTerm(noteSet, t) || hasTerm(nameSet, t));
    const fileCov = terms.length ? inWork.length / terms.length : hasRealFiles ? 1 : 0;
    const anyCov = terms.length ? new Set([...inWork, ...inNote]).size / terms.length : fileCov;

    const count = requiredCount(body);
    let countOk = true;
    let countNote = "";
    if (count) {
      const have = countItems(fileLines.kept, up.nonEmptyCount, count.noun);
      countOk = have >= count.n;
      countNote = countOk ? ` Contains ${have} of the ${count.n} items asked for.` : ` Only ${have} of the ${count.n} items asked for.`;
    }

    const quoted = (() => {
      const hitTerm = inWork[0];
      if (!hitTerm) return "";
      const line = fileLines.kept.find((l) => hasTerm(stemSet(l), hitTerm));
      return line ? ` e.g. "${clip(line, 90)}"` : "";
    })();

    if (!hasRealFiles) {
      // Without files, a long written answer can at best be partial.
      return anyCov >= 0.5 && summary.split(/\s+/).length >= 60
        ? { requirement, status: "partial", evidence: "Described in the note, but no file shows the work." }
        : { requirement, status: "missing", evidence: "No file shows this was done." };
    }

    const visualOnly = up.readableCount === 0 && up.visualCount > 0;
    if (visualOnly) {
      // Without a vision model the picture itself cannot be read: judge from the
      // file types, names and the note, and say so (the upload is flagged for a human look).
      const cov = terms.length ? new Set([...inWork, ...inNote]).size / terms.length : 1;
      if (cov >= 0.6 && countOk) return { requirement, status: "met", evidence: "Image/PDF delivered and described for this (content not machine-read — moderator to confirm)." };
      return cov >= 0.3
        ? { requirement, status: "partial", evidence: "An image/PDF was uploaded for this, but the names and note only partly cover it." }
        : { requirement, status: "missing", evidence: "Nothing in the upload's names or note points to this requirement." };
    }

    // A requirement that names a kind of artifact (a sheet, a page, code, a
    // translation…) is only met when that artifact is actually in the upload —
    // typing the requirement's words into a text file is not enough.
    const proof = proofOf(terms, ev, body);
    const missingTerms = terms.filter((t) => !hasTerm(workSet, t) && !conceptHit(t, ev)).slice(0, 4).join(", ");
    // The kind of work asked for is in the upload but not the thing itself
    // (keywords typed into a text file instead of the sheet / page / translation).
    if (proof.needs && !proof.ok)
      return fileCov >= 0.3
        ? { requirement, status: "partial", evidence: `The words are there, but the upload does not contain the kind of work this asks for (the sheet, page, code, image or translation itself).${countNote}` }
        : { requirement, status: "missing", evidence: `Not found in the uploaded files.${countNote}` };
    // Met: most of the requirement is in the files — or the right artifact is
    // there and it covers a good part of the requirement in the student's own words.
    // A short requirement ("see the delivery status") is met at half its key terms.
    const bar = terms.length <= 2 ? 0.5 : 0.6;
    const strong = proof.needs ? (proof.all && fileCov >= 0.35) || (proof.ok && fileCov >= bar) : fileCov >= bar;
    if (strong && countOk)
      return { requirement, status: "met", evidence: `Found in the files (${inWork.length}/${terms.length || inWork.length} key points).${quoted}${countNote}` };
    if (strong && !countOk)
      return { requirement, status: "partial", evidence: `The work is there but incomplete.${countNote}` };
    if (fileCov >= 0.25 || (proof.needs && proof.ok))
      return { requirement, status: "partial", evidence: `Only partly covered — missing ${missingTerms || "detail"} in the files.${countNote}` };
    return { requirement, status: "missing", evidence: `Not found in the uploaded files.${countNote}` };
  });

  let completion = completionOf(checklist);
  completion = applyCaps(completion, flags, up);

  return finish({ input, checklist, completion, flags, up, source: "engine", lang });
}

export function completionOf(list: ChecklistItem[]): number {
  if (!list.length) return 0;
  const pts = list.reduce((a, c) => a + (c.status === "met" ? 1 : c.status === "partial" ? 0.5 : 0), 0);
  return Math.round((pts / list.length) * 100);
}

/** Hard facts cap completion — no judge (engine or model) can talk past them. */
export function applyCaps(completion: number, flags: string[], up: UploadFacts): number {
  let c = completion;
  if (up.fileCount === 0) c = Math.min(c, 40);
  else if (up.nonEmptyCount === 0) c = Math.min(c, 10);
  if (flags.some((f) => f.startsWith("The content reads as random"))) c = Math.min(c, 25);
  if (flags.some((f) => f.startsWith("Most of the uploaded text repeats"))) c = Math.min(c, 50);
  if (flags.some((f) => f.startsWith("The files contain placeholder"))) c = Math.min(c, 70);
  if (flags.some((f) => f.startsWith("The upload is a list of loose keywords"))) c = Math.min(c, 40);
  if (flags.some((f) => / word-for-word the same as another student/.test(f))) c = Math.min(c, 30);
  return Math.max(0, Math.min(100, Math.round(c)));
}

function finish(p: {
  input: JudgeInput;
  checklist: ChecklistItem[];
  completion: number;
  flags: string[];
  up: UploadFacts;
  source: "engine" | "model";
  lang: number;
  quality?: number;
  verdict?: string;
  coaching?: string;
}): JudgeResult {
  const { input, checklist, completion, flags, up } = p;
  const met = checklist.filter((c) => c.status === "met").length;
  const flagItem = checklist.find((c) => reqKind(c.requirement) === "flag");
  const judgement = flagItem ? (flagItem.status === "met" ? 5 : flagItem.status === "partial" ? 3 : 1) : 3;
  const words = (input.summary ?? "").split(/\s+/).filter(Boolean).length;
  const communication = Math.max(1, Math.min(5, (words >= 25 ? 3 : words >= 10 ? 2 : 1) + (up.folderCount || up.fileCount > 1 ? 1 : 0) + (p.lang >= 0.8 ? 1 : 0)));
  const tm = Math.max(1, input.trialMinutes || 30);
  const timeliness = input.minutesTaken <= 0 ? 2 : input.minutesTaken <= tm ? 5 : input.minutesTaken <= tm * 1.5 ? 4 : input.minutesTaken <= tm * 2 ? 3 : 2;
  const completeness = Math.round((completion / 100) * 5);
  const deliverable = !up.fileCount ? 0 : !up.nonEmptyCount ? 0 : flags.length ? 2 : up.readableCount ? (completion >= 90 ? 5 : completion >= 60 ? 4 : 3) : 3;

  const breakdown = [
    { dim: "Requirements completed", score: completeness, max: 5 },
    { dim: "Deliverable (files)", score: deliverable, max: 5 },
    { dim: "Judgement (flagged the unclear point)", score: judgement, max: 5 },
    { dim: "Communication", score: communication, max: 5 },
    { dim: "Timeliness", score: timeliness, max: 5 },
  ];
  // Quality: completion dominates; the rest separates students who both finished.
  const side = (judgement + communication + timeliness + deliverable) / 20;
  let score = Math.round(completion * 0.7 + side * 30);
  if (typeof p.quality === "number") score = Math.round(score * 0.5 + p.quality * 0.5);
  score = Math.max(0, Math.min(100, Math.min(score, completion + 25))); // never high quality on unfinished work

  const shortlisted = completion >= SHORTLIST_BAR && !flags.some((f) => /random characters|empty|No files/.test(f));
  const missing = checklist.filter((c) => c.status !== "met");

  const verdict =
    p.verdict?.trim() ||
    `Completed ${met} of ${checklist.length} requirements (${completion}%). ` +
      (shortlisted
        ? `Clears the ${SHORTLIST_BAR}% bar — sent to the moderator.`
        : `Below the ${SHORTLIST_BAR}% bar${missing.length ? ` — ${missing.slice(0, 2).map((m) => clip(m.requirement, 60)).join("; ")} ${missing.length === 1 ? "is" : "are"} not fully done` : ""}.`) +
      (flags.length ? ` ${flags[0]}` : "");
  const coaching =
    p.coaching?.trim() ||
    (missing.length
      ? `To reach ${SHORTLIST_BAR}%: ${missing.slice(0, 3).map((m) => `${clip(m.requirement, 70)} — ${m.evidence}`).join(" ")}`
      : "Every requirement is covered. Keep flagging what the brief leaves unclear and keep attaching the real files.");

  return { score, completion, shortlisted, checklist, flags, verdict, coaching, breakdown, source: p.source };
}

/**
 * Merge a model's checklist with the engine's facts. The model reads meaning
 * (and images); the engine enforces the integrity caps and fills any
 * requirement the model skipped.
 */
export function mergeModelJudgement(
  input: JudgeInput,
  model: { checklist?: { status?: string; evidence?: string }[]; quality?: number; verdict?: string; coaching?: string; flags?: string[] } | null
): JudgeResult {
  const engine = judgeAttempt(input);
  if (!model || !Array.isArray(model.checklist) || !model.checklist.length) return engine;

  const facts = analyseUpload(input.attachments);
  const noWork = facts.nonEmptyCount === 0;
  const readable = facts.readableCount > 0 && facts.visualCount === 0; // nothing the model saw that the engine could not
  const checklist: ChecklistItem[] = engine.checklist.map((e, i) => {
    const m = model.checklist![i];
    // With no real file there is nothing for the model to have seen: keep the engine's answer.
    if (noWork && reqKind(e.requirement) !== "flag") return e;
    const status = m && ["met", "partial", "missing"].includes(String(m.status)) ? (m.status as ReqStatus) : e.status;
    // The model may not mark an upload/time requirement met when the facts say otherwise.
    const kind = reqKind(e.requirement);
    let forced: ReqStatus = (kind === "upload" || kind === "time") && e.status === "missing" ? "missing" : status;
    // Readable files in which the engine found neither the words nor the artifact:
    // a "met" from the model there is not trusted beyond "partial".
    if (kind === "content" && e.status === "missing" && forced === "met" && readable) forced = "partial";
    return { requirement: e.requirement, status: forced, evidence: clip(String(m?.evidence ?? e.evidence), 300) };
  });

  const up = analyseUpload(input.attachments);
  const flags = [...engine.flags.filter((f) => !f.startsWith("The upload is images/PDF only")), ...(Array.isArray(model.flags) ? model.flags.map(String).slice(0, 3) : [])];
  let completion = applyCaps(completionOf(checklist), engine.flags, up);
  // For text the engine can read too, a model that sees far more done than the
  // engine can find is not trusted on its own: cap the gap and ask for a human look.
  if (readable && engine.completion < 60 && completion > engine.completion + 30) {
    completion = engine.completion + 30;
    flags.push("The AI's two checks disagree about this upload — a moderator should look at the files.");
  }
  const quality = typeof model.quality === "number" && Number.isFinite(model.quality) ? Math.max(0, Math.min(100, model.quality)) : undefined;

  const res = finish({ input, checklist, completion, flags, up, source: "model", lang: 1, quality });
  // Keep the model's wording only when it agrees with the computed outcome.
  if (model.verdict && typeof model.verdict === "string") res.verdict = `${res.verdict.split(". ")[0]}. ${clip(model.verdict, 280)}`;
  if (model.coaching && typeof model.coaching === "string") res.coaching = clip(model.coaching, 400);
  return res;
}

/** Rank shortlisted attempts: completion first, then quality, then who finished first. */
export function rankAttempts<T extends { completion: number; aiScore: number; submittedAt: string | Date; outcome?: string }>(attempts: T[]): T[] {
  return [...attempts].sort(
    (a, b) =>
      b.completion - a.completion ||
      b.aiScore - a.aiScore ||
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
}
