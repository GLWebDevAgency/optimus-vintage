"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn.js";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  readonly selected?: boolean;
  readonly leading?: ReactNode;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

/** Pastille sélectionnable ; `aria-pressed` reflète l'état. */
export function Chip({
  selected = false,
  leading,
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border-[1.5px] font-ui font-semibold whitespace-nowrap select-none",
        "transition-[transform,background-color,border-color,color] duration-micro ease-snap active:scale-[.92] focus-thread",
        size === "md" ? "min-h-[36px] px-3 text-[12.5px]" : "min-h-[30px] px-2.5 text-[11.5px]",
        selected
          ? "bg-ink text-bg border-ink"
          : "bg-transparent text-ink border-line-2 hover:border-ink",
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
    </button>
  );
}

export interface ChipOption<V extends string> {
  readonly value: V;
  readonly label: ReactNode;
  readonly leading?: ReactNode;
  readonly disabled?: boolean;
}

export type ChipGroupProps<V extends string> = {
  readonly options: readonly ChipOption<V>[];
  readonly "aria-label"?: string;
  readonly className?: string;
  readonly size?: "sm" | "md";
  /** Autorise le défilement horizontal sur une ligne (mobile). */
  readonly scroll?: boolean;
} & (
  | {
      readonly mode?: "single";
      readonly value: V | null;
      readonly onChange: (value: V | null) => void;
      readonly allowEmpty?: boolean;
    }
  | {
      readonly mode: "multi";
      readonly value: readonly V[];
      readonly onChange: (value: V[]) => void;
    }
);

/** Groupe de pastilles, sélection simple ou multiple. */
export function ChipGroup<V extends string>(props: ChipGroupProps<V>) {
  const { options, className, size, scroll } = props;
  const isSelected = (v: V) =>
    props.mode === "multi" ? props.value.includes(v) : props.value === v;
  const toggle = (v: V) => {
    if (props.mode === "multi") {
      props.onChange(
        props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v],
      );
    } else if (props.value === v) {
      if (props.allowEmpty !== false) props.onChange(null);
    } else props.onChange(v);
  };
  return (
    <fieldset
      aria-label={props["aria-label"]}
      className={cn(
        "m-0 flex min-w-0 gap-2 border-0 p-0",
        scroll ? "overflow-x-auto no-scrollbar -mx-5 px-5 py-1" : "flex-wrap",
        className,
      )}
    >
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={isSelected(o.value)}
          disabled={o.disabled}
          leading={o.leading}
          size={size}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </Chip>
      ))}
    </fieldset>
  );
}
