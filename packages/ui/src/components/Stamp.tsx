"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import { stampIn } from "../motion.js";

export interface StampProps {
  readonly children: ReactNode;
  readonly tone?: "thread" | "brass";
  readonly size?: "sm" | "md" | "lg";
  readonly delay?: number;
  readonly still?: boolean;
  readonly className?: string;
}

const sizes = {
  sm: "text-[10px] tracking-[.1em] px-1.5 py-0.5 rounded-[5px] border-2",
  md: "text-[22px] tracking-[.08em] px-3.5 py-1 rounded-[7px] border-[3px]",
  lg: "text-[38px] tracking-[.08em] px-[18px] py-1.5 rounded-lg border-4",
} as const;

/** Tampon encré (VENDU, AMORTIE) : tombe sur la carte en s'écrasant, grain de caoutchouc. */
export function Stamp({ children, tone = "thread", size = "md", delay = 0.25, still, className }: StampProps) {
  const reduced = useReducedMotion();
  const animated = !still && !reduced;
  return (
    <motion.span
      role="status"
      variants={animated ? stampIn : undefined}
      initial={animated ? "hidden" : false}
      animate={animated ? "visible" : undefined}
      custom={delay}
      style={{ mixBlendMode: "var(--stamp-blend)" as never, rotate: -8 }}
      className={cn(
        "relative inline-block font-ui font-extrabold uppercase border-double select-none",
        tone === "brass" ? "border-brass text-brass" : "border-thread text-thread",
        sizes[size],
        "after:pointer-events-none after:absolute after:-inset-1 after:rounded-[inherit] after:opacity-45 after:mix-blend-lighten after:content-[''] after:[background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")]",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
