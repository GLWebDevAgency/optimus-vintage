import { routes } from "@chine/contract";
import { asWorkspaceId } from "@chine/domain";
import { fail, serviceUnavailable } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { forgetWorkspace } from "@/lib/api/workspace";
import { getAuth } from "@/lib/auth";
import { describeError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Suppression définitive du compte (RGPD) : données de l'espace, photos du stockage,
 * empreinte d'authentification (sessions, comptes, jetons), puis déconnexion.
 * Le corps doit contenir `{ "confirm": "SUPPRIMER" }`.
 */
export const DELETE = withAuth(
  async (req, ctx) => {
    const { deps, userId } = ctx;
    await parseBody(req, routes.deleteAccount.body);

    // 0. Facturation d'abord : un compte effacé ne doit jamais rester facturé. Si Stripe ne répond
    //    pas, on n'efface rien (503) plutôt que de laisser un abonnement orphelin.
    for (const workspaceId of await deps.lifecycle.ownedWorkspaceIds(userId)) {
      try {
        await deps.billing.releaseWorkspace(asWorkspaceId(workspaceId));
      } catch (e) {
        ctx.log.error("résiliation Stripe impossible, suppression annulée", describeError(e));
        return fail(serviceUnavailable("Impossible de résilier l'abonnement pour le moment."));
      }
    }

    // 1. Déconnexion d'abord : on récupère les en-têtes qui effacent le cookie de session.
    const setCookies: string[] = [];
    try {
      const res = await (await getAuth()).api.signOut({ headers: req.headers, asResponse: true });
      setCookies.push(...res.headers.getSetCookie());
    } catch (e) {
      ctx.log.warn("déconnexion impossible avant suppression", describeError(e));
    }

    // 2. Espaces, lignes métier et empreinte auth dans des transactions ; clés photo renvoyées.
    const outcome = await deps.lifecycle.deleteUserFootprint(userId, {
      deleteOwnedWorkspaces: true,
    });
    forgetWorkspace(userId);

    // 3. Fichiers : hors transaction, un échec ne doit pas laisser croire que le compte existe encore.
    let failedPhotos = 0;
    for (const key of outcome.deletedPhotoKeys) {
      try {
        await deps.photos.delete(key);
      } catch (e) {
        failedPhotos += 1;
        ctx.log.error("photo non supprimée", { key, ...describeError(e) });
      }
    }
    ctx.log.info("compte supprimé", {
      workspaces: outcome.deletedWorkspaceIds.length,
      photos: outcome.deletedPhotoKeys.length,
      failedPhotos,
      deletedUser: outcome.deletedUser,
    });

    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const cookie of setCookies) headers.append("set-cookie", cookie);
    return sendDto(
      "DELETE /account",
      routes.deleteAccount.response,
      { userId, deleted: true, deletedWorkspaceIds: outcome.deletedWorkspaceIds },
      { headers },
    );
  },
  { limit: { key: "account:delete", max: 3, windowSeconds: 3600 } },
);
