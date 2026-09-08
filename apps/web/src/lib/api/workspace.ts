import { EnsureWorkspaceForUser } from "@chine/application";
import { asUserId, type WorkspaceId } from "@chine/domain";
import type { Container } from "@/lib/container";

/**
 * Résolution de l'espace de travail d'un utilisateur, mémorisée 60 s dans un petit cache LRU :
 * le premier appel crée l'espace s'il n'existe pas encore (inscription concurrente, import…),
 * les suivants évitent une transaction par requête.
 */
const TTL_MS = 60_000;
const MAX_ENTRIES = 1_000;

interface Entry {
  readonly workspaceId: WorkspaceId;
  readonly expiresAt: number;
}

const cache = new Map<string, Entry>();

function remember(userId: string, workspaceId: WorkspaceId, now: number): void {
  cache.delete(userId);
  cache.set(userId, { workspaceId, expiresAt: now + TTL_MS });
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export async function resolveWorkspaceId(deps: Container, userId: string): Promise<WorkspaceId> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > now) {
    // Rafraîchit la position LRU sans toucher l'expiration.
    cache.delete(userId);
    cache.set(userId, hit);
    return hit.workspaceId;
  }
  const result = await new EnsureWorkspaceForUser(deps).execute({ userId: asUserId(userId) });
  if (!result.ok) throw result.error;
  const workspaceId = result.value.workspace.id;
  remember(userId, workspaceId, now);
  return workspaceId;
}

/** Oublie l'entrée d'un utilisateur (suppression de compte, tests). */
export function forgetWorkspace(userId?: string): void {
  if (userId === undefined) cache.clear();
  else cache.delete(userId);
}
