import { describe, expect, it, vi } from "vitest";
import { ApiClientError, buildPath, createApiClient, routes } from "../src/index";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const NOW = "2026-09-07T09:41:00.000Z";
const item = {
  id: "item_1",
  workspaceId: "ws_1",
  sourceId: "src_1",
  sku: "CH-0001",
  title: "Jean Levi's 501",
  category: "JEANS",
  condition: "GOOD",
  colors: [],
  materials: [],
  acquisitionCost: { minor: 800, currency: "EUR" },
  status: "IN_STOCK",
  photos: [],
  photoUrls: [],
  createdAt: NOW,
  updatedAt: NOW,
  ageDays: 3,
  isDormant: false,
};

describe("createApiClient", () => {
  it("expose une méthode par route", () => {
    const client = createApiClient({ baseUrl: "https://chine.app", fetch: vi.fn() });
    for (const name of Object.keys(routes))
      expect(typeof client[name as keyof typeof routes]).toBe("function");
  });

  it("construit l'URL (params, query), envoie les en-têtes et renvoie `data` validé", async () => {
    const fetch = vi.fn(async () =>
      json({ data: { items: [item], total: 1, limit: 30, offset: 0 } }),
    );
    const client = createApiClient({
      baseUrl: "https://chine.app/",
      fetch,
      getHeaders: async () => ({ authorization: "Bearer t" }),
    });
    const page = await client.listItems({
      query: { status: ["LISTED", "IN_STOCK"], search: "levi" },
    });
    expect(page.items[0]?.sku).toBe("CH-0001");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://chine.app/api/v1/items?status=LISTED&status=IN_STOCK&search=levi");
    expect(init.method).toBe("GET");
    expect((init.headers as { authorization?: string }).authorization).toBe("Bearer t");
  });

  it("sérialise le corps validé et encode les paramètres de chemin", async () => {
    const fetch = vi.fn(async () => json({ data: { ...item, status: "LISTED" } }));
    const client = createApiClient({ baseUrl: "", fetch });
    const out = await client.changeItemStatus({
      params: { id: "it/1" },
      body: { action: "list", platform: "VINTED", price: { minor: 7500, currency: "EUR" } },
    });
    expect(out.status).toBe("LISTED");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/items/it%2F1/status");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      action: "list",
      platform: "VINTED",
      price: { minor: 7500, currency: "EUR" },
    });
  });

  it("rejette un corps invalide avant tout appel réseau", async () => {
    const fetch = vi.fn();
    const client = createApiClient({ baseUrl: "", fetch });
    await expect(
      client.recordSale({
        body: {
          itemId: "x",
          platform: "VINTED",
          grossPrice: { minor: -1, currency: "EUR" },
          soldAt: "2026-09-06",
        },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", status: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("transforme une erreur API en ApiClientError avec son code", async () => {
    const fetch = vi.fn(async () =>
      json(
        {
          error: {
            code: "QUOTA_EXCEEDED",
            message: "Quota atteint",
            details: { upgradeTo: "PREMIUM" },
          },
        },
        402,
      ),
    );
    const client = createApiClient({ baseUrl: "", fetch });
    const err = await client.getItem({ params: { id: "1" } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    const e = err as ApiClientError;
    expect(e.is("QUOTA_EXCEEDED")).toBe(true);
    expect(e.status).toBe(402);
    expect(e.details).toEqual({ upgradeTo: "PREMIUM" });
    expect(e.route).toBe("GET /items/:id");
  });

  it("déduit le code des statuts HTTP sans enveloppe et signale les pannes réseau", async () => {
    const notFound = createApiClient({
      baseUrl: "",
      fetch: vi.fn(async () => new Response("", { status: 404 })),
    });
    await expect(notFound.getSale({ params: { id: "s" } })).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    const offline = createApiClient({
      baseUrl: "",
      fetch: vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });
    await expect(offline.getDashboard()).rejects.toMatchObject({ code: "NETWORK", status: 0 });
  });

  it("refuse une réponse qui ne respecte pas le schéma", async () => {
    const client = createApiClient({
      baseUrl: "",
      fetch: vi.fn(async () => json({ data: { nope: true } })),
    });
    await expect(client.getWorkspaceOverview()).rejects.toMatchObject({ code: "INTERNAL" });
  });

  it("buildPath remplace tous les paramètres", () => {
    expect(buildPath("/sources/:id/pieces", { id: "a b" })).toBe("/sources/a%20b/pieces");
    expect(() => buildPath("/items/:id", {} as { id: string })).toThrow(/manquant/);
  });
});
