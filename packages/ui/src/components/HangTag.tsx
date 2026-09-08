"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../cn";
import { swingIn, swingOrigin } from "../motion";

export interface HangTagProps {
  /** Libellé mono capitale (« En stock »). */
  readonly label?: ReactNode;
  /** Valeur en sérif italique (142, 75 €). */
  readonly value?: ReactNode;
  /** Suffixe petit à côté de la valeur (« pièces », « € »). */
  readonly unit?: ReactNode;
  readonly children?: ReactNode;
  /** Délai d'entrée (s) pour une rangée d'étiquettes. */
  readonly delay?: number;
  /** Désactive le balancement d'entrée. */
  readonly still?: boolean;
  readonly tone?: "neutral" | "thread" | "brass";
  readonly className?: string;
  readonly size?: "sm" | "md";
  readonly onClick?: () => void;
}

/** Étiquette suspendue à son fil : entre en se balançant depuis l'œillet. */
export function HangTag({
  label,
  value,
  unit,
  children,
  delay = 0,
  still,
  tone = "neutral",
  className,
  size = "md",
  onClick,
}: HangTagProps) {
  const reduced = useReducedMotion();
  const animated = !still && !reduced;
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      variants={animated ? swingIn : undefined}
      initial={animated ? "hidden" : false}
      animate={animated ? "visible" : undefined}
      custom={delay}
      style={swingOrigin}
      className={cn(
        "relative block w-full rounded-[12px_12px_14px_14px] border border-line bg-surface text-left shadow-tag",
        size === "md" ? "px-3.5 pb-3.5 pt-[26px]" : "px-2.5 pb-2.5 pt-[22px]",
        // Œillet
        "before:absolute before:left-1/2 before:top-[9px] before:h-[9px] before:w-[9px] before:-translate-x-1/2 before:rounded-full before:bg-bg before:shadow-[inset_0_0_0_1.5px_var(--line-2)] before:content-['']",
        // Fil
        "after:absolute after:left-1/2 after:top-[-18px] after:h-6 after:w-[1.5px] after:-translate-x-1/2 after:bg-thread after:content-['']",
        onClick &&
          "cursor-pointer focus-thread active:scale-[.98] transition-transform duration-micro",
        className,
      )}
    >
      {label !== undefined ? (
        <span
          className={cn(
            "block font-mono text-[10px] uppercase tracking-[.14em]",
            tone === "thread" ? "text-thread" : tone === "brass" ? "text-brass" : "text-ink-3",
          )}
        >
          {label}
        </span>
      ) : null}
      {value !== undefined ? (
        <span
          className={cn(
            "mt-1 block font-display italic leading-none text-ink tabular",
            size === "md" ? "text-[30px]" : "text-[24px]",
          )}
        >
          {value}
          {unit !== undefined ? (
            <small className="ml-0.5 font-ui not-italic text-[12px] font-semibold text-ink-2">
              {unit}
            </small>
          ) : null}
        </span>
      ) : null}
      {children}
    </Comp>
  );
}
