import { describe, expect, it } from "vitest";
import {
  AppraiseImageCommand,
  ChangeItemStatusCommand,
  CreateItemCommand,
  CreatePurchaseSourceCommand,
  DashboardDto,
  DashboardQuery,
  ItemDto,
  ListItemsQuery,
  ListSalesQuery,
  MoneyDto,
  ok,
  PageOf,
  RecordSaleCommand,
  SaleDto,
  SourceDto,
  searchParamsToObject,
  toSearchParams,
  UpdateWorkspaceSettingsCommand,
  WorkspaceOverviewDto,
} from "../src/index";

const eur = (minor: number) => ({ minor, currency: "EUR" as const });
const NOW = "2026-09-07T09:41:00.000Z";

const sale = {
  id: "sale_1",
  workspaceId: "ws_1",
  itemId: "item_1",
  sourceId: "src_1",
  platform: "VINTED",
  grossPrice: eur(7500),
  platformFees: eur(0),
  shippingCost: eur(495),
  packagingCost: eur(40),
  otherCosts: eur(0),
  acquisitionCost: eur(2000),
  soldAt: "2026-09-06",
  status: "COMPLETED",
  buyer: "Marine_76",
  createdAt: NOW,
  updatedAt: NOW,
  economics: {
    gross: eur(7500),
    fees: eur(0),
    costs: eur(535),
    net: eur(6965),
    margin: eur(4965),
    roi: 2.4825,
    marginRate: 0.662,
  },
  number: 231,
};

const stats = {
  salesCount: 23,
  gross: eur(142_000),
  net: eur(130_000),
  margin: eur(128_450),
  marginRate: 0.9,
  averageTicket: eur(5652),
  byPlatform: [{ platform: "VINTED", count: 20, net: eur(120_000), margin: eur(110_000) }],
  byDay: [{ day: "2026-09-06", net: eur(6965), margin: eur(4965), count: 1 }],
};

describe("schémas communs", () => {
  it("MoneyDto : entier + devise, refuse les flottants", () => {
    expect(MoneyDto.parse(eur(2000))).toEqual(eur(2000));
    expect(MoneyDto.safeParse({ minor: 20.5, currency: "EUR" }).success).toBe(false);
    expect(MoneyDto.safeParse({ minor: 20, currency: "XXX" }).success).toBe(false);
  });

  it("ok() enveloppe et PageOf() paginent", () => {
    const schema = ok(PageOf(MoneyDto));
    const parsed = schema.parse({ data: { items: [eur(1)], total: 1, limit: 30, offset: 0 } });
    expect(parsed.data.items[0]).toEqual(eur(1));
    expect(schema.safeParse({ data: { items: [], total: -1, limit: 30, offset: 0 } }).success).toBe(
      false,
    );
  });
});

describe("commandes", () => {
  it("CreatePurchaseSource : un lot exige une quantité, une unité n'en accepte qu'une", () => {
    const base = {
      kind: "LOT" as const,
      name: "Palette Eureka",
      supplierKind: "WHOLESALER" as const,
      purchasedAt: "2026-08-24",
      goodsCost: eur(24_000),
    };
    expect(CreatePurchaseSourceCommand.safeParse(base).success).toBe(false);
    expect(CreatePurchaseSourceCommand.safeParse({ ...base, announcedQuantity: 48 }).success).toBe(
      true,
    );
    expect(
      CreatePurchaseSourceCommand.safeParse({ ...base, kind: "UNIT", announcedQuantity: 3 })
        .success,
    ).toBe(false);
    expect(
      CreatePurchaseSourceCommand.safeParse({ ...base, kind: "UNIT", announcedQuantity: 1 })
        .success,
    ).toBe(true);
  });

  it("CreatePurchaseSource : refuse un coût négatif et des devises différentes", () => {
    const cmd = {
      kind: "PICKING",
      name: "Picking",
      supplierKind: "WHOLESALER",
      purchasedAt: "2026-08-24",
      goodsCost: eur(-1),
    };
    expect(CreatePurchaseSourceCommand.safeParse(cmd).success).toBe(false);
    expect(
      CreatePurchaseSourceCommand.safeParse({
        ...cmd,
        goodsCost: eur(100),
        extraCosts: { minor: 10, currency: "USD" },
      }).success,
    ).toBe(false);
  });

  it("CreateItem : capture rapide et fiche complète (union discriminée)", () => {
    const quick = CreateItemCommand.parse({
      mode: "quickCapture",
      pricePaid: eur(2000),
      supplierKind: "FLEA_MARKET",
      locationLabel: "Vide-grenier · Bois-Guillaume",
      lat: 49.47,
      lng: 1.12,
      photoKeys: ["ws_1/photo1.jpg"],
      appraisalId: "appr_1",
    });
    expect(quick.mode).toBe("quickCapture");
    const std = CreateItemCommand.parse({
      mode: "standard",
      sourceId: "src_1",
      title: "Ensemble Lacoste",
      category: "TRACKSUIT",
      condition: "EXCELLENT",
      colors: ["vert"],
    });
    expect(std.mode).toBe("standard");
    expect(
      CreateItemCommand.safeParse({ mode: "quickCapture", pricePaid: eur(2000) }).success,
    ).toBe(false);
    expect(
      CreateItemCommand.safeParse({ mode: "standard", sourceId: "s", title: " " }).success,
    ).toBe(false);
  });

  it("ChangeItemStatus : la mise en ligne exige plateforme et prix positif", () => {
    expect(ChangeItemStatusCommand.parse({ action: "unlist" })).toEqual({ action: "unlist" });
    expect(
      ChangeItemStatusCommand.safeParse({ action: "list", platform: "VINTED", price: eur(0) })
        .success,
    ).toBe(false);
    const list = ChangeItemStatusCommand.parse({
      action: "list",
      platform: "VINTED",
      price: eur(7500),
    });
    expect(list.action === "list" && list.price.minor).toBe(7500);
    expect(ChangeItemStatusCommand.safeParse({ action: "writeOff", reason: "SOLD" }).success).toBe(
      false,
    );
  });

  it("RecordSale : devises cohérentes entre prix et frais", () => {
    const cmd = {
      itemId: "item_1",
      platform: "VINTED",
      grossPrice: eur(7500),
      soldAt: "2026-09-06",
    };
    expect(RecordSaleCommand.parse(cmd).status).toBeUndefined();
    expect(
      RecordSaleCommand.safeParse({ ...cmd, shippingCost: { minor: 495, currency: "USD" } })
        .success,
    ).toBe(false);
    expect(RecordSaleCommand.safeParse({ ...cmd, soldAt: "06/09/2026" }).success).toBe(false);
  });

  it("AppraiseImage : base64 valide, borné à 8 Mo", () => {
    expect(
      AppraiseImageCommand.parse({
        imageBase64: "AAAA",
        mimeType: "image/jpeg",
        wantListingCopy: true,
      }).wantListingCopy,
    ).toBe(true);
    expect(
      AppraiseImageCommand.safeParse({ imageBase64: "not base64!", mimeType: "image/jpeg" })
        .success,
    ).toBe(false);
    const huge = "A".repeat(Math.ceil((8 * 1024 * 1024) / 3) * 4 + 4);
    expect(
      AppraiseImageCommand.safeParse({ imageBase64: huge, mimeType: "image/png" }).success,
    ).toBe(false);
    expect(
      AppraiseImageCommand.safeParse({ imageBase64: "AAAA", mimeType: "image/gif" }).success,
    ).toBe(false);
  });

  it("UpdateWorkspaceSettings : surcharges de frais partielles, préfixe SKU strict", () => {
    const parsed = UpdateWorkspaceSettingsCommand.parse({
      skuPrefix: "CH",
      feeOverrides: { VESTIAIRE: { percent: 12, fixedMinor: 0 }, EBAY: null },
      targetMargin: { kind: "PERCENT", value: 40 },
    });
    expect(parsed.feeOverrides?.VESTIAIRE?.percent).toBe(12);
    expect(parsed.feeOverrides?.EBAY).toBeNull();
    expect(UpdateWorkspaceSettingsCommand.safeParse({ skuPrefix: "chine" }).success).toBe(false);
    expect(
      UpdateWorkspaceSettingsCommand.safeParse({
        feeOverrides: { VINTED: { percent: 120, fixedMinor: 0 } },
      }).success,
    ).toBe(false);
  });
});

describe("requêtes", () => {
  it("ListItems : listes tolérantes, booléens de query string, défauts", () => {
    const a = ListItemsQuery.parse({ status: "LISTED,IN_STOCK", dormantOnly: "true", limit: "20" });
    expect(a).toMatchObject({
      status: ["LISTED", "IN_STOCK"],
      dormantOnly: true,
      limit: 20,
      offset: 0,
      sort: "newest",
    });
    const b = ListItemsQuery.parse({ status: ["SOLD"] });
    expect(b.status).toEqual(["SOLD"]);
    expect(ListItemsQuery.safeParse({ limit: 500 }).success).toBe(false);
    expect(ListItemsQuery.safeParse({ status: "BROKEN" }).success).toBe(false);
  });

  it("ListSales : bornes de dates ordonnées", () => {
    expect(ListSalesQuery.safeParse({ from: "2026-09-01", to: "2026-08-01" }).success).toBe(false);
    expect(
      ListSalesQuery.parse({ from: "2026-08-01", to: "2026-09-01", platform: "VINTED" }).platform,
    ).toBe("VINTED");
  });

  it("Dashboard : période par défaut = mois", () => {
    expect(DashboardQuery.parse({}).period).toBe("month");
    expect(DashboardQuery.safeParse({ period: "2y" }).success).toBe(false);
  });

  it("toSearchParams ↔ searchParamsToObject font l'aller-retour", () => {
    const params = toSearchParams({
      status: ["LISTED", "SOLD"],
      search: "lacoste",
      dormantOnly: true,
      skip: undefined,
    });
    expect(params.toString()).toBe("status=LISTED&status=SOLD&search=lacoste&dormantOnly=true");
    const obj = searchParamsToObject(params);
    expect(obj).toEqual({ status: ["LISTED", "SOLD"], search: "lacoste", dormantOnly: "true" });
    expect(ListItemsQuery.parse(obj).status).toEqual(["LISTED", "SOLD"]);
  });
});

describe("DTOs de réponse", () => {
  it("ItemDto : aller-retour JSON avec champs calculés", () => {
    const item = {
      id: "item_1",
      workspaceId: "ws_1",
      sourceId: "src_1",
      sku: "CH-0142",
      title: "Ensemble Lacoste",
      brand: "Lacoste",
      category: "TRACKSUIT",
      condition: "EXCELLENT",
      era: "1990s",
      colors: ["vert"],
      materials: ["coton piqué"],
      acquisitionCost: eur(2000),
      retailPrice: eur(25_000),
      targetPrice: eur(7500),
      status: "LISTED",
      photos: [{ id: "ph_1", key: "ws_1/a.jpg", url: "https://cdn.chine.app/ws_1/a.jpg" }],
      photoUrls: ["https://cdn.chine.app/ws_1/a.jpg"],
      createdAt: NOW,
      updatedAt: NOW,
      discountVsRetail: 0.7,
      ageDays: 7,
      isDormant: false,
    };
    const parsed = ItemDto.parse(JSON.parse(JSON.stringify(item)));
    expect(parsed.activeListings).toEqual([]);
    expect(parsed.discountVsRetail).toBe(0.7);
    expect(ItemDto.safeParse({ ...item, discountVsRetail: 1.5 }).success).toBe(false);
  });

  it("SourceDto : performance complète", () => {
    const source = {
      id: "src_1",
      workspaceId: "ws_1",
      kind: "PALLET",
      name: "Palette Eureka",
      supplierKind: "WHOLESALER",
      purchasedAt: "2026-08-24",
      goodsCost: eur(24_000),
      extraCosts: eur(0),
      totalInvestment: eur(24_000),
      announcedQuantity: 48,
      receivedQuantity: 48,
      effectiveQuantity: 48,
      averageUnitCost: eur(500),
      weightKg: 12,
      location: { label: "Rouen", point: { lat: 49.44, lng: 1.09 } },
      allocationPolicy: "BY_WEIGHT",
      itemCount: 48,
      createdAt: NOW,
      updatedAt: NOW,
      performance: {
        invested: eur(24_000),
        recovered: eur(26_840),
        remainingToRecover: eur(0),
        profit: eur(2840),
        roi: 0.118,
        recoveryRate: 1.118,
        isAmortized: true,
        soldCount: 31,
        sellableCount: 17,
        writtenOffCount: 0,
        stockValueAtCost: eur(8500),
      },
    };
    const parsed = SourceDto.parse(JSON.parse(JSON.stringify(source)));
    expect(parsed.performance.isAmortized).toBe(true);
    expect(parsed.performance.floorPriceBreakEven).toBeUndefined();
  });

  it("SaleDto : économie de la vente", () => {
    const parsed = SaleDto.parse(JSON.parse(JSON.stringify(sale)));
    expect(parsed.economics.net.minor).toBe(6965);
    expect(SaleDto.safeParse({ ...sale, status: "DONE" }).success).toBe(false);
  });

  it("DashboardDto : période, variations, objectif, dernières ventes", () => {
    const dashboard = {
      period: { from: "2026-09-01", to: "2026-09-30", label: "septembre" },
      current: stats,
      previous: { ...stats, salesCount: 19 },
      change: { net: 0.18, salesCount: 0.21 },
      counts: { inStock: 142, listed: 38, reserved: 2, sold: 23, dormant: 12 },
      goal: { targetMinor: 200_000, currency: "EUR", progress: 0.64 },
      lastSales: [sale],
    };
    const parsed = DashboardDto.parse(JSON.parse(JSON.stringify(dashboard)));
    expect(parsed.goal?.progress).toBe(0.64);
    expect(parsed.lastSales[0]?.economics.margin.minor).toBe(4965);
    expect(parsed.current.refundedCount).toBe(0);
  });

  it("WorkspaceOverviewDto : quotas et facturation", () => {
    const overview = {
      workspace: {
        id: "ws_1",
        name: "Chiné de Lina",
        currency: "EUR",
        locale: "fr",
        targetMargin: { kind: "PERCENT", value: 40 },
        plan: "PREMIUM",
        skuPrefix: "CH",
        createdAt: NOW,
      },
      user: { id: "u_1", email: "lina@example.com", role: "OWNER" },
      quotas: {
        items: { used: 142, limit: null },
        sourcesPerMonth: { used: 4, limit: null },
        aiCreditsPerMonth: { used: 37, limit: 100 },
        members: { used: 1, limit: 1 },
      },
      features: ["AI_APPRAISAL", "CSV_EXPORT"],
      feeOverrides: {},
      billing: { plan: "PREMIUM", interval: "yearly", portalAvailable: true },
    };
    const parsed = WorkspaceOverviewDto.parse(overview);
    expect(parsed.workspace.dormantThresholdDays).toBe(30);
    expect(parsed.workspaces).toEqual([]);
    expect(
      WorkspaceOverviewDto.safeParse({ ...overview, user: { ...overview.user, email: "x" } })
        .success,
    ).toBe(false);
  });
});
