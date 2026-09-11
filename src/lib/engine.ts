/**
 * WorkBridge scoping engine — DEMONSTRATION ONLY.
 *
 * This is a deterministic, rule-based simulation of the Phase 2 AI layer.
 * It reads a plain-language brief, detects which sector the work belongs to,
 * decomposes it into a dependency-ordered task graph with fees and acceptance
 * criteria, surfaces risks, and produces an explained match shortlist.
 *
 * No network calls, no model. Everything runs in the browser so the whole
 * platform can be exported as a static site. The interfaces below are shaped
 * the way a real service call would be, so the simulation can be swapped for
 * a model without touching the UI.
 */

import { planTrial, SHORTLIST_BAR, isFaultBrief, IT_BUILD_CATCH, IT_BUILD_CATCH_BN } from "./judge";
import type { L } from "@/lib/i18n";
import { SECTORS, sectorById } from "@/data/sectors";
import { STUDENTS } from "@/data/people";
import type { Student } from "@/data/types";

export type ScopedTask = {
  id: string;
  seq: number;
  title: L;
  desc: L;
  fee: number;
  hours: number;
  level: "micro" | "standard" | "advanced";
  skills: string[];
  acceptance: { en: string[]; bn: string[] };
  dependsOn?: number;
};

export type Match = {
  student: Student;
  score: number;
  reasons: L[];
  coldStart: boolean;
};

export type ScopeResult = {
  sectorId: string;
  signals: { label: L; weight: number }[];
  problems: L[];
  summary: L;
  complexity: "Low" | "Medium" | "High";
  confidence: number;
  tasks: ScopedTask[];
  risks: L[];
  matches: Match[];
  totalFee: number;
  totalHours: number;
};

/* ── Sector detection ─────────────────────────────────────────── */

type Signal = { sector: string; weight: number; label: L; re: RegExp };

const SIGNALS: Signal[] = [
  { sector: "it", weight: 3, label: { en: "website / storefront", bn: "ওয়েবসাইট / স্টোরফ্রন্ট" }, re: /\b(website|site|web|store|storefront|ecommerce|e-commerce|app|ওয়েবসাইট|সাইট|অ্যাপ)\b/i },
  { sector: "it", weight: 4, label: { en: "checkout / payment failure", bn: "চেকআউট / পেমেন্ট সমস্যা" }, re: /\b(checkout|payment|gateway|bkash|nagad|cart|order fail\w*|চেকআউট|পেমেন্ট|গেটওয়ে|বিকাশ|নগদ)\b/i },
  { sector: "it", weight: 3, label: { en: "dashboard / reporting", bn: "ড্যাশবোর্ড / রিপোর্টিং" }, re: /\b(dashboard|report|analytics|automat\w*|integration|api|ড্যাশবোর্ড|রিপোর্ট|অটোমেশন)\b/i },
  { sector: "mkt", weight: 4, label: { en: "social media / campaign", bn: "সোশ্যাল মিডিয়া / ক্যাম্পেইন" }, re: /\b(social|facebook|instagram|tiktok|campaign|ads?|marketing|agency|সোশ্যাল|ফেসবুক|ইনস্টাগ্রাম|মার্কেটিং|ক্যাম্পেইন|বিজ্ঞাপন)\b/i },
  { sector: "mkt", weight: 2, label: { en: "leads / customers", bn: "লিড / কাস্টমার" }, re: /\b(lead|customer|crm|funnel|conversion|লিড|কাস্টমার|ক্রেতা)\b/i },
  { sector: "biz", weight: 4, label: { en: "accounts / bookkeeping", bn: "হিসাব / বুককিপিং" }, re: /\b(account\w*|bookkeep\w*|ledger|vat|tax|invoice|costing|budget|হিসাব|খাতা|ভ্যাট|ট্যাক্স|ইনভয়েস|বাজেট)\b/i },
  { sector: "biz", weight: 3, label: { en: "financial model / pricing", bn: "ফিন্যান্সিয়াল মডেল / প্রাইসিং" }, re: /\b(profit|margin|pricing|forecast|model|cash ?flow|লাভ|মার্জিন|দাম|পূর্বাভাস)\b/i },
  { sector: "content", weight: 4, label: { en: "writing / translation", bn: "লেখা / অনুবাদ" }, re: /\b(write|writing|copy|content|blog|article|translat\w*|edit\w*|script|লেখা|কনটেন্ট|অনুবাদ|সম্পাদনা|স্ক্রিপ্ট)\b/i },
  { sector: "design", weight: 4, label: { en: "design / branding", bn: "ডিজাইন / ব্র্যান্ডিং" }, re: /\b(design|logo|brand\w*|packag\w*|label|poster|banner|photo|ডিজাইন|লোগো|ব্র্যান্ড|প্যাকেজিং|লেবেল|পোস্টার|ছবি)\b/i },
  { sector: "eng", weight: 4, label: { en: "drawing / site work", bn: "ড্রয়িং / সাইট কাজ" }, re: /\b(drawing|autocad|boq|structur\w*|site|construction|load|survey plan|ড্রয়িং|নকশা|বিওকিউ|নির্মাণ|সাইট)\b/i },
  { sector: "agri", weight: 4, label: { en: "farm / crop data", bn: "খামার / ফসলের ডেটা" }, re: /\b(farm\w*|crop|seed|fertilis\w*|fertiliz\w*|yield|agri\w*|কৃষ\w*|ফসল|বীজ|সার|খামার)\b/i },
  { sector: "social", weight: 3, label: { en: "field research / interviews", bn: "ফিল্ড গবেষণা / সাক্ষাৎকার" }, re: /\b(survey|interview\w*|baseline|community|ngo|m&e|research|জরিপ|সাক্ষাৎকার|গবেষণা|কমিউনিটি)\b/i },
  { sector: "admin", weight: 4, label: { en: "paper records / data entry", bn: "কাগজের রেকর্ড / ডেটা এন্ট্রি" }, re: /\b(data ?entry|register|paper|digiti[sz]\w*|spreadsheet|excel|transcri\w*|list|রেজিস্টার|কাগজ|ডেটা এন্ট্রি|এক্সেল|তালিকা)\b/i },
  { sector: "admin", weight: 2, label: { en: "duplicates / messy data", bn: "ডুপ্লিকেট / এলোমেলো ডেটা" }, re: /\b(duplicate|messy|clean\w*|inconsistent|ডুপ্লিকেট|এলোমেলো|পরিষ্কার)\b/i },
];

const URGENCY = /\b(urgent|asap|immediately|this week|জরুরি|দ্রুত|এই সপ্তাহ)\b/i;
const SCALE = /\b(\d{3,})\b/;

/* ── Task template bank ───────────────────────────────────────── */

type Template = Omit<ScopedTask, "id" | "seq"> & { dependsOn?: number };

const BANK: Record<string, Template[]> = {
  it: [
    {
      title: { en: "Reproduce and diagnose the failure", bn: "সমস্যাটি পুনরায় ঘটিয়ে কারণ নির্ণয়" },
      desc: { en: "Reproduce the issue across devices and payment methods, capture console and network evidence, and write a one-page cause note in non-technical language.", bn: "বিভিন্ন ডিভাইস ও পেমেন্ট মেথডে সমস্যাটি পুনরায় ঘটানো, কনসোল ও নেটওয়ার্ক প্রমাণ সংগ্রহ, এবং অ-কারিগরি ভাষায় এক পৃষ্ঠার কারণ-নোট লেখা।" },
      fee: 2500, hours: 5, level: "micro", skills: ["QA", "Debugging"],
      acceptance: { en: ["Failure reproduced with evidence", "Root cause identified or explicitly ruled out", "Written so a non-technical owner understands it"], bn: ["প্রমাণসহ সমস্যা পুনরায় ঘটানো", "মূল কারণ শনাক্ত বা স্পষ্টভাবে বাতিল", "অ-কারিগরি মালিক বুঝবেন এমনভাবে লেখা"] },
    },
    {
      title: { en: "Fix the failing flow and add clear error states", bn: "ভাঙা ফ্লো ঠিক করা ও স্পষ্ট এরর স্টেট যোগ" },
      desc: { en: "Find the cause, repair it, and replace every silent failure with a readable Bangla and English message.", bn: "কারণ খুঁজে বের করা, সারানো, আর প্রতিটি নীরব ব্যর্থতার বদলে পাঠযোগ্য বাংলা ও ইংরেজি বার্তা বসানো।" },
      fee: 6000, hours: 10, level: "standard", skills: ["JavaScript", "APIs"], dependsOn: 1,
      acceptance: { en: ["A test transaction completes end to end", "Every failure state shows a readable message", "No regression on mobile"], bn: ["টেস্ট লেনদেন শুরু থেকে শেষ সম্পন্ন", "প্রতিটি ব্যর্থ অবস্থায় পাঠযোগ্য বার্তা", "মোবাইলে কোনো রিগ্রেশন নেই"] },
    },
    {
      title: { en: "Build the reporting view", bn: "রিপোর্টিং ভিউ তৈরি" },
      desc: { en: "A single page showing the numbers that drive decisions, readable on a phone, loading fast on a 4G connection.", bn: "এক পৃষ্ঠায় সিদ্ধান্তের জন্য দরকারি সংখ্যাগুলো, ফোনে পড়ার মতো, ৪জি সংযোগে দ্রুত লোড।" },
      fee: 7500, hours: 12, level: "standard", skills: ["Dashboards", "React"], dependsOn: 2,
      acceptance: { en: ["Loads in under 3 seconds on 4G", "Usable without training", "Numbers reconcile with the source system"], bn: ["৪জি-তে ৩ সেকেন্ডের কম লোড", "প্রশিক্ষণ ছাড়াই ব্যবহারযোগ্য", "সংখ্যা সোর্স সিস্টেমের সাথে মেলে"] },
    },
  ],
  mkt: [
    {
      title: { en: "One-page brand and audience sheet", bn: "এক পৃষ্ঠার ব্র্যান্ড ও অডিয়েন্স শিট" },
      desc: { en: "Lock the tone, colours, audience and the one thing every piece of content has to do, using assets that already exist.", bn: "ইতিমধ্যে থাকা অ্যাসেট ব্যবহার করে টোন, রঙ, অডিয়েন্স এবং প্রতিটি কনটেন্টের একটাই কাজ নির্ধারণ।" },
      fee: 2000, hours: 4, level: "micro", skills: ["Brand basics", "Research"],
      acceptance: { en: ["Fits on one page", "Uses only existing assets", "Audience described in specifics, not adjectives"], bn: ["এক পৃষ্ঠায়", "কেবল বিদ্যমান অ্যাসেট", "অডিয়েন্স বিশেষণে নয়, নির্দিষ্টভাবে বর্ণিত"] },
    },
    {
      title: { en: "30-day bilingual content calendar", bn: "৩০ দিনের দ্বিভাষিক কনটেন্ট ক্যালেন্ডার" },
      desc: { en: "Thirty posts with Bangla and English captions, hook lines and a shot list the client's own staff can execute.", bn: "ত্রিশটি পোস্ট — বাংলা ও ইংরেজি ক্যাপশন, হুক লাইন আর ক্লায়েন্টের নিজের কর্মীরাই চালাতে পারবেন এমন শট লিস্ট।" },
      fee: 4500, hours: 9, level: "standard", skills: ["Bangla copy", "Content strategy"], dependsOn: 1,
      acceptance: { en: ["Every post carries a shot instruction", "No caption over 220 characters", "At least a quarter need no new photography"], bn: ["প্রতিটি পোস্টে শট নির্দেশনা", "কোনো ক্যাপশন ২২০ অক্ষরের বেশি নয়", "অন্তত এক-চতুর্থাংশে নতুন ছবি লাগবে না"] },
    },
    {
      title: { en: "Attribution sheet with coupon-code tracking", bn: "কুপন-কোড ট্র্যাকিংসহ অ্যাট্রিবিউশন শিট" },
      desc: { en: "A sheet linking each channel to a coupon code, so the owner can see which posts actually created orders.", bn: "প্রতিটি চ্যানেলকে একটি কুপন কোডের সাথে যুক্ত করা শিট, যাতে মালিক দেখতে পান কোন পোস্ট আসলে অর্ডার এনেছে।" },
      fee: 2000, hours: 4, level: "micro", skills: ["Excel", "Analytics"],
      acceptance: { en: ["Works without any paid tool", "Under two minutes of daily staff effort", "Monthly summary calculates itself"], bn: ["কোনো পেইড টুল ছাড়াই চলে", "কর্মীর দৈনিক দুই মিনিটের কম", "মাসিক সারসংক্ষেপ নিজেই হিসাব করে"] },
    },
  ],
  biz: [
    {
      title: { en: "Reconcile and clean the existing records", bn: "বিদ্যমান হিসাব মিলিয়ে পরিষ্কার করা" },
      desc: { en: "Match records against bank and cash movements, list every unexplained gap rather than forcing a balance.", bn: "ব্যাংক ও নগদ লেনদেনের সাথে হিসাব মেলানো, ব্যালান্স জোর করে না মিলিয়ে প্রতিটি অব্যাখ্যাত ফারাক তালিকাভুক্ত করা।" },
      fee: 3500, hours: 9, level: "standard", skills: ["Bookkeeping", "Excel"],
      acceptance: { en: ["Every unexplained gap listed, none hidden", "Opening and closing balances stated", "Method documented so it can be repeated"], bn: ["প্রতিটি অব্যাখ্যাত ফারাক তালিকাভুক্ত, কিছুই লুকানো নয়", "প্রারম্ভিক ও সমাপনী ব্যালান্স উল্লেখিত", "পদ্ধতি নথিভুক্ত, যাতে আবার করা যায়"] },
    },
    {
      title: { en: "Build the decision model", bn: "সিদ্ধান্তের মডেল তৈরি" },
      desc: { en: "A working sheet showing unit economics and the two or three levers that actually move the result.", bn: "একটি কার্যকর শিট, যাতে ইউনিট ইকোনমিক্স আর ফলাফল বদলে দেওয়া দুই-তিনটি লিভার দেখা যায়।" },
      fee: 4500, hours: 10, level: "standard", skills: ["Excel modelling", "Costing"], dependsOn: 1,
      acceptance: { en: ["Every assumption on its own labelled row", "No hard-coded numbers inside formulas", "Owner can change one input and read the effect"], bn: ["প্রতিটি অনুমান আলাদা লেবেলযুক্ত সারিতে", "ফর্মুলার ভেতরে কোনো হার্ড-কোড করা সংখ্যা নেই", "মালিক একটি ইনপুট বদলে ফল দেখতে পারেন"] },
    },
    {
      title: { en: "Two-page recommendation note", bn: "দুই পৃষ্ঠার সুপারিশ নোট" },
      desc: { en: "What to change, what to stop, and what to watch next month — every claim traced back to a number in the model.", bn: "কী বদলাতে হবে, কী থামাতে হবে, আর আগামী মাসে কী দেখতে হবে — প্রতিটি দাবি মডেলের একটি সংখ্যার সাথে যুক্ত।" },
      fee: 2000, hours: 4, level: "micro", skills: ["Analysis", "Bangla reporting"], dependsOn: 2,
      acceptance: { en: ["Every claim traced to the data", "Written in the client's language of choice", "Fits on two pages"], bn: ["প্রতিটি দাবি ডেটার সাথে যুক্ত", "ক্লায়েন্টের পছন্দের ভাষায় লেখা", "দুই পৃষ্ঠায়"] },
    },
  ],
  content: [
    {
      title: { en: "Source review and outline", bn: "সোর্স পর্যালোচনা ও আউটলাইন" },
      desc: { en: "Read what exists, agree the structure and the voice before a single paragraph is drafted.", bn: "যা আছে তা পড়া, একটি অনুচ্ছেদ লেখার আগেই কাঠামো ও কণ্ঠস্বর চূড়ান্ত করা।" },
      fee: 1500, hours: 3, level: "micro", skills: ["Research", "Editing"],
      acceptance: { en: ["Outline approved before drafting", "Sources listed with links", "Voice sample agreed"], bn: ["খসড়ার আগে আউটলাইন অনুমোদিত", "লিংকসহ সোর্স তালিকাভুক্ত", "কণ্ঠস্বরের নমুনা সম্মত"] },
    },
    {
      title: { en: "Draft the full piece", bn: "পূর্ণ খসড়া লেখা" },
      desc: { en: "Write to the agreed outline, in the agreed voice, with every factual claim sourced.", bn: "সম্মত আউটলাইন ও কণ্ঠস্বরে লেখা, প্রতিটি তথ্যগত দাবির সোর্সসহ।" },
      fee: 3500, hours: 8, level: "standard", skills: ["Writing", "Bangla copy"], dependsOn: 1,
      acceptance: { en: ["Every factual claim carries a source", "Within 10% of the agreed length", "No AI-generated filler paragraphs"], bn: ["প্রতিটি তথ্যগত দাবির সোর্স আছে", "সম্মত দৈর্ঘ্যের ১০%-এর মধ্যে", "কোনো এআই-জেনারেটেড ফিলার অনুচ্ছেদ নেই"] },
    },
    {
      title: { en: "Edit, translate and finalise", bn: "সম্পাদনা, অনুবাদ ও চূড়ান্তকরণ" },
      desc: { en: "A second pass for language and structure, plus the Bangla or English counterpart version.", bn: "ভাষা ও কাঠামোর জন্য দ্বিতীয় পাঠ, সাথে বাংলা বা ইংরেজি সমান্তরাল সংস্করণ।" },
      fee: 2500, hours: 5, level: "standard", skills: ["EN⇄BN translation", "Copy editing"], dependsOn: 2,
      acceptance: { en: ["Both versions say the same thing", "No untranslated technical terms left unexplained", "Client reads it without asking a question"], bn: ["দুই সংস্করণ একই কথা বলে", "কোনো অননূদিত কারিগরি শব্দ ব্যাখ্যা ছাড়া নেই", "ক্লায়েন্ট প্রশ্ন না করেই পড়তে পারেন"] },
    },
  ],
  design: [
    {
      title: { en: "Confirm the production specification", bn: "প্রোডাকশন স্পেসিফিকেশন নিশ্চিতকরণ" },
      desc: { en: "Confirm the real constraints — press, sizes, colours, budget — before any concept work begins.", bn: "কোনো কনসেপ্টের কাজ শুরুর আগেই বাস্তব সীমাবদ্ধতা — প্রেস, সাইজ, রঙ, বাজেট — নিশ্চিত করা।" },
      fee: 1000, hours: 2, level: "micro", skills: ["Print prep", "Research"],
      acceptance: { en: ["Written spec confirmed by the supplier", "Cost stated at three volumes", "Impossible options ruled out early"], bn: ["সরবরাহকারী কর্তৃক নিশ্চিত লিখিত স্পেক", "তিনটি ভলিউমে খরচ উল্লেখিত", "অসম্ভব অপশন আগেই বাদ"] },
    },
    {
      title: { en: "Three concept directions", bn: "তিনটি কনসেপ্ট দিক" },
      desc: { en: "Three genuinely different directions, each shown flat and in context, all producible within the spec.", bn: "তিনটি সত্যিকারের আলাদা দিক, প্রতিটি ফ্ল্যাট ও প্রসঙ্গে দেখানো, সবগুলোই স্পেকের মধ্যে বানানো সম্ভব।" },
      fee: 4000, hours: 10, level: "standard", skills: ["Figma", "Illustrator"], dependsOn: 1,
      acceptance: { en: ["All three producible within spec", "Bangla and English lockups included", "Editable source files delivered"], bn: ["তিনটিই স্পেকের মধ্যে বানানো সম্ভব", "বাংলা ও ইংরেজি লকআপ অন্তর্ভুক্ত", "এডিটযোগ্য সোর্স ফাইল সরবরাহ"] },
    },
    {
      title: { en: "Production-ready files for the chosen route", bn: "নির্বাচিত রুটের প্রোডাকশন-রেডি ফাইল" },
      desc: { en: "Bleed, marks, colour separation and a packaged folder the supplier can open without a phone call.", bn: "ব্লিড, মার্ক, কালার সেপারেশন এবং প্যাকেজড ফোল্ডার, যা সরবরাহকারী ফোন না করেই খুলতে পারেন।" },
      fee: 2500, hours: 6, level: "standard", skills: ["Print prep", "Illustrator"], dependsOn: 2,
      acceptance: { en: ["Supplier opens the files without a callback", "3mm bleed on every edge", "Fonts outlined or packaged"], bn: ["সরবরাহকারী কল ছাড়াই ফাইল খোলেন", "প্রতিটি প্রান্তে ৩ মিমি ব্লিড", "ফন্ট আউটলাইন বা প্যাকেজড"] },
    },
  ],
  eng: [
    {
      title: { en: "Site measurement and existing-condition capture", bn: "সাইট পরিমাপ ও বিদ্যমান অবস্থা নথিভুক্তকরণ" },
      desc: { en: "Measure what is actually there and photograph it, rather than working from an out-of-date drawing.", bn: "পুরনো ড্রয়িং থেকে কাজ না করে, বাস্তবে যা আছে তা মেপে ছবি তোলা।" },
      fee: 2500, hours: 6, level: "micro", skills: ["Site survey", "Documentation"],
      acceptance: { en: ["Every measured dimension photographed", "Discrepancies with old drawings flagged", "Date and location recorded"], bn: ["প্রতিটি মাপা মাত্রার ছবি", "পুরনো ড্রয়িংয়ের সাথে অসঙ্গতি চিহ্নিত", "তারিখ ও অবস্থান নথিভুক্ত"] },
    },
    {
      title: { en: "Drawings and calculations to standard", bn: "স্ট্যান্ডার্ড অনুযায়ী ড্রয়িং ও হিসাব" },
      desc: { en: "Produce the drawings and supporting calculations, referencing the applicable code on every sheet.", bn: "প্রতিটি শিটে প্রযোজ্য কোডের উল্লেখসহ ড্রয়িং ও সহায়ক হিসাব তৈরি।" },
      fee: 6500, hours: 14, level: "advanced", skills: ["AutoCAD", "Estimation"], dependsOn: 1,
      acceptance: { en: ["Applicable standard referenced on each sheet", "Calculations shown, not just results", "Calculations checked against the applicable code"], bn: ["প্রতিটি শিটে প্রযোজ্য স্ট্যান্ডার্ডের উল্লেখ", "কেবল ফল নয়, হিসাব দেখানো", "প্রযোজ্য কোডের সাথে হিসাব মিলিয়ে দেখা"] },
    },
    {
      title: { en: "Bill of quantities with rate basis", bn: "রেট ভিত্তিসহ বিল অফ কোয়ান্টিটিজ" },
      desc: { en: "Quantities with the basis of every rate stated, so the client can challenge any line.", bn: "প্রতিটি রেটের ভিত্তি উল্লেখসহ পরিমাণ, যাতে ক্লায়েন্ট যেকোনো লাইন নিয়ে প্রশ্ন তুলতে পারেন।" },
      fee: 3500, hours: 8, level: "standard", skills: ["BOQ", "Estimation"], dependsOn: 2,
      acceptance: { en: ["Rate basis stated for every line", "Quantities traceable to the drawings", "Contingency shown separately"], bn: ["প্রতিটি লাইনে রেটের ভিত্তি উল্লেখিত", "পরিমাণ ড্রয়িংয়ের সাথে মিলিয়ে দেখা যায়", "কন্টিনজেন্সি আলাদাভাবে দেখানো"] },
    },
  ],
  agri: [
    {
      title: { en: "Sampling plan and pilot round", bn: "স্যাম্পলিং পরিকল্পনা ও পাইলট রাউন্ড" },
      desc: { en: "Agree who is sampled and why, then run a small pilot to measure real time and cost per response.", bn: "কাকে ও কেন নমুনায় নেওয়া হবে তা চূড়ান্ত করা, তারপর ছোট পাইলট চালিয়ে প্রতি উত্তরের প্রকৃত সময় ও খরচ মাপা।" },
      fee: 1500, hours: 4, level: "micro", skills: ["Field survey", "Research"],
      acceptance: { en: ["Sampling logic written down", "Pilot responses collected", "Time and cost per response measured"], bn: ["স্যাম্পলিং যুক্তি লিখিত", "পাইলট উত্তর সংগৃহীত", "প্রতি উত্তরের সময় ও খরচ মাপা"] },
    },
    {
      title: { en: "Field collection round", bn: "ফিল্ড সংগ্রহ রাউন্ড" },
      desc: { en: "Collect the full round with photo evidence and GPS where consent allows.", bn: "সম্মতি থাকলে ছবি ও জিপিএস প্রমাণসহ পূর্ণ রাউন্ড সংগ্রহ।" },
      fee: 4000, hours: 14, level: "standard", skills: ["KoboToolbox", "Data entry"], dependsOn: 1,
      acceptance: { en: ["Consent recorded for every respondent", "No mandatory field left blank", "Refusals logged rather than replaced"], bn: ["প্রতিটি উত্তরদাতার সম্মতি নথিভুক্ত", "কোনো বাধ্যতামূলক ফিল্ড ফাঁকা নয়", "অস্বীকৃতি প্রতিস্থাপন নয়, লগ করা"] },
    },
    {
      title: { en: "Findings note with recommendations", bn: "সুপারিশসহ ফলাফল নোট" },
      desc: { en: "What the data says, what it cannot say, and the two or three actions worth taking next season.", bn: "ডেটা কী বলছে, কী বলতে পারছে না, আর আগামী মৌসুমে করার মতো দুই-তিনটি পদক্ষেপ।" },
      fee: 2000, hours: 5, level: "micro", skills: ["Analysis", "Bangla reporting"], dependsOn: 2,
      acceptance: { en: ["Limitations stated explicitly", "Written in Bangla", "Every recommendation costed roughly"], bn: ["সীমাবদ্ধতা স্পষ্টভাবে উল্লেখিত", "বাংলায় লেখা", "প্রতিটি সুপারিশের আনুমানিক খরচ"] },
    },
  ],
  social: [
    {
      title: { en: "Instrument design and ethics check", bn: "টুল ডিজাইন ও নৈতিকতা যাচাই" },
      desc: { en: "Draft the questions, pilot them on three respondents, and confirm the consent language before fieldwork.", bn: "প্রশ্ন খসড়া করা, তিনজন উত্তরদাতার ওপর পাইলট চালানো, আর ফিল্ডওয়ার্কের আগে সম্মতির ভাষা নিশ্চিত করা।" },
      fee: 2000, hours: 5, level: "micro", skills: ["Research design", "Interviewing"],
      acceptance: { en: ["Consent language reviewed", "Leading questions removed after pilot", "Estimated interview length measured"], bn: ["সম্মতির ভাষা পর্যালোচিত", "পাইলটের পর প্রভাবিতকারী প্রশ্ন বাদ", "আনুমানিক সাক্ষাৎকারের দৈর্ঘ্য মাপা"] },
    },
    {
      title: { en: "Interview round and transcription", bn: "সাক্ষাৎকার রাউন্ড ও ট্রান্সক্রিপশন" },
      desc: { en: "Conduct the interviews and transcribe them faithfully, keeping the respondent's own words.", bn: "সাক্ষাৎকার নেওয়া এবং উত্তরদাতার নিজের শব্দ রেখে বিশ্বস্তভাবে ট্রান্সক্রাইব করা।" },
      fee: 4000, hours: 13, level: "standard", skills: ["Interviewing", "Bangla transcription"], dependsOn: 1,
      acceptance: { en: ["Respondent's own words preserved", "Identifying details separated from transcripts", "Audio retained per the consent terms"], bn: ["উত্তরদাতার নিজের শব্দ সংরক্ষিত", "শনাক্তকারী তথ্য ট্রান্সক্রিপ্ট থেকে আলাদা", "সম্মতির শর্ত অনুযায়ী অডিও সংরক্ষিত"] },
    },
    {
      title: { en: "Coding and findings chapter", bn: "কোডিং ও ফলাফল অধ্যায়" },
      desc: { en: "Code the transcripts into themes and write the findings chapter with quotes as evidence.", bn: "ট্রান্সক্রিপ্টগুলো থিমে কোড করা এবং প্রমাণ হিসেবে উদ্ধৃতিসহ ফলাফল অধ্যায় লেখা।" },
      fee: 3000, hours: 8, level: "standard", skills: ["Qualitative coding", "Writing"], dependsOn: 2,
      acceptance: { en: ["Codebook attached", "Every theme supported by at least three quotes", "Counter-evidence reported, not dropped"], bn: ["কোডবুক সংযুক্ত", "প্রতিটি থিমের সমর্থনে অন্তত তিনটি উদ্ধৃতি", "বিপরীত প্রমাণ বাদ নয়, উল্লেখিত"] },
    },
  ],
  admin: [
    {
      title: { en: "Agree the schema and transcribe a sample", bn: "স্কিমা চূড়ান্ত ও নমুনা লেখা" },
      desc: { en: "Agree the columns with the client, then transcribe a representative sample to price the rest honestly.", bn: "ক্লায়েন্টের সাথে কলাম চূড়ান্ত করা, তারপর বাকিটা সৎভাবে মূল্য নির্ধারণের জন্য প্রতিনিধিত্বমূলক নমুনা লেখা।" },
      fee: 1500, hours: 4, level: "micro", skills: ["Data entry", "Bangla transcription"],
      acceptance: { en: ["Schema signed off by the client", "Sample transcribed at 99% accuracy", "Real time-per-page measured"], bn: ["ক্লায়েন্টের স্কিমা অনুমোদন", "নমুনা ৯৯% নির্ভুলতায় লেখা", "প্রতি পৃষ্ঠার প্রকৃত সময় মাপা"] },
    },
    {
      title: { en: "Full digitisation with verification pass", bn: "যাচাই পাসসহ পূর্ণ ডিজিটাইজেশন" },
      desc: { en: "Enter everything into the agreed schema with a 10% double-entry verification sample.", bn: "১০% ডাবল-এন্ট্রি যাচাই নমুনাসহ সবকিছু নির্ধারিত স্কিমায় এন্ট্রি করা।" },
      fee: 4000, hours: 16, level: "standard", skills: ["Data entry", "Excel"], dependsOn: 1,
      acceptance: { en: ["99% or better on the verification sample", "No mandatory field left blank", "Source page recorded on every row"], bn: ["যাচাই নমুনায় ৯৯% বা তার বেশি", "কোনো বাধ্যতামূলক ফিল্ড ফাঁকা নয়", "প্রতিটি সারিতে সোর্স পৃষ্ঠা নথিভুক্ত"] },
    },
    {
      title: { en: "De-duplicate and build the working view", bn: "ডি-ডুপ্লিকেট ও কার্যকর ভিউ তৈরি" },
      desc: { en: "Resolve spelling variants into single records and produce the segments the client will actually act on.", bn: "বানানের ভিন্নতা মিলিয়ে একক রেকর্ড তৈরি এবং ক্লায়েন্ট সত্যিই কাজে লাগাবেন এমন সেগমেন্ট তৈরি।" },
      fee: 2500, hours: 7, level: "standard", skills: ["Data cleaning", "Excel"], dependsOn: 2,
      acceptance: { en: ["Every merge decision documented", "Segment rules written down", "Client can re-run the rule themselves"], bn: ["প্রতিটি মার্জ সিদ্ধান্ত নথিভুক্ত", "সেগমেন্টের নিয়ম লিখিত", "ক্লায়েন্ট নিজেই নিয়ম আবার চালাতে পারেন"] },
    },
  ],
};

const HANDOVER: Template = {
  title: { en: "Handover: short walkthrough and a one-page guide", bn: "হ্যান্ডওভার: সংক্ষিপ্ত ওয়াকথ্রু ও এক পৃষ্ঠার গাইড" },
  desc: {
    en: "A recorded Bangla walkthrough and a one-page guide, so the client can use the result without calling anyone.",
    bn: "রেকর্ড করা বাংলা ওয়াকথ্রু ও এক পৃষ্ঠার গাইড, যাতে ক্লায়েন্ট কাউকে না ডেকেই ফলাফল ব্যবহার করতে পারেন।",
  },
  fee: 2000, hours: 3, level: "micro", skills: ["Bangla writing", "Screen recording"],
  acceptance: {
    en: ["Walkthrough under 20 minutes", "Guide fits one printed page", "Client confirms they can do it unaided"],
    bn: ["ওয়াকথ্রু ২০ মিনিটের কম", "গাইড এক পৃষ্ঠায়", "ক্লায়েন্ট নিশ্চিত করেন যে নিজে পারবেন"],
  },
};

/* ── Risk bank ────────────────────────────────────────────────── */

const GENERIC_RISKS: L[] = [
  { en: "The brief describes a symptom, not a cause — the first hours are diagnostic, so nothing is built on a guess.", bn: "ব্রিফে উপসর্গ বর্ণিত, কারণ নয় — শুরুর ঘণ্টাগুলো নির্ণয়ের, যাতে অনুমানের ওপর কিছু না দাঁড়ায়।" },
  { en: "Source material quality is unverified — the estimate assumes it is legible, and a coordinator adjusts the fee if it is not.", bn: "সোর্স ম্যাটেরিয়ালের মান যাচাই হয়নি — অনুমানটি ধরে নিয়েছে সেটি পড়ার মতো; না হলে কোঅর্ডিনেটর ফি সমন্বয় করেন।" },
  { en: "No staging environment mentioned — a coordinator must approve any change made to something live.", bn: "কোনো স্টেজিং এনভায়রনমেন্টের উল্লেখ নেই — লাইভ কিছুতে পরিবর্তনে কোঅর্ডিনেটরের অনুমোদন লাগবে।" },
];

const SECTOR_RISKS: Record<string, L> = {
  it: { en: "The failure may sit outside the client's own system (gateway, host, or a third-party plugin), which changes who can fix it.", bn: "সমস্যাটি ক্লায়েন্টের নিজের সিস্টেমের বাইরে থাকতে পারে (গেটওয়ে, হোস্ট বা থার্ড-পার্টি প্লাগইন), যা বদলে দেয় কে এটা ঠিক করতে পারবে।" },
  mkt: { en: "Attribution will be approximate; a single-channel coupon code is the honest measurement, not a dashboard number.", bn: "অ্যাট্রিবিউশন আনুমানিক হবে; সৎ পরিমাপ হলো চ্যানেল-নির্দিষ্ট কুপন কোড, ড্যাশবোর্ডের সংখ্যা নয়।" },
  biz: { en: "Historic records may not reconcile at all; the scope reports the gap rather than forcing a balance.", bn: "পুরনো হিসাব একেবারেই না-ও মিলতে পারে; স্কোপ ব্যালান্স জোর করে না মিলিয়ে ফারাকটা জানায়।" },
  content: { en: "Factual claims need a source the client can supply; unsourced claims will be cut rather than invented.", bn: "তথ্যগত দাবির জন্য ক্লায়েন্টের দেওয়া সোর্স লাগবে; সোর্সবিহীন দাবি বানানো নয়, বাদ দেওয়া হবে।" },
  design: { en: "Production capability is unverified until the press confirms it — a beautiful file the press cannot run is a failed deliverable.", bn: "প্রেস নিশ্চিত না করা পর্যন্ত প্রোডাকশন সক্ষমতা যাচাই হয়নি — প্রেস চালাতে না পারলে সুন্দর ফাইলও ব্যর্থ ডেলিভারেবল।" },
  eng: { en: "As-built conditions frequently differ from the drawings on record; measurement precedes design for that reason.", bn: "বাস্তব অবস্থা প্রায়ই রেকর্ডের ড্রয়িং থেকে আলাদা হয়; সেজন্যই ডিজাইনের আগে পরিমাপ।" },
  agri: { en: "Field access and seasonality constrain the schedule in ways the client may not have priced in.", bn: "ফিল্ডে প্রবেশাধিকার ও মৌসুম সময়সূচিকে এমনভাবে সীমিত করে, যা ক্লায়েন্ট হিসাবে না-ও ধরে থাকতে পারেন।" },
  social: { en: "Consent and respondent privacy govern the method; anonymisation is not an optional extra.", bn: "সম্মতি ও উত্তরদাতার গোপনীয়তা পদ্ধতি নির্ধারণ করে; বেনামিকরণ ঐচ্ছিক বাড়তি কিছু নয়।" },
  admin: { en: "Handwriting and spelling variants need a human decision rule; fuzzy matching alone will merge the wrong records.", bn: "হাতের লেখা ও বানানের ভিন্নতায় মানুষের সিদ্ধান্তের নিয়ম দরকার; কেবল ফাজি ম্যাচিং ভুল রেকর্ড মিলিয়ে দেবে।" },
};

/* ── The engine ───────────────────────────────────────────────── */

export function scope(brief: string, opts?: { sectorId?: string; budget?: number }): ScopeResult {
  const text = brief.trim();
  const hits = SIGNALS.filter((s) => s.re.test(text));

  const tally = new Map<string, number>();
  for (const h of hits) tally.set(h.sector, (tally.get(h.sector) ?? 0) + h.weight);

  const detected =
    opts?.sectorId ??
    [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "admin";

  const sector = sectorById(detected);
  const bank = BANK[detected] ?? BANK.admin;

  // Scale: a big number in the brief (500 invoices, 4,000 rows) means more hours.
  const scaleMatch = text.match(SCALE);
  const scale = scaleMatch ? Math.min(2, 1 + Number(scaleMatch[1]) / 4000) : 1;
  const urgent = URGENCY.test(text);

  // Long, detailed briefs are scoped into more steps; a one-liner gets the core three.
  const words = text.split(/\s+/).filter(Boolean).length;
  const includeHandover = words > 18 || detected === "it";

  const chosen: Template[] = includeHandover ? [...bank, HANDOVER] : [...bank];

  const tasks: ScopedTask[] = chosen.map((tpl, i) => ({
    ...tpl,
    id: `x${i + 1}`,
    seq: i + 1,
    fee: Math.round((tpl.fee * scale * (urgent ? 1.15 : 1)) / 100) * 100,
    hours: Math.max(2, Math.round(tpl.hours * scale)),
    dependsOn: tpl.dependsOn,
  }));

  const totalFee = tasks.reduce((a, t) => a + t.fee, 0);
  const totalHours = tasks.reduce((a, t) => a + t.hours, 0);

  const complexity: ScopeResult["complexity"] = totalHours > 34 ? "High" : totalHours > 20 ? "Medium" : "Low";

  // Confidence: strong keyword evidence and a reasonably detailed brief raise it.
  const evidence = [...tally.values()].reduce((a, b) => a + b, 0);
  const confidence = Math.max(58, Math.min(95, 52 + evidence * 5 + Math.min(18, Math.floor(words / 6))));

  const problems: L[] = [];
  const seen = new Set<string>();
  for (const h of hits) {
    if (seen.has(h.label.en)) continue;
    seen.add(h.label.en);
    problems.push(h.label);
  }
  if (problems.length === 0) problems.push({ en: "general support work", bn: "সাধারণ সহায়ক কাজ" });

  const risks: L[] = [SECTOR_RISKS[detected] ?? GENERIC_RISKS[0], GENERIC_RISKS[0], GENERIC_RISKS[1]];
  if (urgent)
    risks.push({
      en: "The brief signals urgency — the fee carries a 15% expedite premium and the sequence cannot be shortened without dropping a verification step.",
      bn: "ব্রিফে জরুরি ভাব আছে — ফি-তে ১৫% এক্সপিডাইট প্রিমিয়াম যুক্ত, আর একটি যাচাই ধাপ বাদ না দিয়ে ক্রম ছোট করা যাবে না।",
    });

  const summary: L = {
    en: `Detected ${problems.length > 1 ? `${problems.length} separable strands` : "a single strand"} of work in ${sector.name.en}. Scoped into ${tasks.length} sequenced tasks so the diagnostic step is paid for and completed before anything is built on its conclusions.`,
    bn: `${sector.name.bn}-এ ${problems.length > 1 ? `${problems.length}টি আলাদা ধারা` : "একটি ধারা"} শনাক্ত হয়েছে। ${tasks.length}টি ক্রমবদ্ধ টাস্কে ভাগ করা হয়েছে, যাতে নির্ণয়ের ধাপটির জন্য অর্থ দেওয়া হয় এবং তার সিদ্ধান্তের ওপর কিছু দাঁড়ানোর আগেই সেটি শেষ হয়।`,
  };

  const signals = hits.slice(0, 6).map((h) => ({ label: h.label, weight: h.weight }));

  return {
    sectorId: detected,
    signals,
    problems,
    summary,
    complexity,
    confidence,
    tasks,
    risks,
    matches: match(detected, tasks),
    totalFee,
    totalHours,
  };
}

/* ── Matching ─────────────────────────────────────────────────── */

function match(sectorId: string, tasks: ScopedTask[]): Match[] {
  const needed = new Set(tasks.flatMap((t) => t.skills.map((s) => s.toLowerCase())));

  const scored = STUDENTS.map((student) => {
    const reasons: L[] = [];
    let score = 0;

    if (student.sectorIds[0] === sectorId) {
      score += 34;
      reasons.push({ en: "Primary discipline matches the sector", bn: "মূল ডিসিপ্লিন সেক্টরের সাথে মেলে" });
    } else if (student.sectorIds.includes(sectorId)) {
      score += 20;
      reasons.push({ en: "Works across this sector as a secondary track", bn: "দ্বিতীয় ট্র্যাক হিসেবে এই সেক্টরে কাজ করেন" });
    }

    const overlap = student.skills.filter((s) => needed.has(s.toLowerCase()));
    if (overlap.length) {
      score += Math.min(24, overlap.length * 9);
      reasons.push({
        en: `Has ${overlap.slice(0, 2).join(" and ")} on a verified task`,
        bn: `ভেরিফায়েড টাস্কে ${overlap.slice(0, 2).join(" ও ")} ব্যবহার করেছেন`,
      });
    }

    score += Math.round((student.rating - 4) * 24);
    score += Math.round(student.onTime / 8);
    score += Math.min(10, student.verified);

    if (student.verified >= 12)
      reasons.push({ en: `${student.verified} tasks signed off by a coordinator and the client`, bn: `${student.verified}টি টাস্ক কোঅর্ডিনেটর ও ক্লায়েন্ট কর্তৃক সাইন-অফ` });
    if (student.onTime >= 95)
      reasons.push({ en: `${student.onTime}% on-time delivery record`, bn: `${student.onTime}% সময়মতো ডেলিভারির রেকর্ড` });

    return { student, score: Math.min(98, score), reasons: reasons.slice(0, 3), coldStart: false };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Cold start: the lowest-history student in the sector is always reserved a
  // micro-task slot, so a first task is reachable for someone with no record.
  const cold = [...STUDENTS]
    .filter((s) => s.sectorIds.includes(sectorId))
    .sort((a, b) => a.verified - b.verified)[0];

  if (cold && !scored.some((m) => m.student.id === cold.id)) {
    scored.push({
      student: cold,
      score: 41,
      reasons: [
        { en: "Cold-start slot reserved on the entry micro-task", bn: "প্রবেশ মাইক্রো-টাস্কে কোল্ড-স্টার্ট স্লট সংরক্ষিত" },
        { en: "Discipline fits; track record still being built", bn: "ডিসিপ্লিন মেলে; ট্র্যাক রেকর্ড এখনো তৈরি হচ্ছে" },
      ],
      coldStart: true,
    });
  }

  return scored;
}

export const SECTOR_OPTIONS = SECTORS.map((s) => ({ id: s.id, name: s.name }));

/* ── Fair-price check ─────────────────────────────────────────── */

/**
 * The floor a task cannot be priced under, per sector, in taka per hour.
 * Set from what completed work in each sector has actually paid, not from
 * what a client would like to pay. A heavy task priced at a light rate is
 * blocked at the coordinator gate rather than quietly matched to whoever
 * is desperate enough to take it.
 */
export const RATE_FLOOR: Record<string, number> = {
  it: 480,
  eng: 460,
  biz: 400,
  design: 380,
  social: 360,
  agri: 340,
  content: 330,
  mkt: 320,
  admin: 200,
};

export type PriceVerdict = {
  rate: number;
  floor: number;
  fair: boolean;
  shortfall: number;
  gapPct: number;
  level: "ok" | "low" | "blocked";
  message: L;
};

export function priceCheck(totalFee: number, totalHours: number, sectorId: string): PriceVerdict {
  const floor = RATE_FLOOR[sectorId] ?? 300;
  const rate = totalHours > 0 ? Math.round(totalFee / totalHours) : 0;
  const shortfall = Math.max(0, Math.round((floor - rate) * totalHours));
  const gapPct = floor > 0 ? Math.round(((floor - rate) / floor) * 100) : 0;

  const level: PriceVerdict["level"] = rate >= floor ? "ok" : gapPct >= 25 ? "blocked" : "low";

  const message: L =
    level === "ok"
      ? {
          en: `৳${rate.toLocaleString("en-US")} an hour, at or above the ৳${floor} floor for this sector. Cleared for release.`,
          bn: `ঘণ্টায় ৳${rate.toLocaleString("en-US")}, এই সেক্টরের ৳${floor} সীমার সমান বা ওপরে। প্রকাশের জন্য অনুমোদিত।`,
        }
      : level === "low"
        ? {
            en: `৳${rate.toLocaleString("en-US")} an hour sits ${gapPct}% under the ৳${floor} floor. Releasable, but it will sit unmatched — raise it by about ৳${shortfall.toLocaleString("en-US")} or cut scope.`,
            bn: `ঘণ্টায় ৳${rate.toLocaleString("en-US")} — ৳${floor} সীমার চেয়ে ${gapPct}% কম। ছাড়া যাবে, তবে ম্যাচ ছাড়াই পড়ে থাকবে — প্রায় ৳${shortfall.toLocaleString("en-US")} বাড়ান বা স্কোপ কমান।`,
          }
        : {
            en: `৳${rate.toLocaleString("en-US")} an hour is ${gapPct}% under the ৳${floor} floor for this sector. Blocked from release: heavy work cannot be posted at a light rate. Either raise the budget by ৳${shortfall.toLocaleString("en-US")} or cut the scope to match it.`,
            bn: `ঘণ্টায় ৳${rate.toLocaleString("en-US")} — এই সেক্টরের ৳${floor} সীমার চেয়ে ${gapPct}% কম। প্রকাশ আটকানো হয়েছে: ভারী কাজ কম দামে পোস্ট করা যাবে না। হয় বাজেট ৳${shortfall.toLocaleString("en-US")} বাড়ান, নয় সেই অনুযায়ী স্কোপ কমান।`,
          };

  return { rate, floor, fair: level === "ok", shortfall, gapPct, level, message };
}

/* ── Trial tasks and points ───────────────────────────────────── */

/**
 * The AI builds a small mirror of the real task. Applying means doing
 * this, not writing a pitch — because a pitch proves nothing and a
 * forty-minute sample proves almost everything.
 *
 * The rule for what to mirror: copy the single constraint that decides
 * whether the real job succeeds, and drop everything that is only volume.
 */
export function trialSize(hours: number): number {
  // A trial is capped at one hour and is never more than an eighth of the job.
  return Math.max(25, Math.min(60, Math.round((hours * 60) / 8 / 5) * 5));
}

export type TrialRule = { label: L; detail: L };

export const TRIAL_RULES: TrialRule[] = [
  {
    label: { en: "Same features, smaller volume", bn: "একই ফিচার, ছোট পরিমাণ" },
    detail: {
      en: "Every skill the real task needs appears in the trial at least once. Nothing that is only repetition is included.",
      bn: "আসল টাস্কে যত স্কিল লাগে, প্রতিটি ট্রায়ালে অন্তত একবার আসে। যা কেবল পুনরাবৃত্তি, তা বাদ।",
    },
  },
  {
    label: { en: "Under an hour, always", bn: "সবসময় এক ঘণ্টার কম" },
    detail: {
      en: "A trial nobody has time to do filters for free time, not for skill.",
      bn: "যে ট্রায়াল করার সময় কারো নেই, তা দক্ষতা নয় — অবসর বাছাই করে।",
    },
  },
  {
    label: { en: "Unpaid, and it stays that way", bn: "বিনা পারিশ্রমিকে, এবং সেটাই থাকবে" },
    detail: {
      en: "The trial output is never delivered to the client. If a client could use it, it is too big to be a trial.",
      bn: "ট্রায়ালের কাজ কখনো ক্লায়েন্টকে দেওয়া হয় না। ক্লায়েন্ট সেটা কাজে লাগাতে পারলে সেটা ট্রায়াল হিসেবে বড্ড বড়।",
    },
  },
  {
    label: { en: "Effort is never punished", bn: "চেষ্টা কখনো শাস্তি পায় না" },
    detail: {
      en: "Doing a trial and not being selected is +1. Only failing a main task you were given costs anything.",
      bn: "ট্রায়াল করে নির্বাচিত না হওয়া মানে +১। কেবল হাতে পাওয়া মূল কাজে ব্যর্থ হলেই কিছু হারায়।",
    },
  },
];

export type MainResult = "in_progress" | "delivered" | "failed";

export type PointVerdict = { delta: number; reason: L };

/**
 * The points rule, in one place.
 *
 *   did the trial, not selected      → +1
 *   selected, main task delivered    →  0
 *   selected, main task failed       → −1
 *   selected, still working          →  0 (provisional)
 */
export function pointsFor(selected: boolean, main: MainResult = "in_progress"): PointVerdict {
  if (!selected) {
    return {
      delta: 1,
      reason: {
        en: "Did the trial and was not selected — the effort still counts.",
        bn: "ট্রায়াল করেছেন, নির্বাচিত হননি — চেষ্টাটা তবু গণনা হয়।",
      },
    };
  }
  if (main === "failed") {
    return {
      delta: -1,
      reason: {
        en: "Was given the main task and did not deliver it.",
        bn: "মূল কাজ হাতে পেয়ে শেষ করতে পারেননি।",
      },
    };
  }
  if (main === "delivered") {
    return {
      delta: 0,
      reason: {
        en: "Was selected and delivered — the pay and the verified record are the reward, not points.",
        bn: "নির্বাচিত হয়ে কাজ শেষ করেছেন — পুরস্কার হলো টাকা ও ভেরিফায়েড রেকর্ড, পয়েন্ট নয়।",
      },
    };
  }
  return {
    delta: 0,
    reason: { en: "Selected, main task still running.", bn: "নির্বাচিত, মূল কাজ এখনো চলছে।" },
  };
}


/* ── One problem, one task ────────────────────────────────────

   scope() was written when the AI split a brief into a chain of
   sub-tasks. That turned out to be the wrong product: a shop owner
   with one problem does not want a project plan, and a chain means
   the real price is only known at the end.

   scopeOne() reads the same brief and returns a single piece of work
   with one fee, one estimate and one set of acceptance criteria, plus
   the short trial the applicants will do.
   ──────────────────────────────────────────────────────────── */

export type BuiltTrial = {
  title: L;
  brief: L;
  minutes: number;
  acceptance: { en: string[]; bn: string[] };
  mirrors: L;
};

export type SingleScope = {
  sectorId: string;
  signals: { label: L; weight: number }[];
  summary: L;
  complexity: "Low" | "Medium" | "High";
  confidence: number;
  risks: L[];
  task: ScopedTask;
  trial: BuiltTrial;
  price: PriceVerdict;
};

/** Merge the scoped chain into the single job the client is actually buying. */
export function scopeOne(brief: string, opts?: { sectorId?: string; budget?: number }): SingleScope {
  const full = scope(brief, opts);
  const parts = full.tasks;
  const lead = parts[0];

  const hours = full.totalHours;
  const fee = full.totalFee;
  const level: ScopedTask["level"] = hours <= 5 ? "micro" : hours <= 14 ? "standard" : "advanced";

  const dedupe = (xs: string[]) => Array.from(new Set(xs.map((x) => x.trim()))).filter(Boolean);
  const acceptance = {
    en: dedupe(parts.flatMap((p) => p.acceptance.en)).slice(0, 5),
    bn: dedupe(parts.flatMap((p) => p.acceptance.bn)).slice(0, 5),
  };
  const skills = Array.from(new Set(parts.flatMap((p) => p.skills))).slice(0, 6);

  const lower = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
  const extras = parts.slice(1);
  const alsoEn = extras.map((p) => lower(p.title.en)).join(", ");
  const alsoBn = extras.map((p) => p.title.bn).join(", ");

  const task: ScopedTask = {
    id: "one",
    seq: 1,
    title: !lead
      ? { en: "The work described in your brief", bn: "আপনার ব্রিফে বর্ণিত কাজ" }
      : extras.length
        ? { en: `${lead.title.en}, end to end`, bn: `${lead.title.bn} — শুরু থেকে শেষ` }
        : lead.title,
    desc: extras.length
      ? {
          en: `${lead?.desc.en ?? ""} Also included: ${alsoEn}.`,
          bn: `${lead?.desc.bn ?? ""} এর সাথে আছে: ${alsoBn}।`,
        }
      : lead?.desc ?? { en: "", bn: "" },
    fee,
    hours,
    level,
    skills,
    acceptance,
  };

  const sec = sectorById(full.sectorId);
  const summary: L = {
    en: `One piece of work in ${sec.name.en}, priced as a whole: ${lower(task.title.en)}${
      extras.length ? `, including ${alsoEn}` : ""
    }. One fee and one estimate, so the cost is known before anyone starts rather than after.`,
    bn: `${sec.name.bn}-এ একটিমাত্র কাজ, পুরোটার একটাই দাম: ${task.title.bn}${
      extras.length ? `, সাথে ${alsoBn}` : ""
    }। একটি ফি, একটি অনুমান — খরচ জানা যায় কেউ শুরু করার আগেই, পরে নয়।`,
  };

  return {
    sectorId: full.sectorId,
    signals: full.signals,
    summary,
    complexity: full.complexity,
    confidence: full.confidence,
    risks: full.risks,
    task,
    trial: buildTrial(task, full.sectorId, brief),
    price: priceCheck(fee, hours, full.sectorId),
  };
}

/* The trial: the same features, a fraction of the volume, and one
   deliberate ambiguity so the platform learns what a person does when
   the brief runs out. */
const TRIAL_SHAPE: Record<string, { what: L; catch_: L }> = {
  it: {
    what: { en: "reproduce the fault once and write down exactly what you saw", bn: "ত্রুটিটি একবার ঘটিয়ে দেখুন এবং ঠিক কী দেখলেন তা লিখুন" },
    catch_: { en: "one of the steps will not reproduce — say so rather than inventing a cause", bn: "একটি ধাপ পুনরায় ঘটবে না — কারণ বানিয়ে না বলে সেটাই জানান" },
  },
  design: {
    what: { en: "lay out one section at two different sizes", bn: "একটি সেকশন দুটি ভিন্ন সাইজে সাজান" },
    catch_: { en: "the prices must sit in their own editable layer, because they will change", bn: "দাম আলাদা এডিটযোগ্য লেয়ারে থাকতে হবে, কারণ সেগুলো বদলাবে" },
  },
  content: {
    what: { en: "write three entries to the voice already on the site", bn: "সাইটে থাকা কণ্ঠেই তিনটি এন্ট্রি লিখুন" },
    catch_: { en: "one item's name differs between the tag and the site — ask, do not choose", bn: "একটি আইটেমের নাম ট্যাগ আর সাইটে আলাদা — নিজে বেছে না নিয়ে জিজ্ঞেস করুন" },
  },
  admin: {
    what: { en: "enter twelve records into the agreed columns", bn: "বারোটি রেকর্ড নির্ধারিত কলামে তুলুন" },
    catch_: { en: "three are hard to read — flag them, never guess", bn: "তিনটি পড়া কঠিন — অনুমান নয়, চিহ্নিত করুন" },
  },
  agri: {
    what: { en: "read one season of the sample and write two findings", bn: "নমুনার এক মৌসুম পড়ে দুটি ফলাফল লিখুন" },
    catch_: { en: "the evidence is thin — say where you are guessing", bn: "প্রমাণ কম — কোথায় অনুমান করছেন লিখুন" },
  },
  biz: {
    what: { en: "reconcile one week against the sample statement", bn: "নমুনা বিবরণীর সাথে এক সপ্তাহ মিলিয়ে দেখুন" },
    catch_: { en: "two entries will not reconcile — list them instead of forcing a match", bn: "দুটি এন্ট্রি মিলবে না — জোর করে না মিলিয়ে তালিকা করুন" },
  },
  eng: {
    what: { en: "quantify one section from the sample drawing", bn: "নমুনা ড্রয়িং থেকে একটি অংশের পরিমাণ বের করুন" },
    catch_: { en: "one dimension is missing — flag it rather than assuming a value", bn: "একটি মাপ নেই — মান ধরে না নিয়ে চিহ্নিত করুন" },
  },
  social: {
    what: { en: "code three sample interview responses into the agreed themes", bn: "তিনটি নমুনা সাক্ষাৎকারের উত্তর নির্ধারিত থিমে কোড করুন" },
    catch_: { en: "one response fits no theme — note it instead of forcing a fit", bn: "একটি উত্তর কোনো থিমে পড়ে না — জোর করে না বসিয়ে উল্লেখ করুন" },
  },
  mkt: {
    what: { en: "draft one ad and the targeting for a single segment", bn: "একটি সেগমেন্টের জন্য একটি বিজ্ঞাপন ও টার্গেটিং লিখুন" },
    catch_: { en: "the segment data is partial — state what you would confirm first", bn: "সেগমেন্টের তথ্য অসম্পূর্ণ — আগে কী নিশ্চিত করবেন লিখুন" },
  },
};

const TRIAL_FALLBACK = TRIAL_SHAPE.admin;

/* How each sector proves the work — written so the judge can find it in the files. */
const TRIAL_PROOF: Record<string, L> = {
  it: { en: "include a README that says how to run or test it", bn: "কীভাবে চালাবেন বা টেস্ট করবেন তা README-তে লিখুন" },
  design: { en: "export the design at both sizes and include the editable source file", bn: "দুই সাইজেই এক্সপোর্ট করুন এবং এডিটযোগ্য সোর্স ফাইল দিন" },
  content: { en: "cite the source for every fact you state", bn: "প্রতিটি তথ্যের সূত্র উল্লেখ করুন" },
  admin: { en: "use one row per record under a header row of the agreed columns", bn: "নির্ধারিত কলামের হেডারের নিচে প্রতি রেকর্ডে এক সারি ব্যবহার করুন" },
  agri: { en: "tie each finding to figures from the sample and state your assumptions", bn: "প্রতিটি ফলাফল নমুনার সংখ্যার সাথে মিলিয়ে দিন এবং অনুমানগুলো লিখুন" },
  biz: { en: "show the totals and list every entry that does not reconcile", bn: "মোট দেখান এবং যে এন্ট্রিগুলো মেলে না তার তালিকা দিন" },
  eng: { en: "state the quantity and the rate basis for every line", bn: "প্রতিটি লাইনের পরিমাণ ও রেটের ভিত্তি লিখুন" },
  social: { en: "quote each respondent's own words under the theme you coded", bn: "প্রতিটি থিমের নিচে উত্তরদাতার নিজের কথা উদ্ধৃত করুন" },
  mkt: { en: "state the target audience and the metric you would track", bn: "লক্ষ্য দর্শক এবং কোন মেট্রিক ট্র্যাক করবেন তা লিখুন" },
};

const REQ_BN: [RegExp, (m: string) => string][] = [
  [/^Produce, at trial size: (.*)$/, (m) => `ট্রায়াল আকারে তৈরি করুন: ${m}`],
  [/^Find the cause and show a fix for: (.*)$/, (m) => `কারণ খুঁজে সমাধান দেখান: ${m}`],
  [/^Client's instruction: (.*)$/, (m) => `ক্লায়েন্টের নির্দেশনা: ${m}`],
  [/^Flag the unclear point instead of guessing: (.*)$/, (m) => `অনুমান না করে অস্পষ্ট বিষয়টি চিহ্নিত করুন: ${m}`],
  [/^Upload the files you produced/, () => "যে ফাইলগুলো তৈরি করেছেন সেগুলো আপলোড করুন (শুধু বর্ণনা নয়)"],
];

/**
 * The trial is a small copy of the real task: the brief's own features at
 * trial volume (see ./judge planTrial), the sector's proof of work and the
 * deliberate ambiguity. `note` is the client's change request when the AI
 * rebuilds the trial. The requirement list is what the judge checks uploads
 * against — the same builder the server uses.
 */
export function buildTrial(task: ScopedTask, sectorId: string, brief = "", note?: string): BuiltTrial {
  const base = TRIAL_SHAPE[sectorId] ?? TRIAL_FALLBACK;
  // IT build work (not a fault) plants a data problem instead of a step that will not reproduce.
  const shape = sectorId === "it" && brief && !isFaultBrief(brief) ? { ...base, catch_: { en: IT_BUILD_CATCH, bn: IT_BUILD_CATCH_BN } } : base;
  const proof = TRIAL_PROOF[sectorId] ?? TRIAL_PROOF.admin;
  const minutes = trialSize(task.hours);
  const plan = planTrial({ brief, hours: task.hours, minutes, what: shape.what.en, catch_: shape.catch_.en, proof: proof.en, note });
  const toBn = (r: string) => {
    for (const [re, fn] of REQ_BN) {
      const m = r.match(re);
      if (m) return fn(m[1] ?? "");
    }
    if (r.toLowerCase() === proof.en.toLowerCase()) return proof.bn;
    return r;
  };
  const core = plan.title.replace(/^\d+-minute trial: /, "");
  return {
    title: { en: plan.title, bn: `${minutes} মিনিটের ট্রায়াল: ${core}` },
    brief: {
      en: plan.brief,
      bn: `এটি আসল কাজের একটি ছোট কপি — একই ফিচার, অনেক কম পরিমাণে। ${plan.requirements.slice(0, -1).map(toBn).join("; ")}। মনে রাখবেন: ${shape.catch_.bn}। আপনার তৈরি ফাইল আপলোড করুন ও কত সময় লাগল লিখুন — AI প্রতিটি শর্ত ফাইলের সাথে মিলিয়ে দেখে; ${SHORTLIST_BAR}% সম্পূর্ণ হলে মডারেটরের কাছে যায়।`,
    },
    minutes,
    acceptance: { en: plan.requirements, bn: plan.requirements.map(toBn) },
    mirrors: {
      en: plan.mirrors,
      bn: `আসল টাস্ক প্রায় ${task.hours} ঘণ্টার। ট্রায়াল মূল ফিচারগুলোর ছোট সংস্করণ, সাথে সেই অংশ যা পুরো কাজের ভাগ্য ঠিক করে: ${shape.catch_.bn}।`,
    },
  };
}
