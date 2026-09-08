import { describe, expect, it } from "vitest";
import {
  Item, Money, PurchaseSource, Sale, ScheduleFeePolicy, allocateCosts, computePeriodReport, computeSourcePerformance,
  asItemId, asSaleId, asSourceId, asWorkspaceId, unwrap, relativeChange,
} from "../src/index.js";

const now = new Date("2026-09-07T10:00:00Z");
const eur = (n: number) => Money.of(n, "EUR");
const policy = new ScheduleFeePolicy();
const ws = asWorkspaceId("w1");

const pallet = () => unwrap(PurchaseSource.create({
  id: asSourceId("pal"), workspaceId: ws, kind: "PALLET", name: "Palette Eureka", supplierName: "Eureka", supplierKind: "WHOLESALER",
  purchasedAt: "2026-08-20", goodsCost: eur(220), extraCosts: eur(20), announcedQuantity: 48, weightKg: 12, now,
}));

const item = (id: string, cost: number, sourceId = "pal") => unwrap(Item.create({
  id: asItemId(id), workspaceId: ws, sourceId: asSourceId(sourceId), sku: `CH-${id.padStart(4, "0")}`, title: `Pièce ${id}`,
  category: "OTHER", condition: "GOOD", acquisitionCost: eur(cost), now,
}));

const sale = (id: string, itemId: string, gross: number, soldAt: `${number}-${number}-${number}`, platform: "VINTED" | "EBAY" = "VINTED") =>
  unwrap(Sale.record({ id: asSaleId(id), workspaceId: ws, itemId: asItemId(itemId), sourceId: asSourceId("pal"), platform,
    grossPrice: eur(gross), acquisitionCost: eur(5), soldAt, shippingCost: eur(4.95), now }, policy));

describe("PurchaseSource", () => {
  it("exige une quantité pour un lot et fixe 1 pour un achat unitaire", () => {
    expect(PurchaseSource.create({ id: asSourceId("l"), workspaceId: ws, kind: "LOT", name: "Ballot", supplierKind: "ONLINE_B2B", purchasedAt: "2026-09-01", goodsCost: eur(180), extraCosts: eur(0), now }).ok).toBe(false);
    const unit = unwrap(PurchaseSource.create({ id: asSourceId("u"), workspaceId: ws, kind: "UNIT", name: "Vide-grenier", supplierKind: "FLEA_MARKET", purchasedAt: "2026-08-31", goodsCost: eur(20), extraCosts: eur(0), now }));
    expect(unit.announcedQuantity).toBe(1);
    expect(unit.receive(1, now).ok).toBe(false);
  });
  it("réceptionne et calcule le taux de casse", () => {
    const p = pallet();
    expect(p.receive(44, now).ok).toBe(true);
    expect(p.shrinkageRate).toBeCloseTo(4 / 48, 5);
    expect(p.averageUnitCost?.minor).toBe(Math.round(24000 / 44));
    expect(p.pullEvents()[0]?.type).toBe("SourceReceived");
  });
  it("alloue l'investissement sans perdre un centime", () => {
    const parts = allocateCosts(eur(240), "EVEN", 48);
    expect(parts.length).toBe(48);
    expect(parts.reduce((s, m) => s + m.minor, 0)).toBe(24000);
  });
});

describe("Sale", () => {
  it("calcule net, marge et ROI avec les frais de la plateforme", () => {
    const s = sale("s1", "1", 75, "2026-09-06", "EBAY");
    const e = s.economics;
    expect(e.fees.minor).toBe(Math.round(7500 * 0.129) + 30);
    expect(e.net.minor).toBe(7500 - e.fees.minor - 495);
    expect(e.margin.minor).toBe(e.net.minor - 500);
    expect(s.pullEvents().map((x) => x.type)).toEqual(["ItemSold"]);
  });
  it("gère annulation et remboursement", () => {
    const s = sale("s2", "1", 30, "2026-09-06");
    expect(s.refund(now).ok).toBe(true);
    expect(s.countsAsRevenue).toBe(false);
    expect(s.refund(now).ok).toBe(false);
    expect(s.cancel(now).ok).toBe(false);
  });
});

describe("Performance d'une source et prix plancher", () => {
  it("palette 240 €, 48 pièces : après 31 ventes à 8,66 net, il reste à récupérer et un floor price", () => {
    const p = pallet();
    const items = Array.from({ length: 48 }, (_, i) => item(String(i + 1), 5));
    const sales = Array.from({ length: 31 }, (_, i) => sale(`s${i}`, String(i + 1), 8.66, "2026-09-01"));
    for (let i = 0; i < 31; i++) unwrap(items[i]?.markSold(now) ?? { ok: false, error: new Error("no") });
    const perf = computeSourcePerformance(p, items, sales, { kind: "PERCENT", value: 30 });
    expect(perf.soldCount).toBe(31);
    expect(perf.sellableCount).toBe(17);
    expect(perf.recovered.minor).toBe(31 * (866 - 495));
    expect(perf.isAmortized).toBe(false);
    expect(perf.floorPriceBreakEven?.minor).toBe(Math.round(perf.remainingToRecover.minor / 17));
    expect(perf.floorPriceTarget?.minor).toBeGreaterThan(perf.floorPriceBreakEven?.minor ?? 0);
  });
  it("source amortie : floor price à zéro et ROI positif", () => {
    const unit = unwrap(PurchaseSource.create({ id: asSourceId("pal"), workspaceId: ws, kind: "UNIT", name: "VG", supplierKind: "FLEA_MARKET", purchasedAt: "2026-08-31", goodsCost: eur(20), extraCosts: eur(0), now }));
    const it1 = item("1", 20);
    const s = unwrap(Sale.record({ id: asSaleId("x"), workspaceId: ws, itemId: asItemId("1"), sourceId: asSourceId("pal"), platform: "VINTED", grossPrice: eur(75), acquisitionCost: eur(20), soldAt: "2026-09-06", shippingCost: eur(4.95), packagingCost: eur(0.4), now }, policy));
    unwrap(it1.markSold(now));
    const perf = computeSourcePerformance(unit, [it1], [s]);
    expect(perf.isAmortized).toBe(true);
    expect(perf.profit.minor).toBe(6965 - 2000);
    expect(perf.roi).toBeCloseTo(2.4825, 3);
    expect(perf.sellableCount).toBe(0);
    expect(perf.floorPriceBreakEven).toBeUndefined();
  });
});

describe("Rapport de période", () => {
  it("agrège par plateforme et par jour, ignore les remboursées", () => {
    const sales = [sale("a", "1", 75, "2026-09-01"), sale("b", "2", 40, "2026-09-02", "EBAY"), sale("c", "3", 30, "2026-08-30")];
    unwrap(sales[1]?.refund(now) ?? { ok: false, error: new Error("no") });
    const r = computePeriodReport(sales, "2026-09-01", "2026-09-30", "EUR");
    expect(r.salesCount).toBe(1);
    expect(r.refundedCount).toBe(1);
    expect(r.net.minor).toBe(7500 - 495);
    expect(r.byPlatform[0]?.platform).toBe("VINTED");
    expect(r.byDay[0]?.day).toBe("2026-09-01");
    expect(relativeChange(eur(118), eur(100))).toBeCloseTo(0.18, 5);
    expect(relativeChange(eur(10), eur(0))).toBeUndefined();
  });
});
