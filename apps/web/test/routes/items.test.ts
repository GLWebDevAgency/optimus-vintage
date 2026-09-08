import type { ItemDto, PageOf, SourceDto } from "@chine/contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DELETE as deleteItem,
  GET as getItem,
  PATCH as patchItem,
} from "@/app/api/v1/items/[id]/route";
import { POST as createItem, GET as listItems } from "@/app/api/v1/items/route";
import { POST as generatePieces } from "@/app/api/v1/sources/[id]/pieces/route";
import { POST as createSource } from "@/app/api/v1/sources/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, eur } from "../helpers/http";

type D<T> = { data: T };

describe("pièces : capture rapide idempotente, quotas, validation", () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  const quick = (clientId: string) => ({
    mode: "quickCapture" as const,
    pricePaid: eur(2_000),
    supplierKind: "FLEA_MARKET" as const,
    locationLabel: "Vide-grenier · Bois-Guillaume",
    lat: 49.47,
    lng: 1.12,
    photoKeys: [],
    clientId,
    title: "Ensemble Lacoste",
    brand: "Lacoste",
    category: "TRACKSUIT" as const,
    condition: "EXCELLENT" as const,
    retailPrice: eur(25_000),
    targetPrice: eur(7_500),
  });

  it("capture rapide : crée la source unitaire et la pièce (201), puis rejoue en 200 sans doublon", async () => {
    const first = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: quick("local-1"),
    });
    expect(first.status).toBe(201);
    expect(first.data.title).toBe("Ensemble Lacoste");
    expect(first.data.acquisitionCost).toEqual(eur(2_000));
    expect(first.data.sourceName).toBe("Ensemble Lacoste");
    expect(first.data.discountVsRetail).toBeCloseTo(0.7);

    const replay = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: quick("local-1"),
    });
    expect(replay.status).toBe(200);
    expect(replay.data.id).toBe(first.data.id);

    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items");
    expect(list.data.total).toBe(1);
  });

  it("deux identifiants clients différents donnent deux pièces", async () => {
    const res = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: quick("local-2"),
    });
    expect(res.status).toBe(201);
    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items");
    expect(list.data.total).toBe(2);
  });

  it("l'identifiant client est scopé à l'espace : un autre utilisateur crée sa propre pièce", async () => {
    const other = await app.createUser("Karim");
    app.actAs(other);
    const res = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: quick("local-1"),
    });
    expect(res.status).toBe(201);
    expect(res.data.workspaceId).toBe(other.workspaceId);
    app.actAs(app.user);
  });

  it("400 sur un corps invalide (mode inconnu, montant flottant)", async () => {
    const res = await api(createItem, "POST", "/api/v1/items", {
      body: { mode: "quickCapture", pricePaid: { minor: 20.5, currency: "EUR" }, photoKeys: [] },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDATION_FAILED");
    const unreadable = await api(createItem, "POST", "/api/v1/items", {
      rawBody: "{pas du json",
      headers: { "content-type": "application/json" },
    });
    expect(unreadable.status).toBe(400);
  });

  it("refuse une clé de photo d'un autre espace (400)", async () => {
    const res = await api(createItem, "POST", "/api/v1/items", {
      body: { ...quick("local-3"), photoKeys: ["00000000-0000-7000-8000-000000000000/x.webp"] },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDATION_FAILED");
  });

  it("fiche complète depuis une source inconnue → 404", async () => {
    const res = await api(createItem, "POST", "/api/v1/items", {
      body: {
        mode: "standard",
        sourceId: "00000000-0000-7000-8000-000000000000",
        title: "Jean",
        category: "JEANS",
        condition: "GOOD",
      },
    });
    expect(res.status).toBe(404);
    expect(res.error?.code).toBe("NOT_FOUND");
  });

  it("PATCH : `null` efface un champ, et le remet en place", async () => {
    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items?search=lacoste");
    const item = list.data.items[0];
    expect(item?.brand).toBe("Lacoste");
    if (!item) return;
    const cleared = await api<D<ItemDto>, { id: string }>(
      patchItem,
      "PATCH",
      `/api/v1/items/${item.id}`,
      { params: { id: item.id }, body: { brand: null, retailPrice: null, notes: "Crocodile" } },
    );
    expect(cleared.status).toBe(200);
    expect(cleared.data.brand).toBeUndefined();
    expect(cleared.data.retailPrice).toBeUndefined();
    expect(cleared.data.discountVsRetail).toBeUndefined();
    expect(cleared.data.notes).toBe("Crocodile");
    const reread = await api<D<ItemDto>, { id: string }>(
      getItem,
      "GET",
      `/api/v1/items/${item.id}`,
      {
        params: { id: item.id },
      },
    );
    expect(reread.data.brand).toBeUndefined();
    const restored = await api<D<ItemDto>, { id: string }>(
      patchItem,
      "PATCH",
      `/api/v1/items/${item.id}`,
      { params: { id: item.id }, body: { brand: "Lacoste" } },
    );
    expect(restored.data.brand).toBe("Lacoste");
  });

  it("PATCH : titre vide refusé (400)", async () => {
    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items");
    const id = list.data.items[0]?.id ?? "";
    const res = await api(patchItem, "PATCH", `/api/v1/items/${id}`, {
      params: { id },
      body: { title: "   " },
    });
    expect(res.status).toBe(400);
  });

  it("quota FREE : 60 pièces vendables maximum → 402 QUOTA_EXCEEDED avec le plan conseillé", async () => {
    const source = await api<D<SourceDto>>(createSource, "POST", "/api/v1/sources", {
      body: {
        kind: "PALLET",
        name: "Palette Eureka",
        supplierKind: "WHOLESALER",
        purchasedAt: "2026-09-01",
        goodsCost: eur(90_000),
        announcedQuantity: 100,
      },
    });
    expect(source.status).toBe(201);
    // 2 pièces existent déjà : 58 de plus atteignent la limite de 60.
    const fill = await api<D<PageOf<ItemDto>>, { id: string }>(
      generatePieces,
      "POST",
      `/api/v1/sources/${source.data.id}/pieces`,
      { params: { id: source.data.id }, body: { count: 58 } },
    );
    expect(fill.status).toBe(201);
    const over = await api(createItem, "POST", "/api/v1/items", { body: quick("local-quota") });
    expect(over.status).toBe(402);
    expect(over.error?.code).toBe("QUOTA_EXCEEDED");
    expect(over.error?.details).toMatchObject({
      resource: "items",
      limit: 60,
      upgradeTo: "PREMIUM",
    });
    const overGenerate = await api(
      generatePieces,
      "POST",
      `/api/v1/sources/${source.data.id}/pieces`,
      {
        params: { id: source.data.id },
        body: { count: 1 },
      },
    );
    expect(overGenerate.status).toBe(402);
  });

  it("supprimer une pièce libère le quota", async () => {
    const list = await api<D<PageOf<ItemDto>>>(listItems, "GET", "/api/v1/items?limit=1");
    const id = list.data.items[0]?.id ?? "";
    const res = await api<D<{ id: string; deleted: true }>, { id: string }>(
      deleteItem,
      "DELETE",
      `/api/v1/items/${id}`,
      {
        params: { id },
      },
    );
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ id, deleted: true });
    const again = await api(deleteItem, "DELETE", `/api/v1/items/${id}`, { params: { id } });
    expect(again.status).toBe(404);
    const created = await api(createItem, "POST", "/api/v1/items", { body: quick("local-after") });
    expect(created.status).toBe(201);
  });

  it("filtre le stock par statut et pagine", async () => {
    const page = await api<D<PageOf<ItemDto>>>(
      listItems,
      "GET",
      "/api/v1/items?status=IN_STOCK&limit=5&offset=5&sort=cost_desc",
    );
    expect(page.status).toBe(200);
    expect(page.data.items).toHaveLength(5);
    expect(page.data.total).toBe(60);
    expect(page.data.limit).toBe(5);
    expect(page.data.offset).toBe(5);
    const bad = await api(listItems, "GET", "/api/v1/items?status=BROKEN");
    expect(bad.status).toBe(400);
  });
});
