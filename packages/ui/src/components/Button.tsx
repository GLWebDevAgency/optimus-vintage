"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn.js";
import type { LinkComponent } from "../types.js";

export type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Affiche un fil qui tourne et désactive le bouton. */
  readonly loading?: boolean;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
  readonly fullWidth?: boolean;
  /** Rend un lien (avec `Link` injecté ou `a`). */
  readonly href?: string;
  readonly Link?: LinkComponent;
  readonly className?: string;
}

const base =
  "relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-field font-ui font-semibold " +
  "transition-[transform,box-shadow,background-color,color] duration-micro ease-out-expo " +
  "active:scale-[.96] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none focus-thread";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-btn text-btn-ink shadow-[0_8px_20px_-12px_rgba(0,0,0,.6)]",
  ghost: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--line-2)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]",
  danger: "bg-thread text-white",
  subtle: "bg-surface text-ink border border-line",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 text-[12.5px]",
  md: "min-h-[44px] px-[18px] text-[14px]",
  lg: "min-h-[52px] px-6 text-[15px] rounded-[14px]",
};

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin-slow", className)} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" strokeDasharray="6 5" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leading,
  trailing,
  fullWidth,
  href,
  Link,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", loading && "cursor-progress", className);
  const content = (
    <>
      {loading ? <Spinner className="[animation-duration:1.2s]" /> : leading}
      <span className={cn(loading && "opacity-80")}>{children}</span>
      {!loading && trailing}
    </>
  );
  if (href) {
    const L = Link ?? "a";
    return (
      <L href={href} className={classes}>
        {content}
      </L>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
