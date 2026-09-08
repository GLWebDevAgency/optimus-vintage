import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBillingGateway, stripePricesFromEnv } from "../src/billing/index.js";
import { NoopBillingGateway } from "../src/billing/NoopBillingGateway.js";
import {
  encodeStripeForm,
  StripeBillingGateway,
  WebhookSignatureError,
} from "../src/billing/StripeBillingGateway.js";
import { computeStripeSignature, verifyStripeSignature } from "../src/billing/stripe-signature.js";
import { user as authUser } from "../src/db/auth-schema.js";
import { makeWorkspace, type TestDb, testDb } from "./helpers.js";

const SECRET = "whsec_test";
const sign = (payload: string, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${computeStripeSignature(payload, t, SECRET)}`;

describe("verifyStripeSignature", () => {
  it("accepte une signature valide, refuse le reste", () => {
    const payload = '{"id":"evt_1"}';
    expect(verifyStripeSignature(payload, sign(payload), SECRET)).toBe(true);
    expect(verifyStripeSignature(`${payload} `, sign(payload), SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload), "autre")).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload, 1_000_000), SECRET)).toBe(false);
    expect(
      verifyStripeSignature(payload, sign(payload, 1_000_000), SECRET, { nowSeconds: 1_000_100 }),
    ).toBe(true);
    expect(verifyStripeSignature(payload, "t=abc,v1=zz", SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, undefined, SECRET)).toBe(false);
  });
});

describe("encodeStripeForm", () => {
  it("encode les objets imbriqués et les tableaux à la Stripe", () => {
    const encoded = encodeStripeForm({
      mode: "subscription",
      line_items: [{ price: "price_1", quantity: 1 }],
      metadata: { workspace_id: "ws 1" },
      skip: undefined,
    });
    expect(decodeURIComponent(encoded)).toBe(
      "mode=subscription&line_items[0][price]=price_1&line_items[0][quantity]=1&metadata[workspace_id]=ws 1",
    );
  });
});

describe("passerelles de facturation", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("NoopBillingGateway lit le plan stocké, sans URL", async () => {
    const ws = makeWorkspace({ plan: "PREMIUM" });
    await t.repos.workspaces.save(ws);
    const gw = new NoopBillingGateway(t.database.db);
    expect(await gw.currentPlan(ws.id)).toBe("PREMIUM");
    expect(await gw.createCheckoutUrl()).toBeUndefined();
    expect(await gw.createPortalUrl()).toBeUndefined();
    expect(createBillingGateway(t.database.db, {})).toBeInstanceOf(NoopBillingGateway);
    expect(createBillingGateway(t.database.db, { STRIPE_SECRET_KEY: "sk_test" })).toBeInstanceOf(
      StripeBillingGateway,
    );
    expect(
      stripePricesFromEnv({
        STRIPE_PRICE_PRO_MONTHLY: "price_pro_m",
        STRIPE_PRICE_PREMIUM_YEARLY: "price_prem_y",
      }),
    ).toEqual({
      PRO: { monthly: "price_pro_m" },
      PREMIUM: { yearly: "price_prem_y" },
    });
  });

  it("Stripe : crée le client puis la session Checkout, et le portail", async () => {
    const ws = makeWorkspace({ ownerId: "user_stripe" as never });
    await t.repos.workspaces.save(ws);
    await t.database.db
      .insert(authUser)
      .values({ id: "user_stripe", name: "Léa", email: "lea@example.com" });
    const calls: Array<{ url: string; body: string }> = [];
    const gw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      prices: { PRO: { monthly: "price_pro_m" } },
      fetch: async (url, init) => {
        calls.push({ url, body: String(init.body ?? "") });
        if (url.endsWith("/customers")) return Response.json({ id: "cus_1" });
        if (url.endsWith("/checkout/sessions"))
          return Response.json({ id: "cs_1", url: "https://checkout.stripe.com/c/cs_1" });
        if (url.endsWith("/billing_portal/sessions"))
          return Response.json({ url: "https://billing.stripe.com/p/1" });
        return Response.json({ error: { message: "inconnu" } }, { status: 404 });
      },
    });
    expect(
      await gw.createCheckoutUrl(ws.id, "PREMIUM", "monthly", "https://app/x"),
    ).toBeUndefined();
    expect(await gw.createCheckoutUrl(ws.id, "PRO", "monthly", "https://app/billing")).toBe(
      "https://checkout.stripe.com/c/cs_1",
    );
    expect(calls[0]?.url).toBe("https://api.stripe.com/v1/customers");
    expect(decodeURIComponent(calls[0]?.body ?? "")).toContain("email=lea@example.com");
    expect(decodeURIComponent(calls[1]?.body ?? "")).toContain(
      `success_url=https://app/billing?checkout=success`,
    );
    expect(decodeURIComponent(calls[1]?.body ?? "")).toContain("line_items[0][price]=price_pro_m");
    expect(await gw.createPortalUrl(ws.id, "https://app/billing")).toBe(
      "https://billing.stripe.com/p/1",
    );
    // Le client Stripe est mémorisé : pas de second POST /customers.
    await gw.createCheckoutUrl(ws.id, "PRO", "monthly", "https://app/billing");
    expect(calls.filter((c) => c.url.endsWith("/customers")).length).toBe(1);
  });

  it("Stripe : les webhooks synchronisent le plan", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    const gw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      webhookSecret: SECRET,
      prices: { PREMIUM: { monthly: "price_prem_m" }, PRO: { yearly: "price_pro_y" } },
      logger: { warn: () => undefined, info: () => undefined },
      fetch: async (url) => {
        if (url.endsWith("/subscriptions/sub_1")) {
          return Response.json({
            id: "sub_1",
            status: "active",
            customer: "cus_9",
            items: { data: [{ price: { id: "price_pro_y" } }] },
          });
        }
        return Response.json({}, { status: 404 });
      },
    });

    const checkout = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: { customer: "cus_9", subscription: "sub_1", metadata: { workspace_id: ws.id } },
      },
    });
    await expect(gw.handleWebhook(checkout, "t=1,v1=bad")).rejects.toBeInstanceOf(
      WebhookSignatureError,
    );
    expect(await gw.handleWebhook(checkout, sign(checkout))).toMatchObject({
      handled: true,
      plan: "PRO",
    });
    expect(await gw.currentPlan(ws.id)).toBe("PRO");

    // Changement d'abonnement identifié par le client Stripe (sans metadata).
    const updated = JSON.stringify({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          status: "active",
          customer: "cus_9",
          items: { data: [{ price: { id: "price_prem_m" } }] },
        },
      },
    });
    expect(await gw.handleWebhook(updated, sign(updated))).toMatchObject({
      handled: true,
      workspaceId: ws.id,
      plan: "PREMIUM",
    });
    expect(await gw.currentPlan(ws.id)).toBe("PREMIUM");

    const deleted = JSON.stringify({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", status: "canceled", customer: "cus_9" } },
    });
    expect(await gw.handleWebhook(deleted, sign(deleted))).toMatchObject({
      handled: true,
      plan: "FREE",
    });
    expect(await gw.currentPlan(ws.id)).toBe("FREE");

    const other = JSON.stringify({ type: "invoice.paid", data: { object: {} } });
    expect(await gw.handleWebhook(other, sign(other))).toEqual({
      type: "invoice.paid",
      handled: false,
    });
  });
});
