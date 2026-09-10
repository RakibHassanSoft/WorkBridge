// Verifies the AI service falls back to the deterministic engine when Gemini
// is not configured (no GEMINI_API_KEY in the test env).
import { aiService } from "./ai.service";

describe("aiService (no Gemini key -> deterministic fallback)", () => {
  it("scopes a brief with the engine and keeps the price check server-side", async () => {
    const r = await aiService.scope(
      "The checkout payment on my website keeps failing at the last step."
    );
    expect(r.sectorId).toBe("it");
    expect(r.price.level).toBe("ok");
    expect(r.trial.minutes).toBeGreaterThanOrEqual(25);
  });

  it("blocks an underpriced budget regardless of the model", async () => {
    const r = await aiService.scope("Fix the checkout and build a dashboard.", {
      budget: 500,
    });
    expect(r.price.level).toBe("blocked");
  });

  it("evaluates a trial attempt and rewards flagging ambiguity", async () => {
    const flagged = await aiService.evaluateAttempt({
      trialTitle: "t",
      trialBrief: "b",
      trialMirrors: "m",
      trialMinutes: 40,
      summary:
        "I entered the records. Three were unclear so I flagged them and asked rather than guessing.",
      minutesTaken: 30,
    });
    const guessed = await aiService.evaluateAttempt({
      trialTitle: "t",
      trialBrief: "b",
      trialMirrors: "m",
      trialMinutes: 40,
      summary: "I entered all the records and filled in the unclear ones myself.",
      minutesTaken: 30,
    });
    expect(flagged.score).toBeGreaterThan(guessed.score);
    expect(flagged.breakdown.length).toBeGreaterThan(0);
  });
});
