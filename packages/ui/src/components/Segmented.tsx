"use client";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, useId } from "react";
import { cn } from "../cn.js";

export interface SegmentedOption<V extends string> {
  readonly value: V;
  readonly label: ReactNode;
  readonly disabled?: boolean;
}
export interface SegmentedProps<V extends string> {
  readonly options: readonly SegmentedOption<V>[];
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly "aria-label"?: string;
  readonly className?: string;
  readonly size?: "sm" | "md";
}

/** Sélecteur segmenté (« Toutes · Lots · Palettes · Chine ») : radiogroup avec flèches. */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
  ...rest
}: SegmentedProps<V>) {
  const id = useId();
  const reduced = useReducedMotion();
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = options.filter((o) => !o.disabled);
    const i = enabled.findIndex((o) => o.value === value);
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta || i === -1) return;
    e.preventDefault();
    const next = enabled[(i + delta + enabled.length) % enabled.length];
    if (next) {
      onChange(next.value);
      (
        e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null
      )?.focus();
    }
  };
  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-label={rest["aria-label"]}
        onKeyDown={onKeyDown}
        className={cn("flex rounded-field border border-line bg-surface p-[3px]", className)}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            // biome-ignore lint/a11y/useSemanticElements: contrôle segmenté stylé ; la sémantique radio passe par ARIA et le clavier
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              data-value={o.value}
              tabIndex={on ? 0 : -1}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative flex-1 rounded-[9px] font-ui font-semibold transition-colors duration-state focus-thread disabled:opacity-40",
                size === "md"
                  ? "min-h-[38px] px-2 text-[12.5px]"
                  : "min-h-[32px] px-2 text-[11.5px]",
                on ? "text-bg" : "text-ink-3 hover:text-ink",
              )}
            >
              {on ? (
                <motion.span
                  layoutId={`${id}-indicator`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[9px] bg-ink"
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }
                  }
                />
              ) : null}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
