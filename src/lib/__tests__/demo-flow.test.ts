/**
 * The live demo's in-browser backend, end to end — the same flow the three
 * workspaces drive: post (no approval) → AI trial → client changes/approves →
 * live on the board → students upload → AI judges → 90% shortlist → escrow →
 * moderator selects.
 */
import { describe, it, expect, beforeAll } from "vitest";

const store = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

import { demoRequest, resetDemoData } from "@/lib/demo/server";

const C = <T = any>(m: string, p: string, b?: unknown) => demoRequest<T>(m, p, b, "CLIENT", "c1");
const S = (id: string) => <T = any>(m: string, p: string, b?: unknown) => demoRequest<T>(m, p, b, "STUDENT", id);
const M = <T = any>(m: string, p: string, b?: unknown) => demoRequest<T>(m, p, b, "MODERATOR", "m1");
const file = (name: string, content: string | null, mime = "text/plain", size?: number, data?: string) => ({ kind: "file", name, files: [{ name, mime, size: size ?? (content?.length ?? 0), content, ...(data ? { data } : {}) }] });
const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e: any) { return e.status; } };

const goodWork = [
  file("stock.html", "<main><h1>Stock overview</h1><table><tr><th>Item</th><th>On hand</th><th>Low?</th></tr><tr><td>Rice 5kg</td><td>42</td><td></td></tr><tr><td>Sugar 1kg</td><td>3</td><td>LOW</td></tr><tr><td>Oil 1L</td><td>-3</td><td>check</td></tr></table><section><h2>Sales summary per day</h2><ul id='daily'></ul></section></main>", "text/html"),
  file("sales.js", "const sales=[{date:'2026-09-01',amount:5400},{date:'2026-09-02',amount:3100}];\nconst LOW_STOCK=5; // items at or under this are highlighted as low on stock\nfunction perDay(rows){const out={};for(const r of rows){out[r.date]=(out[r.date]||0)+r.amount}return out}", "text/javascript"),
  file("README.md", "## How to run\nOpen stock.html in a browser — no build step. To test: node sales.test.js\n## Flagged\nOil 1L shows -3 on hand. Is that a return or a data error? Please confirm; I did not hide it.", "text/markdown"),
];

let task: any;

describe("demo backend · seeded data", () => {
  beforeAll(() => resetDemoData());

  it("has an AI shortlist waiting: only 90%+ attempts, ranked, one kept back", async () => {
    const rounds = await M<any[]>("GET", "/moderator/select");
    const r = rounds.find((x) => /packaging label/i.test(x.job.brief));
    expect(r.attempts).toHaveLength(2);
    expect(r.attempts.every((a: any) => a.completion >= 90)).toBe(true);
    expect(r.attempts[0].rank).toBe(1);
    expect(r.belowBar).toBe(1);
  });

  it("shows new posts as oversight only (already released)", async () => {
    const posts = await M<any[]>("GET", "/moderator/scopes");
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((j: any) => j.scopeApproved === true)).toBe(true);
  });
});

describe("demo backend · client posts, AI builds the trial", () => {
  it("stores the post at once, with a trial built from the brief", async () => {
    const res = await C("POST", "/client/jobs", { brief: "Build an inventory dashboard showing stock levels and a daily sales report for our shop.", attachments: [file("brief.png", null, "image/png", 5000, "QUJD")] });
    task = res.job.tasks[0];
    expect(res.job.scopeApproved).toBe(true);
    expect(task.status).toBe("OPEN");
    expect(task.trialCheck.status).toBe("AWAITING_CLIENT");
    expect(task.trial.acceptance.join(" ")).toMatch(/inventory dashboard/i);
    expect(res.job.attachments[0].files[0].data).toBeUndefined(); // base64 never stored
  });

  it("is not on the board until the client approves the trial", async () => {
    const board = await S("s1")<any[]>("GET", "/student/tasks");
    expect(board.some((t) => t.id === task.id)).toBe(false);
  });

  it("rebuilds the trial from the client's note and hands it back", async () => {
    expect(await status(C("POST", `/client/tasks/${task.id}/trial-check`, { decision: "changes", note: " " }))).toBe(400);
    const r = await C("POST", `/client/tasks/${task.id}/trial-check`, { decision: "changes", note: "Also show which items are low on stock" });
    expect(r.rebuilt).toBe(true);
    expect(r.status).toBe("AWAITING_CLIENT");
    expect(r.trial.revision).toBe(2);
    expect(r.trial.acceptance.some((a: string) => /low on stock/.test(a))).toBe(true);
  });

  it("approving puts it live on the board, before any money is paid", async () => {
    const r = await C("POST", `/client/tasks/${task.id}/trial-check`, { decision: "approve" });
    expect(r.live).toBe(true);
    const bt = (await S("s1")<any[]>("GET", "/student/tasks")).find((t) => t.id === task.id);
    expect(bt.payment.status).toBe("AWAITING");
    expect(await status(C("POST", `/client/tasks/${task.id}/trial-check`, { decision: "approve" }))).toBe(409);
  });
});

describe("demo backend · students upload, the AI judges", () => {
  it("shortlists complete work at rank 1 with a full checklist", async () => {
    const a = await S("s1")("POST", `/student/tasks/${task.id}/apply`, { summary: "Stock overview page with low-stock highlight and a per-day sales summary. Oil shows -3 — flagged in the README.", minutesTaken: 50, attachments: goodWork });
    expect(a.outcome).toBe("SHORTLISTED");
    expect(a.completion).toBeGreaterThanOrEqual(90);
    expect(a.rank).toBe(1);
    const live = (await S("s1")<any[]>("GET", "/student/tasks")).find((t) => t.id === task.id);
    expect(a.checklist).toHaveLength(live.trial.acceptance.length); // one row per requirement of the (rebuilt) trial
  });

  it("keeps a description with no files below the bar", async () => {
    const a = await S("s2")("POST", `/student/tasks/${task.id}/apply`, { summary: "I built everything, the inventory dashboard and the daily sales report, and flagged issues.", minutesTaken: 30 });
    expect(a.outcome).toBe("NOT_SHORTLISTED");
    expect(a.completion).toBeLessThan(90);
  });

  it("catches a copy of another student's upload", async () => {
    const a = await S("s3")("POST", `/student/tasks/${task.id}/apply`, { summary: "My dashboard and sales summary, flagged the -3.", minutesTaken: 40, attachments: goodWork });
    expect(a.outcome).toBe("NOT_SHORTLISTED");
    expect(a.aiFlags.join(" ")).toMatch(/another student/);
  });

  it("refuses a second attempt and an unverified student", async () => {
    expect(await status(S("s1")("POST", `/student/tasks/${task.id}/apply`, { summary: "again again", minutesTaken: 3 }))).toBe(409);
    expect(await status(S("s4")("POST", `/student/tasks/${task.id}/apply`, { summary: "please let me", minutesTaken: 3 }))).toBe(403);
  });

  it("tells the client counts only", async () => {
    const job = (await C<any[]>("GET", "/client/jobs")).find((j) => j.tasks[0].id === task.id);
    expect(job.tasks[0].trialStats).toEqual({ applicants: 3, shortlisted: 1 });
  });
});

describe("demo backend · moderator selects from the shortlist", () => {
  it("sees only the 90%+ attempt and how many were kept back", async () => {
    const r = (await M<any[]>("GET", "/moderator/select")).find((x) => x.id === task.id);
    expect(r.attempts.map((a: any) => a.studentId)).toEqual(["s1"]);
    expect(r.belowBar).toBe(2);
    expect(r.funded).toBe(false);
  });

  it("cannot assign before the escrow is funded, nor pick a below-bar student", async () => {
    expect(await status(M("POST", `/moderator/tasks/${task.id}/select`, { studentId: "s1", reason: "best" }))).toBe(409);
    await C("POST", `/client/tasks/${task.id}/deposit`, {});
    expect(await status(M("POST", `/moderator/tasks/${task.id}/select`, { studentId: "s2", reason: "x" }))).toBe(400);
  });

  it("selects the shortlisted student; everyone else who tried gets +1", async () => {
    const sel = await M("POST", `/moderator/tasks/${task.id}/select`, { studentId: "s1", reason: "best" });
    expect(sel.creditedOthers).toBe(2);
    const pts = await S("s2")<any>("GET", "/student/points");
    expect(pts.entries.some((p: any) => p.taskId === task.id && p.delta === 1)).toBe(true);
    expect((await M<any>("GET", "/moderator/controls")).shortlistBar).toBe(90);
  });
});
