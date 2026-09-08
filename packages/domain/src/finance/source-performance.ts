import { Money } from "../money/money.js";
import type { PurchaseSource } from "../sourcing/purchase-source.js";
import type { Item } from "../inventory/item.js";
import type { Sale } from "../sales/sale.js";
import type { TargetMargin } from "../identity/workspace.js";

export interface SourcePerformance {
  readonly invested: Money;
  readonly recovered: Money;
  readonly remainingToRecover: Money;
  readonly profit: Money;
  readonly roi: number | undefined;
  readonly recoveryRate: number;
  readonly isAmortized: boolean;
  readonly soldCount: number;
  readonly sellableCount: number;
  readonly writtenOffCount: number;
  readonly stockValueAtCost: Money;
  /** Prix minimum par pièce restante pour rembourser la source. */
  readonly floorPriceBreakEven: Money | undefined;
  /** Prix minimum par pièce restante pour atteindre la marge cible. */
  readonly floorPriceTarget: Money | undefined;
}

/**
 * Service de domaine : performance d'une source (lot, palette, picking, achat unitaire).
 * Les ventes annulées / remboursées ne comptent pas ; les pièces perdues ne sont pas "restantes".
 */
export function computeSourcePerformance(
  source: PurchaseSource,
  items: readonly Item[],
  sales: readonly Sale[],
  targetMargin: TargetMargin = { kind: "PERCENT", value: 0 },
): SourcePerformance {
  const c = source.currency;
  const invested = source.totalInvestment;
  const valid = sales.filter((s) => s.sourceId === source.id && s.countsAsRevenue);
  const recovered = valid.reduce((acc, s) => acc.add(s.economics.net), Money.zero(c));
  const profit = recovered.subtract(invested);
  const remainingToRecover = profit.isNegative ? profit.abs() : Money.zero(c);
  const sellable = items.filter((i) => i.sourceId === source.id && i.isSellable);
  const soldCount = valid.length;
  const writtenOffCount = items.filter((i) => i.sourceId === source.id && (i.status === "LOST" || i.status === "DONATED")).length;
  const stockValueAtCost = sellable.reduce((acc, i) => acc.add(i.acquisitionCost), Money.zero(c));

  // Pièces restantes : pièces vendables connues, sinon (lot pas encore détaillé) quantité effective − vendues.
  const knownRemaining = sellable.length;
  const theoreticalRemaining = Math.max(0, (source.effectiveQuantity ?? 0) - soldCount - writtenOffCount);
  const remaining = items.some((i) => i.sourceId === source.id) ? knownRemaining : theoreticalRemaining;

  let floorPriceBreakEven: Money | undefined;
  let floorPriceTarget: Money | undefined;
  if (remaining > 0) {
    floorPriceBreakEven = remainingToRecover.divide(remaining);
    const targetProfit = targetMargin.kind === "PERCENT" ? invested.percent(targetMargin.value) : Money.ofMinor(targetMargin.value * remaining, c);
    const targetGap = invested.add(targetProfit).subtract(recovered);
    floorPriceTarget = (targetGap.isNegative ? Money.zero(c) : targetGap).divide(remaining);
  }

  return {
    invested, recovered, remainingToRecover, profit,
    roi: profit.ratioTo(invested),
    recoveryRate: invested.isZero ? 1 : recovered.minor / invested.minor,
    isAmortized: !profit.isNegative,
    soldCount, sellableCount: remaining, writtenOffCount, stockValueAtCost,
    floorPriceBreakEven, floorPriceTarget,
  };
}
