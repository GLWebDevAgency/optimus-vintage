"use client";

import { ApiClientError } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { AppIcon, Button, EmptyState } from "@chine/ui";
import { useOnline } from "@/lib/offline/network";
import { useT } from "@/hooks/i18n";

/** Message lisible d'une erreur (code API traduit, sinon message brut). */
export function useErrorMessage() {
  const t = useT();
  return (e: unknown): string => {
    if (e instanceof ApiClientError) {
      const key = `errors.code.${e.code}` as MessageKey;
      const text = t(key);
      return text === key ? e.message : text;
    }
    if (e instanceof Error && e.message) return e.message;
    return t("errors.generic");
  };
}

interface ErrorStateProps {
  readonly error: unknown;
  readonly onRetry?: () => void;
  readonly compact?: boolean;
  /** Titre spécifique (« Pièce introuvable »). */
  readonly title?: string;
}

/** État d'erreur d'un écran : hors ligne (nuage barré) ou erreur (triangle), avec « Réessayer ». */
export function ErrorState({ error, onRetry, compact, title }: ErrorStateProps) {
  const t = useT();
  const online = useOnline();
  const describe = useErrorMessage();
  const offline =
    !online || (error instanceof ApiClientError && (error.code === "NETWORK" || error.code === "TIMEOUT"));
  const notFound = error instanceof ApiClientError && error.code === "NOT_FOUND";
  return (
    <EmptyState
      compact={compact}
      illustration={
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-thread">
          <AppIcon name={offline ? "cloudOff" : notFound ? "search" : "alert"} size={30} />
        </span>
      }
      title={
        title ?? (offline ? t("errors.offlineTitle") : notFound ? t("errors.notFoundTitle") : t("errors.title"))
      }
      body={offline ? t("errors.offlineBody") : describe(error)}
      action={
        onRetry ? (
          <Button variant="ghost" onClick={onRetry} leading={<AppIcon name="refresh" size={16} />}>
            {t("errors.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}
