import { ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
