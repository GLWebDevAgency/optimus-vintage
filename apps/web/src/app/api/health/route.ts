import { LocalPhotoStorage, R2PhotoStorage } from "@chine/infrastructure";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/container";
import { pingDatabase } from "@/lib/db/queries";
import { getEnv } from "@/lib/env";
import { describeError, log } from "@/lib/log";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2_000;
const startedAt = Date.now();

interface HealthReport {
  status: "ok" | "degraded";
  version: string;
  uptimeSeconds: number;
  checks: {
    database: { ok: boolean; driver?: "pg" | "pglite"; latencyMs?: number; error?: string };
    storage: { driver: "local" | "r2" | "unknown" };
    appraiser: { driver: string };
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
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    checks: {
      database: { ok: false },
      storage: { driver: "unknown" },
      appraiser: { driver: "unknown" },
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
    report.checks.appraiser.driver = deps.appraiser.name;
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
