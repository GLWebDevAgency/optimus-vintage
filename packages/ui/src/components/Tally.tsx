"use client";
import { formatMoneyParts, formatNumber } from "@chine/i18n";
import { cn } from "../cn.js";
import { useTally } from "../motion.js";
import type { MoneyLike } from "../types.js";

export interface TallyProps {
  /** Nombre ou montant. */
  readonly value: number | MoneyLike;
  readonly locale?: string;
  /** Décimales (déduites de la devise pour un montant). */
  readonly decimals?: number;
  readonly duration?: number;
  readonly delay?: number;
  /** Signe explicite (« +49,65 »). */
  readonly signed?: boolean;
  /** Sans décimales si rond. */
  readonly compact?: boolean;
  readonly size?: "tag" | "card" | "hero" | "inline";
  readonly tone?: "ink" | "brass" | "thread";
  readonly className?: string;
  /** Rend la devise / le suffixe en petit. */
  readonly suffix?: string;
}

const sizes = {
  inline: "text-[inherit]",
  tag: "text-[30px]",
  card: "text-[36px]",
  hero: "text-[54px] tracking-[-.02em]",
} as const;
const smalls = {
  inline: "text-[.6em]",
  tag: "text-[12px]",
  card: "text-[13px]",
  hero: "text-[16px]",
} as const;

/** Montant compté « à la craie » : accélère puis freine, jamais de saut sec. */
export function Tally({
  value,
  locale = "fr",
  decimals,
  duration = 1.4,
  delay = 0,
  signed,
  compact,
  size = "hero",
  tone = "ink",
  className,
  suffix,
}: TallyProps) {
  const isMoney = typeof value === "object";
  const currency = isMoney ? value.currency : undefined;
  const digits = decimals ?? (isMoney ? (currency === "JPY" ? 0 : 2) : 0);
  const target = isMoney ? value.minor / 10 ** digits : value;
  const current = useTally(target, { duration, decimals: digits, delay });
  const parts = isMoney
    ? formatMoneyParts(
        { minor: Math.round(current * 10 ** digits), currency: currency ?? "EUR" },
        locale,
        {
          compact: compact ?? false,
          signDisplay: signed ? "exceptZero" : "auto",
        },
      )
    : null;
  const text = parts
    ? `${parts.sign}${parts.integer}${parts.fraction}`
    : formatNumber(current, locale, { digits, signed: signed ?? false });
  const final = isMoney
    ? formatMoneyParts(value, locale, {
        compact: compact ?? false,
        signDisplay: signed ? "exceptZero" : "auto",
      }).text
    : formatNumber(target, locale, { digits, signed: signed ?? false });
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[.1em] font-display italic leading-none tabular",
        sizes[size],
        tone === "brass" ? "text-brass" : tone === "thread" ? "text-thread" : "text-ink",
        className,
      )}
    >
      <span className="sr-only">{final}</span>
      <span aria-hidden="true">{text}</span>
      {parts || suffix ? (
        <small
          aria-hidden="true"
          className={cn("font-ui not-italic font-semibold text-ink-2", smalls[size])}
        >
          {suffix ?? parts?.symbol}
        </small>
      ) : null}
    </span>
  );
}
