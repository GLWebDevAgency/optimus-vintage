import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as health } from "@/app/api/health/route";
import { GET as ready } from "@/app/api/ready/route";
import { GET as legacyHealth } from "@/app/api/v1/health/route";
import { APP_VERSION } from "@/lib/version";
import { createTestApp, type TestApp } from "../helpers/app";

describe("santé", () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("/api/health décrit la base, le stockage et l'IA sans secret", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      status: "ok",
      version: APP_VERSION,
      checks: {
        database: { ok: true, driver: "pglite" },
        storage: { driver: "local" },
        appraiser: { driver: "fake" },
        billing: { configured: false },
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/secret|password|key/i);
  });

  it("/api/ready répond prêt", async () => {
    const res = await ready();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ready: true } });
  });

  it("/api/v1/health reste une sonde légère", async () => {
    const res = legacyHealth();
    expect(await res.json()).toEqual({ data: { status: "ok" } });
  });

  it("/api/health passe en 503 quand la base ne répond plus", async () => {
    await app.deps.database.close();
    const res = await health();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { data: { status: string } };
    expect(body.data.status).toBe("degraded");
  });
});
