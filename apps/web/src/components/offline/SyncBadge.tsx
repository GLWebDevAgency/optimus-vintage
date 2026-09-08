"use client";

import { useOnline } from "@/lib/offline/network";
import { replay, retryFailed, useOutboxStatus } from "@/lib/offline/outbox";

/**
 * Pastille d'état de synchronisation : « Hors ligne », « Sync plus tard · 2 », « Sync en cours »,
 * « 1 en échec ». Rien à afficher quand tout est à jour.
 */
export function SyncBadge({ className }: { className?: string }) {
  const online = useOnline();
  const { pending, failed, syncing } = useOutboxStatus();

  if (online && pending === 0 && failed === 0 && !syncing) return null;

  let label: string;
  let action: (() => void) | undefined;
  if (!online) {
    label = pending > 0 ? `Hors ligne · ${pending}` : "Hors ligne";
  } else if (syncing) {
    label = "Sync en cours";
  } else if (failed > 0) {
    label = `${failed} en échec`;
    action = () => void retryFailed();
  } else {
    label = `Sync plus tard · ${pending}`;
    action = () => void replay();
  }

  const cls = ["pill dormant outline sync-badge", syncing ? "is-syncing" : "", className]
    .filter(Boolean)
    .join(" ");

  if (!action) {
    return (
      <span className={cls} aria-live="polite">
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={action}
      aria-live="polite"
      title="Synchroniser maintenant"
    >
      {label}
    </button>
  );
}
