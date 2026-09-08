"use client";

import { AppIcon } from "@chine/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useOnline } from "@/lib/offline/network";
import { replay, retryFailed, useOutboxStatus } from "@/lib/offline/outbox";
import {
  retryFailedPhotos,
  startPendingPhotoUploader,
  usePendingPhotos,
} from "@/lib/offline/pending-photos";

/**
 * Bandeau d'état réseau sous la barre supérieure : « Hors ligne · 2 actions en attente »,
 * « 1 action en échec · Réessayer ». Invisible quand tout est synchronisé.
 * Monte aussi l'upload différé des photos et rafraîchit les données après chaque synchronisation.
 */
export function OfflineBanner() {
  const t = useT();
  const online = useOnline();
  const { pending, failed, syncing, lastSyncedAt } = useOutboxStatus();
  const photos = usePendingPhotos();
  const qc = useQueryClient();
  const lastSeen = useRef<number | null>(null);

  useEffect(() => startPendingPhotoUploader(api), []);

  // Après un rejeu de l'outbox, les listes et compteurs serveur ont changé : on les recharge.
  useEffect(() => {
    if (lastSyncedAt && lastSyncedAt !== lastSeen.current) {
      lastSeen.current = lastSyncedAt;
      void qc.invalidateQueries();
    }
  }, [lastSyncedAt, qc]);

  const failedPhotos = photos.filter((p) => p.status === "failed").length;
  const waiting = pending + photos.length - failedPhotos;
  const broken = failed + failedPhotos;

  if (online && broken === 0 && !syncing && waiting === 0) return null;
  if (online && waiting > 0 && broken === 0) {
    // En ligne avec des actions en attente : la pastille de la barre supérieure suffit.
    return null;
  }

  const retry = () => {
    void retryFailed();
    void retryFailedPhotos(api);
    void replay();
  };

  return (
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
        <button type="button" className="offline-banner-btn" onClick={retry}>
          {t("pwa.retryFailed")}
        </button>
      ) : null}
    </div>
  );
}
