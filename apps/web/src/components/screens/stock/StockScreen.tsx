"use client";

import { ITEM_SORTS, type ItemSort } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { AppIcon, Button, EmptyState, List, Segmented, Select, SkeletonRow, TextInput } from "@chine/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";
import { NextLink } from "@/components/ui/NextLink";
import { type ItemsFilter, useItems } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useOutboxEntries, usePendingCaptures } from "@/hooks/offline";
import { ErrorState } from "../common/ErrorState";
import { LoadMore } from "../common/LoadMore";
import { ItemRow, PendingItemRow } from "./ItemRow";

type Filter = "all" | "stock" | "online" | "dormant" | "sold";
const FILTERS: readonly Filter[] = ["all", "stock", "online", "dormant", "sold"];

const isFilter = (v: string | null): v is Filter => FILTERS.includes(v as Filter);

function toApiFilter(f: Filter, search: string, sort: ItemSort): ItemsFilter {
  const base: ItemsFilter = { sort, ...(search ? { search } : {}) };
  switch (f) {
    case "stock":
      return { ...base, status: ["IN_STOCK"] };
    case "online":
      return { ...base, status: ["LISTED"] };
    case "dormant":
      return { ...base, dormantOnly: true };
    case "sold":
      return { ...base, status: ["SOLD"] };
    default:
      return base;
  }
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** Stock : recherche, filtre de statut, tri, liste paginée par 50, captures hors ligne en tête. */
export function StockScreen() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("filter");
  const [filter, setFilter] = useState<Filter>(isFilter(initial) ? initial : "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ItemSort>("newest");
  const debounced = useDebounced(search.trim(), 300);
  const apiFilter = useMemo(() => toApiFilter(filter, debounced, sort), [filter, debounced, sort]);
  const query = useItems(apiFilter);
  const pending = usePendingCaptures();
  const outbox = useOutboxEntries();
  const pendingStatusIds = useMemo(
    () =>
      new Set(
        outbox
          .map((e) => /^\/items\/([^/]+)\/status$/.exec(e.path)?.[1])
          .filter((id): id is string => Boolean(id))
          .map((id) => decodeURIComponent(id)),
      ),
    [outbox],
  );

  const changeFilter = (f: Filter) => {
    setFilter(f);
    router.replace(f === "all" ? "/app/stock" : `/app/stock?filter=${f}`);
  };

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const showPending = (filter === "all" || filter === "stock") && !debounced;
  const visiblePending = showPending ? pending : [];
  const empty = items.length === 0 && visiblePending.length === 0;
  const filtered = filter !== "all" || debounced !== "";

  return (
    <>
      <TopBar
        title={t("items.title")}
        kicker={
          query.data
            ? t("items.count", { count: total + visiblePending.length })
            : t("common.loading")
        }
        actions={
          <Link href="/app/chiner" className="avatar !bg-btn !text-btn-ink" aria-label={t("items.new")}>
            <IconPlus />
          </Link>
        }
      />
      <Screen>
        <div className="enter d1">
          <TextInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("items.searchPlaceholder")}
            leading={<AppIcon name="search" size={16} />}
            aria-label={t("common.search")}
            autoComplete="off"
            enterKeyHint="search"
            data-testid="stock-search"
          />
        </div>
        <Segmented
          value={filter}
          onChange={changeFilter}
          size="sm"
          aria-label={t("items.filters")}
          className="enter d2"
          options={[
            { value: "all", label: t("items.filterAll") },
            { value: "stock", label: t("items.status.IN_STOCK") },
            { value: "online", label: t("items.status.LISTED") },
            { value: "dormant", label: t("dashboard.dormant") },
            { value: "sold", label: t("items.filterSold") },
          ]}
        />
        <div className="flex items-center justify-between gap-3 enter d2">
          <span className="label">{t("items.sortLabel")}</span>
          <Select
            value={sort}
            onChange={setSort}
            aria-label={t("items.sortLabel")}
            className="!min-h-[38px] w-auto max-w-[220px] !py-0 !text-[13px]"
            options={ITEM_SORTS.map((s) => ({ value: s, label: t(`items.sort.${s}` as MessageKey) }))}
          />
        </div>

        {query.isPending && !query.data ? (
          <div className="enter d3">
            <SkeletonRow count={6} />
          </div>
        ) : query.isError && !query.data ? (
          <div className="card enter d3">
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : empty ? (
          <div className="card enter d3">
            <EmptyState
              title={filtered ? t("items.emptyFiltered") : t("items.empty")}
              body={filtered ? undefined : t("items.emptyBody")}
              action={
                filtered ? (
                  <Button variant="ghost" onClick={() => { setSearch(""); changeFilter("all"); }}>
                    {t("common.reset")}
                  </Button>
                ) : (
                  <Button href="/app/chiner" Link={NextLink} leading={<AppIcon name="camera" size={18} />}>
                    {t("nav.chine")}
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="enter d3 grid gap-3" data-testid="stock-list">
            <List>
              {visiblePending.map((c) => (
                <PendingItemRow key={c.clientId} capture={c} />
              ))}
              {items.map((it) => (
                <ItemRow key={it.id} item={it} pendingSync={pendingStatusIds.has(it.id)} />
              ))}
            </List>
            <LoadMore
              shown={items.length}
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
