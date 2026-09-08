"use client";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId } from "react";
import { cn } from "../cn.js";
import { snapTransition } from "../motion.js";

export interface SnapToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly "aria-label"?: string;
  readonly className?: string;
  readonly name?: string;
}

/** Interrupteur « snap » : le bouton-pression claque en place (`role="switch"`). */
export function SnapToggle({ checked, onChange, label, description, disabled, className, name, ...rest }: SnapToggleProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const control = (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-label={label ? undefined : rest["aria-label"]}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" && !checked) onChange(true);
        if (e.key === "ArrowLeft" && checked) onChange(false);
      }}
      className={cn(
        "relative h-9 w-16 shrink-0 rounded-pill border-0 p-0 transition-colors duration-state focus-thread disabled:opacity-50",
        "before:absolute before:-inset-1 before:content-['']",
        checked ? "bg-ink" : "bg-line-2",
      )}
    >
      <motion.span
        aria-hidden="true"
        className="absolute left-1 top-1 block h-7 w-7 rounded-full bg-surface"
        initial={false}
        animate={{
          x: checked ? 28 : 0,
          boxShadow: checked
            ? "0 2px 6px rgba(0,0,0,.3), inset 0 0 0 3px var(--surface), inset 0 0 0 4.5px var(--thread)"
            : "0 2px 6px rgba(0,0,0,.25), inset 0 0 0 3px var(--surface), inset 0 0 0 4.5px var(--line-2)",
        }}
        transition={reduced ? { duration: 0 } : snapTransition}
      />
    </button>
  );
  if (!label) return <span className={cn("inline-flex", className)}>{control}</span>;
  return (
    <div className={cn("flex min-h-[44px] items-center justify-between gap-4", className)}>
      <span className="grid gap-0.5">
        <label id={`${id}-label`} htmlFor={id} className="font-ui text-[15px] font-medium text-ink">
          {label}
        </label>
        {description ? (
          <span id={`${id}-desc`} className="text-[12.5px] text-ink-2">
            {description}
          </span>
        ) : null}
      </span>
      {control}
    </div>
  );
}
