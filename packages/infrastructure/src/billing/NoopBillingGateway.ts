import type { Plan, WorkspaceId } from "@chine/domain";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { workspaces } from "../db/schema.js";
import type { BillingGateway } from "../ports.js";

/** Sans Stripe : le plan est celui stocké sur l'espace, aucune URL de paiement. */
export class NoopBillingGateway implements BillingGateway {
  constructor(private readonly db: DbExecutor) {}

  async currentPlan(workspaceId: WorkspaceId): Promise<Plan> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { plan: true },
      where: eq(workspaces.id, workspaceId),
    });
    return row?.plan ?? "FREE";
  }

  async createCheckoutUrl(): Promise<string | undefined> {
    return undefined;
  }

  async createPortalUrl(): Promise<string | undefined> {
    return undefined;
  }
}
