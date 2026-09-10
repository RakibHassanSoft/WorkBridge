"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "bn";
export type L = { en: string; bn: string };
export type LList = { en: string[]; bn: string[] };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (v: L | string) => string;
  tl: (v: LList | string[]) => string[];
  ready: boolean;
};

const LangCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "wb.lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.classList.toggle("lang-bn", lang === "bn");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "en" ? "bn" : "en"),
      t: (v) => (typeof v === "string" ? v : v[lang]),
      tl: (v) => (Array.isArray(v) ? v : v[lang]),
      ready,
    }),
    [lang, setLang, ready]
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** Inline bilingual text node. */
export function T({ v }: { v: L | string }) {
  const { t } = useLang();
  return <>{t(v)}</>;
}

/** Bengali-Indic digit conversion for numerals in Bangla mode. */
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function useNum() {
  const { lang } = useLang();
  return useCallback(
    (n: number | string) => {
      const s = String(n);
      return lang === "bn" ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s;
    },
    [lang]
  );
}
