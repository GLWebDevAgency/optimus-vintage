import { type Appraisal, asAppraisalId, Money } from "@chine/domain";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAppraiser } from "../src/ai/FakeAppraiser.js";
import * as auth from "../src/db/auth-schema.js";
import { outboxEvents } from "../src/db/schema.js";
import { OutboxEventPublisher } from "../src/events/OutboxEventPublisher.js";
import { OutboxRelay } from "../src/events/OutboxRelay.js";
import { DataLifecycle, WorkspaceNotFoundError } from "../src/lifecycle/DataLifecycle.js";
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

describe("DataLifecycle", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  async function seed(owner: string) {
    const ws = makeWorkspace({ ownerId: user(owner) });
    const source = makeSource(ws.id);
    const item = makeItem(ws.id, source.id);
    const listing = makeListing(ws.id, item.id);
    const sale = makeSale(ws.id, item.id, source.id);
    const draft = await new FakeAppraiser().appraise({
      imageBase64: "AA==",
      mimeType: "image/jpeg",
      currency: "EUR",
      locale: "fr",
      wantListingCopy: true,
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
    await new OutboxEventPublisher(t.database.db, ids).publish(item.pullEvents());
    return { ws, source, item, listing, sale, appraisal };
  }

  it("exportWorkspace : JSON complet, Money via toJSON, scopé à l'espace", async () => {
    const a = await seed("rgpd_a");
    await seed("rgpd_b");
    const lifecycle = new DataLifecycle(t.database.db, () => new Date("2026-09-09T00:00:00Z"));
    const dump = await lifecycle.exportWorkspace(a.ws.id);
    expect(dump.format).toBe("chine.workspace-export");
    expect(dump.exportedAt).toBe("2026-09-09T00:00:00.000Z");
    expect(dump.workspace).toMatchObject({ id: a.ws.id, name: a.ws.name, ownerId: "rgpd_a" });
    expect(dump.members).toEqual([
      { userId: "rgpd_a", role: "OWNER", createdAt: expect.any(String) },
    ]);
    expect(dump.sources).toHaveLength(1);
    expect(dump.sources[0]).toMatchObject({
      id: a.source.id,
      goodsCost: { minor: 18000, currency: "EUR" },
    });
    expect(dump.items[0]).toMatchObject({
      id: a.item.id,
      acquisitionCost: { minor: 667, currency: "EUR" },
    });
    expect(dump.listings[0]).toMatchObject({
      id: a.listing.id,
      price: { minor: 4900, currency: "EUR" },
    });
    expect(dump.sales[0]).toMatchObject({
      id: a.sale.id,
      grossPrice: { minor: 12000, currency: "EUR" },
    });
    expect(dump.appraisals[0]).toMatchObject({
      id: a.appraisal.id,
      price: { mid: { minor: 4500, currency: "EUR" } },
    });
    // Sérialisable tel quel (aucune instance Money/Date résiduelle).
    expect(JSON.parse(JSON.stringify(dump))).toEqual(dump);
    await expect(lifecycle.exportWorkspace(makeWorkspace().id)).rejects.toBeInstanceOf(
      WorkspaceNotFoundError,
    );
  });

  it("deleteWorkspace : efface tout l'espace, renvoie les clés photo, laisse les autres intacts", async () => {
    const a = await seed("del_a");
    const b = await seed("del_b");
    const lifecycle = new DataLifecycle(t.database.db);
    const { deletedPhotoKeys } = await lifecycle.deleteWorkspace(a.ws.id);
    expect(deletedPhotoKeys).toEqual(a.item.photos.map((p) => p.key));
    expect(await t.repos.workspaces.byId(a.ws.id)).toBeUndefined();
    expect(await t.repos.items.count(a.ws.id)).toBe(0);
    expect(await t.repos.sources.list(a.ws.id)).toEqual([]);
    expect(await t.repos.sales.list(a.ws.id)).toEqual([]);
    expect(await t.repos.appraisals.creditsSince(a.ws.id, new Date(0))).toBe(0);
    expect(await t.repos.workspaces.forUser(user("del_a"))).toEqual([]);
    expect(
      await t.database.db.select().from(outboxEvents).where(eq(outboxEvents.workspaceId, a.ws.id)),
    ).toEqual([]);
    expect(await t.repos.items.count(b.ws.id)).toBe(1);
    expect((await t.repos.workspaces.byId(b.ws.id))?.id).toBe(b.ws.id);
    expect(await lifecycle.deleteWorkspace(a.ws.id)).toEqual({ deletedPhotoKeys: [] });
  });

  it("deleteUserFootprint : tables Better Auth, adhésions, et espaces possédés sur demande", async () => {
    const { db } = t.database;
    await db.insert(auth.user).values({ id: "u_rgpd", name: "Nour", email: "Nour@Example.com" });
    await db.insert(auth.session).values({
      id: "s1",
      token: "tok",
      userId: "u_rgpd",
      expiresAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(auth.account).values({
      id: "acc1",
      accountId: "u_rgpd",
      providerId: "credential",
      userId: "u_rgpd",
      password: "hash",
      updatedAt: new Date(),
    });
    await db
      .insert(auth.verification)
      .values({ id: "v1", identifier: "nour@example.com", value: "x", expiresAt: new Date() });
    await db.insert(auth.user).values({ id: "u_other", name: "Autre", email: "autre@example.com" });
    const owned = await seed("u_rgpd");
    const other = makeWorkspace({ ownerId: user("u_other") });
    await t.repos.workspaces.save(other);
    await t.repos.workspaces.addMember(other.id, user("u_rgpd"), "SELLER");

    const lifecycle = new DataLifecycle(db);
    await expect(lifecycle.deleteUserFootprint("u_rgpd")).rejects.toThrow(/possède encore/);
    const result = await lifecycle.deleteUserFootprint("u_rgpd", { deleteOwnedWorkspaces: true });
    expect(result).toEqual({
      deletedUser: true,
      deletedWorkspaceIds: [owned.ws.id],
      deletedPhotoKeys: owned.item.photos.map((p) => p.key),
    });
    expect(await db.query.user.findFirst({ where: eq(auth.user.id, "u_rgpd") })).toBeUndefined();
    expect(await db.select().from(auth.session)).toEqual([]);
    expect(await db.select().from(auth.account)).toEqual([]);
    expect(await db.select().from(auth.verification)).toEqual([]);
    expect(await t.repos.workspaces.members(other.id)).toEqual([
      { userId: "u_other", role: "OWNER" },
    ]);
    expect(await db.query.user.findFirst({ where: eq(auth.user.id, "u_other") })).toBeDefined();
    expect(await lifecycle.deleteUserFootprint("inconnu")).toEqual({
      deletedUser: false,
      deletedWorkspaceIds: [],
      deletedPhotoKeys: [],
    });
  });
});

describe("OutboxRelay", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("relaie, marque publié ou échec avec attempts++, puis abandonne après maxAttempts", async () => {
    const ws = makeWorkspace();
    const source = makeSource(ws.id);
    const good = makeItem(ws.id, source.id);
    const bad = makeItem(ws.id, source.id);
    const sale = makeSale(ws.id, good.id, source.id, { grossPrice: Money.of(30, "EUR") });
    const publisher = new OutboxEventPublisher(t.database.db, ids);
    await publisher.publish([...good.pullEvents(), ...bad.pullEvents(), ...sale.pullEvents()]);

    const relay = new OutboxRelay(publisher, {
      maxAttempts: 2,
      logger: { warn: () => undefined },
      now: () => new Date("2026-09-08T13:00:00Z"),
    });
    const handled: string[] = [];
    const handler = async (e: { type: string; payload: Record<string, unknown> }) => {
      if (e.payload["itemId"] === bad.id) throw new Error("webhook down");
      handled.push(e.type);
    };

    const first = await relay.relayPending(handler);
    expect(first).toMatchObject({ processed: 3, published: 2, failed: 1 });
    expect(first.failures[0]).toMatchObject({ type: "ItemCreated", error: "webhook down" });
    expect(handled).toEqual(["ItemCreated", "ItemSold"]);

    const rows = await t.database.db
      .select()
      .from(outboxEvents)
      .orderBy(outboxEvents.occurredAt, outboxEvents.id);
    expect(rows.filter((r) => r.publishedAt !== null)).toHaveLength(2);
    expect(rows.find((r) => r.publishedAt === null)?.attempts).toBe(1);

    const second = await relay.relayPending(handler);
    expect(second).toMatchObject({ processed: 1, published: 0, failed: 1 });
    // attempts = 2 = maxAttempts : plus proposé.
    expect(await relay.relayPending(handler)).toMatchObject({
      processed: 0,
      published: 0,
      failed: 0,
    });
    expect(await publisher.pending()).toHaveLength(1);
    expect(await publisher.pending(100, 2)).toHaveLength(0);

    // drain traite par lots.
    await publisher.publish(makeItem(ws.id, source.id).pullEvents());
    await publisher.publish(makeItem(ws.id, source.id).pullEvents());
    const drained = await relay.drain(handler, 1);
    expect(drained).toMatchObject({ processed: 2, published: 2, failed: 0 });
  });
});
