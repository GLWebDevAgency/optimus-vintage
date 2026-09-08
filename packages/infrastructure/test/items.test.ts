import { Money } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeItem, makeSource, makeWorkspace, type TestDb, testDb } from "./helpers.js";

describe("DrizzleItemRepository", () => {
  let t: TestDb;
  const ws = makeWorkspace();
  const src = makeSource(ws.id);
  beforeAll(async () => {
    t = await testDb();
    await t.repos.workspaces.save(ws);
    await t.repos.sources.save(src);
  });
  afterAll(() => t.close());

  it("aller-retour complet (photos, mesures, montants facultatifs)", async () => {
    const item = makeItem(ws.id, src.id);
    await t.repos.items.save(item);
    const loaded = await t.repos.items.byId(ws.id, item.id);
    expect(loaded?.toProps()).toEqual(item.toProps());
    expect(loaded?.acquisitionCost.equals(Money.of(6.67, "EUR"))).toBe(true);
  });

  it("aller-retour minimal (sans champs facultatifs)", async () => {
    const item = makeItem(ws.id, src.id, {
      brand: undefined,
      gender: undefined,
      size: undefined,
      era: undefined,
      measurements: undefined,
      retailPrice: undefined,
      targetPrice: undefined,
      bin: undefined,
      notes: undefined,
      colors: [],
      materials: [],
      photos: [],
    });
    await t.repos.items.save(item);
    const loaded = await t.repos.items.byId(ws.id, item.id);
    expect(loaded?.toProps()).toEqual(item.toProps());
    expect(loaded?.retailPrice).toBeUndefined();
  });

  it("persiste les transitions d'état et les dates associées", async () => {
    const item = makeItem(ws.id, src.id);
    await t.repos.items.save(item);
    item.markListed("VINTED", new Date("2026-09-09T09:00:00Z"));
    item.markSold(new Date("2026-09-10T09:00:00Z"));
    await t.repos.items.save(item);
    const loaded = await t.repos.items.byId(ws.id, item.id);
    expect(loaded?.status).toBe("SOLD");
    expect(loaded?.soldAt?.toISOString()).toBe("2026-09-10T09:00:00.000Z");
    expect(loaded?.toProps().listedAt?.toISOString()).toBe("2026-09-09T09:00:00.000Z");
    expect((await t.repos.items.bySku(ws.id, item.sku))?.id).toBe(item.id);
  });

  it("filtre par statut, recherche, source, tri et pagination ; compte", async () => {
    const w = makeWorkspace();
    const s1 = makeSource(w.id);
    const s2 = makeSource(w.id, { name: "Brocante" });
    await t.repos.workspaces.save(w);
    await t.repos.sources.save(s1);
    await t.repos.sources.save(s2);
    const a = makeItem(w.id, s1.id, {
      title: "Veste Levi's",
      brand: "Levi's",
      acquisitionCost: Money.of(12, "EUR"),
      now: new Date("2026-08-01T00:00:00Z"),
    });
    const b = makeItem(w.id, s1.id, {
      title: "Pull Ralph Lauren",
      brand: "Ralph Lauren",
      acquisitionCost: Money.of(8, "EUR"),
      now: new Date("2026-08-15T00:00:00Z"),
    });
    const c = makeItem(w.id, s2.id, {
      title: "Sac Longchamp",
      brand: "Longchamp",
      acquisitionCost: Money.of(25, "EUR"),
      now: new Date("2026-09-01T00:00:00Z"),
    });
    c.markListed("VINTED", new Date("2026-09-02T00:00:00Z"));
    b.markSold(new Date("2026-09-03T00:00:00Z"));
    await t.repos.items.saveMany([a, b, c]);

    expect((await t.repos.items.list(w.id)).map((i) => i.title)).toEqual([
      "Sac Longchamp",
      "Pull Ralph Lauren",
      "Veste Levi's",
    ]);
    expect((await t.repos.items.list(w.id, { sort: "oldest" })).map((i) => i.title)).toEqual([
      "Veste Levi's",
      "Pull Ralph Lauren",
      "Sac Longchamp",
    ]);
    expect(
      (await t.repos.items.list(w.id, { sort: "cost_desc" })).map((i) => i.acquisitionCost.minor),
    ).toEqual([2500, 1200, 800]);
    expect(
      (await t.repos.items.list(w.id, { sort: "cost_asc" })).map((i) => i.acquisitionCost.minor),
    ).toEqual([800, 1200, 2500]);
    expect((await t.repos.items.list(w.id, { sort: "title" })).map((i) => i.title)).toEqual([
      "Pull Ralph Lauren",
      "Sac Longchamp",
      "Veste Levi's",
    ]);

    expect(
      (await t.repos.items.list(w.id, { status: ["IN_STOCK", "LISTED"] })).map((i) => i.title),
    ).toEqual(["Sac Longchamp", "Veste Levi's"]);
    expect((await t.repos.items.list(w.id, { search: "ralph" })).map((i) => i.title)).toEqual([
      "Pull Ralph Lauren",
    ]);
    expect(
      (await t.repos.items.list(w.id, { search: a.sku.toLowerCase() })).map((i) => i.id),
    ).toEqual([a.id]);
    expect((await t.repos.items.list(w.id, { sourceId: s2.id })).map((i) => i.id)).toEqual([c.id]);
    expect((await t.repos.items.list(w.id, { limit: 1, offset: 1 })).map((i) => i.title)).toEqual([
      "Pull Ralph Lauren",
    ]);

    expect(await t.repos.items.count(w.id)).toBe(3);
    expect(await t.repos.items.count(w.id, { status: ["SOLD"] })).toBe(1);
    expect(await t.repos.items.count(w.id, { search: "levi" })).toBe(1);
    expect((await t.repos.items.bySource(w.id, s1.id)).length).toBe(2);
    // Stock dormant : vendable et entré avant le 20/08 → seule la veste (le pull est vendu).
    expect(
      (await t.repos.items.list(w.id, { dormantSince: new Date("2026-08-20T00:00:00Z") })).map(
        (i) => i.id,
      ),
    ).toEqual([a.id]);
    // Cloisonnement : un autre espace ne voit rien.
    expect(await t.repos.items.count(ws.id, { search: "Longchamp" })).toBe(0);
  });

  it("saveMany met à jour les pièces existantes (upsert)", async () => {
    const item = makeItem(ws.id, src.id, { title: "Avant" });
    await t.repos.items.save(item);
    item.update({ title: "Après", bin: "B7" }, new Date("2026-09-09T00:00:00Z"));
    item.addPhoto(
      { id: "ph_2" as never, key: `${ws.id}/photo-2.webp` },
      new Date("2026-09-09T00:00:00Z"),
    );
    await t.repos.items.saveMany([item]);
    const loaded = await t.repos.items.byId(ws.id, item.id);
    expect(loaded?.title).toBe("Après");
    expect(loaded?.photos.length).toBe(2);
    expect(loaded?.toProps().bin).toBe("B7");
  });

  it("refuse deux SKU identiques dans un même espace", async () => {
    const one = makeItem(ws.id, src.id, { sku: "CH-9999" });
    const two = makeItem(ws.id, src.id, { sku: "CH-9999" });
    await t.repos.items.save(one);
    await expect(t.repos.items.save(two)).rejects.toThrow();
  });

  it("supprime", async () => {
    const item = makeItem(ws.id, src.id);
    await t.repos.items.save(item);
    await t.repos.items.delete(ws.id, item.id);
    expect(await t.repos.items.byId(ws.id, item.id)).toBeUndefined();
  });
});
