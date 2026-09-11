"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, roleHome } from "@/lib/auth";
import { ApiError, Role } from "@/lib/api";
import Logo from "@/components/Logo";

type Mode = "login" | "register";

// Public registration is client/student only. Coordinators are provisioned
// server-side with a signup code, not created from the public form.
const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "CLIENT", label: "Business", hint: "Post work and hire" },
  { value: "STUDENT", label: "Student", hint: "Do work, get verified" },
];

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("CLIENT");
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

  const nextUrl = () => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("next");
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
                : role === "STUDENT"
                  ? {
                      role,
                      name: form.name,
                      email: form.email,
                      password: form.password,
                      university: form.university || undefined,
                      discipline: form.discipline || undefined,
                    }
                  : { role, name: form.name, email: form.email, password: form.password }
            );
      router.replace(nextUrl() || roleHome[user.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  const input =
    "w-full rounded-[12px] border border-line bg-canvas-2/40 p-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-brand-300 focus:bg-white";

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-[13px] text-ink-4 hover:text-ink">
            ← Back to site
          </Link>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-ink">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-4">
            {mode === "login"
              ? "Welcome back to WorkBridge."
              : "Join WorkBridge as a business, student, or coordinator."}
          </p>

          {mode === "register" && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-[12px] border p-2.5 text-left transition-colors ${
                    role === r.value
                      ? "border-brand-300 bg-brand-50"
                      : "border-line bg-canvas-2/40 hover:border-brand-200"
                  }`}
                >
                  <div className="text-[13px] font-medium text-ink">{r.label}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-ink-4">{r.hint}</div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "register" && (
              <input className={input} placeholder="Full name" value={form.name} onChange={set("name")} required />
            )}
            {mode === "register" && role === "CLIENT" && (
              <input className={input} placeholder="Business name" value={form.businessName} onChange={set("businessName")} />
            )}
            {mode === "register" && role === "STUDENT" && (
              <>
                <input className={input} placeholder="University (optional)" value={form.university} onChange={set("university")} />
                <input className={input} placeholder="Discipline (optional)" value={form.discipline} onChange={set("discipline")} />
              </>
            )}
            <input className={input} type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
            <input className={input} type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={set("password")} required />

            {error && (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[12px] bg-brand-600 px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-[13px] text-ink-4">
            {mode === "login" ? "New to WorkBridge?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-medium text-brand-700 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
