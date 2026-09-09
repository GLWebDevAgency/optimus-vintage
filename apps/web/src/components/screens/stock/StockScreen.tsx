"use client";

import { ITEM_SORTS, type ItemSort } from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import {
  AppIcon,
  Button,
  EmptyState,
  List,
  Segmented,
  Select,
  SkeletonRow,
  TextInput,
  useToast,
} from "@chine/ui";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";
import { NextLink } from "@/components/ui/NextLink";
import { api, type ItemsFilter, keys, useItems } from "@/hooks/api";
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
  const qc = useQueryClient();
  const { show } = useToast();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const toggleSelected = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  /** Actions groupées : une requête par pièce (idempotentes), puis rafraîchissement des listes. */
  const bulk = async (label: string, fn: (id: string) => Promise<unknown>) => {
    if (selected.size === 0) return;
    setBusy(true);
    let done = 0;
    for (const id of selected) {
      try {
        await fn(id);
        done += 1;
      } catch {
        // Une pièce refusée (déjà vendue, déjà sortie) n'empêche pas les autres.
      }
    }
    setBusy(false);
    setSelected(new Set());
    setSelecting(false);
    await Promise.all([
      qc.invalidateQueries({ queryKey: keys.itemLists }),
      qc.invalidateQueries({ queryKey: keys.dashboards }),
      qc.invalidateQueries({ queryKey: keys.workspace }),
    ]);
    show(`${label} · ${t("items.bulkDone", { count: done })}`, {
      kind: done > 0 ? "success" : "error",
    });
  };
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
          <Link
            href="/app/chiner"
            className="avatar !bg-btn !text-btn-ink"
            aria-label={t("items.new")}
          >
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
          <div className="flex items-center gap-2">
            <span className="label">{t("items.sortLabel")}</span>
            <button
              type="button"
              className="chip !min-h-[30px] !text-[12px]"
              aria-pressed={selecting}
              onClick={() => {
                setSelecting((v) => !v);
                setSelected(new Set());
              }}
              data-testid="stock-select-toggle"
            >
              {selecting ? t("items.selectDone") : t("items.select")}
            </button>
          </div>
          <Select
            value={sort}
            onChange={setSort}
            aria-label={t("items.sortLabel")}
            className="!min-h-[38px] w-auto max-w-[220px] !py-0 !text-[13px]"
            options={ITEM_SORTS.map((s) => ({
              value: s,
              label: t(`items.sort.${s}` as MessageKey),
            }))}
          />
        </div>

        {visiblePending.length > 0 ? (
          <div className="enter d3" data-testid="stock-pending">
            <List>
              {visiblePending.map((c) => (
                <PendingItemRow key={c.clientId} capture={c} />
              ))}
            </List>
          </div>
        ) : null}

        {query.isPending && !query.data ? (
          <div className="enter d3">
            <SkeletonRow count={6} />
          </div>
        ) : query.isError && !query.data ? (
          <div className="card enter d3">
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
              compact={visiblePending.length > 0}
            />
          </div>
        ) : items.length === 0 ? (
          visiblePending.length > 0 ? null : (
            <div className="card enter d3">
              <EmptyState
                title={filtered ? t("items.emptyFiltered") : t("items.empty")}
                body={filtered ? undefined : t("items.emptyBody")}
                action={
                  filtered ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearch("");
                        changeFilter("all");
                      }}
                    >
                      {t("common.reset")}
                    </Button>
                  ) : (
                    <Button
                      href="/app/chiner"
                      Link={NextLink}
                      leading={<AppIcon name="camera" size={18} />}
                    >
                      {t("nav.chine")}
                    </Button>
                  )
                }
              />
            </div>
          )
        ) : (
          <div className="enter d3 grid gap-3" data-testid="stock-list">
            <List>
              {items.map((it) =>
                selecting ? (
                  <label
                    key={it.id}
                    className="flex items-center gap-2 pl-2"
                    data-testid="stock-select-row"
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-ink"
                      checked={selected.has(it.id)}
                      onChange={() => toggleSelected(it.id)}
                      aria-label={it.title}
                    />
                    <div className="min-w-0 flex-1 pointer-events-none">
                      <ItemRow item={it} pendingSync={pendingStatusIds.has(it.id)} />
                    </div>
                  </label>
                ) : (
                  <ItemRow key={it.id} item={it} pendingSync={pendingStatusIds.has(it.id)} />
                ),
              )}
            </List>
            {selecting ? (
              <div
                className="sticky bottom-[calc(var(--tabbar-h,64px)+8px)] z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-tag"
                data-testid="bulk-bar"
              >
                <span className="label px-1">
                  {t("items.selectedCount", { count: selected.size })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || selected.size === 0}
                  onClick={() =>
                    void bulk(t("items.reserve"), (id) =>
                      api.changeItemStatus({ params: { id }, body: { action: "reserve" } }),
                    )
                  }
                >
                  {t("items.reserve")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || selected.size === 0}
                  onClick={() =>
                    void bulk(t("items.restock"), (id) =>
                      api.changeItemStatus({ params: { id }, body: { action: "restock" } }),
                    )
                  }
                >
                  {t("items.restock")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || selected.size === 0}
                  onClick={() =>
                    void bulk(t("items.writeOff"), (id) =>
                      api.changeItemStatus({
                        params: { id },
                        body: { action: "writeOff", reason: "LOST" },
                      }),
                    )
                  }
                >
                  {t("items.writeOff")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="!text-thread"
                  disabled={busy || selected.size === 0}
                  onClick={() =>
                    void bulk(t("common.delete"), (id) => api.deleteItem({ params: { id } }))
                  }
                >
                  {t("common.delete")}
                </Button>
              </div>
            ) : null}
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
