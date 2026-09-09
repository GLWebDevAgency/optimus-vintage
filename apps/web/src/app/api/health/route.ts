import { LocalPhotoStorage, R2PhotoStorage } from "@chine/infrastructure";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/container";
import { pingDatabase } from "@/lib/db/queries";
import { getEnv } from "@/lib/env";
import { describeError, log } from "@/lib/log";
import { APP_COMMIT, APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2_000;
const startedAt = Date.now();

interface HealthReport {
  status: "ok" | "degraded";
  version: string;
  commit: string | null;
  uptimeSeconds: number;
  checks: {
    database: { ok: boolean; driver?: "pg" | "pglite"; latencyMs?: number; error?: string };
    storage: { driver: "local" | "r2" | "unknown" };
    /** `driver` = premier fournisseur de la chaîne (compatibilité) ; `chain` = ordre de repli. */
    appraiser: {
      driver: string;
      chain: ReadonlyArray<{ provider: string; model: string }>;
      fake: boolean;
    };
    billing: { configured: boolean };
    mail: { configured: boolean };
  };
}

/**
 * État du service, sans aucun secret : base (`SELECT 1` sous 2 s), drivers actifs, version.
 * 200 quand tout répond, 503 sinon (le corps détaille la brique en défaut).
 */
export async function GET(): Promise<Response> {
  const env = getEnv();
  const report: HealthReport = {
    status: "ok",
    version: APP_VERSION,
    commit: APP_COMMIT || null,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    checks: {
      database: { ok: false },
      storage: { driver: "unknown" },
      appraiser: { driver: "unknown", chain: [], fake: false },
      billing: { configured: Boolean(env.STRIPE_SECRET_KEY) },
      mail: { configured: Boolean(env.RESEND_API_KEY) },
    },
  };
  try {
    const deps = await getContainer();
    report.checks.storage.driver =
      deps.photos instanceof LocalPhotoStorage
        ? "local"
        : deps.photos instanceof R2PhotoStorage
          ? "r2"
          : "unknown";
    const appraiser = deps.appraiser.describe();
    // En production, la chaîne n'expose que les fournisseurs (pas les identifiants de modèle).
    report.checks.appraiser = {
      driver: appraiser.chain[0]?.provider ?? "none",
      chain:
        env.NODE_ENV === "production"
          ? appraiser.chain.map((p) => ({ provider: p.provider, model: "•" }))
          : appraiser.chain,
      fake: appraiser.fake,
    };
    report.checks.billing.configured = deps.stripe !== undefined;
    const latencyMs = await pingDatabase(deps.database.db, DB_TIMEOUT_MS);
    report.checks.database = { ok: true, driver: deps.database.driver, latencyMs };
  } catch (e) {
    report.status = "degraded";
    report.checks.database = { ok: false, error: "indisponible" };
    log.error("health : base indisponible", describeError(e));
  }
  return NextResponse.json(
    { data: report },
    { status: report.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
