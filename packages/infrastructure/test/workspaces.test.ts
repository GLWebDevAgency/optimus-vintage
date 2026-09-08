import { Money } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeWorkspace, type TestDb, testDb, user } from "./helpers.js";

describe("DrizzleWorkspaceRepository", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("sauvegarde puis relit un espace à l'identique", async () => {
    const ws = makeWorkspace({ targetMargin: { kind: "AMOUNT_MINOR", value: 1500 } });
    await t.repos.workspaces.save(ws);
    const loaded = await t.repos.workspaces.byId(ws.id);
    expect(loaded?.toProps()).toEqual(ws.toProps());
  });

  it("retrouve l'espace par propriétaire et par utilisateur membre", async () => {
    const ws = makeWorkspace({ ownerId: user("owner_2") });
    await t.repos.workspaces.save(ws);
    await t.repos.workspaces.addMember(ws.id, user("seller_9"), "SELLER");

    expect((await t.repos.workspaces.byOwner(user("owner_2")))?.id).toBe(ws.id);
    expect((await t.repos.workspaces.forUser(user("seller_9"))).map((w) => w.id)).toEqual([ws.id]);
    expect((await t.repos.workspaces.forUser(user("owner_2"))).map((w) => w.id)).toContain(ws.id);
    expect(await t.repos.workspaces.forUser(user("nobody"))).toEqual([]);
    expect(await t.repos.workspaces.roleOf(ws.id, user("seller_9"))).toBe("SELLER");
    expect(await t.repos.workspaces.roleOf(ws.id, user("owner_2"))).toBe("OWNER");
    expect(await t.repos.workspaces.roleOf(ws.id, user("nobody"))).toBeUndefined();
  });

  it("met à jour sans réinitialiser le compteur de SKU", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    expect(await t.repos.skuSequence.next(ws.id)).toBe(1);
    expect(await t.repos.skuSequence.next(ws.id)).toBe(2);
    await t.repos.workspaces.save(ws.with({ name: "Renommé", plan: "PRO" }));
    expect(await t.repos.skuSequence.next(ws.id)).toBe(3);
    expect((await t.repos.workspaces.byId(ws.id))?.plan).toBe("PRO");
  });

  it("stocke les grilles de frais surchargées", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    expect(await t.repos.workspaces.feeOverrides(ws.id)).toEqual({});
    await t.repos.workspaces.saveFeeOverrides(ws.id, {
      VINTED: { percent: 5, fixedMinor: 70, note: "Boost" },
    });
    const overrides = await t.repos.workspaces.feeOverrides(ws.id);
    expect(overrides.VINTED).toEqual({ percent: 5, fixedMinor: 70, note: "Boost" });
    expect(Money.of(100, "EUR").percent(overrides.VINTED?.percent ?? 0).minor).toBe(500);
  });

  it("objectif mensuel facultatif", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    expect(await t.repos.workspaces.monthlyGoalMinor(ws.id)).toBeUndefined();
    await t.repos.workspaces.saveMonthlyGoalMinor(ws.id, 250_000);
    expect(await t.repos.workspaces.monthlyGoalMinor(ws.id)).toBe(250_000);
  });
});
