/**
 * AI judge benchmark — runs every labelled submission in ./benchmark/cases.ts
 * through the real trial builder + judge and requires:
 *   - every piece of good work (excellent, or in the student's own words) is shortlisted (>= 90%)
 *   - every incomplete, unflagged or cheating attempt is kept away from the moderator
 *   - no cheat scores more than 50% completion
 *   - even a fooled model that marks everything "met" cannot push a cheat through
 */
import { scopeOne, evaluateAttemptDeterministic } from "./ai.engine";
import { keyTerms, mergeModelJudgement, SHORTLIST_BAR } from "./ai.judge";
import { BRIEFS, CUSTOM, HOLDOUT, Case, F } from "./benchmark/cases";

const txt = (name: string, content: string): F => ({ name, mime: "text/plain", content, size: content.length });

function cheats(sector: string, trialBrief: string, reqs: string[]): Case[] {
  return [
    { sector, kind: "no-files", expect: "fail", minutes: 45, summary: `I completed everything: ${reqs.join(". ")}. I flagged the unclear point. Please select me.`, files: [] },
    { sector, kind: "paste-brief", expect: "fail", minutes: 20, summary: "Done.", files: [txt("answer.txt", trialBrief + "\n" + reqs.join("\n"))] },
    { sector, kind: "keyword-list", expect: "fail", minutes: 15, summary: "Done.", files: [txt("work.txt", reqs.flatMap((r) => keyTerms(r).slice(0, 6)).join("\n") + "\nunclear?")] },
    { sector, kind: "claims-in-file", expect: "fail", minutes: 20, summary: "See file.", files: [txt("done.txt", reqs.map((r) => `I have done this: ${r.replace(/^[^:]*:\s*/, "")}.`).join("\n"))] },
    { sector, kind: "unrelated", expect: "fail", minutes: 40, summary: "Here is my work.", files: [txt("essay.md", "# The Padma bridge\nThe Padma Multipurpose Bridge opened in June 2022 and connects 21 south-western districts to Dhaka. It is 6.15 km long and carries road and rail traffic.")] },
    { sector, kind: "gibberish", expect: "fail", minutes: 10, summary: "done work", files: [txt("w.txt", "asdkfj qwpoeir zxcvmnb lkjhgf poiuyt mnbvcx qwrtp sdfghk xcvbnm plkjhg trewqa zxcvbq")] },
    { sector, kind: "empty-file", expect: "fail", minutes: 5, summary: "uploaded", files: [{ name: "final.docx", mime: "application/octet-stream", size: 0, content: null }] },
    { sector, kind: "placeholder", expect: "fail", minutes: 20, summary: "Draft attached.", files: [txt("draft.md", reqs.map((r) => `## ${r.slice(0, 40)}\nLorem ipsum dolor sit amet TODO`).join("\n"))] },
  ];
}

function judge(c: Case, brief: string) {
  const s = scopeOne(brief, { sectorId: c.sector });
  const attachments = c.files.length ? [{ kind: "folder" as const, name: "upload", files: c.files.map((f) => ({ ...f, size: f.size ?? 0 })) }] : undefined;
  const input = { trialTitle: s.trial.title, trialBrief: s.trial.brief, requirements: s.trial.acceptance, trialMinutes: s.trial.minutes, summary: c.summary, minutesTaken: c.minutes, attachments, taskAcceptance: s.acceptance };
  return { s, input, r: evaluateAttemptDeterministic(input) };
}

const tuning: [Case, string][] = [];
for (const [sector, brief] of Object.entries(BRIEFS)) {
  const s = scopeOne(brief, { sectorId: sector });
  for (const c of CUSTOM.filter((x) => x.sector === sector)) tuning.push([c, brief]);
  for (const c of cheats(sector, s.trial.brief, s.trial.acceptance)) tuning.push([c, brief]);
}
const holdout: [Case, string][] = HOLDOUT.map((c) => [c, c.brief!]);

describe.each([
  ["tuning set", tuning],
  ["held-out set", holdout],
] as [string, [Case, string][]][])("AI judge benchmark — %s", (_name, set) => {
  it.each(set.map(([c, b]) => [`${c.sector} · ${c.kind} → ${c.expect}`, c, b] as [string, Case, string]))("%s", (_label, c, brief) => {
    const { r } = judge(c, brief);
    expect(r.shortlisted).toBe(c.expect === "pass");
    if (c.expect === "pass") expect(r.completion).toBeGreaterThanOrEqual(SHORTLIST_BAR);
    if (!["excellent", "own-words", "missing-feature", "no-flag", "good", "weak", "guessed"].includes(c.kind)) expect(r.completion).toBeLessThanOrEqual(50);
  });
});

describe("AI judge benchmark — a fooled model cannot push a cheat through", () => {
  const cheatCases = tuning.filter(([c]) => c.expect === "fail" && !["missing-feature", "no-flag"].includes(c.kind));
  it.each(cheatCases.map(([c, b]) => [`${c.sector} · ${c.kind}`, c, b] as [string, Case, string]))("%s", (_label, c, brief) => {
    const { input } = judge(c, brief);
    const fooled = mergeModelJudgement(input, { checklist: input.requirements.map(() => ({ status: "met", evidence: "looks complete" })), quality: 97, verdict: "Excellent", coaching: "", flags: [] });
    expect(fooled.shortlisted).toBe(false);
  });
});
