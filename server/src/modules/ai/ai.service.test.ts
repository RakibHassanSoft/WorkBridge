// Verifies the AI service falls back to the deterministic engine when Gemini
// is not configured (no GEMINI_API_KEY in the test env).
import { aiService } from "./ai.service";

const file = (name: string, content: string, mime = "text/plain") => ({ kind: "file" as const, name, files: [{ name, mime, size: content.length, content }] });

describe("aiService (no Gemini key -> deterministic fallback)", () => {
  it("scopes a brief with the engine and keeps the price check server-side", async () => {
    const r = await aiService.scope("The checkout payment on my website keeps failing at the last step.");
    expect(r.sectorId).toBe("it");
    expect(r.price.level).toBe("ok");
    expect(r.trial.minutes).toBeGreaterThanOrEqual(25);
  });

  it("blocks an underpriced budget regardless of the model", async () => {
    const r = await aiService.scope("Fix the checkout and build a dashboard.", { budget: 500 });
    expect(r.price.level).toBe("blocked");
  });

  it("builds the trial from the brief's own features", async () => {
    const r = await aiService.scope("Enter 800 paper records into a spreadsheet with the agreed columns.");
    expect(r.trial.acceptance.join(" ")).toMatch(/records/i);
    expect(r.trial.acceptance.join(" ")).not.toMatch(/\b800\b/); // trial size, not the full volume
    expect(r.trial.acceptance.some((a) => /^Flag the unclear point/.test(a))).toBe(true);
    expect(r.trial.acceptance.some((a) => /^Upload the files/.test(a))).toBe(true);
  });

  it("rebuilds the trial with the client's note as a requirement", async () => {
    const t = await aiService.rebuildTrial({
      brief: "Enter 800 paper records into a spreadsheet with the agreed columns.",
      sectorId: "admin",
      hours: 8,
      current: { title: "t", brief: "b", requirements: ["x"] },
      note: "Use the Bangla column names from our register",
    });
    expect(t.acceptance.join(" ")).toMatch(/Bangla column names/);
  });

  it("judges files: real work with the ambiguity flagged beats a guess with no files", async () => {
    const scope = await aiService.scope("Enter 800 paper records into a spreadsheet with the agreed columns.");
    const rows = ["date,route,driver,crates_out,crates_returned,note"];
    for (let i = 1; i <= 20; i++) rows.push(`2026-08-${String(i).padStart(2, "0")},R${i % 4},Driver ${i},${10 + i},${8 + (i % 3)},${i % 7 === 0 ? "UNREADABLE - flagged, could not read" : ""}`);
    const base = { trialTitle: scope.trial.title, trialBrief: scope.trial.brief, requirements: scope.trial.acceptance, trialMinutes: scope.trial.minutes, minutesTaken: 30 };

    const good = await aiService.evaluateAttempt({ ...base, summary: "Entered the records; three were illegible so I flagged them.", attachments: [file("records.csv", rows.join("\n"), "text/csv")] });
    const guessed = await aiService.evaluateAttempt({ ...base, summary: "I entered all the records and filled in the unclear ones myself." });

    expect(good.completion).toBeGreaterThanOrEqual(90);
    expect(good.shortlisted).toBe(true);
    expect(guessed.shortlisted).toBe(false);
    expect(good.score).toBeGreaterThan(guessed.score);
    expect(good.checklist.length).toBe(scope.trial.acceptance.length);
  });
});
