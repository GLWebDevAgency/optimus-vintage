"use client";

import { useId } from "react";

interface StitchProps {
  /** Progression 0–100. */
  pct: number;
  className?: string;
  label?: string;
}

/** Fil cousu : la progression se coud sur une ligne pointillée grise. */
export function Stitch({ pct, className, label }: StitchProps) {
  const id = `st${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const w = 1000;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={["stitch", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      aria-label={label}
    >
      <svg viewBox={`0 0 ${w} 14`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id={id}>
            <path className="maskline" d={`M0 7 H${w}`} pathLength={1} />
          </mask>
        </defs>
        <path className="base" d={`M0 7 H${w}`} />
        <path className="run" d={`M0 7 H${(w * p) / 100}`} mask={`url(#${id})`} />
      </svg>
    </div>
  );
}

interface StitchRowProps extends StitchProps {
  left: string;
  right: string;
}

/** Libellés mono au-dessus du fil : « Objectif 2 000 € — 64 % ». */
export function StitchRow({ left, right, ...rest }: StitchRowProps) {
  return (
    <div className="stitch-wrap">
      <div className="lbl">
        <span>{left}</span>
        <b>{right}</b>
      </div>
      <Stitch {...rest} />
    </div>
  );
}
