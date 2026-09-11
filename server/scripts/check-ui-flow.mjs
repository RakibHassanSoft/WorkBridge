#!/usr/bin/env node
/**
 * End-to-end check of the three workspaces' API contract against a running
 * server. It walks the whole flow exactly as the UI does it —
 *   client posts -> trial check -> escrow -> moderator releases -> students
 *   apply -> moderator selects -> chat + progress + delivery -> scoring ->
 *   revision -> sign-off -> earnings/record/points
 * plus verification, support, disputes, payments, directory and controls —
 * and asserts that every field the UI reads is present in the responses.
 *
 * It CHANGES data, so run it on a freshly seeded dev database:
 *   npm run db:reseed
 *   npm run dev            (in another terminal)
 *   npm run check:ui
 *
 * Env: API_URL (default http://localhost:4000/api/v1),
 *      DEMO_PASSWORD (default: the seed password from DEMO_ACCOUNTS.md).
 */

const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const PASSWORD = process.env.DEMO_PASSWORD ?? "Passw0rd!";

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = "") => {
  if (cond) passed++;
  else failed++;
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${name}${!cond && detail ? `  — ${detail}` : ""}`);
  return cond;
};
const has = (obj, path) => path.split(".").every((k) => (obj = obj?.[k]) !== undefined);
const shape = (name, obj, paths) => {
  const missing = paths.filter((p) => !has(obj, p));
  return ok(name, obj && missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : "no object");
};
const section = (t) => console.log(`\n▸ ${t}`);

async function call(token, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = new Error(`${method} ${path} -> ${res.status} ${json?.details?.[0]?.message ?? json?.message ?? ""}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json.data;
}
const as = (token) => ({
  get: (p) => call(token, "GET", p),
  post: (p, b = {}) => call(token, "POST", p, b),
  patch: (p, b = {}) => call(token, "PATCH", p, b),
});

async function login(email) {
  const d = await call(null, "POST", "/auth/login", { email, password: PASSWORD });
  shape(`login ${email}`, d, ["token", "user.id", "user.role", "user.name", "user.email"]);
  return { ...as(d.token), user: d.user };
}

async function step(name, fn) {
  try {
    return await fn();
  } catch (e) {
    ok(name, false, e.message);
    return undefined;
  }
}

async function main() {
  console.log(`Checking ${API}`);
  const health = await fetch(API + "/health").then((r) => r.json()).catch(() => null);
  if (!ok("API is reachable", health?.success)) {
    console.log("\nStart the server first: cd server && npm run dev");
    process.exit(1);
  }

  section("Sign in (seeded demo accounts)");
  const client = await login("nokshi@demo.wb");
  const nusrat = await login("nusrat@demo.wb");
  const tanvir = await login("tanvir@demo.wb");
  const mehedi = await login("mehedi@demo.wb");
  const mod = await login("mod@demo.wb");
  const me = await client.get("/users/me");
  shape("GET /users/me", me, ["id", "email", "role", "name"]);

  section("Client — dashboard data");
  const jobs = await client.get("/client/jobs");
  ok("jobs list is an array with seeded jobs", Array.isArray(jobs) && jobs.length > 0);
  const t0 = jobs[0]?.tasks?.[0];
  shape("job row has what the cards read", jobs[0], ["id", "ref", "title", "brief", "status", "scopeApproved", "createdAt", "aiSummary", "sector.name", "tasks"]);
  shape("task row includes trial, check, payment, evaluation, assignee", t0, ["id", "title", "fee", "hours", "status", "acceptance", "trial", "trialCheck", "payment", "evaluation", "assignee"]);
  const methods = await client.get("/client/payment-methods");
  shape("payment methods", methods[0], ["id", "kind", "label", "isDefault"]);
  const spend = await client.get("/client/payments");
  shape("spend rows", spend[0], ["id", "status", "amount", "note", "task.title"]);

  section("Client — post a problem (validation + AI scope)");
  await step("short brief is rejected with a field message", async () => {
    try {
      await client.post("/client/jobs", { brief: "too short" });
      ok("short brief is rejected with a field message", false, "accepted");
    } catch (e) {
      ok("short brief is rejected with a field message", e.status === 400 && !!e.json?.details?.[0]?.message, e.message);
    }
  });
  const posted = await step("post a job", () =>
    client.post("/client/jobs", { brief: "Measure our three-storey warehouse and redraw the as-built floor plans in AutoCAD for the renovation engineer." })
  );
  const job = posted?.job;
  const task = job?.tasks?.[0];
  shape("posted job + AI scope + price", posted, ["job.id", "job.ref", "job.aiSummary", "job.aiComplexity", "job.aiRisks", "job.sector.name", "price.level", "price.message"]);
  shape("posted task has trial + unfunded escrow", task, ["trial.title", "trial.brief", "trial.minutes", "trialCheck.status", "payment.status"]);
  ok("new task starts OPEN / trial AWAITING_CLIENT / escrow AWAITING", task?.status === "OPEN" && task?.trialCheck?.status === "AWAITING_CLIENT" && task?.payment?.status === "AWAITING");

  section("Client — trial check + escrow");
  await step("ask for changes", async () => {
    const r = await client.post(`/client/tasks/${task.id}/trial-check`, { decision: "changes", note: "Please test layer naming too" });
    ok("ask for changes -> CHANGES_ASKED", r.status === "CHANGES_ASKED");
  });
  await step("approve after changes", async () => {
    const r = await client.post(`/client/tasks/${task.id}/trial-check`, { decision: "approve" });
    ok("approve after changes -> APPROVED", r.status === "APPROVED");
  });
  await step("fund escrow", async () => {
    const r = await client.post(`/client/tasks/${task.id}/deposit`, { paymentMethodId: methods[0]?.id });
    ok("fund escrow -> HELD", r.payment?.status === "HELD");
  });

  section("Moderator — scope review");
  const scopes = await mod.get("/moderator/scopes");
  const sc = scopes.find((j) => j.id === job?.id);
  shape("new job is in the scope queue with what the card reads", sc, ["ref", "brief", "aiSummary", "aiConfidence", "client.name", "sector.id", "sector.name", "tasks.0.fee", "tasks.0.hours", "tasks.0.trial.title", "tasks.0.trialCheck.status", "tasks.0.payment.status"]);
  const controls = await mod.get("/moderator/controls");
  shape("controls (rate floors used by the fair-price check)", controls, ["rateFloors", "rules.0.label", "rules.0.locked"]);
  await step("release scope", () => mod.post(`/moderator/scopes/${job.id}/approve`, {}));
  const afterRelease = (await client.get("/client/jobs")).find((j) => j.id === job?.id);
  ok("task goes live (MATCHING) once all three gates clear", afterRelease?.tasks?.[0]?.status === "MATCHING", afterRelease?.tasks?.[0]?.status);

  section("Student — find tasks + apply by trial");
  const board = await nusrat.get("/student/tasks");
  const bt = board.find((t) => t.id === task?.id);
  shape("board task has what the apply card reads", bt, ["title", "desc", "fee", "hours", "level", "skills", "applied", "createdAt", "sector.id", "sector.name", "job.ref", "trial.title", "trial.minutes", "trial.acceptance"]);
  await step("apply (Nusrat)", async () => {
    const a = await nusrat.post(`/student/tasks/${task.id}/apply`, { summary: "Measured the ground floor and drew it with named layers. Two dimensions were unclear, so I flagged them to confirm instead of guessing.", minutesTaken: 40 });
    shape("attempt is scored by the AI", a, ["aiScore", "aiVerdict", "aiCoaching", "outcome"]);
  });
  await step("apply (Tanvir)", () => tanvir.post(`/student/tasks/${task.id}/apply`, { summary: "Drew the sample floor plan in AutoCAD and exported a PDF.", minutesTaken: 55 }));
  await step("second apply is refused", async () => {
    try {
      await nusrat.post(`/student/tasks/${task.id}/apply`, { summary: "again, trying twice here", minutesTaken: 20 });
      ok("second apply is refused", false, "accepted");
    } catch (e) {
      ok("second apply is refused (409)", e.status === 409, e.message);
    }
  });
  await step("unverified student cannot apply", async () => {
    try {
      await mehedi.post(`/student/tasks/${task.id}/apply`, { summary: "I would like to try this one", minutesTaken: 20 });
      ok("unverified student cannot apply", false, "accepted");
    } catch (e) {
      ok("unverified student cannot apply (403)", e.status === 403, e.message);
    }
  });
  const trials = await nusrat.get("/student/trials");
  shape("trials list", trials.find((a) => a.task?.id === task?.id), ["aiScore", "aiVerdict", "aiCoaching", "outcome", "points", "minutesTaken", "submittedAt", "task.title"]);

  section("Moderator — select the student");
  const rounds = await mod.get("/moderator/select");
  const round = rounds.find((r) => r.id === task?.id);
  shape("selection round has ranked attempts", round, ["title", "fee", "job.ref", "job.client.name", "attempts.0.student.name", "attempts.0.aiScore", "attempts.0.summary", "attempts.0.studentId"]);
  ok("attempts are ranked by AI score", round && round.attempts.every((a, i, arr) => i === 0 || arr[i - 1].aiScore >= a.aiScore));
  await step("select Nusrat", () => mod.post(`/moderator/tasks/${task.id}/select`, { studentId: nusrat.user.id, reason: "Best trial and flagged the ambiguity" }));
  const tanvirPts = await tanvir.get("/student/points");
  ok("the student who was not selected earns +1", tanvirPts.entries.some((p) => p.taskId === task?.id && p.delta === 1));

  section("Student + client — active work, progress, chat");
  const active = await nusrat.get("/student/active");
  const at = active.find((t) => t.id === task?.id);
  shape("active task has what the card reads", at, ["title", "desc", "fee", "hours", "status", "progress", "acceptance", "updatedAt", "job.ref", "job.brief", "sector.name"]);
  await step("update progress", async () => {
    const r = await nusrat.post(`/student/tasks/${task.id}/progress`, { progress: 60 });
    ok("progress saved", r.progress === 60);
  });
  await step("student sends a message", () => nusrat.post(`/student/tasks/${task.id}/messages`, { body: "Site visit is booked for Thursday." }));
  const cmsgs = await client.get(`/client/tasks/${task?.id}/messages`);
  shape("client sees the message with its author", cmsgs.at(-1), ["id", "body", "createdAt", "fromRole", "authorId", "author.name"]);
  await step("client replies", () => client.post(`/client/tasks/${task.id}/messages`, { body: "Great, thanks!" }));
  const smsgs = await nusrat.get(`/student/tasks/${task?.id}/messages`);
  ok("student sees the reply", smsgs.some((m) => m.body === "Great, thanks!"));
  const cjob = (await client.get("/client/jobs")).find((j) => j.id === job?.id);
  shape("client sees who is working and the progress", cjob?.tasks?.[0], ["assignee.name", "progress"]);

  section("Delivery, scoring, revision, sign-off");
  await step("submit work", () => nusrat.post(`/student/tasks/${task.id}/submit`, { note: "All three floors drawn, PDF and DWG shared." }));
  const reviews = await mod.get("/moderator/reviews");
  shape("scoring queue has what the card reads", reviews.find((t) => t.id === task?.id), ["title", "fee", "submissionNote", "submittedAt", "acceptance", "assignee.name", "job.ref"]);
  await step("score", () =>
    mod.post(`/moderator/tasks/${task.id}/score`, { scores: [{ dim: "Quality", score: 5, max: 5 }, { dim: "Completeness", score: 4, max: 5 }, { dim: "Communication", score: 4, max: 5 }], note: "Accurate and well layered." })
  );
  let ct = (await client.get("/client/jobs")).find((j) => j.id === job?.id)?.tasks?.[0];
  shape("client sees the evaluation to sign off", ct, ["evaluation.scores.0.dim", "evaluation.reviewerNote", "evaluation.clientSignoff", "submissionNote"]);
  await step("request a revision", async () => {
    const r = await client.post(`/client/tasks/${task.id}/signoff`, { decision: "revision", note: "Please add the roof plan." });
    ok("revision keeps escrow held", r.released === false);
  });
  const revised = (await nusrat.get("/student/active")).find((t) => t.id === task?.id);
  ok("student sees REVISION", revised?.status === "REVISION", revised?.status);
  await step("resubmit", () => nusrat.post(`/student/tasks/${task.id}/submit`, { note: "Roof plan added." }));
  await step("accept + release", async () => {
    const r = await client.post(`/client/tasks/${task.id}/signoff`, { decision: "accept", note: "Exactly what we needed." });
    ok("accept releases escrow", r.released === true);
  });
  ct = (await client.get("/client/jobs")).find((j) => j.id === job?.id);
  ok("job DELIVERED, task APPROVED, payment RELEASED", ct?.status === "DELIVERED" && ct?.tasks?.[0]?.status === "APPROVED" && ct?.tasks?.[0]?.payment?.status === "RELEASED");

  section("Student — record, earnings, points, profile, support, dispute");
  const earnings = await nusrat.get("/student/earnings");
  shape("earnings", earnings, ["total", "payments.0.amount", "payments.0.updatedAt", "payments.0.task.title"]);
  ok("earnings include the new task", earnings.payments.some((p) => p.task?.id === task?.id));
  const record = await nusrat.get("/student/record");
  shape("record entry has scores for the card", record.find((r) => r.id === task?.id), ["title", "sector.name", "job.ref", "evaluation.scores", "evaluation.reviewerNote", "evaluation.clientNote"]);
  const pts = await nusrat.get("/student/points");
  shape("points", pts, ["total", "entries.0.delta", "entries.0.reason", "entries.0.createdAt", "entries.0.task.title"]);
  const kyc = await nusrat.get("/student/kyc");
  shape("verification status", kyc, ["status", "submission"]);
  const profile = await nusrat.get("/student/profile");
  shape("profile", profile, ["name", "email", "studentProfile.university", "studentProfile.skills"]);
  await step("update profile", async () => {
    const p = await nusrat.patch("/student/profile", { bio: "CSE graduate who likes tidy data.", skills: ["React", "Next.js", "AutoCAD"] });
    ok("profile saved", p.bio === "CSE graduate who likes tidy data.");
  });
  await step("support ticket", async () => {
    const tk = await nusrat.post("/support", { subject: "Payout timing", body: "When does the released money reach my bKash?", priority: "normal" });
    shape("ticket created", tk, ["id", "ref", "subject", "status", "priority", "createdAt"]);
  });
  const activeJ2 = (await nusrat.get("/student/active")).find((t) => t.status === "IN_PROGRESS");
  if (activeJ2)
    await step("student dispute", async () => {
      const d = await nusrat.post(`/student/tasks/${activeJ2.id}/dispute`, { claim: "The client changed the scope twice.", amount: activeJ2.fee });
      ok("student can open a dispute on active work", d.status === "OPEN");
    });

  section("Moderator — verification");
  const kq = await mod.get("/moderator/kyc");
  const mk = kq.find((k) => k.subject?.email === "mehedi@demo.wb");
  shape("KYC queue item", mk, ["id", "status", "createdAt", "documents.0.label", "documents.0.detail", "subject.name", "subject.email"]);
  await step("ask to resubmit", () => mod.post(`/moderator/kyc/${mk.id}`, { decision: "resubmit", note: "Letter is unsigned" }));
  const mkyc = await mehedi.get("/student/kyc");
  ok("student sees RESUBMIT with the note", mkyc.submission?.status === "RESUBMIT" && mkyc.submission?.note === "Letter is unsigned");
  await step("student resubmits", () => mehedi.post("/student/kyc", { documents: [{ label: "Recommendation letter", detail: "Signed copy" }] }));
  const mk2 = (await mod.get("/moderator/kyc")).find((k) => k.subject?.email === "mehedi@demo.wb");
  await step("verify", () => mod.post(`/moderator/kyc/${mk2.id}`, { decision: "approve" }));
  ok("student is now VERIFIED", (await mehedi.get("/student/kyc")).status === "VERIFIED");

  section("Moderator — support, disputes, payments, directory");
  const tickets = await mod.get("/moderator/support");
  const tk = tickets.find((t) => t.subject === "Payout timing");
  shape("ticket row", tk, ["ref", "subject", "body", "priority", "status", "createdAt", "from.name", "from.role"]);
  await step("reply", () => mod.post(`/moderator/support/${tk.id}/reply`, { reply: "Within one working day of sign-off." }));
  ok("student sees the reply", (await nusrat.get("/support")).some((t) => t.reply === "Within one working day of sign-off."));
  const disputes = await mod.get("/moderator/disputes");
  const open = disputes.find((d) => d.status === "OPEN");
  shape("dispute row", open, ["ref", "status", "amount", "claim", "evidence", "raisedByRole", "createdAt", "task.title", "raisedBy.name"]);
  if (open)
    await step("rule dispute", async () => {
      const r = await mod.post(`/moderator/disputes/${open.id}/rule`, { outcome: "split", resolution: "Partial delivery; split the escrow." });
      ok("dispute resolved", r.resolved === true);
    });
  const pays = await mod.get("/moderator/payments");
  shape("payment ledger row", pays[0], ["id", "taskId", "amount", "status", "note", "updatedAt", "task.title", "client.name"]);
  const held = pays.find((p) => p.status === "HELD" && p.task?.status === "MATCHING");
  if (held)
    await step("refund", async () => {
      const r = await mod.post(`/moderator/tasks/${held.taskId}/refund`, { reason: "Client withdrew" });
      ok("refund -> REFUNDED", r.status === "REFUNDED");
    });
  const users = await mod.get("/moderator/users");
  shape("directory row", users.find((u) => u.role === "STUDENT"), ["id", "name", "email", "role", "isActive", "createdAt", "studentProfile.kycStatus"]);
  const students = await mod.get("/moderator/users?role=STUDENT");
  ok("directory filters by role", students.every((u) => u.role === "STUDENT"));
  const farzana = users.find((u) => u.email === "farzana@demo.wb");
  await step("restrict + reactivate", async () => {
    const off = await mod.post(`/moderator/users/${farzana.id}/active`, { isActive: false });
    const on = await mod.post(`/moderator/users/${farzana.id}/active`, { isActive: true });
    ok("restrict + reactivate", off.isActive === false && on.isActive === true);
  });
  const leftover = (await mod.get("/moderator/scopes"))[0];
  if (leftover)
    await step("reject a scope", async () => {
      const r = await mod.post(`/moderator/scopes/${leftover.id}/reject`, { reason: "Needs a site visit before scoping." });
      ok("scope rejected", r.rejected === true);
    });

  console.log(`\n${failed ? "✗" : "✓"} ${passed} passed, ${failed} failed`);
  if (failed) console.log("Run `npm run db:reseed` before re-running — this script changes data.");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("\nUnexpected error:", e.message);
  process.exit(1);
});
