/** Vérification de signature des webhooks Stripe (en-tête `Stripe-Signature`, schéma v1). */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyOptions {
  /** Tolérance d'horodatage en secondes (défaut 300, comme le SDK Stripe). */
  readonly toleranceSeconds?: number | undefined;
  /** Horloge injectable (tests), en secondes Unix. */
  readonly nowSeconds?: number | undefined;
}

/** Découpe `t=...,v1=...,v1=...` en horodatage + signatures candidates. */
export function parseStripeSignatureHeader(header: string): {
  timestamp: number;
  signatures: string[];
} {
  let timestamp = Number.NaN;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "t") timestamp = Number.parseInt(value, 10);
    else if (key === "v1") signatures.push(value);
  }
  return { timestamp, signatures };
}

/** Signature attendue pour un corps brut et un horodatage. */
export function computeStripeSignature(payload: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
}

/**
 * `true` si l'une des signatures v1 correspond au HMAC-SHA256 de `${t}.${payload}` et si
 * l'horodatage est dans la tolérance. Comparaison en temps constant.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): boolean {
  if (!header || !secret) return false;
  const { timestamp, signatures } = parseStripeSignatureHeader(header);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  const tolerance = options.toleranceSeconds ?? 300;
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (tolerance > 0 && Math.abs(now - timestamp) > tolerance) return false;
  const expected = Buffer.from(computeStripeSignature(payload, timestamp, secret), "hex");
  return signatures.some((sig) => {
    if (!/^[0-9a-f]+$/i.test(sig)) return false;
    const candidate = Buffer.from(sig, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}
