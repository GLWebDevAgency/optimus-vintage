import { asUserId, unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  EnsureWorkspaceForUser,
  Forbidden,
  UpdateWorkspaceSettings,
  ValidationFailed,
} from "../src/index.js";
import { createTestDependencies } from "../src/testing/index.js";
import { chine, expectErr, intruder, setup } from "./helpers.js";

describe("EnsureWorkspaceForUser", () => {
  it("crée l'espace au premier login avec les valeurs par défaut, puis est idempotent", async () => {
    const deps = createTestDependencies({ plan: "PREMIUM" });
    const uc = new EnsureWorkspaceForUser(deps);
    const first = unwrap(await uc.execute({ userId: asUserId("u1") }));
    expect(first.created).toBe(true);
    expect(first.workspace).toMatchObject({
      currency: "EUR",
      locale: "fr",
      skuPrefix: "CH",
      plan: "PREMIUM",
      targetMargin: { kind: "PERCENT", value: 30 },
    });
    const second = unwrap(await uc.execute({ userId: asUserId("u1") }));
    expect(second.created).toBe(false);
    expect(second.workspace.id).toBe(first.workspace.id);
  });

  it("ne réécrit jamais le plan aux logins suivants : il appartient à la facturation", async () => {
    const { deps, scope } = await setup({ plan: "FREE" });
    deps.billing.setPlan("PRO");
    const r = unwrap(await new EnsureWorkspaceForUser(deps).execute({ userId: scope.actorUserId }));
    expect(r.created).toBe(false);
    expect(r.workspace.plan).toBe("FREE");
  });
});

describe("UpdateWorkspaceSettings", () => {
  it("met à jour le préfixe SKU, la marge cible et les surcharges de frais", async () => {
    const s = await setup();
    const r = unwrap(
      await new UpdateWorkspaceSettings(s.deps).execute({
        ...s.scope,
        skuPrefix: "vt",
        targetMargin: { kind: "AMOUNT_MINOR", value: 1500 },
        feeOverrides: { VINTED: { percent: 5, fixedMinor: 70 } },
      }),
    );
    expect(r.workspace.skuPrefix).toBe("VT");
    expect(r.workspace.targetMargin).toEqual({ kind: "AMOUNT_MINOR", value: 1500 });
    expect(r.feeOverrides.VINTED).toEqual({ percent: 5, fixedMinor: 70 });
  });

  it("refuse un préfixe invalide (ValidationFailed) et un acteur étranger (Forbidden)", async () => {
    const s = await setup();
    expectErr(
      await new UpdateWorkspaceSettings(s.deps).execute({ ...s.scope, skuPrefix: "TROPLONG" }),
      ValidationFailed,
    );
    expectErr(
      await new UpdateWorkspaceSettings(s.deps).execute({ ...s.scope, ...intruder, name: "X" }),
      Forbidden,
    );
  });

  it("refuse de changer de devise quand des pièces existent", async () => {
    const s = await setup();
    await chine(s, 20);
    expectErr(
      await new UpdateWorkspaceSettings(s.deps).execute({ ...s.scope, currency: "USD" }),
      ValidationFailed,
    );
  });
});
