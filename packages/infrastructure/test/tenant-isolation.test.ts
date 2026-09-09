/**
 * Preuve d'isolation multi-tenant : deux espaces A et B, chaque méthode scopée sur A
 * ne voit ni ne touche jamais les données de B.
 */
import {
  type Appraisal,
  asAppraisalId,
  Item,
  Listing,
  Money,
  PurchaseSource,
  Sale,
} from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAppraiser } from "../src/ai/FakeAppraiser.js";
import { DrizzleUnitOfWork } from "../src/repositories/index.js";
import {
  ids,
  makeItem,
  makeListing,
  makeSale,
  makeSource,
  makeWorkspace,
  type TestDb,
  testDb,
  user,
} from "./helpers.js";

interface Tenant {
  ws: ReturnType<typeof makeWorkspace>;
  source: PurchaseSource;
  item: Item;
  listing: Listing;
  sale: Sale;
  appraisal: Appraisal;
}

async function seed(t: TestDb, name: string, owner: string): Promise<Tenant> {
  const ws = makeWorkspace({ name, ownerId: user(owner) });
  const source = makeSource(ws.id, { name: `Lot ${name}` });
  const item = makeItem(ws.id, source.id, { title: `Pièce ${name}`, brand: name });
  const listing = makeListing(ws.id, item.id);
  const sale = makeSale(ws.id, item.id, source.id);
  const draft = await new FakeAppraiser().appraise({
    imageBase64: "AA==",
    mimeType: "image/jpeg",
    currency: "EUR",
    locale: "fr",
  });
  const appraisal: Appraisal = {
    id: asAppraisalId(ids.next()),
    workspaceId: ws.id,
    itemId: item.id,
    createdAt: new Date("2026-09-08T12:00:00Z"),
    ...draft,
  };
  await t.repos.workspaces.save(ws);
  await t.repos.sources.save(source);
  await t.repos.items.save(item);
  await t.repos.listings.save(listing);
  await t.repos.sales.save(sale);
  await t.repos.appraisals.save(appraisal);
  return { ws, source, item, listing, sale, appraisal };
}

describe("isolation multi-tenant", () => {
  let t: TestDb;
  let A: Tenant;
  let B: Tenant;
  beforeAll(async () => {
    t = await testDb();
    A = await seed(t, "Alpha", "owner_a");
    B = await seed(t, "Beta", "owner_b");
  });
  afterAll(() => t.close());

  /** B est intact après chaque scénario. */
  async function expectBIntact(): Promise<void> {
    expect((await t.repos.sources.byId(B.ws.id, B.source.id))?.toProps()).toEqual(
      B.source.toProps(),
    );
    expect((await t.repos.items.byId(B.ws.id, B.item.id))?.toProps()).toEqual(B.item.toProps());
    expect((await t.repos.listings.byId(B.ws.id, B.listing.id))?.toProps()).toEqual(
      B.listing.toProps(),
    );
    expect((await t.repos.sales.byId(B.ws.id, B.sale.id))?.toProps()).toEqual(B.sale.toProps());
    expect(await t.repos.appraisals.byId(B.ws.id, B.appraisal.id)).toEqual(B.appraisal);
    expect((await t.repos.workspaces.byId(B.ws.id))?.toProps()).toEqual(B.ws.toProps());
  }

  it("workspaces : forUser / byOwner / roleOf ne franchissent pas les espaces", async () => {
    expect((await t.repos.workspaces.forUser(user("owner_a"))).map((w) => w.id)).toEqual([A.ws.id]);
    expect((await t.repos.workspaces.forUser(user("owner_b"))).map((w) => w.id)).toEqual([B.ws.id]);
    expect((await t.repos.workspaces.byOwner(user("owner_a")))?.id).toBe(A.ws.id);
    expect(await t.repos.workspaces.roleOf(B.ws.id, user("owner_a"))).toBeUndefined();
    expect(await t.repos.workspaces.members(A.ws.id)).toEqual([
      { userId: "owner_a", role: "OWNER" },
    ]);
    await t.repos.workspaces.saveFeeOverrides(A.ws.id, { EBAY: { percent: 10, fixedMinor: 0 } });
    expect(await t.repos.workspaces.feeOverrides(B.ws.id)).toEqual({});
  });

  it("sources : lecture, liste, comptage, suppression, réécriture", async () => {
    expect(await t.repos.sources.byId(A.ws.id, B.source.id)).toBeUndefined();
    expect((await t.repos.sources.list(A.ws.id)).map((s) => s.id)).toEqual([A.source.id]);
    expect(await t.repos.sources.list(A.ws.id, { search: "Beta" })).toEqual([]);
    expect(await t.repos.sources.list(A.ws.id, { kind: "LOT", search: "Lot" })).toHaveLength(1);
    expect(await t.repos.sources.countCreatedSince(A.ws.id, new Date(0))).toBe(1);
    await t.repos.sources.delete(A.ws.id, B.source.id);
    // Tentative de réécriture de la source de B avec l'identité de A : ignorée.
    const forged = PurchaseSource.rehydrate({
      ...B.source.toProps(),
      workspaceId: A.ws.id,
      name: "PIRATÉ",
    });
    await t.repos.sources.save(forged);
    expect(await t.repos.sources.byId(A.ws.id, B.source.id)).toBeUndefined();
    await expectBIntact();
  });

  it("items : lecture, bySku, liste (filtres, recherche, tri), bySource, comptage, suppression, réécriture", async () => {
    expect(await t.repos.items.byId(A.ws.id, B.item.id)).toBeUndefined();
    expect(await t.repos.items.bySku(A.ws.id, B.item.sku)).toBeUndefined();
    expect((await t.repos.items.list(A.ws.id)).map((i) => i.id)).toEqual([A.item.id]);
    expect(await t.repos.items.list(A.ws.id, { search: "Beta" })).toEqual([]);
    expect(await t.repos.items.list(A.ws.id, { search: B.item.sku })).toEqual([]);
    expect(await t.repos.items.list(A.ws.id, { sourceId: B.source.id })).toEqual([]);
    expect(await t.repos.items.list(A.ws.id, { status: ["IN_STOCK"], sort: "title" })).toHaveLength(
      1,
    );
    expect(
      await t.repos.items.list(A.ws.id, { dormantSince: new Date("2030-01-01") }),
    ).toHaveLength(1);
    expect(await t.repos.items.bySource(A.ws.id, B.source.id)).toEqual([]);
    expect(await t.repos.items.count(A.ws.id)).toBe(1);
    expect(await t.repos.items.count(A.ws.id, { search: "Beta" })).toBe(0);
    await t.repos.items.delete(A.ws.id, B.item.id);
    const forged = Item.rehydrate({ ...B.item.toProps(), workspaceId: A.ws.id, title: "PIRATÉ" });
    await t.repos.items.saveMany([forged]);
    expect(await t.repos.items.byId(A.ws.id, B.item.id)).toBeUndefined();
    await expectBIntact();
  });

  it("listings : lecture, byItem, réécriture", async () => {
    expect(await t.repos.listings.byId(A.ws.id, B.listing.id)).toBeUndefined();
    expect(await t.repos.listings.byItem(A.ws.id, B.item.id)).toEqual([]);
    const forged = Listing.rehydrate({
      ...B.listing.toProps(),
      workspaceId: A.ws.id,
      price: Money.of(1, "EUR"),
    });
    await t.repos.listings.save(forged);
    expect(await t.repos.listings.byId(A.ws.id, B.listing.id)).toBeUndefined();
    await expectBIntact();
  });

  it("sales : lecture, byItem, bySource, liste filtrée, réécriture", async () => {
    expect(await t.repos.sales.byId(A.ws.id, B.sale.id)).toBeUndefined();
    expect(await t.repos.sales.byItem(A.ws.id, B.item.id)).toEqual([]);
    expect(await t.repos.sales.bySource(A.ws.id, B.source.id)).toEqual([]);
    expect((await t.repos.sales.list(A.ws.id)).map((s) => s.id)).toEqual([A.sale.id]);
    expect(await t.repos.sales.list(A.ws.id, { itemId: B.item.id })).toEqual([]);
    expect(
      await t.repos.sales.list(A.ws.id, {
        from: "2026-01-01",
        to: "2026-12-31",
        platform: "VESTIAIRE",
      }),
    ).toHaveLength(1);
    const forged = Sale.rehydrate({ ...B.sale.toProps(), workspaceId: A.ws.id, buyer: "PIRATÉ" });
    await t.repos.sales.save(forged);
    expect(await t.repos.sales.byId(A.ws.id, B.sale.id)).toBeUndefined();
    await expectBIntact();
  });

  it("appraisals : lecture, comptage, latestForItem, liste, réécriture", async () => {
    expect(await t.repos.appraisals.byId(A.ws.id, B.appraisal.id)).toBeUndefined();
    expect(await t.repos.appraisals.creditsSince(A.ws.id, new Date(0))).toBe(1);
    expect(await t.repos.appraisals.latestForItem(A.ws.id, B.item.id)).toBeUndefined();
    expect((await t.repos.appraisals.list(A.ws.id)).map((a) => a.id)).toEqual([A.appraisal.id]);
    await t.repos.appraisals.save({ ...B.appraisal, workspaceId: A.ws.id, provider: "PIRATÉ" });
    expect(await t.repos.appraisals.byId(A.ws.id, B.appraisal.id)).toBeUndefined();
    await expectBIntact();
  });

  it("skuSequence : le compteur de A n'influence pas celui de B", async () => {
    expect(await t.repos.skuSequence.next(A.ws.id)).toBe(1);
    expect(await t.repos.skuSequence.next(A.ws.id)).toBe(2);
    await t.repos.skuSequence.ensureAtLeast(A.ws.id, 50);
    expect(await t.repos.skuSequence.next(B.ws.id)).toBe(1);
  });

  it("DrizzleUnitOfWork : les repositories transactionnels restent cloisonnés", async () => {
    const uow = new DrizzleUnitOfWork(t.database.db);
    const seen = await uow.run(async (r) => {
      await r.items.delete(A.ws.id, B.item.id);
      await r.sources.delete(A.ws.id, B.source.id);
      await r.sales.save(
        Sale.rehydrate({ ...B.sale.toProps(), workspaceId: A.ws.id, buyer: "PIRATÉ" }),
      );
      return {
        item: await r.items.byId(A.ws.id, B.item.id),
        source: await r.sources.byId(A.ws.id, B.source.id),
        listing: await r.listings.byId(A.ws.id, B.listing.id),
        sale: await r.sales.byId(A.ws.id, B.sale.id),
        appraisal: await r.appraisals.byId(A.ws.id, B.appraisal.id),
        count: await r.items.count(A.ws.id),
      };
    });
    expect(seen).toEqual({
      item: undefined,
      source: undefined,
      listing: undefined,
      sale: undefined,
      appraisal: undefined,
      count: 1,
    });
    await expectBIntact();
  });
});
