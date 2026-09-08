import type { DomainEvent, Plan, WorkspaceId } from "@chine/domain";
import type { BillingGateway, EventPublisher, PhotoStorage } from "../ports/index.js";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Stockage photo en mémoire : clés `ws/photo-n.ext`, URLs `memory://`. */
export class InMemoryPhotoStorage implements PhotoStorage {
  readonly objects = new Map<string, { bytes: Uint8Array; mimeType: string }>();
  #n = 0;

  async createUploadTarget(workspaceId: WorkspaceId, mimeType: string) {
    this.#n += 1;
    const key = `${workspaceId}/photo-${this.#n}.${EXT[mimeType] ?? "bin"}`;
    return {
      key,
      uploadUrl: `memory://upload/${key}`,
      method: "PUT" as const,
      headers: { "content-type": mimeType },
    };
  }
  async put(key: string, bytes: Uint8Array, mimeType: string): Promise<void> {
    this.objects.set(key, { bytes, mimeType });
  }
  publicUrl(key: string): string {
    return `memory://photos/${key}`;
  }
  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

/** Enregistre tout ce qui est publié, pour les assertions. */
export class RecordingEventPublisher implements EventPublisher {
  readonly events: DomainEvent[] = [];
  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
  ofType<T extends DomainEvent["type"]>(type: T): Extract<DomainEvent, { type: T }>[] {
    return this.events.filter((e): e is Extract<DomainEvent, { type: T }> => e.type === type);
  }
  clear(): void {
    this.events.length = 0;
  }
}

/** Facturation statique : un plan fixe, des URLs factices (ou `undefined` si désactivé). */
export class StaticBilling implements BillingGateway {
  constructor(
    private plan: Plan = "FREE",
    private readonly available = true,
  ) {}
  setPlan(plan: Plan): void {
    this.plan = plan;
  }
  async currentPlan(): Promise<Plan> {
    return this.plan;
  }
  async createCheckoutUrl(
    workspaceId: WorkspaceId,
    plan: Exclude<Plan, "FREE">,
    interval: "monthly" | "yearly",
  ): Promise<string | undefined> {
    return this.available
      ? `https://billing.test/checkout/${workspaceId}/${plan}/${interval}`
      : undefined;
  }
  async createPortalUrl(workspaceId: WorkspaceId): Promise<string | undefined> {
    return this.available ? `https://billing.test/portal/${workspaceId}` : undefined;
  }
}
