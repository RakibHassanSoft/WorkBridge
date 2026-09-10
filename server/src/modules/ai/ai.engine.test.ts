import { scopeOne, priceCheck, trialSize } from "./ai.engine";

describe("ai.engine", () => {
  describe("scopeOne sector detection", () => {
    it("detects IT from a checkout/payment brief", () => {
      const r = scopeOne(
        "People add items to the basket on our website but the checkout payment keeps failing."
      );
      expect(r.sectorId).toBe("it");
      expect(r.estHours).toBeGreaterThan(0);
      expect(r.suggestedFee).toBeGreaterThan(0);
      expect(r.trial.minutes).toBeLessThanOrEqual(60);
      expect(r.trial.minutes).toBeGreaterThanOrEqual(25);
    });

    it("detects business/accounting from a bookkeeping brief", () => {
      const r = scopeOne("I need help reconciling my invoices, VAT and ledger.");
      expect(r.sectorId).toBe("biz");
    });

    it("detects design from a logo/branding brief", () => {
      const r = scopeOne("Design a new logo and packaging label for my shop.");
      expect(r.sectorId).toBe("design");
    });

    it("falls back to admin when nothing matches", () => {
      const r = scopeOne("Please help me with a small thing tomorrow.");
      expect(r.sectorId).toBe("admin");
    });

    it("applies an urgency premium", () => {
      const base = scopeOne("Fix the checkout on my website store.");
      const urgent = scopeOne("URGENT: fix the checkout on my website store ASAP.");
      expect(urgent.suggestedFee).toBeGreaterThan(base.suggestedFee);
    });

    it("scales hours up with a large number in the brief", () => {
      const small = scopeOne("Enter records into a spreadsheet from paper.");
      const large = scopeOne("Enter 4000 records into a spreadsheet from paper.");
      expect(large.estHours).toBeGreaterThan(small.estHours);
    });
  });

  describe("priceCheck fair-price floor", () => {
    it("clears a fee at/above the floor", () => {
      const v = priceCheck(480 * 10, 10, "it"); // exactly floor
      expect(v.level).toBe("ok");
      expect(v.fair).toBe(true);
    });

    it("flags a fee just under the floor as low", () => {
      // ~10% under the 480 floor -> low, not blocked
      const v = priceCheck(430 * 10, 10, "it");
      expect(v.level).toBe("low");
    });

    it("blocks a fee 25%+ under the floor", () => {
      const v = priceCheck(300 * 10, 10, "it"); // ~37% under
      expect(v.level).toBe("blocked");
      expect(v.fair).toBe(false);
      expect(v.shortfall).toBeGreaterThan(0);
    });
  });

  describe("trialSize", () => {
    it("caps between 25 and 60 minutes", () => {
      expect(trialSize(1)).toBeGreaterThanOrEqual(25);
      expect(trialSize(1000)).toBeLessThanOrEqual(60);
    });
  });

  it("blocks the scope when the client's budget is far under the floor", () => {
    const r = scopeOne(
      "Fix the checkout payment on my website store, build a dashboard.",
      { budget: 500 }
    );
    expect(r.price.level).toBe("blocked");
  });
});
