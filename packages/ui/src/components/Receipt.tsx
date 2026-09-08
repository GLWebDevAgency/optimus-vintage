import { formatMoney, formatPercent } from "@chine/i18n";
import type { ReactNode } from "react";
import { cn } from "../cn";
import type { MoneyLike, Tone } from "../types";

export interface ReceiptRow {
  /** Clé stable (sinon dérivée du libellé et de la valeur). */
  readonly key?: string;
  readonly label: ReactNode;
  /** Montant, ratio (`{ ratio }` → pourcentage signé) ou texte déjà formaté. */
  readonly value: MoneyLike | { readonly ratio: number | undefined } | string;
  readonly tone?: Tone;
  /** Ligne de total (trait plein, gras). */
  readonly total?: boolean;
  /** Signe explicite pour les montants (« +49,65 » / « −4,95 »). */
  readonly signed?: boolean;
}

export interface ReceiptProps {
  readonly rows: readonly ReceiptRow[];
  readonly locale?: string;
  /** Sans cadre ni fond (dans une carte). */
  readonly bare?: boolean;
  readonly className?: string;
  readonly size?: "sm" | "md";
}

const toneClass: Record<Tone, string> = {
  neutral: "text-ink",
  pos: "text-brass",
  neg: "text-thread",
  muted: "text-ink-3",
};

const autoTone = (row: ReceiptRow): Tone => {
  if (row.tone) return row.tone;
  if (typeof row.value === "string") return "neutral";
  if ("ratio" in row.value)
    return row.value.ratio === undefined
      ? "muted"
      : row.value.ratio > 0
        ? "pos"
        : row.value.ratio < 0
          ? "neg"
          : "neutral";
  if (row.total) return row.value.minor > 0 ? "pos" : row.value.minor < 0 ? "neg" : "neutral";
  return row.value.minor < 0 ? "neg" : "neutral";
};

/** Reçu mono : lignes alignées, coûts en fil rouge, marge en laiton, total souligné. */
export function Receipt({ rows, locale = "fr", bare, className, size = "md" }: ReceiptProps) {
  return (
    <dl
      className={cn(
        "grid gap-[5px] font-mono tabular",
        size === "md" ? "text-[12.5px]" : "text-[12px]",
        !bare && "rounded-field border border-dashed border-line-2 bg-bg px-3.5 py-3",
        className,
      )}
    >
      {rows.map((row) => {
        const tone = autoTone(row);
        const text =
          typeof row.value === "string"
            ? row.value
            : "ratio" in row.value
              ? row.value.ratio === undefined
                ? "—"
                : formatPercent(row.value.ratio, locale, { signed: true })
              : formatMoney(row.value, locale, {
                  symbol: false,
                  signDisplay: row.signed ? "exceptZero" : "auto",
                }).replace("-", "−");
        return (
          <div
            key={row.key ?? `${String(row.label)}:${text}`}
            className={cn(
              "flex justify-between gap-3",
              row.total && "mt-1 border-t-[1.5px] border-ink pt-1.5 font-semibold",
            )}
          >
            <dt className={row.total ? "text-ink" : "text-ink-2"}>{row.label}</dt>
            <dd className={cn("m-0 text-right", toneClass[tone])}>{text}</dd>
          </div>
        );
      })}
    </dl>
  );
}
