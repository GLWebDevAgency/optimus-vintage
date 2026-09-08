import { asWorkspaceId } from "@chine/domain";
import { computeStripeSignature } from "@chine/infrastructure";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as checkout } from "@/app/api/v1/billing/checkout/route";
import { POST as portal } from "@/app/api/v1/billing/portal/route";
import { POST as webhook } from "@/app/api/v1/billing/webhook/route";
import { GET as getMe } from "@/app/api/v1/me/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, ORIGIN } from "../helpers/http";

describe("facturation sans Stripe", () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("checkout et portail répondent 503 BILLING_UNAVAILABLE, jamais une fausse redirection", async () => {
    const res = await api(checkout, "POST", "/api/v1/billing/checkout", {
      body: { plan: "PREMIUM", interval: "monthly", returnUrl: `${ORIGIN}/app/reglages` },
    });
    expect(res.status).toBe(503);
    expect(res.error?.code).toBe("BILLING_UNAVAILABLE");
    expect(res.error?.message).toMatch(/pas encore activé/);
    const p = await api(portal, "POST", "/api/v1/billing/portal", {
      body: { returnUrl: `${ORIGIN}/app/reglages` },
    });
    expect(p.status).toBe(503);
  });

  it("le webhook n'existe pas sans Stripe (404)", async () => {
    const res = await api(webhook, "POST", "/api/v1/billing/webhook", { rawBody: "{}" });
    expect(res.status).toBe(404);
  });
});

describe("facturation avec Stripe configuré", () => {
  let app: TestApp;
  const WEBHOOK_SECRET = "whsec_test_secret";
  beforeAll(async () => {
    app = await createTestApp({
      env: {
        STRIPE_SECRET_KEY: "sk_test_fake",
        STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
        STRIPE_PRICE_PREMIUM_MONTHLY: "price_premium_m",
      },
    });
  });
  afterAll(() => app.close());

  const signed = (payload: string) => {
    const t = Math.floor(Date.now() / 1000);
    return `t=${t},v1=${computeStripeSignature(payload, t, WEBHOOK_SECRET)}`;
  };

  it("refuse une signature invalide (400) et accepte un corps signé (200)", async () => {
    const payload = JSON.stringify({ type: "ping", data: { object: {} } });
    const bad = await api(webhook, "POST", "/api/v1/billing/webhook", {
      rawBody: payload,
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
    });
    expect(bad.status).toBe(400);
    const missing = await api(webhook, "POST", "/api/v1/billing/webhook", { rawBody: payload });
    expect(missing.status).toBe(400);
    const good = await api<{ data: { received: boolean; handled: boolean } }>(
      webhook,
      "POST",
      "/api/v1/billing/webhook",
      { rawBody: payload, headers: { "stripe-signature": signed(payload) } },
    );
    expect(good.status).toBe(200);
    expect(good.data).toEqual({ received: true, type: "ping", handled: false });
  });

  it("synchronise le plan depuis un abonnement Stripe signé, visible dans /me", async () => {
    const payload = JSON.stringify({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          metadata: { workspace_id: app.workspaceId },
          items: { data: [{ price: { id: "price_premium_m" } }] },
        },
      },
    });
    const res = await api<{ data: { handled: boolean } }>(
      webhook,
      "POST",
      "/api/v1/billing/webhook",
      {
        rawBody: payload,
        headers: { "stripe-signature": signed(payload) },
      },
    );
    expect(res.status).toBe(200);
    expect(res.data.handled).toBe(true);
    expect((await app.deps.workspaces.byId(asWorkspaceId(app.workspaceId)))?.plan).toBe("PREMIUM");
    const me = await api<{ data: { billing: { plan: string; portalAvailable: boolean } } }>(
      getMe,
      "GET",
      "/api/v1/me",
    );
    expect(me.data.billing).toEqual({ plan: "PREMIUM", portalAvailable: true });
  });

  it("refuse une URL de retour hors du site (400)", async () => {
    const res = await api(checkout, "POST", "/api/v1/billing/checkout", {
      body: { plan: "PREMIUM", interval: "monthly", returnUrl: "https://evil.example/retour" },
    });
    expect(res.status).toBe(400);
  });
});
