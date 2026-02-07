/**
 * 🧪 CALCULATIONS ENGINE TESTS
 *
 * Tests exhaustifs du moteur de calcul métier
 * - computeLotSummary: résumé financier d'un lot
 * - computeProtection: prix plancher pour rentabilité
 */

import {
  computeLotSummary,
  computeProtection,
  LotSummary,
  ProtectionAnalysis,
} from "../calculations";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 TEST DATA FACTORIES
// ═══════════════════════════════════════════════════════════════════════════════

function createLot(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Lot Test",
    provider: "Eureka",
    buyDate: "2025-01-15",
    type: "BULK" as const,
    totalCost: "150.00",
    additionalFees: "10.00",
    initialQuantity: 20,
    currency: "EUR",
    createdAt: new Date("2025-01-15T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
    ...overrides,
  };
}

function createItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    lotId: 1,
    brand: "Levi's",
    type: "Jeans",
    size: "32",
    color: "Blue",
    condition: "VERY_GOOD" as const,
    unitCost: "8.00",
    status: "AVAILABLE" as const,
    photos: '["photo1.jpg"]',
    notes: null,
    createdAt: new Date("2025-01-15T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
    ...overrides,
  };
}

function createSale(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    itemId: 1,
    lotId: 1,
    platform: "VINTED" as const,
    priceGross: "25.00",
    platformFees: "2.50",
    shippingFees: "5.00",
    miscFees: "0.00",
    priceNet: "17.50",
    saleDate: "2025-01-20",
    status: "COMPLETED" as const,
    buyerUsername: null,
    notes: null,
    createdAt: new Date("2025-01-20T10:00:00Z"),
    updatedAt: new Date("2025-01-20T10:00:00Z"),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧮 computeLotSummary
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeLotSummary", () => {
  it("calcule correctement l'investissement total (coût + frais)", () => {
    const lot = createLot({ totalCost: "150.00", additionalFees: "10.00" });
    const result = computeLotSummary(lot as any, [], []);

    expect(result.totalInvestment).toBe(160);
  });

  it("gère les frais additionnels nuls", () => {
    const lot = createLot({ totalCost: "200.00", additionalFees: "0.00" });
    const result = computeLotSummary(lot as any, [], []);

    expect(result.totalInvestment).toBe(200);
  });

  it("gère les valeurs numériques (non-string)", () => {
    const lot = createLot({ totalCost: 150, additionalFees: 10 });
    const result = computeLotSummary(lot as any, [], []);

    expect(result.totalInvestment).toBe(160);
  });

  it("gère les valeurs null/undefined", () => {
    const lot = createLot({ totalCost: null, additionalFees: undefined });
    const result = computeLotSummary(lot as any, [], []);

    expect(result.totalInvestment).toBe(0);
  });

  it("calcule le revenu des ventes COMPLETED uniquement", () => {
    const lot = createLot();
    const sales = [
      createSale({ id: 1, priceNet: "17.50", status: "COMPLETED" }),
      createSale({ id: 2, priceNet: "22.00", status: "COMPLETED" }),
      createSale({ id: 3, priceNet: "30.00", status: "CANCELLED" }),
      createSale({ id: 4, priceNet: "15.00", status: "REFUNDED" }),
    ];

    const result = computeLotSummary(lot as any, [], sales as any);

    // Seules les 2 premières ventes comptent: 17.50 + 22.00
    expect(result.totalRevenue).toBe(39.5);
  });

  it("calcule le profit (revenue - investment)", () => {
    const lot = createLot({ totalCost: "100.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "120.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.profit).toBe(20);
    expect(result.isBreakEven).toBe(true);
  });

  it("calcule une perte correctement", () => {
    const lot = createLot({ totalCost: "200.00", additionalFees: "50.00" });
    const sales = [createSale({ priceNet: "50.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.profit).toBe(-200); // 50 - 250
    expect(result.isBreakEven).toBe(false);
  });

  it("calcule le delta (manque à gagner pour break-even)", () => {
    const lot = createLot({ totalCost: "100.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "30.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    // Delta = max(0, 100 - 30) = 70
    expect(result.delta).toBe(70);
  });

  it("delta est 0 quand rentabilisé", () => {
    const lot = createLot({ totalCost: "100.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "150.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.delta).toBe(0);
    expect(result.isBreakEven).toBe(true);
  });

  it("calcule le ROI correctement", () => {
    const lot = createLot({ totalCost: "100.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "150.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    // ROI = (50 / 100) * 100 = 50%
    expect(result.roiPercent).toBe(50);
  });

  it("ROI est 0 quand investissement est 0 (lot gratuit)", () => {
    const lot = createLot({ totalCost: "0.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "100.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    // Guard against div by 0
    expect(result.roiPercent).toBe(0);
  });

  it("ROI négatif quand en perte", () => {
    const lot = createLot({ totalCost: "200.00", additionalFees: "0.00" });
    const sales = [createSale({ priceNet: "100.00", status: "COMPLETED" })];

    const result = computeLotSummary(lot as any, [], sales as any);

    // ROI = (-100 / 200) * 100 = -50%
    expect(result.roiPercent).toBe(-50);
  });

  it("calcule les quantités correctement", () => {
    const lot = createLot({ initialQuantity: 20 });
    const sales = [
      createSale({ id: 1, status: "COMPLETED" }),
      createSale({ id: 2, status: "COMPLETED" }),
      createSale({ id: 3, status: "CANCELLED" }),
    ];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.initialQuantity).toBe(20);
    expect(result.soldQuantity).toBe(2); // Seules les COMPLETED
    expect(result.remainingQuantity).toBe(18);
  });

  it("remainingQuantity ne descend jamais en-dessous de 0", () => {
    const lot = createLot({ initialQuantity: 1 });
    const sales = [
      createSale({ id: 1, status: "COMPLETED" }),
      createSale({ id: 2, status: "COMPLETED" }),
      createSale({ id: 3, status: "COMPLETED" }),
    ];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.remainingQuantity).toBe(0);
  });

  it("retourne le lotId correct", () => {
    const lot = createLot({ id: 42 });
    const result = computeLotSummary(lot as any, [], []);

    expect(result.lotId).toBe(42);
  });

  it("lot sans ventes: tout en négatif", () => {
    const lot = createLot({
      totalCost: "100.00",
      additionalFees: "0.00",
      initialQuantity: 10,
    });

    const result = computeLotSummary(lot as any, [], []);

    expect(result.totalRevenue).toBe(0);
    expect(result.profit).toBe(-100);
    expect(result.delta).toBe(100);
    expect(result.soldQuantity).toBe(0);
    expect(result.remainingQuantity).toBe(10);
    expect(result.isBreakEven).toBe(false);
  });

  it("scenario complet: lot avec multiples ventes mixtes", () => {
    const lot = createLot({
      id: 5,
      totalCost: "300.00",
      additionalFees: "20.00",
      initialQuantity: 15,
    });

    const sales = [
      createSale({ id: 1, priceNet: "50.00", status: "COMPLETED" }),
      createSale({ id: 2, priceNet: "75.00", status: "COMPLETED" }),
      createSale({ id: 3, priceNet: "40.00", status: "COMPLETED" }),
      createSale({ id: 4, priceNet: "60.00", status: "COMPLETED" }),
      createSale({ id: 5, priceNet: "100.00", status: "CANCELLED" }),
      createSale({ id: 6, priceNet: "30.00", status: "REFUNDED" }),
    ];

    const result = computeLotSummary(lot as any, [], sales as any);

    expect(result.lotId).toBe(5);
    expect(result.totalInvestment).toBe(320); // 300 + 20
    expect(result.totalRevenue).toBe(225); // 50 + 75 + 40 + 60
    expect(result.profit).toBe(-95); // 225 - 320
    expect(result.delta).toBe(95); // max(0, 320 - 225)
    expect(result.roiPercent).toBeCloseTo(-29.6875, 2);
    expect(result.soldQuantity).toBe(4);
    expect(result.remainingQuantity).toBe(11); // 15 - 4
    expect(result.isBreakEven).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ computeProtection
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeProtection", () => {
  it("calcule le prix plancher pour break-even", () => {
    // Delta = 100€ à récupérer, 10 articles restants → 10€/article
    const result = computeProtection(100, 10);

    expect(result.floorPriceBreakEven).toBe(10);
  });

  it("calcule le prix plancher avec marge cible", () => {
    // Delta 100€, 10 restants, marge cible 50€
    // (100 + 50) / 10 = 15€/article
    const result = computeProtection(100, 10, 50);

    expect(result.floorPriceMargin10).toBe(15);
  });

  it("retourne 0 quand stock épuisé", () => {
    const result = computeProtection(100, 0);

    expect(result.floorPriceBreakEven).toBe(0);
    expect(result.floorPriceMargin10).toBe(0);
    expect(result.remainingQuantity).toBe(0);
    expect(result.floorPriceMsg).toContain("épuisé");
  });

  it("message positif quand pas de delta", () => {
    // Delta 0 = déjà rentabilisé, des articles restent
    const result = computeProtection(0, 5);

    expect(result.floorPriceBreakEven).toBe(0);
    expect(result.delta).toBe(0);
    expect(result.floorPriceMsg).toContain("bonus");
  });

  it("message avec prix minimum quand delta > 0", () => {
    const result = computeProtection(100, 5);

    // 100 / 5 = 20€
    expect(result.floorPriceBreakEven).toBe(20);
    expect(result.floorPriceMsg).toContain("20.00");
    expect(result.floorPriceMsg).toContain("5");
    expect(result.floorPriceMsg).toContain("rembourser");
  });

  it("marge cible par défaut = 0", () => {
    const result = computeProtection(100, 10);

    // (100 + 0) / 10 = 10
    expect(result.floorPriceMargin10).toBe(10);
    expect(result.floorPriceBreakEven).toBe(10);
  });

  it("gère quantité négative comme épuisé", () => {
    const result = computeProtection(50, -3);

    expect(result.floorPriceBreakEven).toBe(0);
    expect(result.remainingQuantity).toBe(0);
  });

  it("gère les petits deltas avec précision", () => {
    // 1€ / 3 articles = 0.3333...
    const result = computeProtection(1, 3);

    expect(result.floorPriceBreakEven).toBeCloseTo(0.333, 2);
  });

  it("gère les grands montants", () => {
    const result = computeProtection(10000, 100, 2000);

    expect(result.floorPriceBreakEven).toBe(100);
    expect(result.floorPriceMargin10).toBe(120); // (10000 + 2000) / 100
  });
});
