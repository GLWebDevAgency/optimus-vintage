import { asSourceId, Money, unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  CreatePurchaseSource,
  DeletePurchaseSource,
  Forbidden,
  GeneratePiecesForSource,
  NotFound,
  QuotaExceeded,
  ReceivePurchaseSource,
  UpdatePurchaseSource,
  ValidationFailed,
} from "../src/index.js";
import { createLot, eur, expectErr, intruder, setup } from "./helpers.js";

describe("CreatePurchaseSource", () => {
  it("enregistre un lot avec son investissement total et son coût unitaire moyen", async () => {
    const s = await setup();
    const source = await createLot(s, { goods: 100, extra: 10, quantity: 10 });
    expect(source.kind).toBe("LOT");
    expect(source.totalInvestment).toEqual({ minor: 11000, currency: "EUR" });
    expect(source.averageUnitCost).toEqual({ minor: 1100, currency: "EUR" });
  });

  it("refuse un montant dans une autre devise que celle de l'espace", async () => {
    const s = await setup();
    const r = await new CreatePurchaseSource(s.deps).execute({
      ...s.scope,
      kind: "UNIT",
      name: "Veste",
      supplierKind: "FLEA_MARKET",
      goodsCost: Money.of(10, "USD"),
    });
    expect(expectErr(r, ValidationFailed).details).toMatchObject({
      field: "goodsCost",
      currency: "USD",
    });
  });

  it("applique le quota de sources par mois du plan FREE (3), hors achats à l'unité", async () => {
    const s = await setup({ plan: "FREE" });
    for (let i = 0; i < 3; i++) await createLot(s);
    const fourth = await new CreatePurchaseSource(s.deps).execute({
      ...s.scope,
      kind: "PICKING",
      name: "4e",
      supplierKind: "OTHER",
      goodsCost: eur(1),
    });
    // Un achat unitaire (mode Chiner) n'est jamais bloqué par le quota de sources.
    const unit = await new CreatePurchaseSource(s.deps).execute({
      ...s.scope,
      kind: "UNIT",
      name: "brocante",
      supplierKind: "FLEA_MARKET",
      goodsCost: eur(1),
    });
    expect(unit.ok).toBe(true);
    const e = expectErr(fourth, QuotaExceeded);
    expect(e.details).toMatchObject({
      resource: "sourcesPerMonth",
      used: 3,
      limit: 3,
      upgradeTo: "PREMIUM",
    });
    // Le mois suivant, le compteur repart.
    s.deps.clock.advanceDays(31);
    expect(
      (
        await new CreatePurchaseSource(s.deps).execute({
          ...s.scope,
          kind: "PICKING",
          name: "ok",
          supplierKind: "OTHER",
          goodsCost: eur(1),
        })
      ).ok,
    ).toBe(true);
  });

  it("refuse un acteur qui n'est pas propriétaire", async () => {
    const s = await setup();
    expectErr(
      await new CreatePurchaseSource(s.deps).execute({
        ...s.scope,
        ...intruder,
        kind: "UNIT",
        name: "x",
        supplierKind: "OTHER",
        goodsCost: eur(1),
      }),
      Forbidden,
    );
  });
});

describe("Update / Receive / Delete", () => {
  it("met à jour puis réceptionne un lot (événement SourceReceived, taux de casse)", async () => {
    const s = await setup();
    const source = await createLot(s, { quantity: 10 });
    const updated = unwrap(
      await new UpdatePurchaseSource(s.deps).execute({
        ...s.scope,
        sourceId: source.id,
        name: "Lot Eureka #2",
        extraCosts: eur(20),
      }),
    );
    expect(updated.source.name).toBe("Lot Eureka #2");
    expect(updated.source.totalInvestment.minor).toBe(12000);
    const received = unwrap(
      await new ReceivePurchaseSource(s.deps).execute({
        ...s.scope,
        sourceId: source.id,
        receivedQuantity: 8,
      }),
    );
    expect(received.source.receivedQuantity).toBe(8);
    expect(received.source.shrinkageRate).toBeCloseTo(0.2);
    expect(s.deps.events.ofType("SourceReceived")).toHaveLength(1);
  });

  it("refuse de supprimer une source avec des pièces sauf en force", async () => {
    const s = await setup();
    const source = await createLot(s, { quantity: 3 });
    unwrap(await new GeneratePiecesForSource(s.deps).execute({ ...s.scope, sourceId: source.id }));
    const e = expectErr(
      await new DeletePurchaseSource(s.deps).execute({ ...s.scope, sourceId: source.id }),
      ValidationFailed,
    );
    expect(e.details).toMatchObject({ reason: "HAS_ITEMS", itemCount: 3 });
    const forced = unwrap(
      await new DeletePurchaseSource(s.deps).execute({
        ...s.scope,
        sourceId: source.id,
        force: true,
      }),
    );
    expect(forced.deletedItems).toBe(3);
    expectErr(
      await new DeletePurchaseSource(s.deps).execute({ ...s.scope, sourceId: asSourceId("nope") }),
      NotFound,
    );
  });
});

describe("GeneratePiecesForSource", () => {
  it("répartit exactement l'investissement entre les pièces générées", async () => {
    const s = await setup();
    const source = await createLot(s, { goods: 100, extra: 10, quantity: 3 });
    const r = unwrap(
      await new GeneratePiecesForSource(s.deps).execute({ ...s.scope, sourceId: source.id }),
    );
    expect(r.items.map((i) => i.acquisitionCost.minor)).toEqual([3667, 3667, 3666]);
    expect(r.items.map((i) => i.title)).toEqual(["Pièce 1", "Pièce 2", "Pièce 3"]);
    expect(r.items.map((i) => i.sku)).toEqual(["CH-0001", "CH-0002", "CH-0003"]);
    expect(s.deps.events.ofType("ItemCreated")).toHaveLength(3);
  });

  it("répartit le reliquat quand des pièces existent déjà, sans double compte", async () => {
    const s = await setup();
    const source = await createLot(s, { goods: 90, extra: 0, quantity: 3 });
    unwrap(
      await new GeneratePiecesForSource(s.deps).execute({
        ...s.scope,
        sourceId: source.id,
        count: 1,
      }),
    );
    const rest = unwrap(
      await new GeneratePiecesForSource(s.deps).execute({ ...s.scope, sourceId: source.id }),
    );
    expect(rest.items).toHaveLength(2);
    expect(rest.items.map((i) => i.acquisitionCost.minor)).toEqual([3000, 3000]);
    expect(rest.items[0]?.title).toBe("Pièce 2");
  });

  it("applique le quota de pièces du plan FREE (50) sans rien créer", async () => {
    const s = await setup({ plan: "FREE" });
    const source = await createLot(s, { quantity: 100 });
    const e = expectErr(
      await new GeneratePiecesForSource(s.deps).execute({
        ...s.scope,
        sourceId: source.id,
        count: 51,
      }),
      QuotaExceeded,
    );
    expect(e.details).toMatchObject({ resource: "items", limit: 50, upgradeTo: "PREMIUM" });
    expect(await s.deps.items.count(s.scope.workspaceId)).toBe(0);
    expect(
      (
        await new GeneratePiecesForSource(s.deps).execute({
          ...s.scope,
          sourceId: source.id,
          count: 50,
        })
      ).ok,
    ).toBe(true);
  });
});
