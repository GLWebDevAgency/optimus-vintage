import { formatMoney } from "@chine/i18n";
import type { ReactNode } from "react";
import { cn } from "../cn.js";
import { AppIcon } from "../icons.js";
import type { LinkComponent, MoneyLike, Tone } from "../types.js";

export interface ListRowProps {
  /** Vignette : URL d'image ou nœud (icône). */
  readonly thumb?: string | ReactNode;
  readonly title: ReactNode;
  readonly sub?: ReactNode;
  /** Montant (formaté et coloré) ou texte libre à droite. */
  readonly amount?: MoneyLike | string;
  readonly tone?: Tone;
  readonly signed?: boolean;
  readonly locale?: string;
  /** Contenu à droite après le montant (pastille, chevron). */
  readonly trailing?: ReactNode;
  readonly href?: string;
  readonly Link?: LinkComponent;
  readonly onClick?: () => void;
  readonly chevron?: boolean;
  readonly className?: string;
}

const toneClass: Record<Tone, string> = { neutral: "text-ink", pos: "text-brass", neg: "text-thread", muted: "text-ink-3" };

/** Ligne de liste : vignette 38 px, titre, sous-titre mono, montant tabulaire. */
export function ListRow({ thumb, title, sub, amount, tone, signed = true, locale = "fr", trailing, href, Link, onClick, chevron, className }: ListRowProps) {
  const isMoney = typeof amount === "object";
  const autoTone: Tone = tone ?? (isMoney ? (amount.minor > 0 ? "pos" : amount.minor < 0 ? "neg" : "neutral") : "neutral");
  const amountText = isMoney ? formatMoney(amount, locale, { symbol: false, signDisplay: signed ? "exceptZero" : "auto" }).replace("-", "−") : amount;
  const interactive = Boolean(href || onClick);
  const inner = (
    <>
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-surface-2 text-ink-3">
        {typeof thumb === "string" ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : (thumb ?? <AppIcon name="shirt" size={18} />)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-ui text-[14px] font-semibold leading-tight text-ink">{title}</span>
        {sub ? <span className="mt-0.5 block truncate font-mono text-[11.5px] text-ink-3">{sub}</span> : null}
      </span>
      <span className="flex items-center gap-2">
        {amountText !== undefined ? <span className={cn("font-mono text-[14px] font-medium tabular", toneClass[autoTone])}>{amountText}</span> : null}
        {trailing}
        {chevron ? <AppIcon name="chevronRight" size={16} className="text-ink-3" /> : null}
      </span>
    </>
  );
  const classes = cn(
    "grid w-full grid-cols-[38px_1fr_auto] items-center gap-3 px-3.5 py-[11px] text-left min-h-[60px]",
    interactive && "transition-colors duration-micro hover:bg-surface-2 active:bg-surface-2 focus-thread",
    className,
  );
  if (href) {
    const L = Link ?? "a";
    return (
      <L href={href} className={classes}>
        {inner}
      </L>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {inner}
      </button>
    );
  }
  return <div className={classes}>{inner}</div>;
}

/** Conteneur de lignes : carte à bords ronds, séparateurs fins. */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid divide-y divide-line overflow-hidden rounded-card border border-line bg-surface", className)}>{children}</div>;
}
