import { unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  ChangeItemStatus,
  GetDashboard,
  GetItem,
  GetSale,
  GetSource,
  GetWorkspaceOverview,
  ListItems,
  ListSales,
  ListSources,
  RecordSale,
  SimulatePrice,
  UpdateItem,
} from "../src/index.js";
import { chine, createLot, eur, setup } from "./helpers.js";

/** Scénario de référence : Lacoste chiné 20 €, vendu 75 € sur Vinted, port 4,95 €, emballage 0,40 €. */
async function lacosteSold() {
  const s = await setup();
  const { item } = await chine(s, 20, { retailPrice: eur(250), targetPrice: eur(75) });
  const sale = unwrap(
    await new RecordSale(s.deps).execute({
      ...s.scope,
      itemId: item.id,
      platform: "VINTED",
      grossPrice: eur(75),
      shippingCost: eur(4.95),
      packagingCost: eur(0.4),
    }),
  ).sale;
  return { s, item, sale };
}

describe("GetDashboard", () => {
  it("chiffres du mois : net 69,65 €, marge 49,65 €, objectif, statuts, dernières ventes", async () => {
    const { s, sale } = await lacosteSold();
    const d = unwrap(await new GetDashboard(s.deps).execute({ ...s.scope, goalMinor: 10000 }));
    expect(d.period).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(d.current).toMatchObject({
      salesCount: 1,
      gross: { minor: 7500 },
      fees: { minor: 0 },
      costs: { minor: 535 },
      net: { minor: 6965 },
      margin: { minor: 4965 },
    });
    expect(d.current.byPlatform[0]).toMatchObject({ platform: "VINTED", count: 1 });
    expect(d.previous).toMatchObject({ from: "2026-08-01", to: "2026-08-31", salesCount: 0 });
    expect(d.change.net).toBeNull();
    expect(d.countsByStatus.SOLD).toBe(1);
    expect(d.sellableCount).toBe(0);
    expect(d.goal).toMatchObject({
      achieved: { minor: 4965 },
      remaining: { minor: 5035 },
      progress: 0.4965,
    });
    expect(d.lastSales.map((x) => x.id)).toEqual([sale.id]);
    expect(d.lastSales[0]?.item?.title).toBe("Survêtement Lacoste");
    expect(JSON.parse(JSON.stringify(d))).toEqual(d);
  });

  it("compte le stock dormant et la valeur immobilisée", async () => {
    const s = await setup();
    await chine(s, 20);
    s.deps.clock.advanceDays(31);
    await chine(s, 30);
    const d = unwrap(await new GetDashboard(s.deps).execute(s.scope));
    expect(d.sellableCount).toBe(2);
    expect(d.dormantCount).toBe(1);
    expect(d.stockValueAtCost.minor).toBe(5000);
    expect(d.change).toEqual({ gross: 0, net: 0, margin: 0, salesCount: 0 });
  });
});

describe("ListItems / GetItem", () => {
  it("filtre, trie et calcule les champs dérivés", async () => {
    const s = await setup();
    const old = await chine(s, 20);
    s.deps.clock.advanceDays(40);
    await chine(s, 30, { title: "Veste Carhartt" });
    const all = unwrap(await new ListItems(s.deps).execute({ ...s.scope, sort: "cost_desc" }));
    expect(all.total).toBe(2);
    expect(all.items.map((i) => i.acquisitionCost.minor)).toEqual([3000, 2000]);
    const dormant = unwrap(await new ListItems(s.deps).execute({ ...s.scope, dormantOnly: true }));
    expect(dormant.items.map((i) => i.id)).toEqual([old.item.id]);
    expect(dormant.items[0]).toMatchObject({ isDormant: true, ageDays: 40 });
    const search = unwrap(
      await new ListItems(s.deps).execute({ ...s.scope, search: "carhartt", limit: 1 }),
    );
    expect(search.items[0]?.title).toBe("Veste Carhartt");
  });

  it("GetItem renvoie source, annonces, ventes et simulations sur 4 plateformes", async () => {
    const s = await setup();
    const { item } = await chine(s, 20, { targetPrice: eur(75) });
    unwrap(
      await new ChangeItemStatus(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        action: "LIST",
        platform: "VINTED",
        price: eur(75),
      }),
    );
    const r = unwrap(await new GetItem(s.deps).execute({ ...s.scope, itemId: item.id }));
    expect(r.source?.kind).toBe("UNIT");
    expect(r.listings).toHaveLength(1);
    expect(r.sales).toHaveLength(0);
    expect(r.simulations.map((x) => x.platform)).toEqual([
      "VINTED",
      "VESTIAIRE",
      "LEBONCOIN",
      "EBAY",
    ]);
    expect(r.simulations[1]).toMatchObject({
      fees: { minor: 1500 },
      net: { minor: 6000 },
      margin: { minor: 4000 },
    });
    expect(r.simulations[3]?.fees.minor).toBe(998); // 12,9 % + 0,30 €
  });
});

describe("Sources / Sales / Overview / SimulatePrice", () => {
  it("ListSources et GetSource exposent la performance d'une source", async () => {
    const { s, item } = await lacosteSold();
    await createLot(s, { goods: 100, extra: 10, quantity: 10 });
    const list = unwrap(await new ListSources(s.deps).execute(s.scope));
    expect(list.sources).toHaveLength(2);
    const unit = list.sources.find((x) => x.id === item.sourceId);
    expect(unit?.performance).toMatchObject({
      invested: { minor: 2000 },
      recovered: { minor: 6965 },
      profit: { minor: 4965 },
      isAmortized: true,
      soldCount: 1,
    });
    const lot = unwrap(
      await new GetSource(s.deps).execute({
        ...s.scope,
        sourceId:
          list.sources[0]?.id === item.sourceId
            ? (list.sources[1]?.id as never)
            : (list.sources[0]?.id as never),
      }),
    );
    expect(lot.performance).toMatchObject({
      invested: { minor: 11000 },
      recovered: { minor: 0 },
      sellableCount: 10,
      floorPriceBreakEven: { minor: 1100 },
    });
    expect(lot.performance.floorPriceTarget?.minor).toBe(1430); // (110 + 30 %) / 10
  });

  it("ListSales enrichit avec la pièce ; GetSale renvoie vente + pièce + source", async () => {
    const { s, item, sale } = await lacosteSold();
    const list = unwrap(await new ListSales(s.deps).execute({ ...s.scope, platform: "VINTED" }));
    expect(list.sales[0]).toMatchObject({
      id: sale.id,
      item: { sku: "CH-0001" },
      economics: { margin: { minor: 4965 } },
    });
    const one = unwrap(await new GetSale(s.deps).execute({ ...s.scope, saleId: sale.id }));
    expect(one.item?.id).toBe(item.id);
    expect(one.source?.id).toBe(item.sourceId);
  });

  it("GetWorkspaceOverview expose plan, quotas consommés et fonctionnalités verrouillées", async () => {
    const s = await setup({ plan: "FREE" });
    await chine(s, 20);
    const o = unwrap(await new GetWorkspaceOverview(s.deps).execute(s.scope));
    expect(o.plan).toBe("FREE");
    expect(o.usage.items).toEqual({
      used: 1,
      limit: 60,
      remaining: 59,
      allowed: true,
      upgradeTo: null,
    });
    expect(o.usage.sourcesPerMonth.used).toBe(1);
    expect(o.limits.maxItems).toBe(60);
    expect(o.features).toEqual(["CSV_EXPORT"]);
    expect(o.lockedFeatures).toContainEqual({ feature: "AI_APPRAISAL", minimumPlan: "PREMIUM" });
    expect(o.feeSchedules.VESTIAIRE.percent).toBe(15);
    expect(JSON.parse(JSON.stringify(o))).toEqual(o);
  });

  it("SimulatePrice : net, marge, ROI et prix pour la marge cible", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    unwrap(await new UpdateItem(s.deps).execute({ ...s.scope, itemId: item.id, notes: "x" }));
    const r = unwrap(
      await new SimulatePrice(s.deps).execute({
        ...s.scope,
        platform: "VESTIAIRE",
        price: eur(100),
        itemId: item.id,
        extraCosts: eur(5),
      }),
    );
    expect(r).toMatchObject({
      fees: { minor: 1500 },
      net: { minor: 8000 },
      margin: { minor: 6000 },
      roi: 3,
      targetMargin: { minor: 600 },
    });
    expect(r.priceForTargetMargin.minor).toBe(2000 + 600 + 500 + 1500);
  });
});
