import type { WorkspaceOverviewDto } from "@chine/contract";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getDashboard } from "@/app/api/v1/dashboard/route";
import { GET as getMe } from "@/app/api/v1/me/route";
import { PATCH as patchSettings } from "@/app/api/v1/workspace/settings/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api } from "../helpers/http";

type Envelope = { data: WorkspaceOverviewDto };

describe("espace de travail : /me, /workspace/settings", () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("401 sans session, avec un X-Request-Id", async () => {
    app.actAs(null);
    const res = await api(getMe, "GET", "/api/v1/me");
    expect(res.status).toBe(401);
    expect(res.error?.code).toBe("UNAUTHORIZED");
    expect(res.headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
    app.actAs(app.user);
  });

  it("GET /me : espace FREE, quotas, utilisateur propriétaire", async () => {
    const res = await api<Envelope>(getMe, "GET", "/api/v1/me");
    expect(res.status).toBe(200);
    const me = res.data;
    expect(me.workspace.id).toBe(app.workspaceId);
    expect(me.workspace.plan).toBe("FREE");
    expect(me.workspace.dormantThresholdDays).toBe(30);
    expect(me.user).toMatchObject({ id: app.user.id, email: app.user.email, role: "OWNER" });
    expect(me.quotas.items).toEqual({ used: 0, limit: 60 });
    expect(me.quotas.aiAppraisalsPerMonth.limit).toBe(8);
    expect(me.features).toContain("CSV_EXPORT");
    expect(me.billing).toEqual({ plan: "FREE", portalAvailable: false });
    expect(me.feeSchedules?.VINTED?.percent).toBe(0);
  });

  it("403 quand une mutation vient d'un autre site (CSRF)", async () => {
    const res = await api(patchSettings, "PATCH", "/api/v1/workspace/settings", {
      body: { name: "Pirate" },
      crossSite: true,
    });
    expect(res.status).toBe(403);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("400 sur un corps invalide (arbre d'erreurs Zod)", async () => {
    const res = await api(patchSettings, "PATCH", "/api/v1/workspace/settings", {
      body: { skuPrefix: "trop-long", dormantThresholdDays: 2 },
    });
    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDATION_FAILED");
    const details = res.error?.details as { properties?: Record<string, unknown> };
    expect(Object.keys(details.properties ?? {})).toEqual(
      expect.arrayContaining(["skuPrefix", "dormantThresholdDays"]),
    );
  });

  it("PATCH /workspace/settings : marge, préfixe, frais, dormance, objectif", async () => {
    const res = await api<Envelope>(patchSettings, "PATCH", "/api/v1/workspace/settings", {
      body: {
        name: "Friperie Léa",
        targetMargin: { kind: "PERCENT", value: 60 },
        skuPrefix: "LEA",
        feeOverrides: { VINTED: { percent: 5, fixedMinor: 70 } },
        dormantThresholdDays: 45,
        monthlyGoal: { minor: 150_000, currency: "EUR" },
      },
    });
    expect(res.status).toBe(200);
    expect(res.data.workspace).toMatchObject({
      name: "Friperie Léa",
      skuPrefix: "LEA",
      targetMargin: { kind: "PERCENT", value: 60 },
      dormantThresholdDays: 45,
      monthlyGoal: { minor: 150_000, currency: "EUR" },
    });
    expect(res.data.feeOverrides.VINTED).toEqual({ percent: 5, fixedMinor: 70 });
    expect(res.data.feeSchedules?.VINTED?.percent).toBe(5);

    // `null` retire la surcharge ; les autres réglages sont conservés.
    const reset = await api<Envelope>(patchSettings, "PATCH", "/api/v1/workspace/settings", {
      body: { feeOverrides: { VINTED: null }, monthlyGoal: null },
    });
    expect(reset.status).toBe(200);
    expect(reset.data.feeOverrides.VINTED).toBeUndefined();
    expect(reset.data.workspace.monthlyGoal).toBeUndefined();
    expect(reset.data.workspace.dormantThresholdDays).toBe(45);
  });

  it("refuse un objectif dans une autre devise", async () => {
    const res = await api(patchSettings, "PATCH", "/api/v1/workspace/settings", {
      body: { monthlyGoal: { minor: 100, currency: "USD" } },
    });
    expect(res.status).toBe(400);
  });

  it("GET /dashboard : état vide", async () => {
    const res = await api<{ data: { counts: unknown; current: { salesCount: number } } }>(
      getDashboard,
      "GET",
      "/api/v1/dashboard?period=month",
    );
    expect(res.status).toBe(200);
    expect(res.data.current.salesCount).toBe(0);
    expect(res.data.counts).toEqual({ inStock: 0, listed: 0, reserved: 0, sold: 0, dormant: 0 });
  });

  it("GET /dashboard : période inconnue → 400", async () => {
    const res = await api(getDashboard, "GET", "/api/v1/dashboard?period=decade");
    expect(res.status).toBe(400);
  });
});
