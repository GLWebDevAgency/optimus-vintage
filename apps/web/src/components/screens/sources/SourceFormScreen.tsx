"use client";

import type { Route } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useSource, useWorkspace } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";
import { SourceForm } from "./SourceForm";

/** Création (`id` absent) ou modification d'une source. */
export function SourceFormScreen({ id }: { id?: string }) {
  const t = useT();
  const workspace = useWorkspace();
  const source = useSource(id ?? "");
  const currency = workspace.data?.workspace.currency ?? "EUR";
  const editing = Boolean(id);
  return (
    <>
      <TopBar
        title={editing ? t("common.edit") : t("sources.new")}
        kicker={editing ? source.data?.name ?? t("sources.one") : t("sources.title")}
        back={editing ? (`/app/sources/${id}` as Route) : "/app/sources"}
        avatar={false}
      />
      <Screen>
        {editing && !source.data ? (
          source.isPending ? (
            <PageSkeleton variant="settings" rows={5} />
          ) : (
            <div className="card enter d2">
              <ErrorState error={source.error} onRetry={() => void source.refetch()} title={t("sources.notFound")} />
            </div>
          )
        ) : (
          <div className="enter d2">
            <SourceForm source={source.data} currency={currency} />
          </div>
        )}
      </Screen>
    </>
  );
}
