import type { DashboardDto, SaleDto } from "@chine/contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as dashboard } from "@/app/api/v1/dashboard/route";
import { GET as exportCsv } from "@/app/api/v1/export/[entity]/route";
import { POST as createItem } from "@/app/api/v1/items/route";
import { POST as completeSale } from "@/app/api/v1/sales/[id]/complete/route";
import { POST as recordSale } from "@/app/api/v1/sales/route";
import { toCsv } from "@/lib/csv";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, eur } from "../helpers/http";

type D<T> = { data: T };

describe("exports CSV, encaissement d'une vente en attente, analytique par formule", () => {
  let app: TestApp;
  let itemId = "";
  beforeAll(async () => {
    app = await createTestApp();
    const created = await api<D<{ id: string }>>(createItem, "POST", "/api/v1/items", {
      body: {
        mode: "quickCapture",
        pricePaid: eur(2_000),
        extraCosts: eur(300),
        supplierKind: "FLEA_MARKET",
        photoKeys: [],
        title: "Ensemble Lacoste",
        brand: "Lacoste",
        purchasedAt: "2026-09-01",
      },
    });
    expect(created.status).toBe(201);
    itemId = created.data.id;
  });
  afterAll(() => app.close());

  it("exporte les pièces en CSV tableur (BOM, point-virgule, frais annexes inclus au coût)", async () => {
    const res = await api<string, { entity: string }>(
      exportCsv,
      "GET",
      "/api/v1/export/items.csv",
      {
        params: { entity: "items.csv" },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("chine-pieces-");
    // `Response.text()` retire le BOM au décodage : il est vérifié sur `toCsv` directement.
    expect(toCsv(["a"], [["b"]]).charCodeAt(0)).toBe(0xfeff);
    const text = String(res.json);
    expect(text).toContain("SKU;Titre;Marque");
    expect(text).toContain("Ensemble Lacoste;Lacoste");
    // 20,00 € + 3,00 € de frais annexes = 23,00 € de coût d'achat.
    expect(text).toContain(";23,00;");
  });

  it("réserve le journal comptable à la formule Pro et refuse une entité inconnue", async () => {
    const locked = await api<unknown, { entity: string }>(
      exportCsv,
      "GET",
      "/api/v1/export/comptabilite.csv",
      {
        params: { entity: "comptabilite.csv" },
      },
    );
    expect(locked.status).toBe(402);
    expect(locked.error?.code).toBe("FEATURE_LOCKED");
    const unknown = await api<unknown, { entity: string }>(
      exportCsv,
      "GET",
      "/api/v1/export/secrets.csv",
      {
        params: { entity: "secrets.csv" },
      },
    );
    expect(unknown.status).toBe(404);
  });

  it("encaisse une vente en attente : pièce vendue, seconde vente refusée entre-temps", async () => {
    const pending = await api<D<SaleDto>>(recordSale, "POST", "/api/v1/sales", {
      body: {
        itemId,
        platform: "VINTED",
        grossPrice: eur(7_500),
        status: "PENDING",
        soldAt: "2026-09-06",
      },
    });
    expect(pending.status).toBe(201);
    expect(pending.data.status).toBe("PENDING");
    const again = await api(recordSale, "POST", "/api/v1/sales", {
      body: { itemId, platform: "VINTED", grossPrice: eur(7_500), soldAt: "2026-09-06" },
    });
    expect(again.status).toBe(409);
    expect(again.error?.code).toBe("CONFLICT");
    const done = await api<D<SaleDto>, { id: string }>(
      completeSale,
      "POST",
      `/api/v1/sales/${pending.data.id}/complete`,
      {
        params: { id: pending.data.id },
        body: {},
      },
    );
    expect(done.status).toBe(200);
    expect(done.data.status).toBe("COMPLETED");
    const sales = await api<string, { entity: string }>(
      exportCsv,
      "GET",
      "/api/v1/export/sales.csv?from=2026-01-01&to=2026-12-31",
      {
        params: { entity: "sales.csv" },
      },
    );
    expect(String(sales.json)).toContain("VINTED;COMPLETED;75,00");
  });

  it("n'expose pas l'analytique sur la formule gratuite, mais accepte des bornes explicites", async () => {
    const res = await api<D<DashboardDto>>(
      dashboard,
      "GET",
      "/api/v1/dashboard?period=month&from=2026-09-01&to=2026-09-30",
    );
    expect(res.status).toBe(200);
    expect(res.data.period).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(res.data.analytics).toBeNull();
    const bad = await api(dashboard, "GET", "/api/v1/dashboard?from=2026-09-30&to=2026-09-01");
    expect(bad.status).toBe(400);
  });
});
