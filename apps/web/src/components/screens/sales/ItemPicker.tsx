"use client";

import type { ItemDto } from "@chine/contract";
import { AppIcon, EmptyState, List, ListRow, Sheet, SkeletonRow, TextInput } from "@chine/ui";
import { useEffect, useState } from "react";
import { useItems } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";

interface ItemPickerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPick: (item: ItemDto) => void;
}

/** Choisir la pièce vendue parmi le stock (en stock, en ligne, réservée). */
export function ItemPicker({ open, onClose, onPick }: ItemPickerProps) {
  const t = useT();
  const fmt = useFormat();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const id = window.setTimeout(() => setQ(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);
  const query = useItems(
    { status: ["IN_STOCK", "LISTED", "RESERVED"], sort: "newest", ...(q ? { search: q } : {}) },
    { enabled: open },
  );
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Sheet open={open} onClose={onClose} title={t("sales.pickItem")} maxHeight="88dvh">
      <div className="grid gap-3 py-1">
        <TextInput
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("sales.pickItemSearch")}
          leading={<AppIcon name="search" size={16} />}
          data-autofocus
          data-testid="picker-search"
        />
        {query.isPending ? (
          <SkeletonRow count={4} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} compact />
        ) : items.length === 0 ? (
          <EmptyState compact title={t("sales.noItemsToSell")} />
        ) : (
          <List>
            {items.map((it) => (
              <ListRow
                key={it.id}
                onClick={() => onPick(it)}
                thumb={it.photos[0]?.thumbnailUrl ?? it.photoUrls[0]}
                title={it.title}
                sub={`${it.sku} · ${fmt.money(it.acquisitionCost, { compact: true })}`}
                amount={it.targetPrice ? fmt.money(it.targetPrice, { compact: true }) : undefined}
                chevron
              />
            ))}
          </List>
        )}
        {query.hasNextPage ? (
          <button type="button" className="btn ghost" onClick={() => void query.fetchNextPage()}>
            {t("common.loadMore")}
          </button>
        ) : null}
      </div>
    </Sheet>
  );
}
