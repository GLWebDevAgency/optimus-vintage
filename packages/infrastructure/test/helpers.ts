/** Base PGlite en mémoire migrée + fabriques d'agrégats pour les tests. */
import {
  asItemId,
  asListingId,
  asSaleId,
  asSourceId,
  asUserId,
  asWorkspaceId,
  Item,
  type ItemId,
  type ItemProps,
  Listing,
  Money,
  PurchaseSource,
  type PurchaseSourceProps,
  Sale,
  ScheduleFeePolicy,
  type SourceId,
  type UserId,
  unwrap,
  Workspace,
  type WorkspaceId,
} from "@chine/domain";
import { createDatabase, type Database } from "../src/db/client.js";
import { UuidV7Generator } from "../src/ids.js";
import { createRepositories, type DrizzleRepositories } from "../src/repositories/index.js";

export const ids = new UuidV7Generator();
export const NOW = new Date("2026-09-08T10:00:00.000Z");

export interface TestDb {
  readonly database: Database;
  readonly repos: DrizzleRepositories;
  close(): Promise<void>;
}

export async function testDb(): Promise<TestDb> {
  const database = await createDatabase({ inMemory: true });
  await database.migrate();
  return { database, repos: createRepositories(database.db), close: () => database.close() };
}

export function makeWorkspace(
  over: Partial<Parameters<typeof Workspace.create>[0]> = {},
): Workspace {
  // Un propriétaire = un espace (index unique) : chaque espace de test a son propre utilisateur.
  const id = asWorkspaceId(ids.next());
  return Workspace.create({
    id,
    ownerId: asUserId(`user_${id}`),
    name: "Friperie Test",
    currency: "EUR",
    locale: "fr",
    targetMargin: { kind: "PERCENT", value: 60 },
    plan: "FREE",
    skuPrefix: "CH",
    createdAt: NOW,
    ...over,
  });
}

export function makeSource(
  workspaceId: WorkspaceId,
  over: Partial<Omit<PurchaseSourceProps, "id" | "workspaceId">> = {},
): PurchaseSource {
  return unwrap(
    PurchaseSource.create({
      id: asSourceId(ids.next()),
      workspaceId,
      kind: "LOT",
      name: "Lot Eureka septembre",
      supplierName: "Eureka",
      supplierKind: "WHOLESALER",
      purchasedAt: "2026-09-01",
      goodsCost: Money.of(180, "EUR"),
      extraCosts: Money.of(20, "EUR"),
      announcedQuantity: 30,
      weightKg: 12.5,
      location: { label: "Lyon", point: { lat: 45.76, lng: 4.84 } },
      notes: "Ballot mixte",
      now: NOW,
      ...over,
    }),
  );
}

let skuSeq = 0;
export function makeItem(
  workspaceId: WorkspaceId,
  sourceId: SourceId,
  over: Partial<Omit<ItemProps, "id" | "workspaceId" | "sourceId">> & { now?: Date } = {},
): Item {
  skuSeq += 1;
  const { now, ...rest } = over;
  return unwrap(
    Item.create({
      id: asItemId(ids.next()),
      workspaceId,
      sourceId,
      sku: `CH-${String(skuSeq).padStart(4, "0")}`,
      title: "Survêtement Lacoste vintage",
      brand: "Lacoste",
      category: "TRACKSUIT",
      gender: "MEN",
      size: "L",
      condition: "VERY_GOOD",
      era: "1990s",
      colors: ["navy", "green"],
      materials: ["polyester"],
      measurements: { chestCm: 56, lengthCm: 68 },
      acquisitionCost: Money.of(6.67, "EUR"),
      retailPrice: Money.of(150, "EUR"),
      targetPrice: Money.of(45, "EUR"),
      photos: [
        { id: "ph_1" as never, key: `${workspaceId}/photo-1.jpg`, width: 1200, height: 1600 },
      ],
      bin: "A3",
      notes: "Crocodile brodé",
      now: now ?? NOW,
      ...rest,
    }),
  );
}

export function makeListing(workspaceId: WorkspaceId, itemId: ItemId): Listing {
  return Listing.create({
    id: asListingId(ids.next()),
    workspaceId,
    itemId,
    platform: "VINTED",
    price: Money.of(49, "EUR"),
    listedAt: "2026-09-05",
    url: "https://www.vinted.fr/items/123",
  });
}

export const feePolicy = new ScheduleFeePolicy();

export function makeSale(
  workspaceId: WorkspaceId,
  itemId: ItemId,
  sourceId: SourceId,
  over: Partial<Parameters<typeof Sale.record>[0]> = {},
): Sale {
  return unwrap(
    Sale.record(
      {
        id: asSaleId(ids.next()),
        workspaceId,
        itemId,
        sourceId,
        platform: "VESTIAIRE",
        grossPrice: Money.of(120, "EUR"),
        acquisitionCost: Money.of(6.67, "EUR"),
        soldAt: "2026-09-07",
        shippingCost: Money.of(4.5, "EUR"),
        packagingCost: Money.of(0.8, "EUR"),
        buyer: "marie_l",
        notes: "Envoi Mondial Relay",
        now: NOW,
        ...over,
      },
      feePolicy,
    ),
  );
}

export const user = (s: string): UserId => asUserId(s);
