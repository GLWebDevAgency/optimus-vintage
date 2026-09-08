import { ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * Sonde légère (utilisée par les tests e2e et le serveur Playwright) : ne touche aucune
 * dépendance. Le diagnostic complet vit sur `/api/health`, la disponibilité sur `/api/ready`.
 */
export function GET() {
  return ok({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
