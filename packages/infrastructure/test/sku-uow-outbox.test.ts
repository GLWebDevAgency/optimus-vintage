import { asWorkspaceId, Money } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OutboxEventPublisher } from "../src/events/OutboxEventPublisher.js";
import { DrizzleUnitOfWork, WorkspaceNotFound } from "../src/repositories/index.js";
import {
  ids,
  makeItem,
  makeSale,
  makeSource,
  makeWorkspace,
  type TestDb,
  testDb,
} from "./helpers.js";

describe("DrizzleSkuSequence", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("incrémente de façon monotone et unique, même en parallèle", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    const values = await Promise.all(
      Array.from({ length: 25 }, () => t.repos.skuSequence.next(ws.id)),
    );
    expect(new Set(values).size).toBe(25);
    expect(Math.max(...values)).toBe(25);
    expect(await t.repos.skuSequence.next(ws.id)).toBe(26);
  });

  it("ensureAtLeast n'abaisse jamais le compteur", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    await t.repos.skuSequence.ensureAtLeast(ws.id, 100);
    expect(await t.repos.skuSequence.next(ws.id)).toBe(101);
    await t.repos.skuSequence.ensureAtLeast(ws.id, 5);
    expect(await t.repos.skuSequence.next(ws.id)).toBe(102);
  });

  it("échoue explicitement sur un espace inconnu", async () => {
    await expect(t.repos.skuSequence.next(asWorkspaceId(ids.next()))).rejects.toBeInstanceOf(
      WorkspaceNotFound,
    );
  });
});

describe("DrizzleUnitOfWork", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("annule tout en cas d'erreur", async () => {
    const uow = new DrizzleUnitOfWork(t.database.db);
    const ws = makeWorkspace();
    const src = makeSource(ws.id);
    await expect(
      uow.run(async (r) => {
        await r.workspaces.save(ws);
        await r.sources.save(src);
        await r.skuSequence.next(ws.id);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await t.repos.workspaces.byId(ws.id)).toBeUndefined();
    expect(await t.repos.sources.byId(ws.id, src.id)).toBeUndefined();
  });

  it("valide et renvoie la valeur du bloc", async () => {
    const uow = new DrizzleUnitOfWork(t.database.db);
    const ws = makeWorkspace();
    const src = makeSource(ws.id);
    const sku = await uow.run(async (r) => {
      await r.workspaces.save(ws);
      await r.sources.save(src);
      const n = await r.skuSequence.next(ws.id);
      const item = makeItem(ws.id, src.id, { sku: `CH-${String(n).padStart(4, "0")}` });
      await r.items.save(item);
      return item.sku;
    });
    expect(sku).toBe("CH-0001");
    expect((await t.repos.items.bySku(ws.id, "CH-0001"))?.sourceId).toBe(src.id);
  });
});

describe("OutboxEventPublisher", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("écrit les événements avec les montants sérialisés, puis les marque relayés", async () => {
    const ws = makeWorkspace();
    const src = makeSource(ws.id);
    const item = makeItem(ws.id, src.id);
    const sale = makeSale(ws.id, item.id, src.id, { grossPrice: Money.of(50, "EUR") });
    const publisher = new OutboxEventPublisher(t.database.db, ids);
    await publisher.publish([...item.pullEvents(), ...sale.pullEvents()]);

    const pending = await publisher.pending();
    expect(pending.map((e) => e.type)).toEqual(["ItemCreated", "ItemSold"]);
    const sold = pending[1];
    expect(sold?.workspaceId).toBe(ws.id);
    expect(sold?.payload).toMatchObject({
      itemId: item.id,
      saleId: sale.id,
      net: { minor: sale.economics.net.minor, currency: "EUR" },
    });
    expect(sold?.payload).not.toHaveProperty("type");
    expect(sold?.occurredAt.toISOString()).toBe("2026-09-08T10:00:00.000Z");

    await publisher.markPublished(pending.map((e) => e.id));
    expect(await publisher.pending()).toEqual([]);
    await expect(publisher.publish([])).resolves.toBeUndefined();
  });
});
