import { NextResponse } from "next/server";
import { getContainer } from "@/lib/container";
import { pingDatabase } from "@/lib/db/queries";
import { APP_COMMIT, APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Sonde de disponibilité : 200 dès que le conteneur est construit et que la base répond, 503 sinon.
 * Expose la version et le commit servis pour que le pipeline vérifie que le déploiement est bien le sien.
 */
export async function GET(): Promise<Response> {
  const identity = { version: APP_VERSION, commit: APP_COMMIT || null };
  try {
    const deps = await getContainer();
    await pingDatabase(deps.database.db, 2_000);
    return NextResponse.json({ data: { ready: true, ...identity } }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { data: { ready: false, ...identity } },
      { status: 503, headers: NO_STORE },
    );
  }
}
