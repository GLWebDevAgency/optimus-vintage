/**
 * Faux `/api/v1` en mémoire pour Playwright : implémente les routes du contrat avec des données
 * de démonstration (ou vides). Sert à capturer les écrans et à exercer les parcours de l'interface
 * sans base de données. L'authentification reste réelle (Better Auth, adaptateur mémoire).
 */
import type { Page, Route } from "@playwright/test";

type Money = { minor: number; currency: "EUR" };
const eur = (minor: number): Money => ({ minor, currency: "EUR" });
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const iso = (d = new Date()) => d.toISOString();

type Fee = { percent: number; fixedMinor: number; minMinor?: number };
type PlatformKey =
  | "VINTED"
  | "VESTIAIRE"
  | "LEBONCOIN"
  | "DEPOP"
  | "EBAY"
  | "ETSY"
  | "WHATNOT"
  | "INSTAGRAM"
  | "IN_PERSON"
  | "OTHER";
const FEES: Record<PlatformKey, Fee> = {
  VINTED: { percent: 0, fixedMinor: 0 },
  VESTIAIRE: { percent: 20, fixedMinor: 0, minMinor: 1500 },
  LEBONCOIN: { percent: 0, fixedMinor: 0 },
  DEPOP: { percent: 13.3, fixedMinor: 45 },
  EBAY: { percent: 0, fixedMinor: 0 },
  ETSY: { percent: 10.9, fixedMinor: 47 },
  WHATNOT: { percent: 10.9, fixedMinor: 30 },
  INSTAGRAM: { percent: 0, fixedMinor: 0 },
  IN_PERSON: { percent: 0, fixedMinor: 0 },
  OTHER: { percent: 0, fixedMinor: 0 },
};
const feesFor = (platform: string, gross: number) => {
  const s: Fee = FEES[platform as PlatformKey] ?? FEES.OTHER;
  if (gross <= 0) return 0;
  let f = Math.round((gross * s.percent) / 100) + s.fixedMinor;
  if (s.minMinor !== undefined) f = Math.max(f, s.minMinor);
  return Math.min(f, gross);
};

interface Photo {
  id: string;
  key: string;
  url: string;
  thumbnailUrl: string;
}
interface Item {
  id: string;
  sku: string;
  title: string;
  brand?: string;
  category: string;
  size?: string;
  condition: string;
  era?: string;
  colors: string[];
  materials: string[];
  acquisitionCost: Money;
  retailPrice?: Money;
  targetPrice?: Money;
  status: string;
  photos: Photo[];
  bin?: string;
  notes?: string;
  createdAt: string;
  sourceId: string;
  listing?: { platform: string; price: Money; listedAt: string; url?: string };
  clientId?: string;
}
interface Source {
  id: string;
  kind: string;
  name: string;
  supplierName?: string;
  supplierKind: string;
  purchasedAt: string;
  goodsCost: Money;
  extraCosts: Money;
  announcedQuantity?: number;
  receivedQuantity?: number;
  weightKg?: number;
  location?: { label: string };
  allocationPolicy: string;
  notes?: string;
  createdAt: string;
}
interface Sale {
  id: string;
  number: number;
  itemId: string;
  platform: string;
  grossPrice: Money;
  shippingCost: Money;
  packagingCost: Money;
  otherCosts: Money;
  feesOverride?: Money;
  soldAt: string;
  status: string;
  buyer?: string;
  notes?: string;
  createdAt: string;
}

type BodyKey =
  | "name"
  | "currency"
  | "locale"
  | "targetMargin"
  | "skuPrefix"
  | "dormantThresholdDays"
  | "monthlyGoal"
  | "feeOverrides"
  | "receivedQuantity"
  | "count"
  | "titlePrefix"
  | "category"
  | "condition"
  | "clientId"
  | "sourceId"
  | "acquisitionCost"
  | "mode"
  | "pricePaid"
  | "locationLabel"
  | "supplierKind"
  | "purchasedAt"
  | "photoKeys"
  | "title"
  | "brand"
  | "size"
  | "retailPrice"
  | "targetPrice"
  | "notes"
  | "action"
  | "platform"
  | "price"
  | "url"
  | "reason"
  | "restock"
  | "photoIds"
  | "key"
  | "itemId"
  | "grossPrice"
  | "shippingCost"
  | "packagingCost"
  | "otherCosts"
  | "platformFeesOverride"
  | "soldAt"
  | "status"
  | "buyer"
  | "goodsCost"
  | "extraCosts"
  | "announcedQuantity"
  | "weightKg"
  | "location"
  | "allocationPolicy"
  | "kind"
  | "supplierName";
/** Corps de requête : clés connues du contrat, valeurs non typées (le faux ne valide pas). */
type Body = Partial<Record<BodyKey, unknown>>;

export interface FakeState {
  workspace: {
    id: string;
    name: string;
    currency: "EUR";
    locale: "fr" | "en" | "de";
    skuPrefix: string;
    targetMargin: { kind: "PERCENT"; value: number } | { kind: "AMOUNT_MINOR"; value: number };
    plan: "FREE" | "PREMIUM";
    dormantThresholdDays: number;
    monthlyGoal?: Money;
    createdAt: string;
  };
  user: { id: string; email: string; name: string };
  feeOverrides: Record<string, { percent: number; fixedMinor: number; minMinor?: number }>;
  sources: Source[];
  items: Item[];
  sales: Sale[];
  appraisals: Record<string, unknown>[];
  seq: number;
}

let photoSeq = 0;
const photoUrl = (origin: string, hue: number) => `${origin}/__fake/photo-${hue}-${++photoSeq}.svg`;

export function emptyState(origin: string, user: { email: string; name: string }): FakeState {
  void origin;
  return {
    workspace: {
      id: "ws_1",
      name: `Friperie ${user.name}`,
      currency: "EUR",
      locale: "fr",
      skuPrefix: "CH",
      targetMargin: { kind: "PERCENT", value: 100 },
      plan: "FREE",
      dormantThresholdDays: 30,
      createdAt: iso(),
    },
    user: { id: "u_1", ...user },
    feeOverrides: {},
    sources: [],
    items: [],
    sales: [],
    appraisals: [],
    seq: 0,
  };
}

/** Données de démonstration proches des maquettes (docs/design/selvedge-identity.html). */
export function demoState(origin: string, user: { email: string; name: string }): FakeState {
  const s = emptyState(origin, user);
  s.workspace.monthlyGoal = eur(200_000);
  s.workspace.plan = "PREMIUM";
  const mk = (id: string, hue: number): Photo => ({
    id: `ph_${id}`,
    key: `items/${id}.jpg`,
    url: photoUrl(origin, hue),
    thumbnailUrl: photoUrl(origin, hue),
  });
  s.sources = [
    {
      id: "src_eureka",
      kind: "PALLET",
      name: "Palette Eureka",
      supplierName: "Eureka Textiles",
      supplierKind: "WHOLESALER",
      purchasedAt: daysAgo(40),
      goodsCost: eur(22_000),
      extraCosts: eur(2_000),
      announcedQuantity: 50,
      receivedQuantity: 48,
      weightKg: 12,
      location: { label: "Rouen" },
      allocationPolicy: "EVEN",
      createdAt: iso(),
    },
    {
      id: "src_fleek",
      kind: "LOT",
      name: "Ballot Fleek #A31",
      supplierName: "Fleek",
      supplierKind: "ONLINE_B2B",
      purchasedAt: daysAgo(6),
      goodsCost: eur(16_500),
      extraCosts: eur(1_500),
      announcedQuantity: 30,
      allocationPolicy: "EVEN",
      createdAt: iso(),
    },
    {
      id: "src_vg",
      kind: "UNIT",
      name: "Vide-grenier Bois-Guillaume",
      supplierKind: "FLEA_MARKET",
      purchasedAt: daysAgo(8),
      goodsCost: eur(2_000),
      extraCosts: eur(0),
      announcedQuantity: 1,
      location: { label: "Bois-Guillaume" },
      allocationPolicy: "EVEN",
      createdAt: iso(),
    },
    {
      id: "src_pick",
      kind: "PICKING",
      name: "Picking Eureka",
      supplierName: "Eureka Textiles",
      supplierKind: "WHOLESALER",
      purchasedAt: daysAgo(15),
      goodsCost: eur(12_600),
      extraCosts: eur(0),
      announcedQuantity: 14,
      allocationPolicy: "MANUAL",
      createdAt: iso(),
    },
  ];
  const item = (
    n: number,
    p: Partial<Item> & { title: string; sourceId: string; acquisitionCost: Money; status: string },
  ): Item => ({
    id: `it_${n}`,
    sku: `CH-${String(n).padStart(4, "0")}`,
    category: "JACKET",
    condition: "EXCELLENT",
    colors: [],
    materials: [],
    photos: [mk(String(n), (n * 47) % 360)],
    createdAt: iso(new Date(Date.now() - (((n * 7) % 40) + 1) * 86_400_000)),
    ...p,
  });
  s.items = [
    item(142, {
      title: "Ensemble Lacoste, 1990s",
      brand: "Lacoste",
      category: "TRACKSUIT",
      size: "L · 42",
      era: "1990s",
      materials: ["Coton piqué"],
      colors: ["Bleu marine"],
      bin: "B-07",
      acquisitionCost: eur(2_000),
      retailPrice: eur(25_000),
      targetPrice: eur(7_500),
      status: "IN_STOCK",
      sourceId: "src_vg",
      createdAt: iso(new Date(Date.now() - 8 * 86_400_000)),
    }),
    item(141, {
      title: "Polaire Patagonia Synchilla",
      brand: "Patagonia",
      category: "SWEATSHIRT",
      size: "M",
      era: "2000s",
      acquisitionCost: eur(500),
      targetPrice: eur(4_500),
      status: "LISTED",
      listing: { platform: "VINTED", price: eur(4_500), listedAt: daysAgo(3) },
      sourceId: "src_eureka",
    }),
    item(140, {
      title: "Jean Levi's 501",
      brand: "Levi's",
      category: "JEANS",
      size: "W32 L32",
      era: "1980s",
      acquisitionCost: eur(500),
      targetPrice: eur(3_800),
      status: "IN_STOCK",
      sourceId: "src_eureka",
      createdAt: iso(new Date(Date.now() - 45 * 86_400_000)),
    }),
    item(139, {
      title: "Veste Carhartt Detroit",
      brand: "Carhartt",
      category: "JACKET",
      size: "XL",
      acquisitionCost: eur(550),
      targetPrice: eur(8_900),
      status: "LISTED",
      listing: { platform: "LEBONCOIN", price: eur(8_900), listedAt: daysAgo(1) },
      sourceId: "src_fleek",
    }),
    item(138, {
      title: "Chemise Ralph Lauren rayée",
      brand: "Ralph Lauren",
      category: "SHIRT",
      size: "L",
      acquisitionCost: eur(500),
      targetPrice: eur(2_900),
      status: "RESERVED",
      sourceId: "src_eureka",
    }),
    item(137, {
      title: "Pull Nike vintage",
      brand: "Nike",
      category: "KNITWEAR",
      size: "M",
      acquisitionCost: eur(900),
      targetPrice: eur(3_500),
      status: "IN_STOCK",
      sourceId: "src_pick",
    }),
  ];
  // Pièces vendues (Eureka amortie, Fleek en cours, picking en cours).
  const sold: [number, string, number, string, string, number][] = [
    [101, "src_eureka", 4_965, "VINTED", "Ensemble Lacoste", 1],
    [102, "src_eureka", 2_210, "VINTED", "Polaire Patagonia", 1],
    [103, "src_eureka", 1_900, "LEBONCOIN", "Jean Levi's 501", 3],
    [104, "src_eureka", 3_400, "VESTIAIRE", "Blouson Schott", 5],
    [105, "src_eureka", 2_650, "VINTED", "Sweat Champion", 9],
    [106, "src_fleek", 3_900, "VINTED", "Veste The North Face", 2],
    [107, "src_fleek", 2_990, "VINTED", "Chemise Burberry", 4],
    [108, "src_pick", 6_900, "DEPOP", "Blazer Yves Saint Laurent", 6],
    [109, "src_eureka", 4_100, "VINTED", "Jean Lee vintage", 12],
    [110, "src_eureka", 2_800, "VINTED", "Polo Lacoste", 16],
    [111, "src_eureka", 7_500, "EBAY", "Manteau Burberry", 22],
  ];
  let n = 230;
  for (const [id, sourceId, gross, platform, title, ago] of sold) {
    s.items.push(
      item(id, {
        title,
        acquisitionCost: eur(
          sourceId === "src_eureka" ? 500 : sourceId === "src_fleek" ? 600 : 900,
        ),
        status: "SOLD",
        sourceId,
      }),
    );
    s.sales.push({
      id: `sale_${id}`,
      number: ++n,
      itemId: `it_${id}`,
      platform,
      grossPrice: eur(gross),
      shippingCost: eur(platform === "IN_PERSON" ? 0 : 495),
      packagingCost: eur(40),
      otherCosts: eur(0),
      soldAt: daysAgo(ago),
      status: "COMPLETED",
      buyer: ago % 2 ? "Marine_76" : undefined,
      createdAt: iso(),
    });
  }
  s.seq = 300;
  return s;
}

/* ───────────── Projections DTO ───────────── */

const economics = (sale: Sale, item: Item | undefined) => {
  const gross = sale.grossPrice.minor;
  const fees = sale.feesOverride?.minor ?? feesFor(sale.platform, gross);
  const costs = sale.shippingCost.minor + sale.packagingCost.minor + sale.otherCosts.minor;
  const net = gross - fees - costs;
  const acq = item?.acquisitionCost.minor ?? 0;
  const margin = net - acq;
  return {
    gross: eur(gross),
    fees: eur(fees),
    costs: eur(costs),
    net: eur(net),
    margin: eur(margin),
    ...(acq > 0 ? { roi: margin / acq } : {}),
    ...(gross > 0 ? { marginRate: margin / gross } : {}),
  };
};

export function saleDto(s: FakeState, sale: Sale) {
  const item = s.items.find((i) => i.id === sale.itemId);
  return {
    ...sale,
    workspaceId: s.workspace.id,
    sourceId: item?.sourceId ?? "",
    platformFees: eur(sale.feesOverride?.minor ?? feesFor(sale.platform, sale.grossPrice.minor)),
    acquisitionCost: item?.acquisitionCost ?? eur(0),
    updatedAt: sale.createdAt,
    economics: economics(sale, item),
    ...(item
      ? {
          item: {
            id: item.id,
            sku: item.sku,
            title: item.title,
            ...(item.brand ? { brand: item.brand } : {}),
            ...(item.photos[0] ? { thumbnailUrl: item.photos[0].thumbnailUrl } : {}),
            status: item.status,
          },
        }
      : {}),
  };
}

export function itemDto(s: FakeState, it: Item) {
  const ageDays = Math.floor((Date.now() - new Date(it.createdAt).getTime()) / 86_400_000);
  const source = s.sources.find((x) => x.id === it.sourceId);
  const { listing, clientId, ...rest } = it;
  void clientId;
  return {
    ...rest,
    workspaceId: s.workspace.id,
    photoUrls: it.photos.map((p) => p.url),
    updatedAt: it.createdAt,
    ...(listing ? { listedAt: iso(new Date(listing.listedAt)) } : {}),
    ...(it.retailPrice && it.retailPrice.minor > 0
      ? {
          discountVsRetail: Math.max(
            0,
            Math.min(1, 1 - (it.targetPrice?.minor ?? 0) / it.retailPrice.minor),
          ),
        }
      : {}),
    ageDays,
    isDormant:
      (it.status === "IN_STOCK" || it.status === "LISTED") &&
      ageDays >= s.workspace.dormantThresholdDays,
    activeListings: listing
      ? [
          {
            id: `lst_${it.id}`,
            itemId: it.id,
            platform: listing.platform,
            price: listing.price,
            listedAt: listing.listedAt,
            status: "ACTIVE",
            ...(listing.url ? { url: listing.url } : {}),
          },
        ]
      : [],
    ...(source ? { sourceName: source.name } : {}),
  };
}

export function sourceDto(s: FakeState, src: Source) {
  const items = s.items.filter((i) => i.sourceId === src.id);
  const invested = src.goodsCost.minor + src.extraCosts.minor;
  const sales = s.sales.filter(
    (x) => x.status === "COMPLETED" && items.some((i) => i.id === x.itemId),
  );
  const recovered = sales.reduce(
    (acc, x) =>
      acc +
      economics(
        x,
        items.find((i) => i.id === x.itemId),
      ).net.minor,
    0,
  );
  const soldCount = items.filter((i) => i.status === "SOLD").length;
  const writtenOff = items.filter((i) => i.status === "LOST" || i.status === "DONATED").length;
  const sellable = items.filter(
    (i) => i.status === "IN_STOCK" || i.status === "LISTED" || i.status === "RESERVED",
  );
  const qty = src.receivedQuantity ?? src.announcedQuantity ?? items.length;
  const remainingPieces = Math.max(0, qty - soldCount - writtenOff);
  const remaining = Math.max(0, invested - recovered);
  const stockValue = sellable.reduce((acc, i) => acc + i.acquisitionCost.minor, 0);
  return {
    ...src,
    workspaceId: s.workspace.id,
    totalInvestment: eur(invested),
    effectiveQuantity: qty,
    averageUnitCost: qty > 0 ? eur(Math.round(invested / qty)) : undefined,
    ...(src.announcedQuantity && src.receivedQuantity !== undefined
      ? { shrinkageRate: Math.max(0, 1 - src.receivedQuantity / src.announcedQuantity) }
      : {}),
    itemCount: items.length,
    updatedAt: src.createdAt,
    performance: {
      invested: eur(invested),
      recovered: eur(recovered),
      remainingToRecover: eur(remaining),
      profit: eur(recovered - invested),
      ...(invested > 0 ? { roi: (recovered - invested) / invested } : {}),
      recoveryRate: invested > 0 ? recovered / invested : 0,
      isAmortized: invested > 0 && recovered >= invested,
      soldCount,
      sellableCount: sellable.length,
      writtenOffCount: writtenOff,
      stockValueAtCost: eur(stockValue),
      ...(remainingPieces > 0 && remaining > 0
        ? { floorPriceBreakEven: eur(Math.ceil(remaining / remainingPieces)) }
        : {}),
      ...(remainingPieces > 0
        ? { floorPriceTarget: eur(Math.ceil((remaining + invested * 0.5) / remainingPieces)) }
        : {}),
    },
  };
}

export function stats(s: FakeState, from: string, to: string) {
  const sales = s.sales.filter(
    (x) => x.status === "COMPLETED" && x.soldAt >= from && x.soldAt <= to,
  );
  const ecos = sales.map((x) =>
    economics(
      x,
      s.items.find((i) => i.id === x.itemId),
    ),
  );
  const gross = ecos.reduce((a, e) => a + e.gross.minor, 0);
  const net = ecos.reduce((a, e) => a + e.net.minor, 0);
  const margin = ecos.reduce((a, e) => a + e.margin.minor, 0);
  const byPlatform = new Map<string, { count: number; net: number; margin: number }>();
  sales.forEach((x, i) => {
    const e = ecos[i];
    const cur = byPlatform.get(x.platform) ?? { count: 0, net: 0, margin: 0 };
    if (e)
      byPlatform.set(x.platform, {
        count: cur.count + 1,
        net: cur.net + e.net.minor,
        margin: cur.margin + e.margin.minor,
      });
  });
  return {
    salesCount: sales.length,
    gross: eur(gross),
    net: eur(net),
    margin: eur(margin),
    ...(gross > 0 ? { marginRate: margin / gross } : {}),
    averageTicket: eur(sales.length ? Math.round(gross / sales.length) : 0),
    refundedCount: 0,
    byPlatform: [...byPlatform.entries()].map(([platform, v]) => ({
      platform,
      count: v.count,
      net: eur(v.net),
      margin: eur(v.margin),
    })),
    byDay: [],
  };
}

function periodBounds(period: string): {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
} {
  const now = new Date();
  const to = today();
  let from: Date;
  if (period === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === "year") from = new Date(now.getFullYear(), 0, 1);
  else if (period === "7d") from = new Date(now.getTime() - 6 * 86_400_000);
  else if (period === "3m") from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  else if (period === "all") from = new Date(2000, 0, 1);
  else from = new Date(now.getTime() - 29 * 86_400_000);
  const len = now.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - len);
  const f = (d: Date) => d.toISOString().slice(0, 10);
  return { from: f(from), to, prevFrom: f(prevFrom), prevTo: f(prevTo) };
}

export function dashboardDto(s: FakeState, period: string) {
  const b = periodBounds(period);
  const current = stats(s, b.from, b.to);
  const previous = stats(s, b.prevFrom, b.prevTo);
  const change = (a: number, p: number) => (p > 0 ? (a - p) / p : undefined);
  const live = s.items.filter(
    (i) => i.status !== "SOLD" && i.status !== "LOST" && i.status !== "DONATED",
  );
  const dormant = live.filter((i) => itemDto(s, i).isDormant).length;
  const goal = s.workspace.monthlyGoal;
  return {
    period: { from: b.from, to: b.to },
    current,
    previous,
    change: {
      net: change(current.net.minor, previous.net.minor),
      margin: change(current.margin.minor, previous.margin.minor),
      salesCount: change(current.salesCount, previous.salesCount),
    },
    counts: {
      inStock: live.filter((i) => i.status === "IN_STOCK").length,
      listed: live.filter((i) => i.status === "LISTED").length,
      reserved: live.filter((i) => i.status === "RESERVED").length,
      sold: s.items.filter((i) => i.status === "SOLD").length,
      dormant,
    },
    stockValueAtCost: eur(live.reduce((a, i) => a + i.acquisitionCost.minor, 0)),
    ...(goal
      ? {
          targetMinor: undefined,
          goal: {
            targetMinor: goal.minor,
            currency: "EUR",
            progress: goal.minor > 0 ? current.margin.minor / goal.minor : 0,
          },
        }
      : {}),
    lastSales: [...s.sales]
      .sort((a, c) => (a.soldAt < c.soldAt ? 1 : -1))
      .slice(0, 5)
      .map((x) => saleDto(s, x)),
  };
}

export function fakeAppraisal(s: FakeState) {
  return {
    id: `ap_${++s.seq}`,
    workspaceId: s.workspace.id,
    provider: "fake",
    model: "fake-vision",
    createdAt: iso(),
    identification: {
      brand: "Lacoste",
      brandConfidence: 0.92,
      category: "TRACKSUIT",
      model: null,
      era: "1990s",
      materials: ["Coton piqué"],
      colors: ["Bleu marine"],
      size: "L",
      condition: "EXCELLENT",
      conditionNotes: [],
      isVintage: true,
      notableFeatures: ["Logo crocodile brodé"],
    },
    price: {
      low: eur(6_000),
      mid: eur(7_500),
      high: eur(8_500),
      retailNew: eur(25_000),
      confidence: 0.86,
      perPlatform: [{ platform: "VINTED", price: eur(7_500), daysToSell: 9 }],
    },
    market: {
      demand: "HIGH",
      trend: "RISING",
      rarity: 0.6,
      audience: ["Streetwear 90s"],
      seasonality: null,
    },
    advice: {
      action: "BUY",
      maxBuyPrice: eur(2_500),
      reasons: ["Marque recherchée", "Ensemble complet"],
      risk: 0.2,
      sellingTips: ["Photographier le logo"],
    },
    listingCopy: {
      title: "Ensemble Lacoste vintage 1990s",
      description: "Ensemble Lacoste en coton piqué…",
      hashtags: ["#lacoste", "#vintage"],
    },
    latencyMs: 1200,
    quota: { used: s.appraisals.length + 1, limit: s.workspace.plan === "FREE" ? 10 : 200 },
  };
}

export function overview(s: FakeState) {
  const items = s.items.filter(
    (i) => i.status !== "SOLD" && i.status !== "LOST" && i.status !== "DONATED",
  ).length;
  const premium = s.workspace.plan !== "FREE";
  return {
    workspace: { ...s.workspace },
    user: { ...s.user, role: "OWNER" },
    quotas: {
      items: {
        used: items,
        limit: premium ? 500 : 50,
        allowed: items < (premium ? 500 : 50),
        upgradeTo: premium ? "PRO" : "PREMIUM",
      },
      sourcesPerMonth: {
        used: s.sources.filter((x) => x.kind !== "UNIT").length,
        limit: premium ? null : 3,
      },
      aiAppraisalsPerMonth: { used: s.appraisals.length, limit: premium ? 200 : 10 },
      members: { used: 1, limit: 1 },
    },
    features: premium
      ? ["AI_APPRAISAL", "AI_LISTING_COPY", "ADVANCED_ANALYTICS", "PDF_REPORTS", "CSV_EXPORT"]
      : ["AI_APPRAISAL", "CSV_EXPORT"],
    feeOverrides: s.feeOverrides,
    feeSchedules: { ...FEES, ...s.feeOverrides },
    billing: {
      plan: s.workspace.plan,
      portalAvailable: premium,
      ...(premium
        ? { interval: "monthly", renewsAt: iso(new Date(Date.now() + 20 * 86_400_000)) }
        : {}),
    },
    workspaces: [{ id: s.workspace.id, name: s.workspace.name, role: "OWNER" }],
  };
}

function paginate<T>(rows: T[], q: URLSearchParams) {
  const limit = Number(q.get("limit") ?? 30);
  const offset = Number(q.get("offset") ?? 0);
  return { items: rows.slice(offset, offset + limit), total: rows.length, limit, offset };
}

const SVG = (hue: number) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 150'><rect width='120' height='150' fill='hsl(${hue} 30% 88%)'/><path d='M38 32 26 40 14 66l16 6-2 48h64l-2-48 16-6-12-26-12-8c-4 8-10 12-22 12S42 40 38 32z' fill='hsl(${(hue + 200) % 360} 45% 32%)' opacity='.9'/></svg>`;

/** Branche le faux serveur sur la page. Retourne l'état (modifiable par le test). */
export async function installFakeApi(page: Page, state: FakeState): Promise<FakeState> {
  const s = state;
  const json = (route: Route, data: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });
  const error = (
    route: Route,
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: { code, message, ...(details ? { details } : {}) } }),
    });

  await page.route("**/__fake/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/__fake/upload/")) return route.fulfill({ status: 200, body: "" });
    const hue = Number(/photo-(\d+)-/.exec(url.pathname)?.[1] ?? 210);
    return route.fulfill({ status: 200, contentType: "image/svg+xml", body: SVG(hue) });
  });

  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const method = req.method();
    const q = url.searchParams;
    const body: Body = (() => {
      try {
        return req.postDataJSON() as Body;
      } catch {
        return {};
      }
    })();
    const origin = url.origin;
    const seg = path.split("/").filter(Boolean);

    if (path === "/health") return json(route, { status: "ok" });
    if (path === "/me" && method === "GET") return json(route, overview(s));
    if (path === "/workspace/settings" && method === "PATCH") {
      const b = body;
      for (const k of [
        "name",
        "currency",
        "locale",
        "targetMargin",
        "skuPrefix",
        "dormantThresholdDays",
      ] as const) {
        if (b[k] !== undefined) (s.workspace as unknown as Record<string, unknown>)[k] = b[k];
      }
      if (b.monthlyGoal !== undefined)
        s.workspace.monthlyGoal = (b.monthlyGoal as Money | null) ?? undefined;
      if (b.feeOverrides) {
        for (const [p, v] of Object.entries(
          b.feeOverrides as Record<string, FakeState["feeOverrides"][string] | null>,
        )) {
          if (v === null) delete s.feeOverrides[p];
          else s.feeOverrides[p] = v;
        }
      }
      return json(route, overview(s));
    }
    if (path === "/dashboard") return json(route, dashboardDto(s, q.get("period") ?? "month"));

    /* Sources */
    if (seg[0] === "sources") {
      if (seg.length === 1 && method === "GET") {
        let rows = [...s.sources].sort((a, c) => (a.purchasedAt < c.purchasedAt ? 1 : -1));
        const kind = q.get("kind");
        if (kind) rows = rows.filter((x) => x.kind === kind);
        return json(
          route,
          paginate(
            rows.map((x) => sourceDto(s, x)),
            q,
          ),
        );
      }
      if (seg.length === 1 && method === "POST") {
        const b = body as Omit<Source, "id" | "createdAt" | "extraCosts"> & { extraCosts?: Money };
        const src: Source = {
          ...b,
          id: `src_${++s.seq}`,
          extraCosts: b.extraCosts ?? eur(0),
          allocationPolicy: b.allocationPolicy ?? "EVEN",
          createdAt: iso(),
        };
        s.sources.unshift(src);
        return json(route, sourceDto(s, src), 201);
      }
      const src = s.sources.find((x) => x.id === seg[1]);
      if (!src) return error(route, 404, "NOT_FOUND", "Source introuvable");
      if (seg.length === 2 && method === "GET") return json(route, sourceDto(s, src));
      if (seg.length === 2 && method === "PATCH") {
        for (const [k, v] of Object.entries(body))
          (src as unknown as Record<string, unknown>)[k] = v === null ? undefined : v;
        return json(route, sourceDto(s, src));
      }
      if (seg.length === 2 && method === "DELETE") {
        if (s.items.some((i) => i.sourceId === src.id))
          return error(route, 409, "INVARIANT_VIOLATION", "La source contient des pièces");
        s.sources = s.sources.filter((x) => x.id !== src.id);
        return json(route, { id: src.id, deleted: true });
      }
      if (seg[2] === "receive") {
        src.receivedQuantity = Number(body.receivedQuantity);
        return json(route, sourceDto(s, src));
      }
      if (seg[2] === "pieces") {
        const count = Number(body.count);
        const created: Item[] = [];
        const invested = src.goodsCost.minor + src.extraCosts.minor;
        const qty = src.receivedQuantity ?? src.announcedQuantity ?? count;
        for (let i = 0; i < count; i++) {
          const n = ++s.seq;
          const it: Item = {
            id: `it_${n}`,
            sku: `${s.workspace.skuPrefix}-${String(n).padStart(4, "0")}`,
            title: `${(body.titlePrefix as string | undefined) ?? src.name} · ${i + 1}`,
            category: (body.category as string | undefined) ?? "OTHER",
            condition: (body.condition as string | undefined) ?? "GOOD",
            colors: [],
            materials: [],
            acquisitionCost: eur(Math.round(invested / Math.max(1, qty))),
            status: "IN_STOCK",
            photos: [],
            createdAt: iso(),
            sourceId: src.id,
          };
          s.items.unshift(it);
          created.push(it);
        }
        return json(
          route,
          {
            items: created.map((i) => itemDto(s, i)),
            total: created.length,
            limit: count,
            offset: 0,
          },
          201,
        );
      }
    }

    /* Pièces */
    if (seg[0] === "items") {
      if (seg.length === 1 && method === "GET") {
        let rows = [...s.items];
        const status = q.getAll("status").flatMap((x) => x.split(","));
        if (status.length) rows = rows.filter((x) => status.includes(x.status));
        if (q.get("dormantOnly") === "true") rows = rows.filter((x) => itemDto(s, x).isDormant);
        const sourceId = q.get("sourceId");
        if (sourceId) rows = rows.filter((x) => x.sourceId === sourceId);
        const search = (q.get("search") ?? "").toLowerCase();
        if (search)
          rows = rows.filter((x) =>
            `${x.title} ${x.brand ?? ""} ${x.sku}`.toLowerCase().includes(search),
          );
        const sort = q.get("sort") ?? "newest";
        rows.sort((a, c) =>
          sort === "oldest"
            ? a.createdAt.localeCompare(c.createdAt)
            : sort === "cost_desc"
              ? c.acquisitionCost.minor - a.acquisitionCost.minor
              : sort === "cost_asc"
                ? a.acquisitionCost.minor - c.acquisitionCost.minor
                : sort === "title"
                  ? a.title.localeCompare(c.title)
                  : c.createdAt.localeCompare(a.createdAt),
        );
        return json(
          route,
          paginate(
            rows.map((x) => itemDto(s, x)),
            q,
          ),
        );
      }
      if (seg.length === 1 && method === "POST") {
        const b = body;
        if (b.clientId && s.items.some((i) => i.clientId === b.clientId)) {
          const existing = s.items.find((i) => i.clientId === b.clientId);
          if (existing) return json(route, itemDto(s, existing));
        }
        const n = ++s.seq;
        let sourceId = b.sourceId as string | undefined;
        let cost = (b.acquisitionCost as Money | undefined) ?? eur(0);
        if (b.mode === "quickCapture") {
          const price = b.pricePaid as Money;
          cost = price;
          const src: Source = {
            id: `src_${n}`,
            kind: "UNIT",
            name: (b.locationLabel as string | undefined) || `Chine du ${today()}`,
            supplierKind: (b.supplierKind as string) ?? "OTHER",
            purchasedAt: (b.purchasedAt as string | undefined) ?? today(),
            goodsCost: price,
            extraCosts: eur(0),
            announcedQuantity: 1,
            ...(b.locationLabel ? { location: { label: b.locationLabel as string } } : {}),
            allocationPolicy: "EVEN",
            createdAt: iso(),
          };
          s.sources.unshift(src);
          sourceId = src.id;
        }
        const keys = (b.photoKeys as string[] | undefined) ?? [];
        const it: Item = {
          id: `it_${n}`,
          sku: `${s.workspace.skuPrefix}-${String(n).padStart(4, "0")}`,
          title: (b.title as string | undefined) || `Pièce du ${today()}`,
          ...(b.brand ? { brand: b.brand as string } : {}),
          category: (b.category as string | undefined) ?? "OTHER",
          ...(b.size ? { size: b.size as string } : {}),
          condition: (b.condition as string | undefined) ?? "GOOD",
          colors: [],
          materials: [],
          acquisitionCost: cost,
          ...(b.retailPrice ? { retailPrice: b.retailPrice as Money } : {}),
          ...(b.targetPrice ? { targetPrice: b.targetPrice as Money } : {}),
          status: "IN_STOCK",
          photos: keys.map((k, i) => ({
            id: `ph_${n}_${i}`,
            key: k,
            url: photoUrl(origin, 200),
            thumbnailUrl: photoUrl(origin, 200),
          })),
          ...(b.notes ? { notes: b.notes as string } : {}),
          createdAt: iso(),
          sourceId: sourceId ?? "",
          ...(b.clientId ? { clientId: b.clientId as string } : {}),
        };
        s.items.unshift(it);
        return json(route, itemDto(s, it), 201);
      }
      const it = s.items.find((x) => x.id === seg[1]);
      if (!it) return error(route, 404, "NOT_FOUND", "Pièce introuvable");
      if (seg.length === 2 && method === "GET") return json(route, itemDto(s, it));
      if (seg.length === 2 && method === "PATCH") {
        for (const [k, v] of Object.entries(body)) {
          if (k === "photoIds" || k === "addPhotoKeys") continue;
          (it as unknown as Record<string, unknown>)[k] = v === null ? undefined : v;
        }
        return json(route, itemDto(s, it));
      }
      if (seg.length === 2 && method === "DELETE") {
        s.items = s.items.filter((x) => x.id !== it.id);
        return json(route, { id: it.id, deleted: true });
      }
      if (seg[2] === "status") {
        const action = body.action as string;
        if (action === "list") {
          it.status = "LISTED";
          it.listing = {
            platform: body.platform as string,
            price: body.price as Money,
            listedAt: today(),
            ...(body.url ? { url: body.url as string } : {}),
          };
        } else if (action === "unlist" || action === "restock") {
          it.status = "IN_STOCK";
          it.listing = undefined;
        } else if (action === "reserve") it.status = "RESERVED";
        else if (action === "writeOff") {
          it.status = body.reason === "LOST" ? "LOST" : "DONATED";
          it.listing = undefined;
        }
        return json(route, itemDto(s, it));
      }
      if (seg[2] === "photos") {
        if (method === "POST") {
          const n = ++s.seq;
          it.photos.push({
            id: `ph_${n}`,
            key: body.key as string,
            url: photoUrl(origin, 120),
            thumbnailUrl: photoUrl(origin, 120),
          });
          return json(route, itemDto(s, it));
        }
        if (method === "DELETE") {
          it.photos = it.photos.filter((p) => p.id !== seg[3]);
          return json(route, itemDto(s, it));
        }
        if (method === "PUT") {
          const ids = body.photoIds as string[];
          it.photos = ids.flatMap((id) => it.photos.filter((p) => p.id === id));
          return json(route, itemDto(s, it));
        }
      }
    }

    /* Ventes */
    if (seg[0] === "sales") {
      if (seg.length === 1 && method === "GET") {
        let rows = [...s.sales].sort((a, c) =>
          a.soldAt < c.soldAt ? 1 : a.soldAt > c.soldAt ? -1 : c.number - a.number,
        );
        const from = q.get("from");
        const to = q.get("to");
        if (from) rows = rows.filter((x) => x.soldAt >= from);
        if (to) rows = rows.filter((x) => x.soldAt <= to);
        const itemId = q.get("itemId");
        if (itemId) rows = rows.filter((x) => x.itemId === itemId);
        return json(
          route,
          paginate(
            rows.map((x) => saleDto(s, x)),
            q,
          ),
        );
      }
      if (seg.length === 1 && method === "POST") {
        const b = body;
        const item = s.items.find((i) => i.id === b.itemId);
        if (!item) return error(route, 404, "NOT_FOUND", "Pièce introuvable");
        if (item.status === "SOLD")
          return error(route, 409, "INVALID_TRANSITION", "Pièce déjà vendue");
        const sale: Sale = {
          id: `sale_${++s.seq}`,
          number: s.sales.length + 231,
          itemId: item.id,
          platform: b.platform as string,
          grossPrice: b.grossPrice as Money,
          shippingCost: (b.shippingCost as Money | undefined) ?? eur(0),
          packagingCost: (b.packagingCost as Money | undefined) ?? eur(0),
          otherCosts: (b.otherCosts as Money | undefined) ?? eur(0),
          ...(b.platformFeesOverride ? { feesOverride: b.platformFeesOverride as Money } : {}),
          soldAt: b.soldAt as string,
          status: (b.status as string | undefined) ?? "COMPLETED",
          ...(b.buyer ? { buyer: b.buyer as string } : {}),
          createdAt: iso(),
        };
        item.status = "SOLD";
        item.listing = undefined;
        s.sales.push(sale);
        return json(route, saleDto(s, sale), 201);
      }
      const sale = s.sales.find((x) => x.id === seg[1]);
      if (!sale) return error(route, 404, "NOT_FOUND", "Vente introuvable");
      if (seg.length === 2 && method === "GET") return json(route, saleDto(s, sale));
      if (seg.length === 2 && method === "PATCH") {
        for (const [k, v] of Object.entries(body))
          (sale as unknown as Record<string, unknown>)[k] = v === null ? undefined : v;
        return json(route, saleDto(s, sale));
      }
      const item = s.items.find((i) => i.id === sale.itemId);
      if (seg[2] === "cancel") {
        sale.status = "CANCELLED";
        if (item) item.status = "IN_STOCK";
        return json(route, saleDto(s, sale));
      }
      if (seg[2] === "refund") {
        sale.status = "REFUNDED";
        if (item) item.status = body.restock ? "IN_STOCK" : "RETURNED";
        return json(route, saleDto(s, sale));
      }
    }

    /* Expertise IA */
    if (path === "/appraisals" && method === "POST") {
      // Plan gratuit : 10 expertises par mois, sans texte d'annonce.
      const limit = s.workspace.plan === "FREE" ? 10 : 200;
      if (s.appraisals.length >= limit)
        return error(route, 402, "QUOTA_EXCEEDED", "Quota mensuel d'expertises atteint", {
          resource: "aiAppraisalsPerMonth",
          used: s.appraisals.length,
          limit,
          upgradeTo: s.workspace.plan === "FREE" ? "PREMIUM" : "PRO",
        });
      const a = fakeAppraisal(s);
      s.appraisals.push(a);
      await new Promise((r) => setTimeout(r, 900));
      return json(route, a, 201);
    }
    if (seg[0] === "appraisals" && method === "GET") {
      const a = s.appraisals.find((x) => (x as { id: string }).id === seg[1]);
      return a ? json(route, a) : error(route, 404, "NOT_FOUND", "Expertise introuvable");
    }

    /* Upload */
    if (path === "/uploads" && method === "POST") {
      const key = `items/${++s.seq}.jpg`;
      return json(
        route,
        { key, uploadUrl: `${origin}/__fake/upload/${s.seq}`, method: "PUT" },
        201,
      );
    }

    /* Facturation & compte */
    if (path === "/billing/checkout")
      return json(route, { url: `${origin}/app/reglages?checkout=demo` });
    if (path === "/billing/portal")
      return json(route, { url: `${origin}/app/reglages?portal=demo` });
    if (path === "/account/export") {
      return json(route, {
        format: "chine.workspace-export",
        version: 1,
        exportedAt: iso(),
        workspace: s.workspace,
        members: [{ userId: s.user.id, role: "OWNER", createdAt: iso() }],
        feeOverrides: s.feeOverrides,
        monthlyGoalMinor: s.workspace.monthlyGoal?.minor ?? null,
        sources: s.sources,
        items: s.items,
        listings: [],
        sales: s.sales,
        appraisals: s.appraisals,
      });
    }
    if (path === "/account" && method === "DELETE")
      return json(route, {
        userId: s.user.id,
        deleted: true,
        deletedWorkspaceIds: [s.workspace.id],
      });

    return error(route, 404, "NOT_FOUND", `Route inconnue : ${method} ${path}`);
  });
  return s;
}
