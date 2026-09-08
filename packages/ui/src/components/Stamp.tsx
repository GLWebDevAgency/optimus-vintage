"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../cn";
import { stampIn } from "../motion";

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
export function Stamp({
  children,
  tone = "thread",
  size = "md",
  delay = 0.25,
  still,
  className,
}: StampProps) {
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
        "stamp-grain",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}
