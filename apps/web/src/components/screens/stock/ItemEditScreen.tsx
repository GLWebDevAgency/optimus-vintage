"use client";

import type { Route } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useItem } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";
import { ItemForm } from "./ItemForm";

export function ItemEditScreen({ id }: { id: string }) {
  const t = useT();
  const query = useItem(id);
  return (
    <>
      <TopBar
        title={t("items.editTitle")}
        kicker={query.data?.sku ?? t("items.one")}
        back={`/app/stock/${id}` as Route}
        avatar={false}
      />
      <Screen>
        {query.data ? (
          <div className="enter d2">
            <ItemForm item={query.data} />
          </div>
        ) : query.isPending ? (
          <PageSkeleton variant="settings" rows={6} />
        ) : (
          <div className="card enter d2">
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
              title={t("items.notFound")}
            />
          </div>
        )}
      </Screen>
    </>
  );
}
