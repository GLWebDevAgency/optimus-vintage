"use client";

import { AppIcon, Button, Sheet } from "@chine/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useOnline } from "@/lib/offline/network";
import {
  discard,
  listEntries,
  type OutboxEntry,
  replay,
  retryFailed,
  useOutboxStatus,
} from "@/lib/offline/outbox";
import {
  discardPendingPhoto,
  retryFailedPhotos,
  startPendingPhotoUploader,
  usePendingPhotos,
} from "@/lib/offline/pending-photos";

/**
 * Bandeau d'état réseau sous la barre supérieure : « Hors ligne · 2 actions en attente »,
 * « 1 action en échec · Réessayer · Voir ». Invisible quand tout est synchronisé.
 * « Voir » ouvre la liste des actions refusées par le serveur : chacune s'abandonne d'un geste,
 * pour qu'un rejeu impossible (quota, pièce supprimée) ne bloque plus la file.
 * Monte aussi l'upload différé des photos et rafraîchit les données après chaque synchronisation.
 */
export function OfflineBanner() {
  const t = useT();
  const online = useOnline();
  const { pending, failed, syncing, lastSyncedAt } = useOutboxStatus();
  const photos = usePendingPhotos();
  const qc = useQueryClient();
  const lastSeen = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<OutboxEntry[]>([]);

  useEffect(() => startPendingPhotoUploader(api), []);

  // Après un rejeu de l'outbox, les listes et compteurs serveur ont changé : on les recharge.
  useEffect(() => {
    if (lastSyncedAt && lastSyncedAt !== lastSeen.current) {
      lastSeen.current = lastSyncedAt;
      void qc.invalidateQueries();
    }
  }, [lastSyncedAt, qc]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listEntries().then((rows) => {
      if (!cancelled) setEntries(rows.filter((e) => e.status === "failed"));
    });
    return () => {
      cancelled = true;
    };
  }, [open, failed]);

  const failedPhotoRows = photos.filter((p) => p.status === "failed");
  const failedPhotos = failedPhotoRows.length;
  const waiting = pending + photos.length - failedPhotos;
  const broken = failed + failedPhotos;

  const retry = () => {
    void retryFailed();
    void retryFailedPhotos(api);
    void replay();
  };
  const dropEntry = async (id: string) => {
    await discard(id);
    setEntries((rows) => rows.filter((e) => e.id !== id));
  };

  if (online && broken === 0 && !syncing && waiting === 0) return null;
  if (online && waiting > 0 && broken === 0) {
    // En ligne avec des actions en attente : la pastille de la barre supérieure suffit.
    return null;
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="offline-banner"
        data-tone={!online ? "offline" : "failed"}
        data-testid="offline-banner"
      >
        <AppIcon name={online ? "alert" : "cloudOff"} size={16} />
        <span className="min-w-0 flex-1 truncate">
          {!online
            ? waiting > 0
              ? t("pwa.offlineBannerPending", { count: waiting })
              : t("pwa.offlineBanner")
            : t("pwa.failedBanner", { count: broken })}
        </span>
        {online && broken > 0 ? (
          <>
            <button type="button" className="offline-banner-btn" onClick={retry}>
              {t("pwa.retryFailed")}
            </button>
            <button
              type="button"
              className="offline-banner-btn"
              onClick={() => setOpen(true)}
              data-testid="offline-failed-open"
            >
              {t("pwa.showFailed")}
            </button>
          </>
        ) : null}
      </div>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("pwa.failedTitle")}
        description={t("pwa.failedBody")}
      >
        <ul className="grid gap-2" data-testid="offline-failed-list">
          {entries.map((e) => (
            <li key={e.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">
                  {e.method} {e.path}
                </div>
                <div className="truncate text-[12px] text-ink-2">{e.lastError ?? "—"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void dropEntry(e.id)}>
                {t("pwa.discard")}
              </Button>
            </li>
          ))}
          {failedPhotoRows.map((p) => (
            <li key={p.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">{t("pwa.failedPhoto")}</div>
                <div className="truncate text-[12px] text-ink-2">{p.lastError ?? "—"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void discardPendingPhoto(p.id)}>
                {t("pwa.discard")}
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Button variant="ghost" onClick={retry}>
            {t("pwa.retryFailed")}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
