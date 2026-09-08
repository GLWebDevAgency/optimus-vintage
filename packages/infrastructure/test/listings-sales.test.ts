import { Money } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  makeItem,
  makeListing,
  makeSale,
  makeSource,
  makeWorkspace,
  type TestDb,
  testDb,
} from "./helpers.js";

describe("DrizzleListingRepository", () => {
  let t: TestDb;
  const ws = makeWorkspace();
  const src = makeSource(ws.id);
  const item = makeItem(ws.id, src.id);
  beforeAll(async () => {
    t = await testDb();
    await t.repos.workspaces.save(ws);
    await t.repos.sources.save(src);
    await t.repos.items.save(item);
  });
  afterAll(() => t.close());

  it("aller-retour, fin d'annonce et liste par pièce", async () => {
    const l1 = makeListing(ws.id, item.id);
    await t.repos.listings.save(l1);
    expect((await t.repos.listings.byId(ws.id, l1.id))?.toProps()).toEqual(l1.toProps());

    l1.reprice(Money.of(42, "EUR"));
    l1.end("2026-09-08", "SOLD");
    await t.repos.listings.save(l1);
    const loaded = await t.repos.listings.byId(ws.id, l1.id);
    expect(loaded?.status).toBe("SOLD");
    expect(loaded?.price.minor).toBe(4200);
    expect(loaded?.toProps().endedAt).toBe("2026-09-08");

    const l2 = makeListing(ws.id, item.id);
    await t.repos.listings.save(l2);
    expect((await t.repos.listings.byItem(ws.id, item.id)).map((l) => l.id)).toEqual([
      l1.id,
      l2.id,
    ]);
    expect(await t.repos.listings.byId(makeWorkspace().id, l1.id)).toBeUndefined();
  });
});

describe("DrizzleSaleRepository", () => {
  let t: TestDb;
  const ws = makeWorkspace();
  const src = makeSource(ws.id);
  const item = makeItem(ws.id, src.id);
  beforeAll(async () => {
    t = await testDb();
    await t.repos.workspaces.save(ws);
    await t.repos.sources.save(src);
    await t.repos.items.save(item);
  });
  afterAll(() => t.close());

  it("aller-retour avec économie recalculée à l'identique", async () => {
    const sale = makeSale(ws.id, item.id, src.id);
    await t.repos.sales.save(sale);
    const loaded = await t.repos.sales.byId(ws.id, sale.id);
    expect(loaded?.toProps()).toEqual(sale.toProps());
    expect(loaded?.economics.net.minor).toBe(sale.economics.net.minor);
    expect(loaded?.platformFees.minor).toBe(1800); // 15 % de 120 € sur Vestiaire
  });

  it("persiste un remboursement", async () => {
    const sale = makeSale(ws.id, item.id, src.id);
    await t.repos.sales.save(sale);
    sale.refund(new Date("2026-09-12T12:00:00Z"));
    await t.repos.sales.save(sale);
    const loaded = await t.repos.sales.byId(ws.id, sale.id);
    expect(loaded?.status).toBe("REFUNDED");
    expect(loaded?.toProps().refundedAt?.toISOString()).toBe("2026-09-12T12:00:00.000Z");
  });

  it("liste par période, plateforme, pièce et source", async () => {
    const w = makeWorkspace();
    const s = makeSource(w.id);
    const i1 = makeItem(w.id, s.id);
    const i2 = makeItem(w.id, s.id);
    await t.repos.workspaces.save(w);
    await t.repos.sources.save(s);
    await t.repos.items.saveMany([i1, i2]);
    await t.repos.sales.save(
      makeSale(w.id, i1.id, s.id, {
        soldAt: "2026-08-20",
        platform: "VINTED",
        grossPrice: Money.of(30, "EUR"),
      }),
    );
    await t.repos.sales.save(
      makeSale(w.id, i2.id, s.id, { soldAt: "2026-09-02", platform: "EBAY" }),
    );
    await t.repos.sales.save(
      makeSale(w.id, i2.id, s.id, { soldAt: "2026-09-06", platform: "VINTED", status: "PENDING" }),
    );

    expect((await t.repos.sales.list(w.id)).map((x) => x.soldAt)).toEqual([
      "2026-09-06",
      "2026-09-02",
      "2026-08-20",
    ]);
    expect((await t.repos.sales.list(w.id, { from: "2026-09-01", to: "2026-09-30" })).length).toBe(
      2,
    );
    expect((await t.repos.sales.list(w.id, { platform: "VINTED" })).length).toBe(2);
    expect((await t.repos.sales.list(w.id, { itemId: i1.id })).length).toBe(1);
    expect((await t.repos.sales.list(w.id, { limit: 1, offset: 1 })).map((x) => x.soldAt)).toEqual([
      "2026-09-02",
    ]);
    expect((await t.repos.sales.byItem(w.id, i2.id)).length).toBe(2);
    expect((await t.repos.sales.bySource(w.id, s.id)).map((x) => x.soldAt)).toEqual([
      "2026-08-20",
      "2026-09-02",
      "2026-09-06",
    ]);
    expect(await t.repos.sales.list(ws.id, { sourceId: s.id })).toEqual([]);
  });
});
