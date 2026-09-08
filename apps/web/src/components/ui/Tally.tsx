"use client";

import { animate } from "motion";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";

interface TallyProps {
  to: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

const fmt = (v: number, d: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Compter à la craie : le montant s'additionne en accélérant puis en freinant. Sans JS : valeur finale. */
export function Tally({ to, decimals = 0, duration = 1.4, className }: TallyProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (reduce || !ref.current) return;
    ref.current.textContent = fmt(0, decimals);
  }, [reduce, decimals]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = fmt(to, decimals);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v, decimals);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, to, decimals, duration]);

  return (
    <span ref={ref} className={["tabular", className].filter(Boolean).join(" ")}>
      {fmt(to, decimals)}
    </span>
  );
}
