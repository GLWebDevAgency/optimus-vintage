"use client";
import { type HTMLMotionProps, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import { pressTap } from "../motion.js";
import { Spinner } from "./Button.js";

export interface BigButtonProps
  extends Omit<HTMLMotionProps<"button">, "className" | "children" | "ref"> {
  readonly children: ReactNode;
  readonly loading?: boolean;
  readonly leading?: ReactNode;
  readonly className?: string;
  /** Variante secondaire (contour), pour la paire « Mettre en ligne · Vendre ». */
  readonly variant?: "primary" | "secondary";
}

/** Le grand bouton d'action, cousu d'un fil rouge en bas. */
export function BigButton({
  children,
  loading,
  leading,
  className,
  variant = "primary",
  disabled,
  type = "button",
  ...rest
}: BigButtonProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type={type}
      whileTap={reduced ? undefined : pressTap}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative w-full overflow-hidden rounded-[16px] px-4 py-4 min-h-[56px] text-center font-ui text-[15px] font-bold select-none focus-thread disabled:opacity-50",
        variant === "primary"
          ? "bg-btn text-btn-ink"
          : "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--line-2)]",
        "after:pointer-events-none after:absolute after:left-[14px] after:right-[14px] after:bottom-2 after:border-t-2 after:border-dashed after:border-thread after:opacity-90",
        className,
      )}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? <Spinner className="[animation-duration:1.2s]" /> : leading}
        {children}
      </span>
    </motion.button>
  );
}
