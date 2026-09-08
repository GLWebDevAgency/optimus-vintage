"use client";
import type { Transition, Variants } from "motion/react";
/**
 * Grammaire du mouvement Selvedge pour `motion/react` :
 * six gestes (accrocher, coudre, compter, plier, tamponner, dérouler) et une entrée en cascade.
 * Tout respecte `prefers-reduced-motion` via `useReducedMotion` / `useMotionPrefs`.
 */
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_FOLD: [number, number, number, number] = [0.7, 0, 0.2, 1];
export const EASE_SNAP: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export const DURATION = { micro: 0.12, state: 0.24, enter: 0.52, hero: 1.1 } as const;

/** Transition d'état (chips, toggles, bordures). */
export const stateTransition: Transition = { duration: DURATION.state, ease: EASE_OUT };
/** Transition micro (pression d'un bouton). */
export const microTransition: Transition = { duration: DURATION.micro, ease: EASE_OUT };
/** Ressort « snap » pour les bascules. */
export const snapTransition: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 26,
  mass: 0.8,
};

/* ───────────── 1. Accrocher — l'étiquette entre suspendue et se balance ───────────── */
export const swingIn: Variants = {
  hidden: { opacity: 0, y: -28, rotate: -14 },
  visible: (delay = 0) => ({
    opacity: [0, 1, 1, 1, 1],
    y: [-28, 0, 0, 0, 0],
    rotate: [-14, 8, -4.5, 2, 0],
    transition: { duration: DURATION.hero, ease: EASE_OUT, times: [0, 0.35, 0.6, 0.8, 1], delay },
  }),
};
/** Style à poser sur l'élément : pivot sur l'œillet. */
export const swingOrigin = { transformOrigin: "50% -18px" } as const;

/* ───────────── 2. Coudre — le fil se coud sur la ligne pointillée ───────────── */
/** Props pour un `motion.path` de masque (`pathLength` 0 → 1). */
export const stitchDraw = (delay = 0, duration = 1.4) => ({
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration, ease: EASE_OUT, delay },
});

/* ───────────── 3. Compter à la craie — les montants se comptent ───────────── */
export interface TallyOptions {
  /** Durée en secondes (1,4 s par défaut). */
  readonly duration?: number;
  /** Décimales affichées : limite les rendus aux valeurs distinctes. */
  readonly decimals?: number;
  /** Valeur de départ au montage (0 par défaut). */
  readonly from?: number;
  readonly delay?: number;
}

/**
 * Nombre animé de `from` vers `value` avec la courbe de sortie ; saute directement à la valeur
 * si l'utilisateur préfère moins de mouvement. Ne re-rend que lorsque la valeur arrondie change.
 */
export function useTally(value: number, opts: TallyOptions = {}): number {
  const reduced = useReducedMotion();
  const { duration = 1.4, decimals = 0, from = 0, delay = 0 } = opts;
  const mv = useMotionValue(reduced ? value : from);
  const factor = 10 ** decimals;
  const round = (v: number) => Math.round(v * factor) / factor;
  const [display, setDisplay] = useState(() => round(reduced ? value : from));
  const displayRef = useRef(display);

  useMotionValueEvent(mv, "change", (v) => {
    const r = round(v);
    if (r !== displayRef.current) {
      displayRef.current = r;
      setDisplay(r);
    }
  });

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: EASE_OUT, delay });
    return () => controls.stop();
  }, [value, reduced, duration, delay, mv]);

  return display;
}

/* ───────────── 4. Plier — le panneau se déplie depuis la charnière basse ───────────── */
export const foldUp: Variants = {
  hidden: { rotateX: -78, y: 30, opacity: 0 },
  visible: {
    rotateX: 0,
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: EASE_FOLD, opacity: { duration: 0.42, ease: EASE_FOLD } },
  },
  exit: { rotateX: -40, y: 40, opacity: 0, transition: { duration: 0.32, ease: EASE_FOLD } },
};
/** À poser sur le parent du panneau. */
export const foldPerspective = { perspective: 900 } as const;
export const foldOrigin = { transformOrigin: "50% 100%" } as const;

/* ───────────── 5. Tamponner — VENDU tombe sur la carte ───────────── */
export const stampIn: Variants = {
  hidden: { scale: 2.4, rotate: -14, opacity: 0, filter: "blur(3px)" },
  visible: (delay = 0.25) => ({
    scale: [2.4, 0.94, 1],
    rotate: [-14, -8, -8],
    opacity: [0, 1, 1],
    filter: ["blur(3px)", "blur(0px)", "blur(0px)"],
    transition: { duration: 0.55, ease: EASE_FOLD, times: [0, 0.55, 1], delay },
  }),
};

/* ───────────── 6. Dérouler — le mètre glisse à l'ouverture ───────────── */
export const tapeIn = {
  initial: { x: 40 },
  animate: { x: 0 },
  transition: { duration: 1.6, ease: EASE_OUT },
} as const;

/* ───────────── Entrée en cascade (écrans) ───────────── */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, ease: EASE_OUT, delay },
  }),
  exit: { opacity: 0, y: 6, transition: { duration: DURATION.state, ease: EASE_FOLD } },
};

/** Décalages de la charte (s) : d1…d7. */
export const STAGGER = [0.05, 0.14, 0.23, 0.32, 0.41, 0.5, 0.62] as const;
/** Délai de la n-ième entrée (0-based), extrapolé au-delà de d7. */
export const stagger = (index: number, step = 0.09): number =>
  STAGGER[index] ?? (STAGGER[STAGGER.length - 1] ?? 0) + (index - STAGGER.length + 1) * step;

/** Parent qui orchestre ses enfants `riseIn` en cascade. */
export const riseParent = (staggerChildren = 0.09, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/* ───────────── Pression ───────────── */
export const pressTap = { scale: 0.96, y: 1 } as const;
export const chipTap = { scale: 0.92 } as const;

/** Préférences de mouvement, stables pour tout un arbre. */
export function useMotionPrefs(): {
  reduced: boolean;
  variantsOrNone: (v: Variants) => Variants | undefined;
} {
  const reduced = useReducedMotion() ?? false;
  return useMemo(
    () => ({ reduced, variantsOrNone: (v: Variants) => (reduced ? undefined : v) }),
    [reduced],
  );
}
