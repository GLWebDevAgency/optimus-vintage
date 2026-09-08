/**
 * Jeu de données de démonstration (développement et e2e uniquement).
 *
 *   pnpm --filter @chine/web seed
 *
 * Crée l'utilisateur demo@chine.app / Chine-demo-2026! via Better Auth, puis — par les cas
 * d'usage, comme le ferait l'app — quatre sources, une soixantaine de pièces, des annonces et
 * une trentaine de ventes sur les trois derniers mois, dont l'exemple Lacoste
 * (achetée 20 €, vendue 75 € sur Vinted, port 4,95 €, emballage 0,40 €, prix neuf 250 €).
 * Idempotent : si l'espace de démo contient déjà des sources, le script ne fait rien.
 */
import { authSchema, createAppDependencies } from "@chine/infrastructure";
import { eq } from "drizzle-orm";

if (process.env.NODE_ENV === "production") {
  console.error("Refus : le jeu de données de démonstration ne s'installe pas en production.");
  process.exit(1);
}

const [
  {
    ChangeItemStatus,
    CreateItem,
    CreatePurchaseSource,
    GeneratePiecesForSource,
    ReceivePurchaseSource,
    RecordSale,
    RefundSale,
    UpdateItem,
    UpdateWorkspaceSettings,
  },
  { Money, asItemId, asSaleId, asSourceId, asUserId, asWorkspaceId, toIsoDate },
  { createAuth },
  { ensureWorkspace },
  { saveWorkspacePreferences },
  { getEnv },
] = await Promise.all([
  import("@chine/application"),
  import("@chine/domain"),
  import("../src/lib/auth"),
  import("../src/lib/api/workspace"),
  import("../src/lib/db/queries"),
  import("../src/lib/env"),
]);

type Category = import("@chine/domain").Category;
type Platform = import("@chine/domain").Platform;
type Result<T> = import("@chine/domain").Result<T, import("@chine/domain").DomainError>;

export const DEMO_EMAIL = "demo@chine.app";
export const DEMO_PASSWORD = "Chine-demo-2026!";

/* ───────────── Aides ───────────── */

/** Générateur pseudo-aléatoire déterministe : deux exécutions produisent le même jeu. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
const random = rng(20_260_908);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(random() * xs.length)] as T;
const between = (min: number, max: number): number => Math.round(min + random() * (max - min));

const eur = (amount: number) => Money.of(amount, "EUR").toJSON();
const daysAgo = (days: number, hour = 10): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, between(0, 59), 0, 0);
  return d;
};

/** Horloge pilotable : les pièces et ventes portent des dates réparties sur trois mois. */
class SeedClock {
  current = new Date();
  now(): Date {
    return this.current;
  }
}

function unwrap<T>(r: Result<T>, what: string): T {
  if (!r.ok) throw new Error(`${what} : ${r.error.code} — ${r.error.message}`);
  return r.value;
}

/* ───────────── Catalogue ───────────── */

const BRANDS = [
  "Levi's",
  "Carhartt",
  "Lacoste",
  "Ralph Lauren",
  "Nike",
  "Adidas",
  "Burberry",
  "Tommy Hilfiger",
  "The North Face",
  "Patagonia",
  "Dickies",
  "Wrangler",
];
const COLORS = ["noir", "bleu marine", "beige", "vert", "bordeaux", "gris", "écru", "camel"];
const SIZES = ["S", "M", "L", "XL", "W32 L32", "W34 L34"];
const TITLES: Readonly<Record<string, string[]>> = {
  JACKET: ["Veste en jean", "Blouson harrington", "Veste de travail", "Coach jacket"],
  KNITWEAR: ["Pull col rond", "Cardigan en laine", "Pull torsadé", "Pull col zippé"],
  JEANS: ["Jean 501", "Jean droit", "Jean carpenter", "Jean bootcut"],
  SHIRT: ["Chemise oxford", "Surchemise flanelle", "Chemise rayée", "Chemise en lin"],
  TSHIRT: ["T-shirt logo", "T-shirt rayé", "T-shirt brodé", "T-shirt tour 1998"],
  SWEATSHIRT: ["Sweat à capuche", "Sweat col rond", "Sweat demi-zip", "Sweat université"],
  POLO: ["Polo piqué", "Polo manches longues", "Polo rugby"],
  COAT: ["Trench", "Manteau en laine", "Parka"],
  SNEAKERS: ["Baskets Air Max", "Baskets Samba", "Baskets Gazelle"],
};

/* ───────────── Script ───────────── */

const env = getEnv();
const deps = await createAppDependencies(process.env);
const clock = new SeedClock();
const seeded = { ...deps, clock };

try {
  // 1. Utilisateur de démo (Better Auth) et son espace.
  const auth = createAuth({ deps, env, nextCookies: false });
  let user = await deps.database.db.query.user.findFirst({
    columns: { id: true },
    where: eq(authSchema.user.email, DEMO_EMAIL),
  });
  if (!user) {
    const created = await auth.api.signUpEmail({
      body: { name: "Démo", email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    user = { id: created.user.id };
    console.log(`Utilisateur créé : ${DEMO_EMAIL}`);
  } else {
    console.log(`Utilisateur existant : ${DEMO_EMAIL}`);
  }
  const userId = asUserId(user.id);
  const { workspace } = await ensureWorkspace(deps, user.id, "Friperie Démo");
  const workspaceId = asWorkspaceId(workspace.id);
  const scope = { workspaceId, actorUserId: userId };

  if ((await deps.sources.list(workspaceId, { limit: 1 })).length > 0) {
    console.log("L'espace de démo contient déjà des données : rien à faire.");
    process.exit(0);
  }

  // 2. Réglages : marge cible 60 %, objectif mensuel 1 500 €, frais Vinted par défaut.
  clock.current = daysAgo(95);
  const settings = unwrap(
    await new UpdateWorkspaceSettings(seeded).execute({
      ...scope,
      name: "Friperie Démo",
      targetMargin: { kind: "PERCENT", value: 60 },
      skuPrefix: "CH",
    }),
    "réglages",
  );
  await saveWorkspacePreferences(deps.database.db, workspaceId, {
    monthlyGoalMinor: 150_000,
    dormantThresholdDays: 30,
  });

  // 3. Sources.
  const createSource = new CreatePurchaseSource(seeded);
  const receive = new ReceivePurchaseSource(seeded);
  const generate = new GeneratePiecesForSource(seeded);
  const createItem = new CreateItem(seeded);
  const updateItem = new UpdateItem(seeded);
  const changeStatus = new ChangeItemStatus(seeded);
  const recordSale = new RecordSale(seeded);
  const refundSale = new RefundSale(seeded);

  const itemIds: { id: string; sourceId: string; cost: number }[] = [];

  // Palette Eureka : 30 pièces annoncées, 28 reçues, réparties au poids par lots de catégorie.
  clock.current = daysAgo(88);
  const palette = unwrap(
    await createSource.execute({
      ...scope,
      kind: "PALLET",
      name: "Palette Eureka",
      supplierName: "Eureka",
      supplierKind: "WHOLESALER",
      purchasedAt: toIsoDate(clock.current),
      goodsCost: eur(420),
      extraCosts: eur(60),
      announcedQuantity: 30,
      weightKg: 42,
      location: { label: "Entrepôt Eureka · Rouen", point: { lat: 49.44, lng: 1.09 } },
      notes: "Palette mixte homme, tri A/B.",
    }),
    "Palette Eureka",
  ).source;
  clock.current = daysAgo(86);
  unwrap(
    await receive.execute({ ...scope, sourceId: asSourceId(palette.id), receivedQuantity: 28 }),
    "réception palette",
  );
  for (const [category, count] of [
    ["JACKET", 10],
    ["KNITWEAR", 8],
    ["JEANS", 6],
    ["SHIRT", 4],
  ] as const) {
    clock.current = daysAgo(85 - itemIds.length / 10);
    const out = unwrap(
      await generate.execute({
        ...scope,
        sourceId: asSourceId(palette.id),
        count,
        category,
        condition: "GOOD",
      }),
      `pièces ${category}`,
    );
    for (const i of out.items)
      itemIds.push({ id: i.id, sourceId: palette.id, cost: i.acquisitionCost.minor });
  }

  // Ballot Fleek : 16 pièces, réparties à parts égales.
  clock.current = daysAgo(60);
  const ballot = unwrap(
    await createSource.execute({
      ...scope,
      kind: "LOT",
      name: "Ballot Fleek",
      supplierName: "Fleek",
      supplierKind: "ONLINE_B2B",
      purchasedAt: toIsoDate(clock.current),
      goodsCost: eur(190),
      extraCosts: eur(19),
      announcedQuantity: 16,
      notes: "Ballot streetwear années 90-2000.",
    }),
    "Ballot Fleek",
  ).source;
  clock.current = daysAgo(57);
  unwrap(
    await receive.execute({ ...scope, sourceId: asSourceId(ballot.id), receivedQuantity: 16 }),
    "réception ballot",
  );
  for (const [category, count] of [
    ["TSHIRT", 6],
    ["SWEATSHIRT", 6],
    ["POLO", 4],
  ] as const) {
    clock.current = daysAgo(56);
    const out = unwrap(
      await generate.execute({
        ...scope,
        sourceId: asSourceId(ballot.id),
        count,
        category,
        condition: "VERY_GOOD",
      }),
      `pièces ${category}`,
    );
    for (const i of out.items)
      itemIds.push({ id: i.id, sourceId: ballot.id, cost: i.acquisitionCost.minor });
  }

  // Vide-grenier Bois-Guillaume : quatre trouvailles, dont la Lacoste à 20 €.
  clock.current = daysAgo(40, 8);
  const brocante = unwrap(
    await createSource.execute({
      ...scope,
      kind: "PICKING",
      name: "Vide-grenier Bois-Guillaume",
      supplierKind: "FLEA_MARKET",
      purchasedAt: toIsoDate(clock.current),
      goodsCost: eur(45),
      location: { label: "Vide-grenier · Bois-Guillaume", point: { lat: 49.47, lng: 1.12 } },
      notes: "Un dimanche pluvieux, très bonnes affaires.",
    }),
    "Vide-grenier",
  ).source;
  const finds: {
    title: string;
    brand: string;
    category: Category;
    cost: number;
    retail?: number;
    target: number;
    size: string;
    era?: "1990s" | "2000s";
  }[] = [
    {
      title: "Ensemble survêtement Lacoste vintage",
      brand: "Lacoste",
      category: "TRACKSUIT",
      cost: 20,
      retail: 250,
      target: 75,
      size: "L",
      era: "1990s",
    },
    {
      title: "Veste en jean Levi's Trucker",
      brand: "Levi's",
      category: "JACKET",
      cost: 12,
      retail: 120,
      target: 45,
      size: "M",
      era: "1990s",
    },
    {
      title: "Polo Ralph Lauren brodé",
      brand: "Ralph Lauren",
      category: "POLO",
      cost: 8,
      retail: 110,
      target: 28,
      size: "L",
    },
    {
      title: "Sweat Nike demi-zip",
      brand: "Nike",
      category: "SWEATSHIRT",
      cost: 5,
      retail: 70,
      target: 32,
      size: "XL",
      era: "2000s",
    },
  ];
  let lacosteId = "";
  for (const f of finds) {
    clock.current = daysAgo(40, 9);
    const out = unwrap(
      await createItem.execute({
        ...scope,
        sourceId: asSourceId(brocante.id),
        title: f.title,
        brand: f.brand,
        category: f.category,
        condition: "EXCELLENT",
        size: f.size,
        era: f.era,
        colors: [pick(COLORS)],
        acquisitionCost: eur(f.cost),
        retailPrice: f.retail === undefined ? undefined : eur(f.retail),
        targetPrice: eur(f.target),
        gender: "MEN",
      }),
      f.title,
    );
    if (f.brand === "Lacoste") lacosteId = out.item.id;
    itemIds.push({ id: out.item.id, sourceId: brocante.id, cost: f.cost * 100 });
  }

  // Picking Eureka : six pièces choisies à la pièce.
  clock.current = daysAgo(21, 11);
  const picking = unwrap(
    await createSource.execute({
      ...scope,
      kind: "PICKING",
      name: "Picking Eureka",
      supplierName: "Eureka",
      supplierKind: "WHOLESALER",
      purchasedAt: toIsoDate(clock.current),
      goodsCost: eur(85),
      location: { label: "Entrepôt Eureka · Rouen", point: { lat: 49.44, lng: 1.09 } },
    }),
    "Picking Eureka",
  ).source;
  const picks: { category: Category; cost: number; target: number }[] = [
    { category: "COAT", cost: 22, target: 79 },
    { category: "COAT", cost: 18, target: 65 },
    { category: "SNEAKERS", cost: 15, target: 55 },
    { category: "JACKET", cost: 12, target: 49 },
    { category: "KNITWEAR", cost: 10, target: 35 },
    { category: "JEANS", cost: 8, target: 32 },
  ];
  for (const p of picks) {
    const out = unwrap(
      await createItem.execute({
        ...scope,
        sourceId: asSourceId(picking.id),
        title: `${pick(TITLES[p.category] ?? ["Pièce"])} ${pick(BRANDS)}`,
        brand: pick(BRANDS),
        category: p.category,
        condition: pick(["VERY_GOOD", "EXCELLENT", "GOOD"] as const),
        size: pick(SIZES),
        colors: [pick(COLORS)],
        acquisitionCost: eur(p.cost),
        targetPrice: eur(p.target),
      }),
      "pièce picking",
    );
    itemIds.push({ id: out.item.id, sourceId: picking.id, cost: p.cost * 100 });
  }

  // 4. Fiches : les pièces générées reçoivent un titre, une marque, une taille et un prix cible.
  const generated = itemIds.filter((i) => i.sourceId === palette.id || i.sourceId === ballot.id);
  for (const [index, entry] of generated.entries()) {
    const item = await deps.items.byId(workspaceId, asItemId(entry.id));
    if (!item) continue;
    clock.current = daysAgo(
      index < 28 ? 84 - Math.floor(index / 4) : 55 - Math.floor((index - 28) / 4),
      14,
    );
    const brand = pick(BRANDS);
    unwrap(
      await updateItem.execute({
        ...scope,
        itemId: asItemId(entry.id),
        title: `${pick(TITLES[item.category] ?? ["Pièce"])} ${brand}`,
        brand,
        size: pick(SIZES),
        colors: [pick(COLORS)],
        targetPrice: eur(
          between(Math.max(12, entry.cost / 100 + 10), Math.max(25, (entry.cost / 100) * 4)),
        ),
        ...(random() < 0.5 ? { retailPrice: eur(between(60, 180)) } : {}),
      }),
      "fiche",
    );
  }

  // 5. Ventes : une trentaine sur trois mois, la Lacoste en tête d'affiche.
  const platforms: readonly Platform[] = [
    "VINTED",
    "VINTED",
    "VINTED",
    "VINTED",
    "VESTIAIRE",
    "LEBONCOIN",
    "DEPOP",
    "IN_PERSON",
  ];
  const buyers = [
    "marine_76",
    "theo.dc",
    "lila_vintage",
    "nathan.r",
    "camille_b",
    "jules76",
    "ines.mrt",
  ];
  const candidates = itemIds.filter((i) => i.id !== lacosteId);
  const toSell = [...candidates].sort(() => random() - 0.5).slice(0, 29);
  let salesCount = 0;
  let refundedId: string | undefined;
  for (const [index, entry] of toSell.entries()) {
    const days = between(2, 88);
    clock.current = daysAgo(days, between(9, 21));
    const platform = pick(platforms);
    const gross = Math.max(
      12,
      Math.round((entry.cost / 100) * (2 + random() * 3) + between(5, 25)),
    );
    const sale = unwrap(
      await recordSale.execute({
        ...scope,
        itemId: asItemId(entry.id),
        platform,
        grossPrice: eur(gross),
        soldAt: toIsoDate(clock.current),
        shippingCost: platform === "IN_PERSON" ? eur(0) : eur(pick([3.5, 4.95, 5.9, 6.9])),
        packagingCost: platform === "IN_PERSON" ? eur(0) : eur(pick([0.3, 0.4, 0.6])),
        status: index === 0 ? "PENDING" : "COMPLETED",
        ...(random() < 0.7 ? { buyer: pick(buyers) } : {}),
      }),
      "vente",
    ).sale;
    salesCount += 1;
    if (index === 3) refundedId = sale.id;
  }
  clock.current = daysAgo(10, 18);
  unwrap(
    await recordSale.execute({
      ...scope,
      itemId: asItemId(lacosteId),
      platform: "VINTED",
      grossPrice: eur(75),
      soldAt: toIsoDate(clock.current),
      shippingCost: eur(4.95),
      packagingCost: eur(0.4),
      buyer: "marine_76",
      notes: "Envoi Mondial Relay, acheteuse ravie.",
    }),
    "vente Lacoste",
  );
  salesCount += 1;
  if (refundedId) {
    clock.current = daysAgo(1, 12);
    unwrap(await refundSale.execute({ ...scope, saleId: asSaleId(refundedId) }), "remboursement");
  }

  // 6. Quelques annonces en ligne sur les pièces restantes.
  const remaining = candidates.filter((c) => !toSell.includes(c)).slice(0, 8);
  for (const entry of remaining) {
    clock.current = daysAgo(between(1, 12), 19);
    const item = await deps.items.byId(workspaceId, asItemId(entry.id));
    if (!item?.isSellable) continue;
    unwrap(
      await changeStatus.execute({
        ...scope,
        itemId: asItemId(entry.id),
        action: "LIST",
        platform: pick(["VINTED", "VINTED", "LEBONCOIN"] as const),
        price: item.targetPrice?.toJSON() ?? eur(Math.max(15, (entry.cost / 100) * 3)),
      }),
      "annonce",
    );
  }

  console.log(
    `Espace « ${settings.workspace.name} » : 4 sources, ${itemIds.length} pièces, ${salesCount} ventes, ${remaining.length} annonces.`,
  );
  console.log(`Connexion : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} finally {
  await deps.database.close();
}
