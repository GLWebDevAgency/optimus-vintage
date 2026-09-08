import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ok } from "@/lib/api/respond";
import { withAuth, withPublic } from "@/lib/api/with-auth";
import { createTestApp, type TestApp } from "../helpers/app";
import { api } from "../helpers/http";

describe("limite de débit et contexte de requête", () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("429 après la limite, avec Retry-After, par espace de travail", async () => {
    const handler = withAuth(async (_req, ctx) => ok({ workspaceId: ctx.workspaceId }), {
      limit: { key: "test:tiny", max: 2, windowSeconds: 60 },
    });
    const first = await api<{ data: { workspaceId: string } }>(handler, "GET", "/api/v1/x");
    expect(first.status).toBe(200);
    expect(first.data.workspaceId).toBe(app.workspaceId);
    expect((await api(handler, "GET", "/api/v1/x")).status).toBe(200);
    const third = await api(handler, "GET", "/api/v1/x");
    expect(third.status).toBe(429);
    expect(third.error?.code).toBe("RATE_LIMITED");
    expect(Number(third.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(third.headers.get("X-Request-Id")).toBeTruthy();

    // Un autre espace de travail a son propre compteur.
    const other = await app.createUser("Nour");
    app.actAs(other);
    expect((await api(handler, "GET", "/api/v1/x")).status).toBe(200);
    app.actAs(app.user);
  });

  it("les routes publiques limitent par adresse IP", async () => {
    const handler = withPublic(async (_req, ctx) => ok({ ip: ctx.ip }), {
      limit: { key: "test:public", max: 1, windowSeconds: 60 },
    });
    const a = await api<{ data: { ip: string } }>(handler, "GET", "/api/x", {
      headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" },
    });
    expect(a.status).toBe(200);
    expect(a.data.ip).toBe("198.51.100.1");
    const again = await api(handler, "GET", "/api/x", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    expect(again.status).toBe(429);
    const otherIp = await api(handler, "GET", "/api/x", {
      headers: { "x-forwarded-for": "198.51.100.2" },
    });
    expect(otherIp.status).toBe(200);
  });

  it("une exception inattendue devient un 500 générique sans fuite", async () => {
    const handler = withAuth(async () => {
      throw new Error("secret interne");
    });
    const res = await api(handler, "GET", "/api/v1/boom");
    expect(res.status).toBe(500);
    expect(res.error).toEqual({ code: "INTERNAL_ERROR", message: "Erreur interne." });
  });

  it("les identifiants de requête sont uniques et croissants (UUID v7)", async () => {
    const handler = withPublic(async () => ok({}));
    const a = (await api(handler, "GET", "/api/x")).headers.get("X-Request-Id") ?? "";
    const b = (await api(handler, "GET", "/api/x")).headers.get("X-Request-Id") ?? "";
    expect(a).not.toBe(b);
    expect(a.charAt(14)).toBe("7");
  });
});
