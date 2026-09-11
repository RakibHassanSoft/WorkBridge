import { planTrial, judgeAttempt, mergeModelJudgement, extractFeatures, rankAttempts, similarityToPeers, scaleDown, SHORTLIST_BAR, JudgeAttachment } from "./ai.judge";

const f = (name: string, content: string | null, mime = "text/plain", size?: number): JudgeAttachment => ({
  kind: "file",
  name,
  files: [{ name, mime, size: size ?? (content?.length ?? 0), content }],
});

const trial = planTrial({
  brief: "Build an inventory dashboard showing stock levels and a daily sales report.",
  hours: 12,
  minutes: 60,
  what: "",
  catch_: "one product has a negative stock count in the sample — flag it, do not hide it",
  proof: "include a README that says how to run or test it",
});
const judge = (summary: string, attachments?: JudgeAttachment[], minutesTaken = 45) =>
  judgeAttempt({ trialTitle: trial.title, trialBrief: trial.brief, requirements: trial.requirements, trialMinutes: trial.minutes, summary, minutesTaken, attachments });

const goodWork = [
  f("stock.html", "<main><h1>Stock overview</h1><table><tr><th>Item</th><th>On hand</th></tr><tr><td>Rice 5kg</td><td>42</td></tr><tr><td>Oil 1L</td><td>-3</td></tr></table><section><h2>Sales summary per day</h2><ul id='daily'></ul></section></main>", "text/html"),
  f("sales.js", "const sales=[{date:'2026-09-01',amount:5400},{date:'2026-09-01',amount:1200},{date:'2026-09-02',amount:3100}];\nfunction perDay(rows){const out={};for(const r of rows){out[r.date]=(out[r.date]||0)+r.amount}return out}", "text/javascript"),
  f("README.md", "## How to run\nOpen stock.html in a browser — no build step.\n## Flagged\nOil 1L shows -3 on hand. Is that a return or a data error? Please confirm; I did not hide it.", "text/markdown"),
];

describe("ai.judge — trial builder", () => {
  it("splits a brief into its features", () => {
    expect(extractFeatures("Build an inventory dashboard showing stock levels and a daily sales report.")).toHaveLength(2);
    // "Facebook and Instagram" is one feature, not two
    expect(extractFeatures("Run a two-week social media campaign for our new menu across Facebook and Instagram.")).toHaveLength(1);
  });

  it("makes the trial a small copy: same features, trial volume, planted ambiguity, upload", () => {
    const t = planTrial({ brief: "Enter 800 paper records into a spreadsheet with the agreed columns.", hours: 12, minutes: 60, what: "", catch_: "three are hard to read — flag them", proof: "use one row per record" });
    expect(t.requirements[0]).toMatch(/\b20 paper records\b/);
    expect(t.requirements.some((r) => r.startsWith("Flag the unclear point"))).toBe(true);
    expect(t.requirements[t.requirements.length - 1]).toMatch(/^Upload the files/);
  });

  it("adds the client's change request as a requirement", () => {
    const t = planTrial({ brief: "Write ten product descriptions.", hours: 7, minutes: 50, what: "", catch_: "c", proof: "p", note: "Use our Eid collection" });
    expect(t.requirements.join("\n")).toMatch(/Eid collection/);
  });
});

describe("ai.judge — evaluating uploads", () => {
  it(`shortlists complete work written in the student's own words (>= ${SHORTLIST_BAR}%)`, () => {
    const r = judge("Stock overview page plus a per-day sales summary; README explains how to open it. Oil shows -3 — flagged.", goodWork);
    expect(r.completion).toBeGreaterThanOrEqual(SHORTLIST_BAR);
    expect(r.shortlisted).toBe(true);
    expect(r.checklist.every((c) => c.status === "met")).toBe(true);
  });

  it("does not shortlist good work that skipped the planted ambiguity", () => {
    const r = judge("Built it.", goodWork.slice(0, 2));
    expect(r.shortlisted).toBe(false);
  });

  it("caps an attempt with no files — a description is not the work", () => {
    const r = judge("I built the inventory dashboard with stock levels and the daily sales report, flagged the negative stock, everything done.");
    expect(r.completion).toBeLessThanOrEqual(40);
    expect(r.flags[0]).toMatch(/No files/);
  });

  it("scores empty files at zero", () => {
    expect(judge("uploaded", [f("app.js", "", "text/javascript", 0)]).completion).toBe(0);
  });

  it("catches the brief pasted back as the deliverable", () => {
    const r = judge("done", [f("answer.txt", trial.brief + "\n" + trial.requirements.join("\n"))]);
    expect(r.shortlisted).toBe(false);
    expect(r.completion).toBeLessThanOrEqual(50);
  });

  it("catches claims typed into a file instead of work", () => {
    const r = judge("done", [f("done.txt", "I built the inventory dashboard showing stock levels and a daily sales report.\nA README that says how to run or test it is included.\nI flagged the negative stock count instead of guessing.")]);
    expect(r.shortlisted).toBe(false);
  });

  it("catches keyword stuffing and gibberish", () => {
    expect(judge("done", [f("w.txt", "inventory\ndashboard\nstock levels\ndaily sales report\nREADME run test\nnegative stock unclear?")]).shortlisted).toBe(false);
    const g = judge("done", [f("w.txt", "asdkfj qwpoeir zxcvmnb lkjhgf poiuyt mnbvcx qwerty asdfgh zxcvb lkjhg poiuy trewq sdfgh xcvbn qwrtp")]);
    expect(g.completion).toBeLessThanOrEqual(25);
  });

  it("does not reward unrelated work", () => {
    const r = judge("Here is my work", [f("essay.md", "# Mango season in Rajshahi\nThe mango harvest this year was strong, with farmers reporting higher yields across three upazilas.")]);
    expect(r.completion).toBeLessThan(50);
  });

  it("enforces an explicit item count", () => {
    const t = planTrial({ brief: "Enter 800 paper records into a spreadsheet with the agreed columns.", hours: 12, minutes: 60, what: "", catch_: "three are hard to read — flag them, never guess", proof: "use one row per record under a header row of the agreed columns" });
    const rows = (n: number) => ["date,route,driver,crates", ...Array.from({ length: n }, (_, i) => `2026-08-${i + 1},R${i % 4},D${i},${i}${i === 3 ? ",UNREADABLE - flagged" : ""}`)].join("\n");
    const j = (n: number) => judgeAttempt({ trialTitle: t.title, trialBrief: t.brief, requirements: t.requirements, trialMinutes: 60, summary: "Entered; one illegible record flagged.", minutesTaken: 50, attachments: [f("r.csv", rows(n), "text/csv")] });
    expect(j(20).shortlisted).toBe(true);
    expect(j(8).shortlisted).toBe(false);
  });
});

describe("ai.judge — copying another student", () => {
  const text = goodWork.map((f) => f.files[0].content).join("\n");
  it("catches a word-for-word copy of a peer's upload", () => {
    const r = judgeAttempt({ trialTitle: trial.title, trialBrief: trial.brief, requirements: trial.requirements, trialMinutes: 60, summary: "Stock page and per-day sales; flagged -3.", minutesTaken: 40, attachments: goodWork, peers: [text] });
    expect(r.shortlisted).toBe(false);
    expect(r.completion).toBeLessThanOrEqual(30);
    expect(r.flags.join(" ")).toMatch(/another student/);
  });
  it("does not flag independent work on the same task", () => {
    expect(similarityToPeers(text, ["A completely different page: stock list for the pharmacy with reorder levels, written by someone else from scratch with their own words and code."])).toBeLessThan(0.2);
  });
});

describe("ai.judge — trial volume", () => {
  it("scales counts of things, never sizes or properties", () => {
    expect(scaleDown("Enter 800 records", 0.05)).toBe("Enter 20 records");
    expect(scaleDown("Check a 20-foot steel beam", 0.05)).toBe("Check a 20-foot steel beam");
    expect(scaleDown("Design a 15-question survey", 0.05)).toBe("Design a 15-question survey");
    expect(scaleDown("Run it for 6 months", 0.05)).toBe("Run it for 6 months");
  });
});

describe("ai.judge — merging a model's judgement", () => {
  it("a model cannot mark work done when nothing was uploaded", () => {
    const r = mergeModelJudgement(
      { trialTitle: trial.title, trialBrief: trial.brief, requirements: trial.requirements, trialMinutes: 60, summary: "all done", minutesTaken: 30, attachments: [] },
      { checklist: trial.requirements.map(() => ({ status: "met", evidence: "ok" })), quality: 99, verdict: "great", coaching: "", flags: [] }
    );
    expect(r.shortlisted).toBe(false);
    expect(r.completion).toBeLessThanOrEqual(40);
  });

  it("uses the model's per-requirement reading of an image and computes completion itself", () => {
    const r = mergeModelJudgement(
      { trialTitle: trial.title, trialBrief: trial.brief, requirements: trial.requirements, trialMinutes: 60, summary: "done", minutesTaken: 30, attachments: [f("shot.png", null, "image/png", 300000)] },
      { checklist: [{ status: "met", evidence: "a" }, { status: "met", evidence: "b" }, { status: "partial", evidence: "no README" }, { status: "met", evidence: "c" }, { status: "met", evidence: "d" }], quality: 80, verdict: "Solid", coaching: "Add a README", flags: [] }
    );
    expect(r.completion).toBe(90);
    expect(r.shortlisted).toBe(true);
    expect(r.source).toBe("model");
  });
});

describe("ai.judge — ranking", () => {
  it("ranks by completion, then quality, then who finished first", () => {
    const ranked = rankAttempts([
      { id: "a", completion: 92, aiScore: 99, submittedAt: "2026-01-01" },
      { id: "b", completion: 100, aiScore: 80, submittedAt: "2026-01-03" },
      { id: "c", completion: 100, aiScore: 80, submittedAt: "2026-01-02" },
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
});
