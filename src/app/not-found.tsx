import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[70dvh] place-items-center px-5 py-24">
      <div className="max-w-[440px] text-center">
        <div
          className="num text-[72px] font-semibold leading-none tracking-[-0.05em] text-brand-600"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </div>
        <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.025em] text-ink">Nothing verified at this address</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-3">
          The page you were looking for does not exist. Every route on this prototype is reachable from the home page.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-px hover:bg-ink-2"
        >
          Back to WorkBridge
        </Link>
      </div>
    </section>
  );
}
