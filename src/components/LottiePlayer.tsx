"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Plays a Lottie animation with lottie-web's light SVG player. The player and
 * the animation data load only in the browser, after mount, so they add
 * nothing to the server render or to pages that don't use them. With "reduce
 * motion" on, the animation is shown as a still frame instead of playing.
 */
export default function LottiePlayer({
  load,
  label,
  className,
  stillFrame = 60,
}: {
  /** Returns the animation JSON, e.g. () => import("./my-animation.json"). */
  load: () => Promise<{ default: unknown }>;
  /** Accessible description of what the animation shows. */
  label: string;
  className?: string;
  /** Frame shown when the visitor prefers reduced motion. */
  stillFrame?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    Promise.all([import("lottie-web/build/player/lottie_light"), load()])
      .then(([{ default: lottie }, { default: animationData }]) => {
        if (cancelled || !ref.current) return;
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: true,
          autoplay: !still,
          animationData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true },
        });
        if (still) anim.goToAndStop(stillFrame, true);
        destroy = () => anim.destroy();
      })
      .catch(() => {
        /* the animation is decorative — the page works without it */
      });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [load, stillFrame]);

  return <div ref={ref} role="img" aria-label={label} className={cn("[&>svg]:block", className)} />;
}
