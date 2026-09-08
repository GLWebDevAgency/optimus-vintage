"use client";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import type { MoneyLike } from "../types.js";
import { Tally } from "./Tally.js";

export interface KpiHeroProps {
  readonly label: ReactNode;
  readonly value: number | MoneyLike;
  /** Variation (« +18 % vs août · 23 ventes »). */
  readonly delta?: ReactNode;
  readonly deltaTone?: "brass" | "thread" | "muted";
  readonly locale?: string;
  readonly compact?: boolean;
  readonly className?: string;
  readonly size?: "hero" | "card";
  readonly tone?: "ink" | "brass";
}

/** Le chiffre du mois : libellé mono, montant compté en sérif, variation en laiton. */
export function KpiHero({
  label,
  value,
  delta,
  deltaTone = "brass",
  locale = "fr",
  compact,
  className,
  size = "hero",
  tone = "ink",
}: KpiHeroProps) {
  return (
    <div className={cn("grid gap-1", className)}>
      <span className="font-mono text-[10.5px] uppercase tracking-[.14em] text-ink-3">{label}</span>
      <Tally value={value} locale={locale} size={size} compact={compact ?? false} tone={tone} />
      {delta ? (
        <span
          className={cn(
            "text-[13px] font-semibold",
            deltaTone === "brass"
              ? "text-brass"
              : deltaTone === "thread"
                ? "text-thread"
                : "text-ink-3",
          )}
        >
          {delta}
        </span>
      ) : null}
    </div>
  );
}
