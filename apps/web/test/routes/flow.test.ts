import type {
  DashboardDto,
  ItemDto,
  PageOf,
  SaleDto,
  SourceDto,
  WorkspaceExportDto,
} from "@chine/contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as exportAccount } from "@/app/api/v1/account/export/route";
import { GET as getDashboard } from "@/app/api/v1/dashboard/route";
import { GET as getItem, PATCH as patchItem } from "@/app/api/v1/items/[id]/route";
import { POST as changeStatus } from "@/app/api/v1/items/[id]/status/route";
import { GET as listItems } from "@/app/api/v1/items/route";
import { POST as cancelSale } from "@/app/api/v1/sales/[id]/cancel/route";
import { POST as refundSale } from "@/app/api/v1/sales/[id]/refund/route";
import { GET as getSale } from "@/app/api/v1/sales/[id]/route";
import { GET as listSales, POST as recordSale } from "@/app/api/v1/sales/route";
import { POST as generatePieces } from "@/app/api/v1/sources/[id]/pieces/route";
import { POST as receiveSource } from "@/app/api/v1/sources/[id]/receive/route";
import {
  DELETE as deleteSource,
  GET as getSource,
  PATCH as updateSource,
} from "@/app/api/v1/sources/[id]/route";
import { POST as createSource, GET as listSources } from "@/app/api/v1/sources/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, eur } from "../helpers/http";

type D<T> = { data: T };
const today = new Date().toISOString().slice(0, 10);

describe("parcours : source → pièces → vente → tableau de bord", () => {
  let app: TestApp;
  let sourceId: string;
  let lacosteId: string;
  let saleId: string;
  let firstAllocatedCost = 0;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("crée un lot avec quantité annoncée (201) et le renvoie avec sa performance", async () => {
    const res = await api<D<SourceDto>>(createSource, "POST", "/api/v1/sources", {
      body: {
        kind: "LOT",
        name: "Ballot Fleek",
        supplierKind: "WHOLESALER",
        supplierName: "Fleek",
        purchasedAt: "2026-08-24",
        goodsCost: eur(24_000),
        extraCosts: eur(1_000),
        announcedQuantity: 10,
      },
    });
    expect(res.status).toBe(201);
    sourceId = res.data.id;
    expect(res.data.totalInvestment).toEqual(eur(25_000));
    expect(res.data.itemCount).toBe(0);
    expect(res.data.performance.invested).toEqual(eur(25_000));
    expect(res.data.performance.isAmortized).toBe(false);
  });

  it("refuse un lot sans quantité (400) et une unité avec 3 pièces", async () => {
    const res = await api(createSource, "POST", "/api/v1/sources", {
      body: {
        kind: "LOT",
        name: "Sans quantité",
        supplierKind: "WHOLESALER",
        purchasedAt: "2026-08-24",
        goodsCost: eur(100),
      },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDATION_FAILED");
  });

  it("PATCH : `null` efface le fournisseur et les notes d'une source", async () => {
    const res = await api<D<SourceDto>, { id: string }>(
      updateSource,
      "PATCH",
      `/api/v1/sources/${sourceId}`,
      { params: { id: sourceId }, body: { supplierName: null, notes: null, weightKg: 12.5 } },
    );
    expect(res.status).toBe(200);
    expect(res.data.supplierName).toBeUndefined();
    expect(res.data.notes).toBeUndefined();
    expect(res.data.weightKg).toBe(12.5);
    const invalid = await api(updateSource, "PATCH", `/api/v1/sources/${sourceId}`, {
      params: { id: sourceId },
      body: { announcedQuantity: null },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.error?.code).toBe("QUANTITY_REQUIRED");
  });

  it("réceptionne 9 pièces sur 10 : taux de casse 10 %", async () => {
    const res = await api<D<SourceDto>, { id: string }>(
      receiveSource,
      "POST",
      `/api/v1/sources/${sourceId}/receive`,
      { params: { id: sourceId }, body: { receivedQuantity: 9 } },
    );
    expect(res.status).toBe(200);
    expect(res.data.receivedQuantity).toBe(9);
    expect(res.data.shrinkageRate).toBeCloseTo(0.1);
    expect(res.data.averageUnitCost?.minor).toBe(Math.round(25_000 / 9));
  });

  it("génère 9 pièces dont les coûts somment exactement à l'investissement", async () => {
    const res = await api<D<PageOf<ItemDto>>, { id: string }>(
      generatePieces,
      "POST",
      `/api/v1/sources/${sourceId}/pieces`,
      { params: { id: sourceId }, body: { count: 9, category: "JACKET" } },
    );
    expect(res.status).toBe(201);
    expect(res.data.items).toHaveLength(9);
    const total = res.data.items.reduce((acc, i) => acc + i.acquisitionCost.minor, 0);
    expect(total).toBe(25_000);
    firstAllocatedCost = res.data.items[0]?.acquisitionCost.minor ?? 0;
    expect(res.data.items[0]?.sourceName).toBe("Ballot Fleek");
    expect(res.data.items[0]?.sku).toMatch(/^CH-\d{4}$/);
  });

  it("liste les sources avec le nombre de pièces et un filtre amortized", async () => {
    const res = await api<D<PageOf<SourceDto>>>(listSources, "GET", "/api/v1/sources");
    expect(res.status).toBe(200);
    expect(res.data.total).toBe(1);
    expect(res.data.items[0]?.itemCount).toBe(9);
    const amortized = await api<D<PageOf<SourceDto>>>(
      listSources,
      "GET",
      "/api/v1/sources?amortized=true",
    );
    expect(amortized.data.total).toBe(0);
  });

  it("refuse de supprimer une source qui porte des pièces (409)", async () => {
    const res = await api(deleteSource, "DELETE", `/api/v1/sources/${sourceId}`, {
      params: { id: sourceId },
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("enrichit une pièce : exemple Lacoste (achetée 20 €, neuf 250 €)", async () => {
    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items?sort=oldest");
    const first = list.data.items[0];
    expect(first).toBeDefined();
    if (!first) return;
    const res = await api<D<ItemDto>, { id: string }>(
      patchItem,
      "PATCH",
      `/api/v1/items/${first.id}`,
      {
        params: { id: first.id },
        body: {
          title: "Ensemble Lacoste vintage",
          brand: "Lacoste",
          category: "TRACKSUIT",
          condition: "EXCELLENT",
          acquisitionCost: eur(2_000),
          retailPrice: eur(25_000),
          targetPrice: eur(7_500),
          colors: ["vert"],
        },
      },
    );
    expect(res.status).toBe(200);
    lacosteId = res.data.id;
    expect(res.data.brand).toBe("Lacoste");
    expect(res.data.discountVsRetail).toBeCloseTo(0.7);
    expect(res.data.sourceName).toBe("Ballot Fleek");
  });

  it("met en ligne sur Vinted puis retrouve l'annonce active sur la fiche", async () => {
    const res = await api<D<ItemDto>, { id: string }>(
      changeStatus,
      "POST",
      `/api/v1/items/${lacosteId}/status`,
      {
        params: { id: lacosteId },
        body: { action: "list", platform: "VINTED", price: eur(7_500) },
      },
    );
    expect(res.status).toBe(200);
    expect(res.data.status).toBe("LISTED");
    expect(res.data.activeListings).toHaveLength(1);
    expect(res.data.activeListings[0]?.platform).toBe("VINTED");
  });

  it("enregistre la vente : 75 € sur Vinted, port 4,95 €, emballage 0,40 €", async () => {
    const res = await api<D<SaleDto>>(recordSale, "POST", "/api/v1/sales", {
      body: {
        itemId: lacosteId,
        platform: "VINTED",
        grossPrice: eur(7_500),
        soldAt: today,
        shippingCost: eur(495),
        packagingCost: eur(40),
        buyer: "Marine_76",
      },
    });
    expect(res.status).toBe(201);
    saleId = res.data.id;
    expect(res.data.economics.fees).toEqual(eur(0));
    expect(res.data.economics.net).toEqual(eur(6_965));
    expect(res.data.economics.margin).toEqual(eur(4_965));
    expect(res.data.item).toMatchObject({ id: lacosteId, status: "SOLD", brand: "Lacoste" });
  });

  it("la pièce est vendue et l'annonce clôturée", async () => {
    const res = await api<D<ItemDto>, { id: string }>(
      getItem,
      "GET",
      `/api/v1/items/${lacosteId}`,
      {
        params: { id: lacosteId },
      },
    );
    expect(res.data.status).toBe("SOLD");
    expect(res.data.soldAt).toBeDefined();
    expect(res.data.activeListings).toHaveLength(0);
  });

  it("refuse de vendre une pièce déjà vendue", async () => {
    const res = await api(recordSale, "POST", "/api/v1/sales", {
      body: { itemId: lacosteId, platform: "VINTED", grossPrice: eur(100), soldAt: today },
    });
    expect(res.status).toBe(400);
  });

  it("liste les ventes avec un total exact et le résumé de la pièce", async () => {
    const res = await api<D<PageOf<SaleDto>>>(listSales, "GET", "/api/v1/sales?platform=VINTED");
    expect(res.status).toBe(200);
    expect(res.data.total).toBe(1);
    expect(res.data.items[0]?.item?.sku).toBeDefined();
    const none = await api<D<PageOf<SaleDto>>>(listSales, "GET", "/api/v1/sales?platform=EBAY");
    expect(none.data.total).toBe(0);
    const bad = await api(listSales, "GET", "/api/v1/sales?from=2026-09-10&to=2026-09-01");
    expect(bad.status).toBe(400);
  });

  it("le tableau de bord reflète la vente et le stock", async () => {
    const res = await api<D<DashboardDto>>(getDashboard, "GET", "/api/v1/dashboard?period=30d");
    expect(res.status).toBe(200);
    const d = res.data;
    expect(d.current.salesCount).toBe(1);
    expect(d.current.net).toEqual(eur(6_965));
    expect(d.current.margin).toEqual(eur(4_965));
    expect(d.counts.sold).toBe(1);
    expect(d.counts.inStock).toBe(8);
    // Les 8 pièces restantes portent leur coût alloué ; la Lacoste (vendue) n'y est plus.
    expect(d.stockValueAtCost).toEqual(eur(25_000 - firstAllocatedCost));
    expect(d.lastSales[0]?.id).toBe(saleId);
    expect(d.period.label).toBe("30 derniers jours");
    const all = await api<D<DashboardDto>>(getDashboard, "GET", "/api/v1/dashboard?period=all");
    expect(all.data.current.salesCount).toBe(1);
  });

  it("la source a récupéré une partie de l'investissement", async () => {
    const res = await api<D<SourceDto>, { id: string }>(
      getSource,
      "GET",
      `/api/v1/sources/${sourceId}`,
      {
        params: { id: sourceId },
      },
    );
    expect(res.data.performance.recovered).toEqual(eur(6_965));
    expect(res.data.performance.soldCount).toBe(1);
    expect(res.data.performance.sellableCount).toBe(8);
  });

  it("l'export RGPD contient la vente et les pièces", async () => {
    const res = await api<D<WorkspaceExportDto>>(exportAccount, "GET", "/api/v1/account/export");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment; filename="chine-export-/);
    expect(res.data.format).toBe("chine.workspace-export");
    expect(res.data.sales).toHaveLength(1);
    expect(res.data.sales[0]).toMatchObject({ id: saleId, platform: "VINTED" });
    expect(res.data.items).toHaveLength(9);
    expect(res.data.sources[0]).toMatchObject({ name: "Ballot Fleek" });
  });

  it("rembourse la vente : pièce retournée puis remise en stock", async () => {
    const res = await api<D<SaleDto>, { id: string }>(
      refundSale,
      "POST",
      `/api/v1/sales/${saleId}/refund`,
      { params: { id: saleId }, body: { restock: true } },
    );
    expect(res.status).toBe(200);
    expect(res.data.status).toBe("REFUNDED");
    expect(res.data.item?.status).toBe("IN_STOCK");
    const again = await api(cancelSale, "POST", `/api/v1/sales/${saleId}/cancel`, {
      params: { id: saleId },
      body: {},
    });
    expect(again.status).toBe(409);
    const sale = await api<D<SaleDto>, { id: string }>(getSale, "GET", `/api/v1/sales/${saleId}`, {
      params: { id: saleId },
    });
    expect(sale.data.refundedAt).toBeDefined();
  });

  it("un autre utilisateur ne voit rien de cet espace (404)", async () => {
    const other = await app.createUser("Karim");
    app.actAs(other);
    const res = await api(getItem, "GET", `/api/v1/items/${lacosteId}`, {
      params: { id: lacosteId },
    });
    expect(res.status).toBe(404);
    const sales = await api<D<PageOf<SaleDto>>>(listSales, "GET", "/api/v1/sales");
    expect(sales.data.total).toBe(0);
    app.actAs(app.user);
  });
});
