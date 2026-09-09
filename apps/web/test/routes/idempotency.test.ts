import type { SaleDto } from "@chine/contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as createItem } from "@/app/api/v1/items/route";
import { GET as me } from "@/app/api/v1/me/route";
import { POST as recordSale } from "@/app/api/v1/sales/route";
import { CLIENT_IP_HEADER, clientIp, resolveClientIp } from "@/lib/api/request";
import { createTestApp, type TestApp } from "../helpers/app";
import { call, request } from "../helpers/http";

type D<T> = { data: T };
const KEY = "018f5c1e-0000-7000-8000-0000000000aa";

describe("idempotence des mutations (X-Outbox-Id) et taille des corps", () => {
  let app: TestApp;
  let itemId = "";
  beforeAll(async () => {
    app = await createTestApp();
    const created = await call<Record<string, never>, D<{ id: string }>>(
      createItem,
      request("POST", "/api/v1/items", {
        body: {
          mode: "quickCapture",
          clientId: "018f5c1e-0000-7000-8000-0000000000bb",
          pricePaid: { minor: 2000, currency: "EUR" },
          supplierKind: "FLEA_MARKET",
          photoKeys: [],
          title: "Ensemble Lacoste",
        },
      }),
    );
    expect(created.status).toBe(201);
    itemId = created.data.id;
  });
  afterAll(() => app.close());

  it("rejoue la même réponse sans enregistrer une seconde vente", async () => {
    const body = {
      itemId,
      platform: "VINTED",
      grossPrice: { minor: 7500, currency: "EUR" },
      soldAt: "2026-09-06",
    };
    const first = await call<Record<string, never>, D<SaleDto>>(
      recordSale,
      request("POST", "/api/v1/sales", { body, headers: { "x-outbox-id": KEY } }),
    );
    expect(first.status).toBe(201);
    const replay = await call<Record<string, never>, D<SaleDto>>(
      recordSale,
      request("POST", "/api/v1/sales", { body, headers: { "x-outbox-id": KEY } }),
    );
    expect(replay.status).toBe(201);
    expect(replay.headers.get("x-idempotent-replay")).toBe("true");
    expect(replay.data.id).toBe(first.data.id);
    // Sans clé, la même requête est refusée par le domaine : la pièce est déjà vendue.
    const again = await call(recordSale, request("POST", "/api/v1/sales", { body }));
    expect(again.status).toBe(400);
  });

  it("refuse un corps JSON au-delà du plafond (413)", async () => {
    const huge = { itemId, platform: "VINTED", notes: "x".repeat(300 * 1024) };
    const res = await call(recordSale, request("POST", "/api/v1/sales", { body: huge }));
    expect(res.status).toBe(413);
    expect(res.error?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("résout l'IP du client sur le dernier saut de confiance, jamais sur le premier", async () => {
    const h = (entries: Record<string, string>) => new Headers(entries);
    expect(resolveClientIp(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
    expect(
      resolveClientIp(h({ "cf-connecting-ip": "198.51.100.2", "x-forwarded-for": "1.2.3.4" })),
    ).toBe("198.51.100.2");
    expect(resolveClientIp(h({ "x-forwarded-for": "not-an-ip" }))).toBe("unknown");
    // L'en-tête interne posé par le proxy prime ; une valeur invalide est ignorée.
    expect(
      clientIp(request("GET", "/api/v1/me", { headers: { [CLIENT_IP_HEADER]: "2001:db8::1" } })),
    ).toBe("2001:db8::1");
    const res = await call(me, request("GET", "/api/v1/me"));
    expect(res.status).toBe(200);
  });
});
