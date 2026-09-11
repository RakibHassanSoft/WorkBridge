/**
 * AI judge benchmark fixtures — realistic trial submissions for all 9 sectors.
 *
 *  - TUNING set: 9 briefs x (excellent, own-words, missing-feature, no-flag) plus
 *    8 generated cheats per sector (no files, brief pasted, keyword list, claims
 *    typed into a file, unrelated work, gibberish, empty file, placeholder).
 *  - HOLDOUT set: 9 different briefs written after the judge was tuned.
 *
 * expect "pass" = must be shortlisted (>= 90%); "fail" = must be kept away from
 * the moderator. Used by ai.benchmark.test.ts.
 */
export type F = { name: string; mime: string; size?: number; content: string | null };
export type Case = { sector: string; kind: string; expect: "pass" | "fail"; summary: string; minutes: number; files: F[]; brief?: string };
const t = (name: string, content: string, mime = "text/plain"): F => ({ name, mime, content, size: content.length });
const bin = (name: string, mime: string, size: number): F => ({ name, mime, content: null, size });

export const CUSTOM: Case[] = [
  // ── IT: order tracking page ──
  { sector: "it", kind: "excellent", expect: "pass", minutes: 55, summary: "Built the order-tracking page: customer types an order number and sees the delivery status. README explains how to run and test. Order #1043 has a negative quantity (-2) in the sample — flagged, not hidden.",
    files: [
      t("track/index.html", "<main><h1>Track your order</h1><form id='track'><label>Order number <input name='order'></label><button>Track</button></form><p id='status'></p></main><script src='track.js'></script>", "text/html"),
      t("track/track.js", "const orders = { '1041': 'Out for delivery', '1042': 'Baking', '1043': 'Delivered' };\ndocument.getElementById('track').addEventListener('submit', (e) => {\n  e.preventDefault();\n  const n = e.target.order.value.trim();\n  document.getElementById('status').textContent = orders[n] ? `Delivery status: ${orders[n]}` : 'Order not found';\n});", "text/javascript"),
      t("track/README.md", "# Order tracking page\n## How to run\nOpen index.html in any browser.\n## How to test\nEnter 1041 → 'Out for delivery'; enter 9999 → 'Order not found'.\n## Flagged\nIn the sample data order 1043 has quantity -2. I did not change or hide it — please confirm whether it is a refund.", "text/markdown"),
    ] },
  { sector: "it", kind: "own-words", expect: "pass", minutes: 60, summary: "Small status lookup screen for the bakery; README has the steps. One sample row looked wrong.",
    files: [
      t("lookup.html", "<section class='lookup'><h2>Where is my cake?</h2><input id='code' placeholder='Your order no.'><button onclick='check()'>Check</button><div id='out'></div></section><script>const data={A17:'on the way',A18:'ready for pickup'};function check(){const c=document.getElementById('code').value;document.getElementById('out').innerText=data[c]||'No such order';}</script>", "text/html"),
      t("README.txt", "Steps to run: double-click lookup.html. To test: type A17, you should see 'on the way'.\nQuestion for the client: order A19 in the sheet shows a negative total (-350 tk). Is that a refund? I have not fixed it."),
    ] },
  { sector: "it", kind: "missing-feature", expect: "fail", minutes: 40, summary: "Made the page with the input box. Status part not done yet.",
    files: [t("index.html", "<h1>Bakery orders</h1><form><label>Order number</label><input name='order'><button>Search</button></form>", "text/html")] },
  { sector: "it", kind: "no-flag", expect: "fail", minutes: 50, summary: "Built the tracking page with status lookup and a README.",
    files: [
      t("index.html", "<h1>Track order</h1><input id='o'><button id='b'>Track</button><p id='s'></p><script src='app.js'></script>", "text/html"),
      t("app.js", "const statuses={1:'Baking',2:'Out for delivery'};document.getElementById('b').onclick=()=>{document.getElementById('s').textContent='Delivery status: '+(statuses[document.getElementById('o').value]||'unknown')};", "text/javascript"),
      t("README.md", "How to run: open index.html. How to test: enter 1 and check the delivery status shows 'Baking'.", "text/markdown"),
    ] },

  // ── Design: Eid poster ──
  { sector: "design", kind: "excellent", expect: "pass", minutes: 58, summary: "Eid poster at Facebook post size (1080x1080) and A4 print, from one editable Figma source; the discount sits in its own layer. Flagged: the brief says 20% off but the shop sign says 25%.",
    files: [
      bin("eid-poster/eid-poster-facebook-1080.png", "image/png", 612000),
      bin("eid-poster/eid-poster-a4-print.pdf", "application/pdf", 1840000),
      bin("eid-poster/eid-poster-source.fig", "application/octet-stream", 2400000),
      t("eid-poster/NOTES.md", "# Eid poster — festive, for the clothing shop\nTwo sizes: Facebook post 1080x1080 and A4 print (300dpi), both exported from the same editable source file.\nThe discount is in its own layer named `discount` so the price can change without touching the artwork.\n## Flagged\nThe brief says 20% off but the shop banner says 25% — I left the discount layer editable and need you to confirm which is right instead of guessing.", "text/markdown"),
    ] },
  { sector: "design", kind: "own-words", expect: "pass", minutes: 60, summary: "Poster done in two formats with the offer on a separate layer.",
    files: [
      bin("poster_fb.jpg", "image/jpeg", 420000),
      bin("poster_a4.png", "image/png", 980000),
      t("poster.svg", "<svg xmlns='http://www.w3.org/2000/svg'><g id='artwork'><text>Eid Mubarak — new festive collection</text></g><g id='discount' data-editable='true'><text>Flat 20% off</text></g></svg>", "image/svg+xml"),
      t("readme.txt", "Eid poster in Facebook size and A4 for print. Offer text is on its own editable layer (discount) in poster.svg.\nNot sure: should the discount show 20% or the 25% on the old banner? Please confirm."),
    ] },
  { sector: "design", kind: "missing-feature", expect: "fail", minutes: 45, summary: "Made the Facebook version of the Eid poster.",
    files: [bin("eid-fb.png", "image/png", 500000), t("notes.txt", "Eid poster for Facebook, 1080x1080. The discount is baked into the image. Should the price be 20% or 25%?")] },
  { sector: "design", kind: "no-flag", expect: "fail", minutes: 55, summary: "Poster in both sizes with editable source.",
    files: [bin("eid-fb.png", "image/png", 500000), bin("eid-a4.pdf", "application/pdf", 1500000), bin("eid.psd", "application/octet-stream", 3000000), t("notes.txt", "Festive Eid poster in Facebook post and A4 print sizes, exported from the editable source. Discount on its own layer.")] },

  // ── Content: wallet descriptions + Bangla ──
  { sector: "content", kind: "excellent", expect: "pass", minutes: 50, summary: "Two wallet descriptions in the brand voice with Bangla translations; each fact is sourced to the product tag. Flagged the name mismatch.",
    files: [t("wallets.md", "## 1. Classic Bifold Wallet\nHand-stitched from full-grain cowhide by artisans in Hazaribagh, this bifold wallet softens with use and keeps six cards and your notes in order. (Source: product tag, SKU LW-101)\nবাংলা: হাজারীবাগের কারিগরদের হাতে সেলাই করা খাঁটি গরুর চামড়ার এই বাইফোল্ড ওয়ালেট ব্যবহারে আরও নরম হয়, ছয়টি কার্ড রাখা যায়।\n\n## 2. Slim Card Holder\nA slim card holder cut from vegetable-tanned leather, made for a front pocket and finished by hand. (Source: website product page)\nবাংলা: ভেজিটেবল-ট্যানড চামড়ার পাতলা কার্ড হোল্ডার, সামনের পকেটের জন্য, হাতে ফিনিশ করা।\n\n**Question for the client:** the tag says 'Slim Card Holder' but the site says 'Mini Wallet' — which name should I use? I did not choose.", "text/markdown")] },
  { sector: "content", kind: "own-words", expect: "pass", minutes: 55, summary: "Wrote copy for two wallets plus Bangla versions, with sources.",
    files: [
      t("copy-en.txt", "Heritage Bifold — Cut from full-grain leather and stitched by hand in Dhaka, it holds six cards and ages into a rich brown. Ref: supplier spec sheet.\nPocket Slim — Vegetable-tanned leather card holder that slides into a front pocket without a bulge. Ref: product tag.\nUnclear: the tag calls it 'Pocket Slim' and the site 'Slim Holder' — which is correct?"),
      t("copy-bn.txt", "হেরিটেজ বাইফোল্ড — খাঁটি চামড়ায় ঢাকায় হাতে সেলাই, ছয়টি কার্ড রাখা যায়।\nপকেট স্লিম — ভেজিটেবল-ট্যানড চামড়ার কার্ড হোল্ডার, সামনের পকেটে সহজে ঢোকে।"),
    ] },
  { sector: "content", kind: "missing-feature", expect: "fail", minutes: 35, summary: "Two descriptions done, no translation yet.",
    files: [t("wallets.txt", "Classic Bifold Wallet — full-grain leather, hand-stitched, holds six cards. Source: product tag.\nSlim Card Holder — vegetable-tanned leather, fits a front pocket. Source: website.\nQuestion: tag vs site name differ for the card holder — which one?")] },
  { sector: "content", kind: "no-flag", expect: "fail", minutes: 45, summary: "Descriptions and Bangla translation.",
    files: [t("wallets.md", "## Classic Bifold Wallet\nFull-grain leather, hand-stitched in Hazaribagh, six card slots. Source: product tag.\nবাংলা: খাঁটি চামড়ার হাতে সেলাই করা ওয়ালেট, ছয়টি কার্ড স্লট।\n## Slim Card Holder\nVegetable-tanned leather, fits a front pocket. Source: website.\nবাংলা: ভেজিটেবল-ট্যানড চামড়ার কার্ড হোল্ডার।", "text/markdown")] },
];

// admin, biz, eng, agri, social, mkt
const rows = (n: number, flagged = true) => ["name,phone,area,date,note", ...Array.from({ length: n }, (_, i) => `Customer ${i + 1},01711${String(100000 + i)},${["Mirpur", "Uttara", "Banani", "Dhanmondi"][i % 4]},2026-08-${String((i % 28) + 1).padStart(2, "0")},${flagged && [4, 11, 17].includes(i) ? "UNREADABLE phone - flagged, not guessed" : ""}`)].join("\n");
CUSTOM.push(
  { sector: "admin", kind: "excellent", expect: "pass", minutes: 50, summary: "Entered 20 forms into the agreed columns; 3 were hard to read so I flagged them in the note column.", files: [t("registrations.csv", rows(20), "text/csv")] },
  { sector: "admin", kind: "own-words", expect: "pass", minutes: 55, summary: "Typed up the registration forms; unclear ones marked.", files: [t("forms_typed.tsv", rows(22).replace(/,/g, "\t"), "text/tab-separated-values")] },
  { sector: "admin", kind: "missing-feature", expect: "fail", minutes: 25, summary: "Entered the first forms; three unreadable ones are flagged.", files: [t("registrations.csv", rows(7), "text/csv")] },
  { sector: "admin", kind: "no-flag", expect: "fail", minutes: 50, summary: "Entered all forms.", files: [t("registrations.csv", rows(20, false), "text/csv")] },

  { sector: "biz", kind: "excellent", expect: "pass", minutes: 58, summary: "Reconciled a week of bKash sales against the bank statement; totals shown; two entries do not reconcile and are listed, not forced.",
    files: [
      t("reconciliation.csv", "date,bkash_txn,bkash_amount,bank_ref,bank_amount,matched\n2026-08-01,8N7X1,4500,BRAC-2231,4500,yes\n2026-08-02,8N7X2,3200,BRAC-2240,3200,yes\n2026-08-03,8N7X3,1250,,0,no\n2026-08-04,8N7X4,6100,BRAC-2262,6100,yes\n2026-08-05,8N7X5,2800,BRAC-2270,2750,no\nTOTAL,,17850,,16550,", "text/csv"),
      t("exceptions.md", "# Payments that don't match\n- 8N7X3 (৳1,250, 3 Aug): no bank credit found — could not match, needs checking with bKash.\n- 8N7X5: bKash ৳2,800 vs bank ৳2,750 — ৳50 gap, maybe the cash-out fee? Please confirm; I did not force a match.\nTotals: bKash sales ৳17,850, bank credits ৳16,550, difference ৳1,300.", "text/markdown"),
    ] },
  { sector: "biz", kind: "own-words", expect: "pass", minutes: 60, summary: "Matched mobile-money takings to the bank; two unmatched items listed.",
    files: [t("matching.xlsx.csv", "day,wallet_ref,wallet_tk,bank_line,bank_tk,status\nMon,Q1,5000,L7,5000,ok\nTue,Q2,2200,L9,2200,ok\nWed,Q3,900,-,0,UNMATCHED\nThu,Q4,3100,L12,3050,UNMATCHED\nTotal,,11200,,10250,\nNote: Q3 has no bank credit and Q4 is short by 50 tk — I could not reconcile these two, please confirm the fee.", "text/csv")] },
  { sector: "biz", kind: "missing-feature", expect: "fail", minutes: 30, summary: "Put the bKash sales in a sheet.",
    files: [t("bkash.csv", "date,txn,amount\n2026-08-01,8N7X1,4500\n2026-08-02,8N7X2,3200\n2026-08-03,8N7X3,1250", "text/csv")] },
  { sector: "biz", kind: "no-flag", expect: "fail", minutes: 50, summary: "Reconciled everything.",
    files: [t("reconciliation.csv", "date,bkash_amount,bank_amount,matched\n2026-08-01,4500,4500,yes\n2026-08-02,3200,3200,yes\n2026-08-03,1250,1250,yes\nTOTAL,8950,8950,", "text/csv")] },

  { sector: "eng", kind: "excellent", expect: "pass", minutes: 55, summary: "BOQ for brickwork and plaster of room 1 from the drawing, quantity and rate basis on every line. The window width on the east wall is missing — flagged, not assumed.",
    files: [
      t("boq-room1.csv", "item,description,unit,quantity,rate_basis,rate_tk,amount_tk\n1,Brickwork 250mm external wall (first class bricks, 1:6 mortar),m3,6.8,PWD schedule 2025 item 4.1,9800,66640\n2,Brickwork 125mm partition wall,m2,11.2,PWD schedule 2025 item 4.3,1450,16240\n3,Cement plaster 12mm internal (1:4),m2,58.4,PWD schedule 2025 item 7.2,310,18104\n4,Cement plaster 20mm external (1:4),m2,31.0,PWD schedule 2025 item 7.4,420,13020", "text/csv"),
      t("NOTES.md", "# Bill of quantities — office extension, room 1\nQuantities taken from drawing A-01 (plan and section); deductions made for the door (0.9 x 2.1 m).\n## Flagged\nThe east wall window width is missing from the drawing. I did not assume a value — the external plaster quantity will change once it is confirmed.", "text/markdown"),
    ] },
  { sector: "eng", kind: "own-words", expect: "pass", minutes: 60, summary: "Takeoff for the masonry and rendering, each line with how it was priced; one missing measurement flagged.",
    files: [t("takeoff.csv", "line,work,unit,qty,basis,rate\n1,brick wall 10 inch,cft,240,market rate Mirpur Aug-2026,145\n2,brick wall 5 inch,sft,121,market rate Mirpur Aug-2026,160\n3,inside plaster,sft,628,market rate Mirpur Aug-2026,32\n4,outside plaster,sft,334,market rate Mirpur Aug-2026,44\nNote: the window on drawing A-01 has no width dimension - could not measure it, please confirm before I finalise line 4.", "text/csv")] },
  { sector: "eng", kind: "missing-feature", expect: "fail", minutes: 35, summary: "Brickwork quantities done; plaster not included.",
    files: [t("boq.csv", "item,unit,quantity\nBrickwork 250mm,m3,6.8\nBrickwork 125mm,m2,11.2\nNote: window width missing on the drawing — flagged.", "text/csv")] },
  { sector: "eng", kind: "no-flag", expect: "fail", minutes: 50, summary: "BOQ complete.",
    files: [t("boq.csv", "item,description,unit,quantity,rate_basis,rate_tk\n1,Brickwork 250mm,m3,6.8,PWD 2025,9800\n2,Plaster internal,m2,58.4,PWD 2025,310\n3,Plaster external,m2,34.0,PWD 2025,420\nAssumed the window is 1.2 m wide.", "text/csv")] },

  { sector: "agri", kind: "excellent", expect: "pass", minutes: 58, summary: "Analysed 3 seasons of yields for 4 farmers; two findings tied to the figures, assumptions stated, and I say where the evidence is thin.",
    files: [
      t("yields.csv", "farmer,season,plan,yield_t_per_ha\nRahim,Boro-24,A (urea only),4.1\nRahim,Aman-24,B (NPK + zinc),4.9\nRahim,Boro-25,B (NPK + zinc),5.0\nKarim,Boro-24,B (NPK + zinc),4.8\nKarim,Aman-24,B (NPK + zinc),4.7\nKarim,Boro-25,A (urea only),4.0\nSalma,Boro-24,A (urea only),3.9\nSalma,Aman-24,A (urea only),4.2\nSalma,Boro-25,B (NPK + zinc),4.9\nJolil,Boro-24,B (NPK + zinc),5.1\nJolil,Aman-24,A (urea only),4.0\nJolil,Boro-25,B (NPK + zinc),5.2", "text/csv"),
      t("findings.md", "# Findings — which fertiliser plan works best\n1. Plan B (NPK + zinc) averaged 4.94 t/ha against 4.03 t/ha for plan A (urea only) — about 0.9 t/ha more, in every one of the 4 farmers.\n2. The gap is larger in Boro (5.03 vs 4.0) than in Aman (4.8 vs 4.1).\n## Assumptions\n- Plots are the same size and irrigated the same way.\n## Where I am guessing\nOnly 4 farmers and 12 plots — the evidence is thin, so finding 2 is a guess until more farmers are added.", "text/markdown"),
    ] },
  { sector: "agri", kind: "own-words", expect: "pass", minutes: 60, summary: "Compared the two fertiliser programmes across the seasons; conclusions with numbers; limits noted.",
    files: [t("analysis.md", "## Rice yield comparison (4 growers, 3 seasons)\n| grower | season | programme | t/ha |\n|---|---|---|---|\n| Rahim | Boro-24 | urea only | 4.1 |\n| Rahim | Aman-24 | NPK+zinc | 4.9 |\n| Karim | Boro-24 | NPK+zinc | 4.8 |\n| Salma | Aman-24 | urea only | 4.2 |\n| Jolil | Boro-25 | NPK+zinc | 5.2 |\nConclusion 1: NPK+zinc gives roughly 0.8-0.9 t/ha more than urea only (avg 4.97 vs 4.15).\nConclusion 2: the benefit looks biggest in Boro season.\nAssumption: same plot size. Caveat: very small sample — I am not sure conclusion 2 holds; more growers needed.", "text/markdown")] },
  { sector: "agri", kind: "missing-feature", expect: "fail", minutes: 30, summary: "Typed the yield data into a table.",
    files: [t("yields.csv", "farmer,season,plan,yield\nRahim,Boro-24,A,4.1\nKarim,Boro-24,B,4.8\nSalma,Aman-24,A,4.2\nJolil,Boro-25,B,5.2\nSample is thin, unsure about the season effect.", "text/csv")] },
  { sector: "agri", kind: "no-flag", expect: "fail", minutes: 50, summary: "Findings written.",
    files: [t("findings.md", "# Rice yield findings\nAnalysed 3 seasons of data from 4 farmers. Plan B (NPK + zinc) gives 4.94 t/ha vs 4.03 t/ha for plan A. Plan B is clearly the best fertiliser plan for every season and every farmer.\n| plan | avg yield |\n|---|---|\n| A | 4.03 |\n| B | 4.94 |", "text/markdown")] },

  { sector: "social", kind: "excellent", expect: "pass", minutes: 55, summary: "Coded 3 transcripts into commute themes with quotes, wrote a short summary; one response fits no theme and is noted.",
    files: [
      t("coding.md", "# Commute problems — 3 garment worker interviews\n## Theme 1: Cost of transport\n- R1: \"Half my overtime goes on the tempo fare.\"\n- R3: \"If the fare goes up again I will walk two hours.\"\n## Theme 2: Safety at night\n- R2: \"After the night shift the road is dark, we walk in groups.\"\n## Theme 3: Time lost\n- R1: \"The bus takes one hour for six kilometres.\"\n## Fits no theme\n- R2: \"My mother is sick so I leave early\" — this does not fit any commute theme; noted instead of forcing it.\n## Short summary\nCost and night-time safety dominate; every respondent loses over an hour a day to the commute.", "text/markdown"),
    ] },
  { sector: "social", kind: "own-words", expect: "pass", minutes: 60, summary: "Thematic analysis of the three interviews with verbatim quotes and a brief summary; one outlier noted.",
    files: [t("themes.csv", "respondent,theme,quote\nR1,fares too high,\"Half my overtime goes on the fare\"\nR2,unsafe after dark,\"We walk in groups after the night shift\"\nR3,long travel time,\"One hour for six kilometres\"\nR2,OUTLIER - no theme,\"My mother is sick\" (does not fit any theme, flagged)", "text/csv"), t("summary.txt", "Summary: fares and safety after dark are the biggest commute problems for these garment workers; long travel times come next. One response did not fit any theme and is marked as an outlier rather than forced.")] },
  { sector: "social", kind: "missing-feature", expect: "fail", minutes: 30, summary: "Summary only.",
    files: [t("summary.txt", "Short summary: garment workers struggle with transport cost and safety at night when commuting. One interview did not fit any theme.")] },
  { sector: "social", kind: "no-flag", expect: "fail", minutes: 50, summary: "Coded all three.",
    files: [t("coding.md", "# Themes\n## Cost\n- R1: \"Half my overtime goes on the fare.\"\n## Safety\n- R2: \"We walk in groups after the night shift.\"\n- R2: \"My mother is sick so I leave early\" (put under safety)\n## Time\n- R3: \"One hour for six kilometres.\"\nSummary: cost, safety and time are the commute problems.", "text/markdown")] },

  { sector: "mkt", kind: "excellent", expect: "pass", minutes: 50, summary: "Two-week Facebook ad plan for the Mirpur cafe aimed at university students, with audience, budget, ads, and the metrics to track. Flagged what I would confirm first.",
    files: [t("campaign-plan.md", "# Facebook ad campaign — new cafe, Mirpur (2 weeks)\n## Target audience\nAge 18-24, students at universities within 5 km of Mirpur 10 (MIST, BUP, Mirpur campuses), interests: coffee, study spots, Bangla indie music.\n## Budget & schedule\n৳1,000/day for 14 days; week 1 awareness (video), week 2 offer (20% student discount with ID).\n## Ads\n1. Reel: 'Your new study spot in Mirpur' — CTA: Get directions.\n2. Carousel: menu under ৳200.\n## Metrics to track\nReach, CTR (target 1.5%), cost per message, and student-ID discount redemptions in the cafe.\n## Confirm first\nThe segment data is partial — I would confirm the cafe's opening hours and whether students actually come after 8pm before spending on evening ads.", "text/markdown")] },
  { sector: "mkt", kind: "own-words", expect: "pass", minutes: 55, summary: "Two-week FB promotion for students near the cafe, KPIs listed, open question noted.",
    files: [t("fb_plan.txt", "Promotion plan (14 days) — cafe in Mirpur, Facebook + Instagram placements.\nWho: undergraduates aged 18-24 living or studying near Mirpur, interested in coffee and group study.\nSpend: 14,000 tk total. Days 1-7 reels to build reach, days 8-14 student discount offer.\nCreative: 'Study break? 20% off with your student ID'.\nKPIs: reach, clicks/CTR, messages, and discount codes used at the till.\nTo confirm first: we only have partial data on students' evening habits - need the cafe's footfall by hour before choosing ad times.")] },
  { sector: "mkt", kind: "missing-feature", expect: "fail", minutes: 25, summary: "Wrote the ad text.",
    files: [t("ad.txt", "Ad copy: 'Your new favourite cafe in Mirpur! Come try our coffee.' Not sure about the student data.")] },
  { sector: "mkt", kind: "no-flag", expect: "fail", minutes: 45, summary: "Campaign plan done.",
    files: [t("plan.md", "# Two-week Facebook ad campaign for the new cafe in Mirpur\nTarget audience: university students aged 18-24 in Mirpur.\nBudget ৳14,000 over 14 days. Ads: reels and a student discount carousel.\nMetrics: reach, CTR and discount redemptions.", "text/markdown")] },
);

export const BRIEFS: Record<string, string> = {
  it: "Build a simple order-tracking page for our bakery website where customers enter their order number and see the delivery status.",
  design: "Design a festive Eid poster for our clothing shop in two sizes (Facebook post and A4 print) with the discount in its own editable layer.",
  content: "Write five product descriptions for our handmade leather wallets in our brand voice and translate them to Bangla.",
  admin: "Enter 600 handwritten customer registration forms into a spreadsheet with the columns name, phone, area and date.",
  biz: "Reconcile last month's bKash sales against our bank statement and list any payments that don't match.",
  eng: "Prepare a bill of quantities for the brickwork and plaster of our two-room office extension from the attached drawing.",
  agri: "Analyse our 3 seasons of rice yield data from 40 farmers and write findings on which fertiliser plan works best.",
  social: "Code 30 interview transcripts with garment workers into themes about commute problems and write a short summary.",
  mkt: "Plan a two-week Facebook ad campaign for our new cafe in Mirpur targeting university students.",
};

export const HOLDOUT_BRIEFS = {
  it: "Our pharmacy needs a medicine stock alert: a small web page that lists medicines and highlights the ones below the reorder level.",
  design: "Make a logo for our tea stall 'Cha Adda' and show it on a cup mockup and a signboard mockup.",
  content: "Translate our 3-page restaurant menu from English to Bangla, keeping dish names and prices exactly as they are.",
  admin: "Clean our messy supplier contact list of 300 rows: remove duplicates and put phone numbers in one format.",
  biz: "Build a simple monthly cash flow forecast for our tailoring shop for the next 6 months from last year's figures.",
  eng: "Check the load calculation for a 20-foot steel beam in our warehouse mezzanine and report whether the section is adequate.",
  agri: "Survey 25 fish farmers about feed costs and summarise which feed brand gives the best growth per taka.",
  social: "Design a 15-question survey on women's access to mobile banking in Rangpur and pilot it with a few respondents.",
  mkt: "Write a month of Instagram posts for our organic honey brand with captions and hashtags.",
};
export const HOLDOUT: Case[] = [
  { sector: "it", brief: HOLDOUT_BRIEFS.it, kind: "good", expect: "pass", minutes: 55, summary: "Stock alert page: lists medicines, highlights those under reorder level; README with test steps. Paracetamol reorder level is blank in the sample — flagged.",
    files: [t("alert/index.html", "<table id='meds'><thead><tr><th>Medicine</th><th>In stock</th><th>Reorder level</th></tr></thead><tbody></tbody></table><script src='alert.js'></script>", "text/html"),
      t("alert/alert.js", "const meds=[{name:'Napa 500',stock:40,reorder:100},{name:'Seclo 20',stock:300,reorder:120},{name:'Paracetamol syrup',stock:12,reorder:null}];\nfor(const m of meds){const low=m.reorder!==null&&m.stock<m.reorder;document.querySelector('#meds tbody').insertAdjacentHTML('beforeend',`<tr class='${low?'low':''}'><td>${m.name}</td><td>${m.stock}</td><td>${m.reorder??'?'}</td></tr>`)}", "text/javascript"),
      t("alert/README.md", "# Medicine stock alert\nHow to run: open index.html. How to test: Napa 500 (40 < 100) should be highlighted as low stock.\nQuestion: Paracetamol syrup has no reorder level in the sample — I left it un-highlighted and marked '?'. Please confirm the level.", "text/markdown")] },
  { sector: "it", brief: HOLDOUT_BRIEFS.it, kind: "weak", expect: "fail", minutes: 30, summary: "Listed the medicines.", files: [t("meds.html", "<ul><li>Napa 500 — 40</li><li>Seclo 20 — 300</li></ul>", "text/html")] },
  { sector: "it", brief: HOLDOUT_BRIEFS.it, kind: "wrong-task", expect: "fail", minutes: 40, summary: "Here is my translation work.", files: [t("menu-bn.md", "## মেনু\nচিকেন বিরিয়ানি — ২৮০ টাকা\nবিফ তেহারি — ২৬০ টাকা\nবোরহানি — ৬০ টাকা", "text/markdown")] },

  { sector: "design", brief: HOLDOUT_BRIEFS.design, kind: "good", expect: "pass", minutes: 60, summary: "Cha Adda logo with cup and signboard mockups plus the editable vector source. Asked which Bangla spelling of the name to use.",
    files: [bin("cha-adda/logo.png", "image/png", 180000), bin("cha-adda/mockup-cup.jpg", "image/jpeg", 540000), bin("cha-adda/mockup-signboard.jpg", "image/jpeg", 820000), bin("cha-adda/logo.ai", "application/postscript", 1300000),
      t("cha-adda/NOTES.md", "# Cha Adda logo\nA steaming clay cup (bhaar) inside a round badge, with 'Cha Adda' lettering. Shown on a cup mockup and a signboard mockup; both exported from the editable vector source (logo.ai).\nQuestion for the client: should the Bangla name read 'চা আড্ডা' or 'চা-আড্ডা'? I did not choose.", "text/markdown")] },
  { sector: "design", brief: HOLDOUT_BRIEFS.design, kind: "weak", expect: "fail", minutes: 25, summary: "Logo only.", files: [bin("logo.png", "image/png", 150000), t("notes.txt", "Cha Adda logo, one version.")] },
  { sector: "design", brief: HOLDOUT_BRIEFS.design, kind: "stock-text", expect: "fail", minutes: 10, summary: "Logo ideas.", files: [t("ideas.txt", "Logo ideas for a tea stall: a cup, some steam, warm brown colours, a friendly font. Could also use a kettle.")] },

  { sector: "content", brief: HOLDOUT_BRIEFS.content, kind: "good", expect: "pass", minutes: 55, summary: "Translated the first page of the menu to Bangla; dish names and prices kept exactly; one price didn't match between pages — asked.",
    files: [t("menu-page1-bn.md", "# মেনু — পৃষ্ঠা ১ (Menu page 1)\n| English | বাংলা | Price |\n|---|---|---|\n| Chicken Biryani | চিকেন বিরিয়ানি | 280 |\n| Beef Tehari | বিফ তেহারি | 260 |\n| Borhani | বোরহানি | 60 |\n| Firni | ফিরনি | 80 |\nSource: client's English menu PDF, page 1.\nQuestion: Firni is 80 on page 1 but 90 on page 3 — which price is correct? I kept 80 as printed.", "text/markdown")] },
  { sector: "content", brief: HOLDOUT_BRIEFS.content, kind: "weak", expect: "fail", minutes: 20, summary: "Did some items, English only cleaned up.", files: [t("menu.txt", "Chicken Biryani 280\nBeef Tehari 260\nBorhani 60")] },
  { sector: "content", brief: HOLDOUT_BRIEFS.content, kind: "machine-junk", expect: "fail", minutes: 5, summary: "done", files: [t("menu.txt", "Menu menu menu translate Bangla dish names prices exactly keep keep keep")] },

  { sector: "admin", brief: HOLDOUT_BRIEFS.admin, kind: "good", expect: "pass", minutes: 50, summary: "Cleaned 20 rows: duplicates removed, phones in +8801 format; 2 rows had phones I could not read — flagged.",
    files: [t("suppliers-clean.csv", ["supplier,contact_person,phone,area,note", ...Array.from({ length: 20 }, (_, i) => `Supplier ${i + 1},Person ${i + 1},+88017${String(10000000 + i * 7919).slice(0, 8)},${["Tejgaon", "Gazipur", "Savar"][i % 3]},${i === 6 || i === 13 ? "phone unreadable - flagged" : ""}`), "# removed 4 duplicate rows (same supplier + phone)"].join("\n"), "text/csv")] },
  { sector: "admin", brief: HOLDOUT_BRIEFS.admin, kind: "weak", expect: "fail", minutes: 20, summary: "Removed duplicates.", files: [t("suppliers.csv", "supplier,phone\nA,01711-000001\nB,8801711000002\nC,+880 1711 000003", "text/csv")] },
  { sector: "admin", brief: HOLDOUT_BRIEFS.admin, kind: "no-files", expect: "fail", minutes: 40, summary: "I cleaned all 300 rows, removed duplicates, formatted every phone number to +8801 and flagged unclear rows. Everything is complete and ready.", files: [] },

  { sector: "biz", brief: HOLDOUT_BRIEFS.biz, kind: "good", expect: "pass", minutes: 60, summary: "6-month cash flow forecast from last year's monthly figures, totals shown; two months with odd expenses flagged.",
    files: [t("cashflow.csv", "month,opening_cash,cash_in,cash_out,net,closing_cash\nOct,50000,82000,70000,12000,62000\nNov,62000,90000,76000,14000,76000\nDec,76000,120000,85000,35000,111000\nJan,111000,70000,72000,-2000,109000\nFeb,109000,68000,71000,-3000,106000\nMar,106000,150000,95000,55000,161000\nTOTAL,,580000,469000,111000,", "text/csv"),
      t("assumptions.md", "# Cash flow forecast — tailoring shop\nBased on last year's monthly sales; Eid (March) sales assumed +20%.\nCould not reconcile: last January shows a ৳30,000 'misc' expense with no receipt — I did not include it; please confirm what it was.", "text/markdown")] },
  { sector: "biz", brief: HOLDOUT_BRIEFS.biz, kind: "weak", expect: "fail", minutes: 25, summary: "Wrote down last year's sales.", files: [t("sales.txt", "Last year sales were good in Eid months and slow in winter.")] },
  { sector: "biz", brief: HOLDOUT_BRIEFS.biz, kind: "placeholder", expect: "fail", minutes: 10, summary: "template", files: [t("forecast.csv", "month,cash_in,cash_out\nTODO,TODO,TODO\nlorem ipsum,xxx,xxx", "text/csv")] },

  { sector: "eng", brief: HOLDOUT_BRIEFS.eng, kind: "good", expect: "pass", minutes: 60, summary: "Checked bending and deflection for the 20 ft beam; section adequate for bending, deflection marginal; the live load value is missing so I flagged it.",
    files: [t("beam-check.md", "# Steel beam check — 20 ft (6.1 m) mezzanine beam, W8x18\n| check | value | limit | result |\n|---|---|---|---|\n| Bending moment | 42.5 kN·m | 61.0 kN·m (φMn) | OK |\n| Shear | 27.9 kN | 170 kN | OK |\n| Deflection | 21 mm | 17 mm (L/360) | NOT OK |\nLoads: dead 3.0 kPa (rate basis: BNBC 2020 Table 6.2.1), live load assumed from drawing note.\nQuantity: 1 beam, 6.1 m, 26.8 kg/m.\n## Flagged\nThe live load for the mezzanine is missing from the drawing — I could not confirm it, so the deflection result must be re-checked once it is given.", "text/markdown")] },
  { sector: "eng", brief: HOLDOUT_BRIEFS.eng, kind: "weak", expect: "fail", minutes: 20, summary: "Looked at the beam; seems fine.", files: [t("notes.txt", "The beam looks strong enough for a mezzanine.")] },
  { sector: "eng", brief: HOLDOUT_BRIEFS.eng, kind: "guessed", expect: "fail", minutes: 45, summary: "Full check done.", files: [t("check.md", "# Beam check\n| check | value | limit | result |\n|---|---|---|---|\n| Bending | 42.5 kN·m | 61.0 kN·m | OK |\n| Deflection | 15 mm | 17 mm | OK |\nLive load assumed 5 kPa since it was not given. Quantity 1 beam, rate basis BNBC 2020. Section is adequate.", "text/markdown")] },

  { sector: "agri", brief: HOLDOUT_BRIEFS.agri, kind: "good", expect: "pass", minutes: 60, summary: "Surveyed 3 fish farmers (trial size), compared feed brands on growth per taka, stated assumptions and where data is thin.",
    files: [t("feed-survey.csv", "farmer,feed_brand,feed_cost_tk_per_kg,weight_gain_g_per_fish_30d,gain_per_100tk\nMonir,Quality Feed,58,190,3.3\nRuma,Aftab Feed,52,160,3.1\nHasan,Quality Feed,58,210,3.6", "text/csv"),
      t("summary.md", "# Which feed gives the best growth per taka\nFinding 1: Quality Feed gave 3.3-3.6 g gain per ৳100 against 3.1 g for Aftab Feed, despite costing ৳6/kg more.\nAssumption: all ponds stocked at similar density.\nCaveat: only 3 farmers — the evidence is thin, so this is not yet a firm result.", "text/markdown")] },
  { sector: "agri", brief: HOLDOUT_BRIEFS.agri, kind: "weak", expect: "fail", minutes: 25, summary: "Asked farmers; they like Quality Feed.", files: [t("notes.txt", "Most farmers said Quality Feed is better. It costs more.")] },
  { sector: "agri", brief: HOLDOUT_BRIEFS.agri, kind: "unrelated-data", expect: "fail", minutes: 30, summary: "Data attached.", files: [t("rice.csv", "farmer,season,yield\nRahim,Boro,4.1\nKarim,Aman,4.8\nSalma,Boro,3.9", "text/csv")] },

  { sector: "social", brief: HOLDOUT_BRIEFS.social, kind: "good", expect: "pass", minutes: 60, summary: "Wrote the questionnaire (trial size, 5 of 15 questions) and piloted with 2 women; quotes recorded; one question confused respondents — flagged.",
    files: [t("survey-pilot.md", "# Women's access to mobile banking — Rangpur (pilot)\n## Questions (draft, 5 of 15)\n1. Do you have your own mobile phone? (yes/no)\n2. Do you have a bKash or Nagad account in your own name?\n3. Who usually does the cash-in for you?\n4. What stops you from using mobile banking more?\n5. Have you ever lost money in a transaction?\n## Pilot responses\n- R1 (Mithapukur): \"My husband keeps the PIN, I only receive money.\"\n- R2 (Pirganj): \"The agent shop is far and full of men.\"\n## Flagged\nQuestion 3 did not fit how R2 answered — she does cash-in herself but through her son's account. I noted it instead of forcing an answer; the question needs rewording.", "text/markdown")] },
  { sector: "social", brief: HOLDOUT_BRIEFS.social, kind: "weak", expect: "fail", minutes: 20, summary: "Made a few questions.", files: [t("q.txt", "1. Do you use bKash?\n2. Why not?")] },
  { sector: "social", brief: HOLDOUT_BRIEFS.social, kind: "copied-brief", expect: "fail", minutes: 5, summary: "done", files: [t("survey.txt", HOLDOUT_BRIEFS.social + "\nDesign a 15-question survey on women's access to mobile banking in Rangpur and pilot it with a few respondents. Quote respondents.")] },

  { sector: "mkt", brief: HOLDOUT_BRIEFS.mkt, kind: "good", expect: "pass", minutes: 55, summary: "A week of Instagram posts (trial size) with captions and hashtags, audience and metrics stated; asked whether we can claim 'raw'.",
    files: [t("instagram-week1.md", "# Organic honey — Instagram, week 1\nAudience: women 25-40 in Dhaka who buy organic food; interests: healthy cooking, baby food.\n## Posts\n1. Mon — Reel: honey pouring over pitha. Caption: 'Sundarbans honey, straight from the hive.' #organichoney #Sundarbans #healthyBangladesh\n2. Wed — Carousel: 3 recipes with honey. Caption: 'Breakfast, sweeter.' #honeyrecipes #organicfood\n3. Fri — Photo: beekeeper portrait. Caption: 'Meet Rahim, our beekeeper in Satkhira.' #beekeeper #madeinbangladesh\nMetrics to track: reach, saves, profile visits, DMs asking for price.\nTo confirm first: can we legally say 'raw' on the label? I did not use the word until you confirm.", "text/markdown")] },
  { sector: "mkt", brief: HOLDOUT_BRIEFS.mkt, kind: "weak", expect: "fail", minutes: 15, summary: "Captions done.", files: [t("captions.txt", "Pure honey for your family.\nTaste the Sundarbans.")] },
  { sector: "mkt", brief: HOLDOUT_BRIEFS.mkt, kind: "hashtag-dump", expect: "fail", minutes: 5, summary: "hashtags", files: [t("tags.txt", "#honey\n#organic\n#instagram\n#posts\n#captions\n#hashtags\n#month\n#brand")] },
];
