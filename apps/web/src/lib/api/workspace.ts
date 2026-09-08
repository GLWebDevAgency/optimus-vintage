import { EnsureWorkspaceForUser, type EnsureWorkspaceForUserOutput } from "@chine/application";
import { asUserId, type WorkspaceId } from "@chine/domain";
import type { Container } from "@/lib/container";

/**
 * Espace de travail d'un utilisateur : création au premier passage, puis résolution mémorisée
 * 60 s dans un petit cache LRU (une transaction évitée par requête).
 */
const TTL_MS = 60_000;
const MAX_ENTRIES = 1_000;

interface Entry {
  readonly workspaceId: WorkspaceId;
  readonly expiresAt: number;
}

const cache = new Map<string, Entry>();

/**
 * Exécute `EnsureWorkspaceForUser` en lisant le plan courant avant d'ouvrir la transaction.
 *
 * Le cas d'usage interroge la facturation depuis l'intérieur de sa transaction ; nos passerelles
 * (Stripe comme neutre) lisent ce plan dans la colonne `workspaces.plan`, c'est-à-dire la valeur
 * déjà chargée. PGlite (développement, tests) ne dispose que d'une connexion : une lecture hors
 * transaction pendant une transaction ouverte bloquerait. On fournit donc le plan tel quel.
 */
export async function ensureWorkspace(
  deps: Container,
  userId: string,
  name?: string,
): Promise<EnsureWorkspaceForUserOutput> {
  const existing = await deps.workspaces.byOwner(asUserId(userId));
  const plan = existing?.plan ?? "FREE";
  const result = await new EnsureWorkspaceForUser({
    ...deps,
    billing: { ...deps.billing, currentPlan: async () => plan },
  }).execute({ userId: asUserId(userId), name });
  if (!result.ok) throw result.error;
  return result.value;
}

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
  const { workspace } = await ensureWorkspace(deps, userId);
  remember(userId, workspace.id, now);
  return workspace.id;
}

/** Oublie l'entrée d'un utilisateur (suppression de compte, tests). */
export function forgetWorkspace(userId?: string): void {
  if (userId === undefined) cache.clear();
  else cache.delete(userId);
}
