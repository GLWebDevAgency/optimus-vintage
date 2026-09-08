import { Item, Lot, Sale } from "../../db/repositories";

// Helper to convert string/number to number (PostgreSQL returns DECIMAL as string)
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

// Types for the engine inputs/outputs
// We use Partial or Pick because sometimes we just pass the numbers,
// but it's safer to rely on the schema types generally.
// For the engine, let's be flexible but type-safe.

export interface LotSummary {
  lotId: number;
  totalInvestment: number; // Coût Achat + Frais
  totalRevenue: number; // Somme(Prix Net Ventes)
  profit: number; // Revenue - Investment
  roiPercent: number; // (Profit / Investment) * 100
  delta: number; // Manque à gagner pour break-even (>= 0)

  initialQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;

  breakEvenPoint: number; // Nombre de pièces à vendre pour BEP (approx)
  isBreakEven: boolean;
}

export interface ProtectionAnalysis {
  lotId: number;
  remainingQuantity: number;
  delta: number;

  // Recommended floor prices
  floorPriceBreakEven: number; // Prix/pièce pour reach 0 profit exactly
  floorPriceMargin10: number; // Prix/pièce pour reach 10% profit global? Or 10€ profit? Let's say +10% margin on lot.
  floorPriceMsg: string; // Human readable advice
}

// --------------------------------------------------------------------------
// CORE ENGINE
// --------------------------------------------------------------------------

/**
 * Calculates the financial summary of a Lot based on its cost and sales.
 */
export function computeLotSummary(
  lot: Lot,
  items: Item[], // We might need this for precise unit costs if Piecewise ? For now simplified.
  sales: Sale[]
): LotSummary {
  const totalInvestment = toNumber(lot.totalCost) + toNumber(lot.additionalFees);

  const totalRevenue = sales.reduce((sum, s) => {
    // Only count valid sales
    if (s.status === "CANCELLED" || s.status === "REFUNDED") return sum;
    return sum + toNumber(s.priceNet);
  }, 0);

  const profit = totalRevenue - totalInvestment;
  // ROI: if investment is 0 (gift?), ROI is infinite. Guard against div0.
  const roiPercent = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  // Delta: How much MORE do we need to make to cover costs?
  const delta = Math.max(0, totalInvestment - totalRevenue);

  const initialQuantity = lot.initialQuantity;
  // Count items sold. NOTE: Sales array might not have 1-to-1 mapping if we support 'bulk sales'?
  // For MVP, 1 sale = 1 item sold.
  const validSalesCount = sales.filter(
    (s) => s.status !== "CANCELLED" && s.status !== "REFUNDED"
  ).length;

  const remainingQuantity = Math.max(0, initialQuantity - validSalesCount);

  return {
    lotId: lot.id,
    totalInvestment,
    totalRevenue,
    profit,
    roiPercent,
    delta,
    initialQuantity,
    soldQuantity: validSalesCount,
    remainingQuantity,
    breakEvenPoint: 0, // Todo: calculate how many items needed at avg price? Not strictly requested in spec.
    isBreakEven: profit >= 0,
  };
}

/**
 * Calculates the "Protection" (floor price) for remaining items logic.
 */
export function computeProtection(
  delta: number,
  remainingQuantity: number,
  targetMargin: number = 0 // Extra profit target in currency units
): ProtectionAnalysis {
  // If no remaining items or no delta (already profit), floor is effectively 0 (or cost?)
  // But logically, if we are in profit, "Protection" to BEP is 0.

  if (remainingQuantity <= 0) {
    return {
      lotId: 0,
      remainingQuantity: 0,
      delta,
      floorPriceBreakEven: 0,
      floorPriceMargin10: 0,
      floorPriceMsg: "Stock épuisé.",
    };
  }

  const floorPriceBreakEven = delta / remainingQuantity;

  // Example logic: Target Margin is a flat amount we want ON TOP of break even.
  // e.g. I want to make at least 100€ profit total on this lot.
  // (Delta + Target) / Remaining
  const floorPriceMargin10 = (delta + targetMargin) / remainingQuantity;

  return {
    lotId: 0,
    remainingQuantity,
    delta,
    floorPriceBreakEven,
    floorPriceMargin10,
    floorPriceMsg:
      delta > 0
        ? `Vends les ${remainingQuantity} restants à ${floorPriceBreakEven.toFixed(
            2
          )}€/u min pour rembourser.`
        : `Lot rentabilisé ! Tout est du bonus.`,
  };
}
