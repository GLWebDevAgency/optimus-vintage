import { NextResponse } from "next/server";
import { getContainer } from "@/lib/container";
import { pingDatabase } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Sonde de disponibilité : 200 dès que le conteneur est construit et que la base répond, 503 sinon. */
export async function GET(): Promise<Response> {
  try {
    const deps = await getContainer();
    await pingDatabase(deps.database.db, 2_000);
    return NextResponse.json(
      { data: { ready: true } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { data: { ready: false } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
