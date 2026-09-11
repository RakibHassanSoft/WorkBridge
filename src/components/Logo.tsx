import { cn } from "@/lib/cn";

export default function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center rounded-[9px] bg-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 16.5h4.2c1.2 0 1.9-.7 2.6-1.9l3.4-6c.7-1.2 1.4-1.9 2.6-1.9H21" stroke="#48b583" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M3 7.5h4.2c1.2 0 1.9.7 2.6 1.9" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M13.9 15.6c.7 1.2 1.4 1.9 2.6 1.9H21" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      </span>
      {!mark && (
        <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          BD<span className="text-brand-600">Freshers</span>
        </span>
      )}
    </span>
  );
}
