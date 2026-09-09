import { type Appraisal, asAppraisalId } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAppraiser } from "../src/ai/FakeAppraiser.js";
import { ids, makeItem, makeSource, makeWorkspace, type TestDb, testDb } from "./helpers.js";

describe("DrizzleAppraisalRepository", () => {
  let t: TestDb;
  const ws = makeWorkspace();
  const src = makeSource(ws.id);
  const item = makeItem(ws.id, src.id);
  const fake = new FakeAppraiser();

  const draft = async (currency: "EUR" | "USD" = "EUR") =>
    fake.appraise({
      imageBase64: "AA==",
      mimeType: "image/jpeg",
      currency,
      locale: "fr",
      wantListingCopy: true,
    });

  beforeAll(async () => {
    t = await testDb();
    await t.repos.workspaces.save(ws);
    await t.repos.sources.save(src);
    await t.repos.items.save(item);
  });
  afterAll(() => t.close());

  it("aller-retour d'une expertise complète (Money en jsonb)", async () => {
    const a: Appraisal = {
      id: asAppraisalId(ids.next()),
      workspaceId: ws.id,
      itemId: item.id,
      createdAt: new Date("2026-09-08T11:00:00Z"),
      ...(await draft("USD")),
    };
    await t.repos.appraisals.save(a);
    const loaded = await t.repos.appraisals.byId(ws.id, a.id);
    expect(loaded).toEqual(a);
    expect(loaded?.price.mid.currency).toBe("USD");
    expect(loaded?.advice.maxBuyPrice?.minor).toBe(1800);
  });

  it("expertise sans pièce ni annonce", async () => {
    const d = await fake.appraise({
      imageBase64: "AA==",
      mimeType: "image/png",
      currency: "EUR",
      locale: "en",
    });
    const a: Appraisal = {
      id: asAppraisalId(ids.next()),
      workspaceId: ws.id,
      createdAt: new Date(),
      ...d,
    };
    await t.repos.appraisals.save(a);
    const loaded = await t.repos.appraisals.byId(ws.id, a.id);
    expect(loaded?.itemId).toBeUndefined();
    expect(loaded?.listingCopy).toBeNull();
  });

  it("compte depuis une date et retourne la plus récente pour une pièce", async () => {
    const w = makeWorkspace();
    const s = makeSource(w.id);
    const i = makeItem(w.id, s.id);
    await t.repos.workspaces.save(w);
    await t.repos.sources.save(s);
    await t.repos.items.save(i);
    const d = await draft();
    const older: Appraisal = {
      id: asAppraisalId(ids.next()),
      workspaceId: w.id,
      itemId: i.id,
      createdAt: new Date("2026-09-01T00:00:00Z"),
      ...d,
    };
    const newer: Appraisal = {
      id: asAppraisalId(ids.next()),
      workspaceId: w.id,
      itemId: i.id,
      createdAt: new Date("2026-09-07T00:00:00Z"),
      ...d,
    };
    await t.repos.appraisals.save(older);
    await t.repos.appraisals.save(newer);
    expect(await t.repos.appraisals.creditsSince(w.id, new Date("2026-09-05T00:00:00Z"))).toBe(1);
    expect(await t.repos.appraisals.creditsSince(w.id, new Date("2026-08-01T00:00:00Z"))).toBe(2);
    expect((await t.repos.appraisals.latestForItem(w.id, i.id))?.id).toBe(newer.id);
    expect((await t.repos.appraisals.list(w.id)).map((x) => x.id)).toEqual([newer.id, older.id]);
  });
});
