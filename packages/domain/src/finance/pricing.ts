import { Money } from "../money/money.js";
import type { Platform, PlatformFeePolicy } from "../listing/platforms.js";

export interface PriceSimulation {
  readonly platform: Platform;
  readonly price: Money;
  readonly fees: Money;
  readonly net: Money;
  readonly margin: Money;
  readonly roi: number | undefined;
}

/** Simule ce qu'un prix affiché rapporte sur une plateforme donnée. */
export function simulatePrice(
  platform: Platform, price: Money, acquisitionCost: Money, feePolicy: PlatformFeePolicy,
  extraCosts: Money = Money.zero(price.currency),
): PriceSimulation {
  const fees = feePolicy.feesFor(platform, price);
  const net = price.subtract(fees).subtract(extraCosts);
  const margin = net.subtract(acquisitionCost);
  return { platform, price, fees, net, margin, roi: margin.ratioTo(acquisitionCost) };
}

/**
 * Prix affiché minimal pour atteindre une marge nette voulue, frais compris.
 * Résolution par itération sur la grille (les grilles ont des minimums/fixes, pas de forme fermée).
 */
export function priceForTargetMargin(
  platform: Platform, acquisitionCost: Money, targetMargin: Money, feePolicy: PlatformFeePolicy,
  extraCosts: Money = Money.zero(acquisitionCost.currency),
): Money {
  const c = acquisitionCost.currency;
  const wanted = acquisitionCost.add(targetMargin).add(extraCosts);
  let price = wanted;
  for (let i = 0; i < 12; i++) {
    const fees = feePolicy.feesFor(platform, price);
    const next = wanted.add(fees);
    if (next.minor <= price.minor) return price;
    price = next;
  }
  return price;
}
