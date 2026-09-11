"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  Lock,
  Mail,
  School,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth, roleHome } from "@/lib/auth";
import { ApiError, type Role } from "@/lib/api";
import { T, useLang, type L } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import Logo from "@/components/Logo";
import LottiePlayer from "@/components/LottiePlayer";
import { LangToggle } from "@/components/ui";

type Mode = "login" | "register";

// Loaded in the browser only, alongside the Lottie player.
const loadAnimation = () => import("@/components/auth/graduate-animation.json");

// Public registration is client/student only. Coordinators are provisioned
// server-side with a signup code, not created from the public form.
const ROLES: { value: Role; icon: LucideIcon; label: L; hint: L }[] = [
  { value: "CLIENT", icon: Building2, label: { en: "Business", bn: "ব্যবসা" }, hint: { en: "Post work and hire", bn: "কাজ পোস্ট ও নিয়োগ" } },
  { value: "STUDENT", icon: GraduationCap, label: { en: "Student", bn: "শিক্ষার্থী" }, hint: { en: "Do work, get verified", bn: "কাজ করুন, ভেরিফায়েড হন" } },
];

const DEMOS: { href: string; label: L }[] = [
  { href: "/demo/client", label: { en: "Client", bn: "ক্লায়েন্ট" } },
  { href: "/demo/student", label: { en: "Student", bn: "শিক্ষার্থী" } },
  { href: "/demo/moderator", label: { en: "Moderator", bn: "মডারেটর" } },
];

const PROMISES: { icon: LucideIcon; text: L }[] = [
  { icon: BadgeCheck, text: { en: "Apply by doing a short trial, not by writing a pitch", bn: "পিচ লিখে নয়, ছোট একটি ট্রায়াল করে আবেদন" } },
  { icon: Wallet, text: { en: "Every fee is held in escrow and paid on sign-off", bn: "প্রতিটি ফি এসক্রোতে থাকে, সাইন-অফে পরিশোধ" } },
  { icon: ShieldCheck, text: { en: "Finished work is scored by a coordinator and the client", bn: "শেষ করা কাজ মূল্যায়ন করেন কোঅর্ডিনেটর ও ক্লায়েন্ট" } },
];

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("CLIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    university: "",
    discipline: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Only same-site paths are honoured, so ?next= can't redirect off the site.
  const nextUrl = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user =
        mode === "login"
          ? await login(form.email, form.password)
          : await register(
              role === "CLIENT"
                ? {
                    role,
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    businessName: form.businessName || form.name,
                  }
                : {
                    role,
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    university: form.university || undefined,
                    discipline: form.discipline || undefined,
                  }
            );
      router.replace(nextUrl() || roleHome[user.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t({ en: "Something went wrong", bn: "কিছু একটা ভুল হয়েছে" }));
    }
  }

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ── Form side ─────────────────────────────────────────── */}
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="WorkBridge home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink sm:inline-flex">
              <ArrowLeft className="size-3.5" />
              <T v={{ en: "Back to site", bn: "সাইটে ফিরুন" }} />
            </Link>
            <LangToggle className="w-[100px]" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {/* The illustration moves above the form on small screens. */}
          <div className="mx-auto mb-2 w-full max-w-[240px] lg:hidden">
            <LottiePlayer load={loadAnimation} label={t({ en: "A graduate waving from a bridge beside a verified work card", bn: "সেতুর ওপর থেকে হাত নাড়ছেন একজন গ্র্যাজুয়েট, পাশে ভেরিফায়েড কাজের কার্ড" })} className="aspect-square" />
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
            <Sparkles className="size-3.5" />
            {mode === "login" ? <T v={{ en: "Welcome back", bn: "আবার স্বাগতম" }} /> : <T v={{ en: "Free to join", bn: "যোগ দেওয়া বিনামূল্যে" }} />}
          </span>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[34px]">
            {mode === "login" ? (
              <T v={{ en: "Sign in to WorkBridge", bn: "ওয়ার্কব্রিজে সাইন ইন করুন" }} />
            ) : (
              <T v={{ en: "Create your account", bn: "আপনার অ্যাকাউন্ট খুলুন" }} />
            )}
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-3">
            {mode === "login" ? (
              <T v={{ en: "Pick up where you left off — your tasks, trials and payments are waiting.", bn: "যেখানে ছিলেন সেখান থেকেই শুরু করুন — আপনার টাস্ক, ট্রায়াল আর পেমেন্ট অপেক্ষা করছে।" }} />
            ) : (
              <T v={{ en: "Join as a business that needs work done, or a student who wants proof they can do it.", bn: "কাজ করাতে চাওয়া ব্যবসা হিসেবে, অথবা কাজ পারার প্রমাণ চাওয়া শিক্ষার্থী হিসেবে যোগ দিন।" }} />
            )}
          </p>

          {/* Sign in / Create account */}
          <div role="tablist" aria-label={t({ en: "Account", bn: "অ্যাকাউন্ট" })} className="relative mt-7 grid grid-cols-2 rounded-[14px] bg-canvas-3 p-1 text-[13.5px] font-medium">
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(10,14,12,.08),0_4px_12px_-6px_rgba(10,14,12,.18)] transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: mode === "login" ? "translateX(0)" : "translateX(100%)" }}
            />
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn("relative z-10 h-10 rounded-[10px] transition-colors", mode === m ? "text-ink" : "text-ink-4 hover:text-ink-2")}
              >
                {m === "login" ? <T v={{ en: "Sign in", bn: "সাইন ইন" }} /> : <T v={{ en: "Create account", bn: "অ্যাকাউন্ট খুলুন" }} />}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <fieldset>
                <legend className="mb-2 text-[12.5px] font-medium text-ink-2">
                  <T v={{ en: "I am joining as", bn: "আমি যোগ দিচ্ছি" }} />
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const on = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "relative rounded-[14px] border p-3.5 text-left transition-all duration-200",
                          on ? "border-brand-500 bg-brand-50 shadow-[0_0_0_3px_rgba(26,155,102,.12)]" : "border-line bg-white hover:border-brand-200"
                        )}
                      >
                        <span className={cn("grid size-9 place-items-center rounded-[10px]", on ? "bg-brand-600 text-white" : "bg-canvas-3 text-ink-3")}>
                          <r.icon className="size-4.5" />
                        </span>
                        <span className="mt-2.5 block text-[13.5px] font-semibold text-ink">{t(r.label)}</span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-4">{t(r.hint)}</span>
                        {on && (
                          <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                            <Check className="size-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {mode === "register" && (
              <Field id="name" label={{ en: "Full name", bn: "পুরো নাম" }} icon={User}>
                <input id="name" className={inputCls} autoComplete="name" value={form.name} onChange={set("name")} required />
              </Field>
            )}
            {mode === "register" && role === "CLIENT" && (
              <Field id="businessName" label={{ en: "Business name", bn: "ব্যবসার নাম" }} icon={Store} optional>
                <input id="businessName" className={inputCls} autoComplete="organization" value={form.businessName} onChange={set("businessName")} />
              </Field>
            )}
            {mode === "register" && role === "STUDENT" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="university" label={{ en: "University", bn: "বিশ্ববিদ্যালয়" }} icon={School} optional>
                  <input id="university" className={inputCls} value={form.university} onChange={set("university")} />
                </Field>
                <Field id="discipline" label={{ en: "Discipline", bn: "বিষয়" }} icon={BookOpen} optional>
                  <input id="discipline" className={inputCls} value={form.discipline} onChange={set("discipline")} />
                </Field>
              </div>
            )}

            <Field id="email" label={{ en: "Email", bn: "ইমেইল" }} icon={Mail}>
              <input id="email" className={inputCls} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </Field>
            <Field id="password" label={{ en: "Password", bn: "পাসওয়ার্ড" }} icon={Lock}>
              <input
                id="password"
                className={cn(inputCls, "pr-11")}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                placeholder={t({ en: "At least 8 characters", bn: "অন্তত ৮ অক্ষর" })}
                value={form.password}
                onChange={set("password")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t({ en: "Hide password", bn: "পাসওয়ার্ড লুকান" }) : t({ en: "Show password", bn: "পাসওয়ার্ড দেখুন" })}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] text-ink-4 transition-colors hover:bg-canvas-3 hover:text-ink-2"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-brand-600 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(3,35,26,.25),0_14px_30px_-14px_rgba(15,127,82,.8)] transition-all duration-300 hover:-translate-y-px hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  <T v={{ en: "Please wait…", bn: "একটু অপেক্ষা করুন…" }} />
                </>
              ) : (
                <>
                  {mode === "login" ? <T v={{ en: "Sign in", bn: "সাইন ইন" }} /> : <T v={{ en: "Create account", bn: "অ্যাকাউন্ট খুলুন" }} />}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Live demo — no account needed */}
          <div className="mt-8">
            <div className="flex items-center gap-3 text-[12px] text-ink-4">
              <span className="h-px flex-1 bg-line" />
              <T v={{ en: "or explore the live demo", bn: "অথবা লাইভ ডেমো দেখুন" }} />
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {DEMOS.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="rounded-[12px] border border-line bg-white px-3 py-2.5 text-center text-[13px] font-medium text-ink-2 transition-all hover:-translate-y-px hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700"
                >
                  {t(d.label)}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-4">
              <T v={{ en: "Coordinator accounts are created by the WorkBridge team.", bn: "কোঅর্ডিনেটর অ্যাকাউন্ট ওয়ার্কব্রিজ টিম তৈরি করে।" }} />
            </p>
          </div>
        </div>
      </div>

      {/* ── Illustration side ─────────────────────────────────── */}
      <aside className="hidden p-4 lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-100/70">
          <div aria-hidden className="grid-bg absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
          <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-brand-200/40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-28 -left-20 size-80 rounded-full bg-brand-100/60 blur-3xl" />

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-10 pt-10">
            <LottiePlayer
              load={loadAnimation}
              label={t({ en: "A graduate waving from a bridge beside a verified work card", bn: "সেতুর ওপর থেকে হাত নাড়ছেন একজন গ্র্যাজুয়েট, পাশে ভেরিফায়েড কাজের কার্ড" })}
              className="aspect-square h-full max-h-[460px] max-w-full"
            />
          </div>

          <div className="relative px-10 pb-10 xl:px-14 xl:pb-12">
            <h2 className="max-w-[26ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink xl:text-[30px]">
              <T v={{ en: "A degree says you studied. WorkBridge proves you can do the work.", bn: "ডিগ্রি বলে আপনি পড়েছেন। ওয়ার্কব্রিজ প্রমাণ করে আপনি কাজটা পারেন।" }} />
            </h2>
            <ul className="mt-6 space-y-3">
              {PROMISES.map((p) => (
                <li key={p.text.en} className="flex items-center gap-3 text-[14px] text-ink-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white text-brand-600 shadow-[0_1px_2px_rgba(10,14,12,.06)] ring-1 ring-brand-100">
                    <p.icon className="size-4" />
                  </span>
                  {t(p.text)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-[12px] border border-line bg-white pl-10 pr-3.5 text-[14px] text-ink outline-none transition-all placeholder:text-ink-4 hover:border-line-2 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(26,155,102,.12)]";

function Field({
  id,
  label,
  icon: Icon,
  optional,
  children,
}: {
  id: string;
  label: L;
  icon: LucideIcon;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-ink-2">
        {t(label)}
        {optional && <span className="font-normal text-ink-4">{t({ en: "Optional", bn: "ঐচ্ছিক" })}</span>}
      </label>
      <div className="relative">
        <Icon aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
        {children}
      </div>
    </div>
  );
}
