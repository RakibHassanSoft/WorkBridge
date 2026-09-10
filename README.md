# WorkBridge — interactive platform prototype

A premium, fully static **Next.js 15** prototype of WorkBridge: a verified-work layer for
Bangladesh's graduate-to-employment gap. Bilingual (English ⇄ বাংলা), white / forest-green / ink
design system, and a simulated AI scoping layer that runs entirely in the browser.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

## Building the static site

```bash
npm run build      # writes a fully static site to ./out
```

`next.config.ts` sets `output: "export"`, so `out/` is plain HTML/CSS/JS. It can be dropped on
Netlify, Vercel, GitHub Pages, cPanel, or any static host with no server and no environment
variables. To preview the built output locally:

```bash
npx serve out
```

---

## What's in it

### Marketing site

| Route | What it is |
| --- | --- |
| `/` | Landing page — hero with a live AI-scoping preview, the problem, the six-step pipeline, the five turning points, nine sectors, the two entry layers, the Proof-of-Work passport, a competitor comparison, and the phased roadmap |
| `/how-it-works` | The pipeline in detail, what each of the three sides gets, and the objections worth answering |
| `/ai-engine` | The interactive scoping playground, plus the guided intake for clients who cannot write a brief (both below) |
| `/tasks` | The public task board — every client brief in its own words, filterable by skill, sector, fee and status (open / ongoing / completed / cancelled), latest first, with a right slide-over drawer |
| `/tasks/[id]` | Full task detail — the client's words, the AI's plain-language restatement and suggested route, acceptance criteria, applicants with match scores and why each was or wasn't chosen, a status timeline, the client's written cancellation reason where it applies, and the learn-from-the-outcome view |
| `/sectors` | All nine sectors with their verification rubrics and typical work |
| `/pricing` | Micro-task / project / entrepreneur tiers, and a published fee split |
| `/about` | The long-form argument, long-term impact, the five risks and their mitigations, partners, next steps |

### Product demo

| Route | What it is |
| --- | --- |
| `/app/client` | Client workspace — overview, posted problems with their AI breakdowns, deliverables awaiting sign-off (interactive), talent and connections, spend |
| `/app/student` | Student workspace — matched tasks with the matching reasons shown, an active-task workspace with a self-check and submission flow, the verified record, earnings |
| `/app/mentor` | Mentor console — review queue with a working 1–5 rubric scorer, all nine sector rubrics, verified graduates, and what mentors get |
| `/app/moderator` | Moderator console — the coordinator gate: AI scope review (approve / re-scope / reject), verification audit of both signatures, the payment ledger with escrow release and refunds, identity checks for businesses, students and mentors, client and student directories with account controls, and platform rules |
| `/passport/[slug]` | The public Proof-of-Work passport — one static page per demo graduate |

### The AI layer

`src/lib/engine.ts` is a **deterministic, rule-based simulation** of the Phase 2 scoping engine.
It runs in the browser with no model call and no network request, and it:

1. reads a plain-language brief in Bangla or English,
2. detects the sector from weighted keyword signals,
3. splits genuinely separate problems apart,
4. decomposes the work into a dependency-ordered task graph with fees, hours and acceptance criteria,
5. scales fees by the numbers and urgency it finds in the brief,
6. surfaces risks it cannot resolve from the brief alone, and
7. produces an explained match shortlist, always reserving a cold-start slot.

The interfaces are shaped the way a real service call would be, so the simulation can be replaced
by a model without touching any UI code.

Three more things sit on top of it:

- **Task simplification.** Every board task carries an AI restatement of the brief, a numbered
  route through the work, and the trap the brief is really describing — always beside the
  client's own words, never in place of them.
- **Guided intake** (`/ai-engine#intake`). Most SME owners can say what is annoying them but not
  what they want built. Six questions with no technical vocabulary assemble a brief, which is
  then run through the same scoping engine.
- **Fair-price check** (`priceCheck` in `src/lib/engine.ts`). Each sector has a rate floor set
  from what completed work there has actually paid. A brief priced more than 25% under its floor
  is *blocked* at the coordinator gate rather than quietly matched to whoever is desperate enough
  to take it. The moderator console cannot release it, and the intake flow will not submit it.

---

## Design system

Everything lives in `src/app/globals.css` as Tailwind v4 `@theme` tokens.

- **Canvas** pure white, with `#f7f9f8` / `#eff3f1` for surfaces
- **Ink** `#0a0e0c` → `#8e9793` for text
- **Brand** a forest-green ramp, `--color-brand-50` … `--color-brand-950`, primary `#0f7f52`
- **Type** Inter (body) and Inter Tight (display) for Latin, Noto Sans Bengali for বাংলা —
  all self-hosted in `src/fonts/`, so the site makes **zero external requests** and works offline

## Bilingual engine

`src/lib/i18n.tsx` provides a `LangProvider`, a `useLang()` hook, a `<T v={{ en, bn }} />` inline
node, and `useNum()` for Bengali-Indic numerals. Content is authored as `{ en, bn }` pairs
alongside the data, not in a separate translation file, so a copy change can never drift out of
sync between the two languages. The choice persists in `localStorage`.

---

## Project layout

```
src/
  app/                  routes (App Router, all statically exported)
  components/
    home/               landing-page sections
    marketing/          shared marketing sections
    engine/             the AI scoping playground and the guided intake
    tasks/              the task board, right drawer and task detail
    app/                the four role workspaces + app shell
    passport/           the public Proof-of-Work passport
    ui.tsx              buttons, cards, reveal-on-scroll, language toggle
  data/                 demo data — sectors, people, jobs, tasks, evaluations,
                        roadmap, the moderator layer (payments, KYC, scope
                        reviews, platform controls), and the marketplace layer
                        (board tasks, AI task copy, applicants, submissions)
  lib/
    engine.ts           the simulated scoping engine
    i18n.tsx            the bilingual engine
  fonts/                self-hosted variable fonts
```

---

## A note on the data

Every business, graduate, mentor, project and number in this prototype is demonstration data,
labelled as such in the interface. The roadmap, phases, risks, sectors and fee ranges follow the
WorkBridge proposal; the people and projects are invented to make the flows legible.
