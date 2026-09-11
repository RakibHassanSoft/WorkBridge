# WorkBridge — Backend API

Node.js + Express + TypeScript + Prisma (PostgreSQL). Modular, one folder per
feature, with a service/controller/validator/route/model split and unit tests.
Designed to line up with the WorkBridge frontend (`../src`) — the Prisma schema
mirrors `src/data/types.ts`, and roles map to the client / student / moderator
workspaces.

## Stack

- **Runtime:** Node.js + Express 4
- **Language:** TypeScript (strict)
- **ORM:** Prisma 5 + PostgreSQL
- **Validation:** zod
- **Auth:** JWT (Bearer) + bcrypt password hashing
- **Tests:** Jest + ts-jest (+ supertest for HTTP tests)

## Getting started

```bash
cd server
npm install
cp .env.example .env      # a working .env with your Render URL is already included
```

Sync the schema to your database and generate the client:

```bash
# simplest for a managed DB (Render): pushes the schema, no shadow DB needed
npx prisma db push
npx prisma generate

# — or, if you want versioned migration history and have create-db rights:
# npx prisma migrate dev --name init
```

Run it:

```bash
npm run dev       # http://localhost:4000  (tsx watch)
npm test          # unit tests
npm run build     # tsc -> dist (path aliases rewritten by tsc-alias)
npm start         # run the compiled build
```

Health check: `GET http://localhost:4000/api/v1/health`.

## Demo data

Populate the database with realistic demo data (clients, students, a
moderator, jobs in every state, trials, payments, a dispute, KYC queue,
support tickets) so every workspace looks full:

```bash
npm run seed        # wipes, then fills the database
npm run db:reset    # deletes ALL data (one command)
npm run db:reseed   # reset + seed
```

Demo logins — **3 clients, 2 moderators, 5 students** (password for all: `Passw0rd!`).
Full list with notes is in **`DEMO_ACCOUNTS.md`**.

| Role | Emails |
| --- | --- |
| Client (3) | `nokshi@demo.wb`, `chaap@demo.wb`, `shopno@demo.wb` |
| Moderator (2) | `mod@demo.wb`, `mod2@demo.wb` |
| Student (5) | `nusrat@demo.wb`, `tanvir@demo.wb`, `afsana@demo.wb` (verified); `mehedi@demo.wb`, `farzana@demo.wb` (pending) |

### Check the workspaces against the API

`npm run check:ui` walks the whole flow the three workspaces use — post, trial
check, escrow, scope release, trials, selection, chat, delivery, scoring,
revision, sign-off, verification, support, disputes, payments and the
directory — and checks every field the UI reads is in the responses. It changes
data, so run it on fresh seed data with the server running:

```bash
npm run db:reseed && npm run check:ui
```

## Project layout

```
server/
  prisma/
    schema.prisma          full data model for all three roles
  src/
    config/                env loading, Prisma singleton
    middlewares/           auth (JWT + role guard), zod validate, error handler
    utils/                 AppError, catchAsync, jwt, password, apiResponse
    routes/index.ts        mounts every module under /api/v1
    modules/
      auth/                register (all roles) + login
      user/                get by id, /me
      # client/  student/  moderator/   ← added in later phases
```

Every feature folder follows the same pattern:
`*.model.ts` (types + Prisma selections) · `*.service.ts` (business logic /
data access) · `*.controller.ts` (HTTP) · `*.validator.ts` (zod) ·
`*.route.ts` · `*.test.ts` (unit tests).

## Implemented so far

### Phase 1 — Foundation

- **`POST /api/v1/auth/register`** — role-aware. A `CLIENT` must send
  `businessName`; a `STUDENT` may send university/discipline/skills; a
  `MODERATOR` needs nothing extra. Creates the user and its role profile in one
  transaction, returns `{ user, token }`.
- **`POST /api/v1/auth/login`** — email + password, returns `{ user, token }`.
  Rejects unknown email / wrong password (401) and disabled accounts (403).
- **`GET /api/v1/users/me`** — the authenticated user (Bearer token).
- **`GET /api/v1/users/:id`** — a user by id (authenticated).

### Phase 2 — Client (all require an authenticated `CLIENT`)

- **`POST /client/jobs`** — post a problem. **Stored at once, no approval
  step.** The AI scopes it (`modules/ai`) and builds a small trial with the
  same features as the real task; the job, one priced task, its trial, a
  trial-check (`AWAITING_CLIENT`) and an unfunded payment (`AWAITING`) are
  persisted. Returns the job and the fair-price verdict.
- **`GET /client/jobs`** · **`GET /client/jobs/:id`** — list / detail.
- **`POST /client/tasks/:taskId/trial-check`** — `{ decision: approve | changes, note? }`.
  **Approve** puts the task live on the task board (`MATCHING`) — the client's
  approval is the only gate. **Changes** makes the AI rebuild the trial with
  the note as a new requirement (`trial.revision` + 1) and hands it back
  (`AWAITING_CLIENT`).
- **`POST /client/tasks/:taskId/deposit`** — fund the escrow (`AWAITING → HELD`).
  **Blocked** if the fee is 25%+ under the sector rate floor. Funding is what
  lets the moderator assign a student.
- **`GET /client/jobs`** also returns `trialStats` per task (students who did
  the trial, and how many the AI shortlisted) — counts only.
- **`POST /client/tasks/:taskId/signoff`** — `{ decision: accept | revision, note? }`.
  **Accept** releases the escrow (`HELD → RELEASED`), marks the job delivered,
  and credits the selected student **0** points. **Revision** keeps the escrow held.
- **`POST /client/tasks/:taskId/dispute`** — raise a dispute (one per task).
- **`GET/POST /client/tasks/:taskId/messages`** — task chat (opens once a
  student is suggested).
- **`GET /client/payments`** — spend. **`GET/POST /client/payment-methods`**.

### Phase 3 — Student (all require an authenticated `STUDENT`)

- **`GET/PATCH /student/profile`** — view / edit the student profile.
- **`POST /student/kyc`** — submit verification documents (recommendation
  letter, student ID, transcript, NID, payout account). Documents are stored
  **unverified**; a moderator clears them and makes the phone check (Phase 4).
  **`GET /student/kyc`** — current status.
- **`GET /student/tasks`** — browse the live board (only `MATCHING` tasks with an
  approved trial), each flagged with whether you've applied. **`GET /student/tasks/:taskId`** — detail.
- **`POST /student/tasks/:taskId/apply`** — **apply by doing the trial**: submit
  `{ summary, minutesTaken, attachments }`. The AI judges the uploaded files
  against **every requirement of the trial** and returns a `checklist`
  (met / partial / missing + evidence), a `completion` %, a quality `aiScore`,
  a public verdict and private coaching. **Completion ≥ 90% → `SHORTLISTED`**
  (sent to the moderator, ranked); below → `NOT_SHORTLISTED`. Requires a
  **verified** account, one attempt per task; **no points yet** — the
  +1/0/−1 resolves at selection and delivery.
- **`GET /student/trials`** · **`GET /student/points`** — your attempts and points ledger.
- **`GET /student/active`** — your assigned task(s).
  **`POST /student/tasks/:taskId/progress`** · **`POST /student/tasks/:taskId/submit`**
  — report progress / submit the finished work (→ `IN_REVIEW`).
- **`GET /student/record`** — verified/approved work. **`GET /student/earnings`** —
  released payments + total.
- **`POST /student/tasks/:taskId/dispute`** and task **messages** (shared chat).

### Phase 4 — Moderator (all require an authenticated `MODERATOR`)

The human gate. Every AI decision is a draft until a moderator releases it.

- **New posts (oversight, not approval)** — `GET /moderator/scopes` lists posts
  whose trial is still with the client. `POST /moderator/scopes/:jobId/approve`
  `{ fee?, hours? }` corrects the AI's price (only before funding and before
  anyone applies); `POST /moderator/scopes/:jobId/reject` cancels a post.
- **Select the student** — `GET /moderator/select` returns only tasks with an
  **AI shortlist**: attempts at **90%+ completion**, in rank order (completion,
  then quality, then who finished first), plus `belowBar` (how many were kept
  back) and `funded`. `POST /moderator/tasks/:taskId/select` `{ studentId, reason }`
  accepts only a `SHORTLISTED` student and only once the escrow is `HELD`.
  **This is where points resolve:** the selected student gets **0**
  (provisional), everyone else who did the trial gets **+1**; the task goes
  `IN_PROGRESS` and the client↔student chat opens.
- **Score work** — `GET /moderator/reviews`,
  `POST /moderator/tasks/:taskId/score` `{ scores[], note }` — creates the
  evaluation the client then signs off.
- **Verify students (KYC)** — `GET /moderator/kyc`, `POST /moderator/kyc/:id`
  `{ decision: approve | reject | resubmit }`. Approving clears every document
  and flips the student to `VERIFIED`.
- **Payments** — `GET /moderator/payments`,
  `POST /moderator/tasks/:taskId/refund`.
- **Disputes** — `GET /moderator/disputes`,
  `POST /moderator/disputes/:id/rule` `{ outcome: client | student | split }`.
  A **client refund** means the student failed to deliver, resolving their point
  to **−1**; the ruling is written onto the dispute record.
- **Support** — `GET /moderator/support`, `POST /moderator/support/:id/reply`.
  (Clients/students open tickets at `POST /support`.)
- **Directory** — `GET /moderator/users`, `POST /moderator/users/:id/active`
  (activate / restrict).
- **Controls** — `GET /moderator/controls` — rate floors and the locked platform
  rules (fair-price floor, escrow-on-signoff, verify-before-trial).

### The AI layer (`modules/ai/`)

`ai.engine.ts` is a server port of the frontend `src/lib/engine.ts` — the same
weighted keyword signals, sector rate floors, scale/urgency pricing and
fair-price check.

`ai.judge.ts` (identical copy in `src/lib/judge.ts` for the live demo) is the
trial builder and the judge:

- **Trial = a small copy of the real task.** It pulls the brief's features
  ("inventory dashboard", "daily sales report", "800 records"), scales the
  volume down to trial size ("20 records"), adds the sector's proof of work
  (README / source file / cited sources…), one planted ambiguity to flag, and
  "upload the files". That list is the trial's `acceptance` — the checklist.
- **Judging an upload.** Every requirement is checked against the **files**
  (the note explains, it is not evidence): key terms and synonyms, the kind of
  artifact asked for (a CSV with rows, code/HTML, Bangla text, images at two
  sizes, a source file…), explicit counts ("12 records"), and whether the
  planted ambiguity was flagged. Integrity checks cap the result whatever else
  happens: no files (≤ 40%), empty files (≤ 10%), gibberish (≤ 25%), the brief
  or requirements pasted back (≤ 50%), placeholder text (≤ 70%).
- **Completion** = met 1 · partial ½ · missing 0, averaged over the
  requirements. **`SHORTLIST_BAR = 90`**.

`ai.gemini.ts` calls the **Gemini API** (`GEMINI_API_KEY` + `GEMINI_MODEL`,
default `gemini-3.6-flash`) to scope briefs, rebuild trials and judge attempts
requirement by requirement — **images and scanned PDFs are sent to the model
so it can look at them** (the browser adds base64 for those; it is stripped
before anything is stored). `ai.service.ts` uses Gemini when a key is set and
the call succeeds, and **falls back to the deterministic judge** otherwise.
Two things are always computed server-side: the **fair-price check** and the
**completion %** (from the checklist, with the integrity caps — the model can't
mark work done when nothing was uploaded).

Set the key in `.env`:

```
GEMINI_API_KEY="your-aistudio-key"
GEMINI_MODEL="gemini-3.6-flash"
```

The full schema (jobs, tasks, trials, attempts, points, payments/escrow,
evaluations, disputes, support, chat, KYC, payment methods) is defined in
`schema.prisma`, so later phases add modules on a stable data model.

> **After pulling, update the database** — `npx prisma migrate deploy` (applies
> `0002_trial_shortlist`: `TrialAttempt.completion/checklist/aiFlags/aiSource`,
> `Trial.revision`, and releases every waiting scope) or `npx prisma db push`,
> then `npx prisma generate`. `0002` uses `ADD COLUMN IF NOT EXISTS`, so it is
> safe on a database that was built with `db push`.

## Roadmap

- **Phase 1 — Foundation (done):** config, Prisma, auth/JWT, error handling,
  the full schema, `user` + `auth` modules, unit tests.
- **Phase 2 — Client (done):** `ai` engine, post job → scope → trial-check →
  escrow deposit → sign-off (release) / revision (hold) → dispute, chat,
  payments & payment methods, unit tests.
- **Phase 3 — Student (done):** KYC/verification, browse & apply-by-trial with
  AI scoring, points ledger, active task, submit, verified record, earnings.
  Real Gemini AI wired in with a deterministic fallback.
- **Phase 4 — Moderator (done):** scope review, select student (points resolve
  here), score work, verify students (KYC), payments & refunds, dispute rulings,
  support replies, directory (activate/restrict), platform controls.

**All four phases are implemented.** The full loop runs end to end: client posts
(stored, no approval) → AI scopes + builds a same-feature trial → client approves
it (or the AI rebuilds it) → task goes live → students upload their trial work →
AI checks every requirement, shortlists 90%+ → client funds escrow → moderator
selects from the shortlist (+1/0) → student delivers → moderator scores → client
signs off (escrow released, point 0) → disputes/refunds where needed (−1 on failure).

## Production

Hardening already in place:

- **Helmet** security headers, **CORS** locked to `CORS_ORIGIN` (set your real
  frontend origin, not `*`), and `trust proxy` for correct client IPs behind a
  load balancer.
- **Rate limiting** — a global limiter plus a stricter limiter on `/auth`
  (brute-force protection).
- **Moderator lockdown** — `/auth/register` only creates `CLIENT`/`STUDENT`
  accounts publicly; a `MODERATOR` requires `MODERATOR_SIGNUP_CODE`. Leave that
  env var empty to disable moderator registration entirely once your
  coordinators exist.
- **Real migrations** — `prisma/migrations/` holds a versioned init migration;
  deploy with `npx prisma migrate deploy` (no shadow DB, no schema drift).
- **Dockerfile** — multi-stage build; the container runs `migrate deploy` then
  starts the compiled server.

Before going live:

1. Set strong secrets in the environment (not `.env` in the image):
   `JWT_SECRET`, `DATABASE_URL`, `MODERATOR_SIGNUP_CODE`, `GEMINI_API_KEY`, and
   `CORS_ORIGIN=https://your-frontend`.
2. **Rotate** the DB password, `JWT_SECRET`, and Gemini key that were shared in
   plaintext during development.
3. Run migrations: `npx prisma migrate deploy` (or let the Docker `CMD` do it).
   If your DB was previously created with `db push`, baseline it first:
   `npx prisma migrate resolve --applied 0001_init`.
4. Serve over HTTPS (terminate TLS at your proxy/load balancer).

```bash
docker build -t workbridge-api ./server
docker run -p 4000:4000 --env-file server/.env workbridge-api
```

## Notes

- `.env` holds secrets and is git-ignored. The escrow rule (funds released only
  on client sign-off), the fair-price floor, and verify-before-trial are all
  enforced in the services, not just the UI.
```
