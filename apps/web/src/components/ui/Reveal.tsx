"use client";

import { motion, useAnimationControls, useInView, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Entrée au défilement (montée + fondu, courbe de sortie Selvedge).
 * Visible au repos : le HTML serveur ne porte jamais `opacity: 0` ; l'état caché n'est posé
 * qu'après montage, et seulement si l'utilisateur n'a pas demandé moins de mouvement.
 */
export function Reveal({ children, className, delay = 0, y = 18, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    if (reduce) return;
    controls.set({ opacity: 0, y });
    setArmed(true);
  }, [controls, reduce, y]);

  useEffect(() => {
    if (!armed || !inView) return;
    void controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1], delay },
    });
  }, [armed, inView, controls, delay]);

  const Tag = motion[as];
  return (
    <Tag ref={ref} initial={false} animate={controls} className={className}>
      {children}
    </Tag>
  );
}
