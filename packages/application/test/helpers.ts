import { asUserId, type DomainError, Money, type Plan, type Result, unwrap } from "@chine/domain";
import { expect } from "vitest";
import {
  CreateItem,
  type CreateItemOutput,
  CreatePurchaseSource,
  EnsureWorkspaceForUser,
  type SourceDto,
  type WorkspaceScoped,
} from "../src/index.js";
import { createTestDependencies, type TestDependencies } from "../src/testing/index.js";

export interface Scenario {
  readonly deps: TestDependencies;
  readonly scope: WorkspaceScoped;
}

/** Espace prêt à l'emploi (propriétaire `user-owner`), sur le plan demandé. */
export async function setup(opts: { plan?: Plan; now?: Date } = {}): Promise<Scenario> {
  const deps = createTestDependencies({
    plan: opts.plan ?? "FREE",
    ...(opts.now ? { now: opts.now } : {}),
  });
  const owner = asUserId("user-owner");
  const r = unwrap(
    await new EnsureWorkspaceForUser(deps).execute({ userId: owner, name: "Atelier Chiné" }),
  );
  deps.events.clear();
  return { deps, scope: { workspaceId: r.workspace.id, actorUserId: owner } };
}

export const eur = (amount: number): Money => Money.of(amount, "EUR");
export const intruder = { actorUserId: asUserId("user-intruder") };

export async function createLot(
  s: Scenario,
  opts: { goods?: number; extra?: number; quantity?: number } = {},
): Promise<SourceDto> {
  return unwrap(
    await new CreatePurchaseSource(s.deps).execute({
      ...s.scope,
      kind: "LOT",
      name: "Lot Eureka",
      supplierKind: "WHOLESALER",
      purchasedAt: "2026-09-01",
      goodsCost: eur(opts.goods ?? 100),
      extraCosts: eur(opts.extra ?? 10),
      announcedQuantity: opts.quantity ?? 10,
    }),
  ).source;
}

/** « Chiner » : capture rapide d'une pièce en brocante. */
export async function chine(
  s: Scenario,
  pricePaid: number,
  extra: Partial<Parameters<CreateItem["execute"]>[0]> = {},
): Promise<CreateItemOutput> {
  return unwrap(
    await new CreateItem(s.deps).execute({
      ...s.scope,
      title: "Survêtement Lacoste",
      brand: "Lacoste",
      category: "TRACKSUIT",
      condition: "VERY_GOOD",
      quickCapture: { pricePaid: eur(pricePaid) },
      ...extra,
    }),
  );
}

/** Affirme l'échec et renvoie l'erreur typée. */
export function expectErr<E extends DomainError>(
  r: Result<unknown, DomainError>,
  ctor: new (...args: never[]) => E,
): E {
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error("Résultat ok inattendu");
  expect(r.error).toBeInstanceOf(ctor);
  return r.error as E;
}
