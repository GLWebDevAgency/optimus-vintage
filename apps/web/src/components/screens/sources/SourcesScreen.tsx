"use client";

import type { SourceKind } from "@chine/contract";
import { AppIcon, Button, EmptyState, Segmented } from "@chine/ui";
import Link from "next/link";
import { useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";
import { NextLink } from "@/components/ui/NextLink";
import { useSources } from "@/hooks/api";
import { useLocale, useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";
import { label } from "../common/labels";
import { LoadMore } from "../common/LoadMore";
import { SourceCard } from "./SourceCard";

type Seg = "all" | SourceKind;
const SEGS: readonly Seg[] = ["all", "LOT", "PALLET", "PICKING", "UNIT"];

/** Sources : lots, palettes, pickings, chine à l'unité — chacune se rembourse au fil rouge. */
export function SourcesScreen() {
  const t = useT();
  const { intl } = useLocale();
  const [seg, setSeg] = useState<Seg>("all");
  const query = useSources(seg === "all" ? {} : { kind: seg });
  const sources = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const month = new Intl.DateTimeFormat(intl, { month: "long" }).format(new Date());
  const kicker = query.data
    ? t("sources.monthCount", { month: month.charAt(0).toUpperCase() + month.slice(1), count: total })
    : t("common.loading");

  return (
    <>
      <TopBar
        title={t("sources.title")}
        kicker={kicker}
        actions={
          <Link href="/app/sources/nouvelle" className="avatar !bg-btn !text-btn-ink" aria-label={t("sources.new")} data-testid="sources-new">
            <IconPlus />
          </Link>
        }
      />
      <Screen>
        <Segmented
          value={seg}
          onChange={setSeg}
          size="sm"
          aria-label={t("sources.kind")}
          className="enter d2"
          options={SEGS.map((s) => ({ value: s, label: s === "all" ? t("common.all") : label.sourceKindPlural(t, s) }))}
        />
        {query.isPending && !query.data ? (
          <PageSkeleton variant="sources" rows={4} />
        ) : query.isError && !query.data ? (
          <div className="card enter d3">
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : sources.length === 0 ? (
          <div className="card enter d3">
            <EmptyState
              title={t("sources.empty")}
              body={t("sources.emptyBody")}
              action={
                <Button href="/app/sources/nouvelle" Link={NextLink} leading={<AppIcon name="plus" size={18} />}>
                  {t("sources.new")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3" data-testid="sources-list">
            {sources.map((s, i) => (
              <SourceCard key={s.id} source={s} index={i} />
            ))}
            <LoadMore
              shown={sources.length}
              total={total}
              hasMore={Boolean(query.hasNextPage)}
              loading={query.isFetchingNextPage}
              onMore={() => void query.fetchNextPage()}
            />
          </div>
        )}
      </Screen>
    </>
  );
}
