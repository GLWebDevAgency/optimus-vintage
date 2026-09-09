import { eq } from "drizzle-orm";
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
import { workspaces } from "../src/db/schema.js";
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

describe("Stripe : essai, idempotence, ordre et résiliation", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  const subscription = (over: Record<string, unknown> = {}) => ({
    id: "sub_A",
    status: "active",
    customer: "cus_A",
    cancel_at_period_end: false,
    current_period_end: 1_800_000_000,
    items: { data: [{ price: { id: "price_prem_m", recurring: { interval: "month" } } }] },
    ...over,
  });
  const event = (type: string, object: unknown, id: string, created: number) =>
    JSON.stringify({ id, type, created, data: { object } });

  it("propose l'essai sans carte une seule fois, collecte la TVA si Stripe Tax est actif", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    const bodies: string[] = [];
    const gw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      prices: { PREMIUM: { monthly: "price_prem_m" } },
      automaticTax: true,
      idempotencyKey: () => "idem_1",
      fetch: async (url, init) => {
        bodies.push(decodeURIComponent(String(init.body ?? "")));
        expect(new Headers(init.headers).get("idempotency-key")).toBe("idem_1");
        if (url.endsWith("/customers")) return Response.json({ id: "cus_A" });
        if (url.endsWith("/checkout/sessions"))
          return Response.json({ url: "https://checkout.stripe.com/c/x" });
        return Response.json({}, { status: 404 });
      },
    });
    await gw.createCheckoutUrl(ws.id, "PREMIUM", "monthly", "https://app/r");
    const checkout = bodies[1] ?? "";
    expect(checkout).toContain("subscription_data[trial_period_days]=14");
    expect(checkout).toContain("payment_method_collection=if_required");
    expect(checkout).toContain("automatic_tax[enabled]=true");
    expect(checkout).toContain("tax_id_collection[enabled]=true");

    // Un essai consommé (statut trialing vu en webhook) : plus d'essai au Checkout suivant.
    const webhookGw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      webhookSecret: SECRET,
      prices: { PREMIUM: { monthly: "price_prem_m" } },
      logger: { warn: () => undefined, info: () => undefined },
    });
    const trialing = event(
      "customer.subscription.created",
      subscription({
        status: "trialing",
        trial_end: 1_700_000_000,
        metadata: { workspace_id: ws.id },
      }),
      "evt_trial",
      1_690_000_000,
    );
    expect(await webhookGw.handleWebhook(trialing, sign(trialing))).toMatchObject({
      handled: true,
      plan: "PREMIUM",
    });
    expect(await webhookGw.hasActiveSubscription(ws.id)).toBe(true);
    await gw.createCheckoutUrl(ws.id, "PREMIUM", "monthly", "https://app/r");
    expect(bodies[2]).not.toContain("trial_period_days");
  });

  it("ignore les rejeux, les événements en retard et la fin d'un ancien abonnement", async () => {
    const ws = makeWorkspace();
    await t.repos.workspaces.save(ws);
    const gw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      webhookSecret: SECRET,
      prices: { PREMIUM: { monthly: "price_prem_m" }, PRO: { yearly: "price_pro_y" } },
      logger: { warn: () => undefined, info: () => undefined },
    });
    const meta = { metadata: { workspace_id: ws.id }, customer: "cus_B" };
    const created = event("customer.subscription.created", subscription(meta), "evt_1", 1_000);
    expect(await gw.handleWebhook(created, sign(created))).toMatchObject({
      handled: true,
      plan: "PREMIUM",
    });
    // Rejeu du même événement : rien n'est refait.
    expect(await gw.handleWebhook(created, sign(created))).toMatchObject({
      handled: false,
      skipped: "duplicate",
    });
    // Passage à Pro annuel (événement plus récent).
    const upgraded = event(
      "customer.subscription.updated",
      subscription({
        ...meta,
        items: { data: [{ price: { id: "price_pro_y", recurring: { interval: "year" } } }] },
        cancel_at_period_end: true,
      }),
      "evt_2",
      2_000,
    );
    expect(await gw.handleWebhook(upgraded, sign(upgraded))).toMatchObject({ plan: "PRO" });
    const row = await t.database.db.query.workspaces.findFirst({
      where: (w, { eq }) => eq(w.id, ws.id),
    });
    expect(row).toMatchObject({
      plan: "PRO",
      subscriptionStatus: "active",
      subscriptionInterval: "yearly",
      cancelAtPeriodEnd: true,
    });
    expect(row?.currentPeriodEnd?.toISOString()).toBe(new Date(1_800_000_000 * 1000).toISOString());
    // Un événement plus ancien (Stripe livre dans le désordre) ne rétrograde pas.
    const late = event("customer.subscription.updated", subscription(meta), "evt_3", 1_500);
    expect(await gw.handleWebhook(late, sign(late))).toMatchObject({
      handled: false,
      skipped: "stale",
    });
    expect(await gw.currentPlan(ws.id)).toBe("PRO");
    // La suppression d'un autre abonnement (ancien, remplacé) n'annule pas le courant.
    const otherDeleted = event(
      "customer.subscription.deleted",
      subscription({ ...meta, id: "sub_OLD", status: "canceled" }),
      "evt_4",
      3_000,
    );
    expect(await gw.handleWebhook(otherDeleted, sign(otherDeleted))).toMatchObject({
      handled: false,
      skipped: "other-subscription",
    });
    expect(await gw.currentPlan(ws.id)).toBe("PRO");
    // Impayé : statut visible, accès conservé.
    const failed = event("invoice.payment_failed", { customer: "cus_B" }, "evt_5", 3_500);
    expect(await gw.handleWebhook(failed, sign(failed))).toMatchObject({ handled: true });
    expect(await gw.hasActiveSubscription(ws.id)).toBe(true);
    // Fin réelle de l'abonnement courant.
    const deleted = event(
      "customer.subscription.deleted",
      subscription({ ...meta, status: "canceled" }),
      "evt_6",
      4_000,
    );
    expect(await gw.handleWebhook(deleted, sign(deleted))).toMatchObject({
      handled: true,
      plan: "FREE",
    });
    expect(await gw.hasActiveSubscription(ws.id)).toBe(false);
  });

  it("releaseWorkspace résilie l'abonnement, efface le client et tolère les 404", async () => {
    const ws = makeWorkspace({ plan: "PRO" });
    await t.repos.workspaces.save(ws);
    await t.database.db
      .update(workspaces)
      .set({
        stripeCustomerId: "cus_R",
        stripeSubscriptionId: "sub_R",
        subscriptionStatus: "active",
      })
      .where(eq(workspaces.id, ws.id));
    const calls: string[] = [];
    const gw = new StripeBillingGateway(t.database.db, {
      secretKey: "sk_test",
      prices: {},
      logger: { warn: () => undefined, info: () => undefined },
      fetch: async (url, init) => {
        calls.push(`${init.method} ${url}`);
        if (url.endsWith("/customers/cus_R"))
          return Response.json({ error: { message: "No such customer" } }, { status: 404 });
        return Response.json({ deleted: true });
      },
    });
    await gw.releaseWorkspace(ws.id);
    expect(calls).toEqual([
      "DELETE https://api.stripe.com/v1/subscriptions/sub_R",
      "DELETE https://api.stripe.com/v1/customers/cus_R",
    ]);
    expect(await gw.currentPlan(ws.id)).toBe("FREE");
    expect(await gw.hasActiveSubscription(ws.id)).toBe(false);
  });
});
