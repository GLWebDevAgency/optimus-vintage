import { asSourceId, Money } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeSource, makeWorkspace, type TestDb, testDb } from "./helpers.js";

describe("DrizzlePurchaseSourceRepository", () => {
  let t: TestDb;
  const ws = makeWorkspace();
  beforeAll(async () => {
    t = await testDb();
    await t.repos.workspaces.save(ws);
  });
  afterAll(() => t.close());

  it("aller-retour complet, options comprises", async () => {
    const src = makeSource(ws.id);
    await t.repos.sources.save(src);
    const loaded = await t.repos.sources.byId(ws.id, src.id);
    expect(loaded?.toProps()).toEqual(src.toProps());
    expect(loaded?.totalInvestment.equals(Money.of(200, "EUR"))).toBe(true);
  });

  it("aller-retour minimal (achat unitaire sans options)", async () => {
    const src = makeSource(ws.id, {
      kind: "UNIT",
      supplierKind: "FLEA_MARKET",
      announcedQuantity: 1,
    });
    const props = src.toProps();
    const { supplierName: _s, weightKg: _w, location: _l, notes: _n, ...minimal } = props;
    await t.repos.sources.save(src);
    const loaded = await t.repos.sources.byId(ws.id, src.id);
    expect(loaded?.toProps()).toMatchObject(minimal);
    expect(loaded?.toProps().location).toEqual(props.location);
  });

  it("met à jour après réception et isole par espace", async () => {
    const src = makeSource(ws.id);
    await t.repos.sources.save(src);
    src.receive(27, new Date("2026-09-09T08:00:00Z"));
    await t.repos.sources.save(src);
    const loaded = await t.repos.sources.byId(ws.id, src.id);
    expect(loaded?.receivedQuantity).toBe(27);
    expect(loaded?.updatedAt.toISOString()).toBe("2026-09-09T08:00:00.000Z");
    expect(await t.repos.sources.byId(makeWorkspace().id, src.id)).toBeUndefined();
  });

  it("liste avec filtre de type, recherche et pagination", async () => {
    const other = makeWorkspace();
    await t.repos.workspaces.save(other);
    await t.repos.sources.save(makeSource(other.id, { name: "Palette Fleek", kind: "PALLET" }));
    await t.repos.sources.save(
      makeSource(ws.id, { name: "Palette Fleek", kind: "PALLET", weightKg: 80 }),
    );
    await t.repos.sources.save(
      makeSource(ws.id, { name: "Picking Emmaüs", kind: "PICKING", supplierName: "Emmaüs" }),
    );

    const pallets = await t.repos.sources.list(ws.id, { kind: "PALLET" });
    expect(pallets.map((s) => s.name)).toEqual(["Palette Fleek"]);
    expect(pallets[0]?.allocationPolicy).toBe("BY_WEIGHT");

    const search = await t.repos.sources.list(ws.id, { search: "emma" });
    expect(search.map((s) => s.name)).toEqual(["Picking Emmaüs"]);

    const all = await t.repos.sources.list(ws.id);
    const page2 = await t.repos.sources.list(ws.id, { limit: 2, offset: 2 });
    expect(page2.length).toBe(Math.min(2, Math.max(0, all.length - 2)));
    expect(await t.repos.sources.list(ws.id, { search: "%_" })).toEqual([]);
  });

  it("compte les sources créées depuis une date", async () => {
    const fresh = makeWorkspace();
    await t.repos.workspaces.save(fresh);
    await t.repos.sources.save(makeSource(fresh.id));
    await t.repos.sources.save(makeSource(fresh.id));
    expect(await t.repos.sources.countCreatedSince(fresh.id, new Date("2026-09-01"))).toBe(2);
    expect(await t.repos.sources.countCreatedSince(fresh.id, new Date("2026-09-09"))).toBe(0);
  });

  it("supprime", async () => {
    const src = makeSource(ws.id);
    await t.repos.sources.save(src);
    await t.repos.sources.delete(ws.id, src.id);
    expect(await t.repos.sources.byId(ws.id, src.id)).toBeUndefined();
    await expect(t.repos.sources.delete(ws.id, asSourceId(src.id))).resolves.toBeUndefined();
  });
});
