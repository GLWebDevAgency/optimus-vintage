import {
  type DomainError,
  err,
  ok,
  type Result,
  type UserId,
  type Workspace,
  type WorkspaceId,
} from "@chine/domain";
import { Forbidden, NotFound } from "../errors.js";
import type { WorkspaceRepository } from "../ports/index.js";

/** Toute commande ou requête est scopée à un espace et portée par un acteur. */
export interface WorkspaceScoped {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId;
}

/** Charge l'espace et vérifie que l'acteur en est le propriétaire. */
export async function loadOwnedWorkspace(
  workspaces: WorkspaceRepository,
  scope: WorkspaceScoped,
): Promise<Result<Workspace, DomainError>> {
  const ws = await workspaces.byId(scope.workspaceId);
  if (!ws) return err(new NotFound("Workspace", scope.workspaceId));
  if (ws.ownerId !== scope.actorUserId) return err(new Forbidden());
  return ok(ws);
}
