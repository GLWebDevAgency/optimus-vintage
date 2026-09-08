"use client";

import { Button } from "@chine/ui";
import { useT } from "@/hooks/i18n";

interface LoadMoreProps {
  readonly shown: number;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onMore: () => void;
}

/** Pied de liste paginée : « 50 sur 142 · Charger plus ». */
export function LoadMore({ shown, total, hasMore, loading, onMore }: LoadMoreProps) {
  const t = useT();
  if (total === 0) return null;
  return (
    <div className="grid justify-items-center gap-2 py-2">
      <span className="label">{t("common.showing", { shown, total })}</span>
      {hasMore ? (
        <Button variant="ghost" size="sm" onClick={onMore} loading={loading}>
          {t("common.loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
