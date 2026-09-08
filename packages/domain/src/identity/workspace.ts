import type { Currency } from "../money/currency.js";
import type { UserId, WorkspaceId } from "../shared/ids.js";
import { assertInvariant } from "../shared/result.js";
import type { Plan } from "../billing/plans.js";

export type MemberRole = "OWNER" | "MANAGER" | "SELLER";

/** Marge cible : soit un pourcentage sur le coût, soit un montant fixe par pièce. */
export type TargetMargin =
  | { readonly kind: "PERCENT"; readonly value: number }
  | { readonly kind: "AMOUNT_MINOR"; readonly value: number };

export interface WorkspaceProps {
  readonly id: WorkspaceId;
  readonly ownerId: UserId;
  readonly name: string;
  readonly currency: Currency;
  readonly locale: "fr" | "en" | "de";
  readonly targetMargin: TargetMargin;
  readonly plan: Plan;
  readonly skuPrefix: string;
  readonly createdAt: Date;
}

/** Espace de travail = un compte reseller (multi-tenant natif, prêt pour le multi-utilisateur). */
export class Workspace {
  private constructor(private readonly p: WorkspaceProps) {}

  static create(p: WorkspaceProps): Workspace {
    assertInvariant(p.name.trim().length > 0, "Le nom de l'espace est requis");
    assertInvariant(/^[A-Z]{1,4}$/.test(p.skuPrefix), "Le préfixe SKU doit faire 1 à 4 lettres majuscules", { skuPrefix: p.skuPrefix });
    if (p.targetMargin.kind === "PERCENT") assertInvariant(p.targetMargin.value >= 0 && p.targetMargin.value <= 1000, "Marge cible % hors bornes");
    return new Workspace(p);
  }
  static rehydrate(p: WorkspaceProps): Workspace { return new Workspace(p); }

  get id(): WorkspaceId { return this.p.id; }
  get ownerId(): UserId { return this.p.ownerId; }
  get name(): string { return this.p.name; }
  get currency(): Currency { return this.p.currency; }
  get locale(): "fr" | "en" | "de" { return this.p.locale; }
  get targetMargin(): TargetMargin { return this.p.targetMargin; }
  get plan(): Plan { return this.p.plan; }
  get skuPrefix(): string { return this.p.skuPrefix; }
  get createdAt(): Date { return this.p.createdAt; }

  with(patch: Partial<Pick<WorkspaceProps, "name" | "currency" | "locale" | "targetMargin" | "plan" | "skuPrefix">>): Workspace {
    return Workspace.create({ ...this.p, ...patch });
  }
  toProps(): WorkspaceProps { return { ...this.p }; }
}
