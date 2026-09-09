import type { DbExecutor } from "../db/client.js";
import type { BillingGateway } from "../ports.js";
import { NoopBillingGateway } from "./NoopBillingGateway.js";
import { type PriceMap, StripeBillingGateway } from "./StripeBillingGateway.js";

export { NoopBillingGateway } from "./NoopBillingGateway.js";
export {
  ACTIVE_STATUSES,
  type BillingInterval,
  encodeStripeForm,
  type PaidPlan,
  type PriceMap,
  StripeBillingGateway,
  type StripeBillingGatewayOptions,
  StripeError,
  type WebhookOutcome,
  WebhookSignatureError,
} from "./StripeBillingGateway.js";
export {
  computeStripeSignature,
  parseStripeSignatureHeader,
  verifyStripeSignature,
} from "./stripe-signature.js";

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key]?.trim() || undefined;

/** Grille des prix Stripe lue depuis `STRIPE_PRICE_<PLAN>_<INTERVAL>`. */
export function stripePricesFromEnv(env: Env): PriceMap {
  const prices: PriceMap = {};
  for (const plan of ["PREMIUM", "PRO", "BUSINESS"] as const) {
    const monthly = read(env, `STRIPE_PRICE_${plan}_MONTHLY`);
    const yearly = read(env, `STRIPE_PRICE_${plan}_YEARLY`);
    if (monthly || yearly) {
      prices[plan] = { ...(monthly ? { monthly } : {}), ...(yearly ? { yearly } : {}) };
    }
  }
  return prices;
}

/** Stripe si `STRIPE_SECRET_KEY` est défini, sinon passerelle neutre. */
export function createBillingGateway(db: DbExecutor, env: Env = process.env): BillingGateway {
  const secretKey = read(env, "STRIPE_SECRET_KEY");
  if (!secretKey) return new NoopBillingGateway(db);
  const trial = read(env, "STRIPE_TRIAL_DAYS");
  return new StripeBillingGateway(db, {
    secretKey,
    webhookSecret: read(env, "STRIPE_WEBHOOK_SECRET"),
    prices: stripePricesFromEnv(env),
    automaticTax: read(env, "STRIPE_AUTOMATIC_TAX") === "true",
    trialDays: trial !== undefined ? Math.max(0, Number(trial) || 0) : undefined,
  });
}
