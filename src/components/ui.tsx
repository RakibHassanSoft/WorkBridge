"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { T, useLang, type L } from "@/lib/i18n";

/* ── Reveal on scroll ─────────────────────────────────────────── */
/**
 * Content is rendered fully visible on the server, so every page reads
 * correctly with JavaScript disabled, still loading, or blocked. After
 * hydration, only elements that start below the fold are hidden and then
 * faded in as they scroll into view.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen: leave it exactly as rendered.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: React.CSSProperties | undefined =
    state === "static"
      ? undefined
      : {
          opacity: state === "shown" ? 1 : 0,
          transform: state === "shown" ? "none" : `translateY(${y}px)`,
          transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
        };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

/* ── Button ───────────────────────────────────────────────────── */
type BtnProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
};

const btnBase =
  "group relative inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] disabled:opacity-45 disabled:pointer-events-none";

const btnVariants: Record<string, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_1px_2px_rgba(3,35,26,.25),0_12px_28px_-14px_rgba(15,127,82,.75)] hover:bg-brand-700 hover:-translate-y-px active:translate-y-0",
  dark: "bg-ink text-white hover:bg-ink-2 hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-white text-ink ring-1 ring-line-2 hover:ring-brand-300 hover:bg-brand-50/60 hover:-translate-y-px",
  ghost: "text-ink-2 hover:text-ink hover:bg-canvas-3",
};

const btnSizes: Record<string, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-[10px]",
  md: "h-11 px-5 text-[14px] rounded-[12px]",
  lg: "h-[52px] px-7 text-[15px] rounded-[14px]",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  icon,
  onClick,
  type = "button",
  disabled,
  full,
}: BtnProps) {
  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], full && "w-full", className);
  const inner = (
    <>
      <span className="relative">{children}</span>
      {icon && (
        <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">{icon}</span>
      )}
    </>
  );
  if (href) {
    const external = href.startsWith("http");
    if (external)
      return (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>
          {inner}
        </a>
      );
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

/* ── Badge / Pill ─────────────────────────────────────────────── */
export function Badge({
  children,
  tone = "brand",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "ink" | "warn" | "info";
  className?: string;
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    neutral: "bg-canvas-2 text-ink-3 ring-line",
    ink: "bg-ink text-white ring-ink",
    warn: "bg-warn-bg text-warn ring-warn/15",
    info: "bg-info-bg text-info ring-info/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

/* ── Card ─────────────────────────────────────────────────────── */
export function Card({
  children,
  className,
  hover,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-line bg-white",
        padded && "p-6",
        hover &&
          "transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(10,14,12,.05),0_22px_44px_-24px_rgba(10,14,12,.22)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Section heading ──────────────────────────────────────────── */
export function SectionHead({
  eyebrow,
  title,
  desc,
  align = "left",
  className,
}: {
  eyebrow?: L | string;
  title: L | string;
  desc?: L | string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <div className="eyebrow mb-3.5 flex items-center gap-2.5" style={{ justifyContent: align === "center" ? "center" : undefined }}>
          <span className="h-px w-6 bg-brand-300" />
          <T v={eyebrow} />
        </div>
      )}
      <h2 className="display-2 text-ink">
        <T v={title} />
      </h2>
      {desc && (
        <p className="mt-4 text-[16.5px] leading-relaxed text-ink-3">
          <T v={desc} />
        </p>
      )}
    </div>
  );
}

/* ── Language toggle ──────────────────────────────────────────── */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "relative flex h-9 items-center rounded-full border border-line bg-canvas-2 p-0.5 text-[12.5px] font-medium",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-[0_1px_2px_rgba(10,14,12,.10)] ring-1 ring-line transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ left: lang === "en" ? 2 : "50%", width: "calc(50% - 2px)" }}
      />
      <button
        onClick={() => setLang("en")}
        className={cn("relative z-10 h-8 flex-1 rounded-full px-3 transition-colors", lang === "en" ? "text-ink" : "text-ink-4")}
      >
        EN
      </button>
      <button
        onClick={() => setLang("bn")}
        className={cn("relative z-10 h-8 flex-1 rounded-full px-3 transition-colors", lang === "bn" ? "text-ink" : "text-ink-4")}
        style={{ fontFamily: "var(--font-bn)" }}
      >
        বাং
      </button>
    </div>
  );
}

/* ── Stat ─────────────────────────────────────────────────────── */
export function Stat({ value, label, sub }: { value: string; label: L | string; sub?: L | string }) {
  return (
    <div>
      <div className="num display-3 text-brand-600">{value}</div>
      <div className="mt-1.5 text-[14px] font-medium text-ink">
        <T v={label} />
      </div>
      {sub && (
        <div className="mt-1 text-[13px] leading-relaxed text-ink-4">
          <T v={sub} />
        </div>
      )}
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────────── */
export function Bar({ value, tone = "brand" }: { value: number; tone?: "brand" | "ink" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-3">
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]", tone === "brand" ? "bg-brand-500" : "bg-ink")}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────── */
export function Avatar({ name, size = 36, tone, src }: { name: string; size?: number; tone?: string; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="inline-block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const palette = ["#0f7f52", "#0b6242", "#1a9b66", "#094e36", "#48b583"];
  const bg = tone ?? palette[name.charCodeAt(0) % palette.length];
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
