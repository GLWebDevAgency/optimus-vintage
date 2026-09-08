import type { ComponentType, ReactNode } from "react";

/** Montant en unités mineures (même forme que `MoneyDto` du contrat). */
export interface MoneyLike {
  readonly minor: number;
  readonly currency: string;
}

/** Composant de lien injectable (Next `Link`, Expo Router, ou `a`). */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string | undefined;
  children?: ReactNode;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string | undefined;
  onClick?: (() => void) | undefined;
}>;

export type Tone = "neutral" | "pos" | "neg" | "muted";
