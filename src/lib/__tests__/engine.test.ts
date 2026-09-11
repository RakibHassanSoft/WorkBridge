import { describe, it, expect } from "vitest";
import { scopeOne, buildTrial, priceCheck, trialSize, pointsFor } from "@/lib/engine";

describe("engine · scopeOne + trial", () => {
  it("builds the trial as a small copy of the brief's own features", () => {
    const s = scopeOne("Build an inventory dashboard showing stock levels and a daily sales report.");
    const reqs = s.trial.acceptance.en.join("\n");
    expect(s.sectorId).toBe("it");
    expect(reqs).toMatch(/inventory dashboard/i);
    expect(reqs).toMatch(/daily sales report/i);
    expect(s.trial.acceptance.en[s.trial.acceptance.en.length - 1]).toMatch(/^Upload the files/);
    expect(s.trial.acceptance.en.some((r) => r.startsWith("Flag the unclear point"))).toBe(true);
  });

  it("gives every requirement a Bangla line", () => {
    const s = scopeOne("Enter 800 paper records into a spreadsheet with the agreed columns.");
    expect(s.trial.acceptance.bn).toHaveLength(s.trial.acceptance.en.length);
    expect(s.trial.acceptance.bn.join(" ")).toMatch(/ট্রায়াল আকারে|আপলোড/);
  });

  it("uses trial volume, not the full job", () => {
    const s = scopeOne("Enter 800 paper records into a spreadsheet with the agreed columns.");
    expect(s.trial.acceptance.en[0]).not.toMatch(/\b800\b/);
    expect(s.trial.minutes).toBeGreaterThanOrEqual(25);
    expect(s.trial.minutes).toBeLessThanOrEqual(60);
  });

  it("plants a data problem for IT build work and a non-reproducing step for a fault", () => {
    const build = scopeOne("Build a small web page that lists medicines and highlights low stock.");
    const fault = scopeOne("The checkout payment on our website keeps failing at the last step.");
    expect(build.trial.acceptance.en.join(" ")).toMatch(/does not make sense/);
    expect(fault.trial.acceptance.en.join(" ")).toMatch(/will not reproduce/);
    expect(fault.trial.acceptance.en[0]).toMatch(/^Find the cause/);
  });

  it("rebuilds with the client's note as a requirement", () => {
    const s = scopeOne("Write ten product descriptions in our brand voice.");
    const t = buildTrial({ hours: 7 } as Parameters<typeof buildTrial>[0], s.sectorId, "Write ten product descriptions in our brand voice.", "Use the Eid collection");
    expect(t.acceptance.en.join("\n")).toMatch(/Client's instruction: Use the Eid collection/);
    expect(t.acceptance.bn.join("\n")).toMatch(/ক্লায়েন্টের নির্দেশনা/);
  });
});

describe("engine · price and points", () => {
  it("blocks a fee 25%+ under the sector floor", () => {
    expect(priceCheck(3000, 10, "it").level).toBe("blocked");
    expect(priceCheck(4800, 10, "it").level).toBe("ok");
  });
  it("caps trial time between 25 and 60 minutes", () => {
    expect(trialSize(1)).toBe(25);
    expect(trialSize(500)).toBe(60);
  });
  it("applies the points rule: +1 tried, 0 delivered, -1 failed", () => {
    expect(pointsFor(false).delta).toBe(1);
    expect(pointsFor(true, "delivered").delta).toBe(0);
    expect(pointsFor(true, "failed").delta).toBe(-1);
  });
});
