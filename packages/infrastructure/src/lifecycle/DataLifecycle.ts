/**
 * Cycle de vie des données (RGPD) : portabilité (export JSON complet d'un espace),
 * effacement d'un espace et effacement de l'empreinte d'un utilisateur (tables Better Auth).
 * La suppression des fichiers photo est laissée à l'appelant (`PhotoStorage.delete`).
 */
import { eq, inArray } from "drizzle-orm";
import { serializeAppraisalBody } from "../ai/appraisal-codec.js";
import * as auth from "../db/auth-schema.js";
import type { DbExecutor } from "../db/client.js";
import {
  appraisals,
  items,
  listings,
  outboxEvents,
  purchaseSources,
  sales,
  workspaceMembers,
  workspaces,
} from "../db/schema.js";
import { appraisalToDomain } from "../repositories/DrizzleAppraisalRepository.js";
import { itemToDomain } from "../repositories/DrizzleItemRepository.js";
import { listingToDomain } from "../repositories/DrizzleListingRepository.js";
import { purchaseSourceToDomain } from "../repositories/DrizzlePurchaseSourceRepository.js";
import { saleToDomain } from "../repositories/DrizzleSaleRepository.js";
import { workspaceToDomain } from "../repositories/DrizzleWorkspaceRepository.js";

export type JsonObject = Record<string, unknown>;

export interface WorkspaceExport {
  readonly format: "chine.workspace-export";
  readonly version: 1;
  readonly exportedAt: string;
  readonly workspace: JsonObject;
  readonly members: ReadonlyArray<{ userId: string; role: string; createdAt: string }>;
  readonly feeOverrides: JsonObject;
  readonly monthlyGoalMinor: number | null;
  readonly sources: readonly JsonObject[];
  readonly items: readonly JsonObject[];
  readonly listings: readonly JsonObject[];
  readonly sales: readonly JsonObject[];
  readonly appraisals: readonly JsonObject[];
}

export class WorkspaceNotFoundError extends Error {
  override readonly name = "WorkspaceNotFoundError";
  constructor(readonly workspaceId: string) {
    super(`Espace de travail introuvable : ${workspaceId}`);
  }
}

/** `Money.toJSON()` et `Date` → ISO, via une passe JSON. */
const toJson = (v: unknown): JsonObject => JSON.parse(JSON.stringify(v)) as JsonObject;

export class DataLifecycle {
  constructor(
    private readonly db: DbExecutor,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Export complet et portable d'un espace (uniquement ses propres lignes). */
  async exportWorkspace(workspaceId: string): Promise<WorkspaceExport> {
    const ws = await this.db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });
    if (!ws) throw new WorkspaceNotFoundError(workspaceId);
    // PGlite sérialise les requêtes : on lit séquentiellement, dans un ordre stable.
    const members = await this.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    const sourceRows = await this.db
      .select()
      .from(purchaseSources)
      .where(eq(purchaseSources.workspaceId, workspaceId))
      .orderBy(purchaseSources.createdAt);
    const itemRows = await this.db
      .select()
      .from(items)
      .where(eq(items.workspaceId, workspaceId))
      .orderBy(items.createdAt);
    const listingRows = await this.db
      .select()
      .from(listings)
      .where(eq(listings.workspaceId, workspaceId))
      .orderBy(listings.listedAt);
    const saleRows = await this.db
      .select()
      .from(sales)
      .where(eq(sales.workspaceId, workspaceId))
      .orderBy(sales.soldAt);
    const appraisalRows = await this.db
      .select()
      .from(appraisals)
      .where(eq(appraisals.workspaceId, workspaceId))
      .orderBy(appraisals.createdAt);

    return {
      format: "chine.workspace-export",
      version: 1,
      exportedAt: this.now().toISOString(),
      workspace: toJson(workspaceToDomain(ws).toProps()),
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      })),
      feeOverrides: toJson(ws.feeOverrides),
      monthlyGoalMinor: ws.monthlyGoalMinor,
      sources: sourceRows.map((r) => toJson(purchaseSourceToDomain(r).toProps())),
      items: itemRows.map((r) => toJson(itemToDomain(r).toProps())),
      listings: listingRows.map((r) => toJson(listingToDomain(r).toProps())),
      sales: saleRows.map((r) => toJson(saleToDomain(r).toProps())),
      appraisals: appraisalRows.map((r) => {
        const a = appraisalToDomain(r);
        return toJson({
          id: a.id,
          workspaceId: a.workspaceId,
          itemId: a.itemId ?? null,
          provider: a.provider,
          model: a.model,
          latencyMs: a.latencyMs,
          createdAt: a.createdAt,
          ...serializeAppraisalBody(a),
        });
      }),
    };
  }

  /**
   * Efface un espace et toutes ses lignes métier dans une transaction.
   * Renvoie les clés des photos à supprimer ensuite du stockage.
   */
  async deleteWorkspace(workspaceId: string): Promise<{ deletedPhotoKeys: string[] }> {
    return this.db.transaction(async (tx) => {
      const ws = await tx.query.workspaces.findFirst({
        columns: { id: true },
        where: eq(workspaces.id, workspaceId),
      });
      if (!ws) return { deletedPhotoKeys: [] };
      const photoRows = await tx
        .select({ photos: items.photos })
        .from(items)
        .where(eq(items.workspaceId, workspaceId));
      const deletedPhotoKeys = photoRows.flatMap((r) => r.photos.map((p) => p.key));

      // Ordre explicite (enfants → parents) : indépendant des cascades.
      await tx.delete(appraisals).where(eq(appraisals.workspaceId, workspaceId));
      await tx.delete(sales).where(eq(sales.workspaceId, workspaceId));
      await tx.delete(listings).where(eq(listings.workspaceId, workspaceId));
      await tx.delete(items).where(eq(items.workspaceId, workspaceId));
      await tx.delete(purchaseSources).where(eq(purchaseSources.workspaceId, workspaceId));
      await tx.delete(outboxEvents).where(eq(outboxEvents.workspaceId, workspaceId));
      await tx.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
      await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
      return { deletedPhotoKeys };
    });
  }

  /** Espaces dont l'utilisateur est propriétaire (à traiter avant d'effacer son compte). */
  async ownedWorkspaceIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.ownerUserId, userId));
    return rows.map((r) => r.id);
  }

  /**
   * Efface l'empreinte d'un utilisateur : sessions, comptes OAuth/mot de passe, jetons de
   * vérification liés à son e-mail, adhésions aux espaces, puis la ligne `user`.
   * Avec `deleteOwnedWorkspaces`, ses espaces sont effacés aussi (clés photo renvoyées) ;
   * sinon, s'il en possède, on refuse afin de ne pas laisser d'espace orphelin.
   */
  async deleteUserFootprint(
    userId: string,
    options: { deleteOwnedWorkspaces?: boolean } = {},
  ): Promise<{ deletedUser: boolean; deletedWorkspaceIds: string[]; deletedPhotoKeys: string[] }> {
    const owned = await this.ownedWorkspaceIds(userId);
    const deletedPhotoKeys: string[] = [];
    if (owned.length > 0) {
      if (!options.deleteOwnedWorkspaces) {
        throw new Error(
          `L'utilisateur ${userId} possède encore ${owned.length} espace(s) : les transférer ou passer deleteOwnedWorkspaces`,
        );
      }
      for (const id of owned)
        deletedPhotoKeys.push(...(await this.deleteWorkspace(id)).deletedPhotoKeys);
    }

    const deletedUser = await this.db.transaction(async (tx) => {
      const user = await tx.query.user.findFirst({
        columns: { id: true, email: true },
        where: eq(auth.user.id, userId),
      });
      await tx.delete(workspaceMembers).where(eq(workspaceMembers.userId, userId));
      await tx.delete(auth.session).where(eq(auth.session.userId, userId));
      await tx.delete(auth.account).where(eq(auth.account.userId, userId));
      if (!user) return false;
      await tx
        .delete(auth.verification)
        .where(inArray(auth.verification.identifier, [user.email, user.email.toLowerCase()]));
      await tx.delete(auth.user).where(eq(auth.user.id, userId));
      return true;
    });

    return { deletedUser, deletedWorkspaceIds: owned, deletedPhotoKeys };
  }
}
