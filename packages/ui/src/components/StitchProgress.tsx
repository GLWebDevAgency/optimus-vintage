"use client";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId } from "react";
import { cn } from "../cn.js";
import { stitchDraw } from "../motion.js";

export interface StitchProgressProps {
  /** 0 … 1 (peut dépasser 1 : plafonné à la ligne). */
  readonly value: number;
  readonly label?: ReactNode;
  /** Texte à droite (« 64 % », « 112 % remboursée »). */
  readonly valueLabel?: ReactNode;
  readonly height?: number;
  readonly delay?: number;
  readonly className?: string;
  /** Couleur du fil ; brass une fois amortie. */
  readonly tone?: "thread" | "brass" | "indigo";
  readonly "aria-label"?: string;
}

const W = 1000;

/** Progression cousue : un fil rouge qui se coud sur une ligne pointillée. */
export function StitchProgress({ value, label, valueLabel, height = 14, delay = 0, className, tone = "thread", ...rest }: StitchProgressProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const stroke = tone === "brass" ? "var(--brass)" : tone === "indigo" ? "var(--indigo)" : "var(--thread)";
  const y = height / 2;
  return (
    <div className={cn("grid w-full gap-2", className)}>
      {label !== undefined || valueLabel !== undefined ? (
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[.1em] text-ink-3">
          <span>{label}</span>
          <b className="font-medium normal-case tracking-normal text-ink tabular">{valueLabel}</b>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={rest["aria-label"] ?? (typeof label === "string" ? label : undefined)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        className="w-full"
        style={{ height }}
      >
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={height}>
              <motion.path
                d={`M0 ${y} H${W}`}
                stroke="#fff"
                strokeWidth={height}
                fill="none"
                {...(reduced ? { initial: { pathLength: 1 } } : stitchDraw(delay))}
              />
            </mask>
          </defs>
          <path d={`M0 ${y} H${W}`} stroke="var(--line-2)" strokeWidth="2" strokeDasharray="7 5" fill="none" vectorEffect="non-scaling-stroke" />
          {pct > 0 ? (
            <path
              d={`M0 ${y} H${W * pct}`}
              stroke={stroke}
              strokeWidth="2.4"
              strokeDasharray="7 5"
              strokeLinecap="round"
              fill="none"
              mask={`url(#${id})`}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}
