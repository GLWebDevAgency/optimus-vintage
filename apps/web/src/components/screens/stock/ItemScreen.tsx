"use client";

import type { ItemDto, Platform } from "@chine/contract";
import { ChipGroup, Receipt, SectionHeader, StatusPill } from "@chine/ui";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { type ItemWithSync, useAppraisal, useItem, useWorkspace } from "@/hooks/api";
import { effectiveSchedules, simulateAcross } from "@/hooks/economics";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { usePendingPath } from "@/hooks/offline";
import { ErrorState } from "../common/ErrorState";
import { itemPill, label, MAIN_PLATFORMS } from "../common/labels";
import { FlipTag } from "./FlipTag";
import { ItemActions } from "./ItemActions";
import { ItemPhotos } from "./ItemPhotos";

const SIM_PLATFORMS: readonly Platform[] = MAIN_PLATFORMS.slice(0, 6);

/** Fiche Pièce : étiquette recto/verso, méta, reçu simulé par plateforme, photos, actions. */
export function ItemScreen({ id }: { id: string }) {
  const t = useT();
  const fmt = useFormat();
  const query = useItem(id);
  const item = query.data as ItemWithSync | undefined;
  const pendingStatus = usePendingPath(`/items/${encodeURIComponent(id)}/`);
  const kicker = item
    ? [item.sku, item.sourceName, fmt.date(item.createdAt, "medium")].filter(Boolean).join(" · ")
    : `${t("items.sku")} ${id.slice(0, 8).toUpperCase()}`;

  return (
    <>
      <TopBar title={item?.title ?? t("items.one")} kicker={kicker} back="/app/stock" avatar={false} />
      <Screen>
        {!item && query.isPending ? (
          <PageSkeleton variant="item" />
        ) : !item ? (
          <div className="card enter d2">
            <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t("items.notFound")} />
          </div>
        ) : (
          <ItemBody item={item} pendingSync={pendingStatus || Boolean(item.pendingSync)} />
        )}
      </Screen>
    </>
  );
}

function ItemBody({ item, pendingSync }: { item: ItemDto; pendingSync: boolean }) {
  const t = useT();
  const fmt = useFormat();
  const { locale } = useLocale();
  const workspace = useWorkspace();
  const appraisal = useAppraisal(item.latestAppraisalId);
  const pill = itemPill(t, item.status, item.isDormant);
  const [platform, setPlatform] = useState<Platform>(item.activeListings[0]?.platform ?? "VINTED");

  const aiRange = appraisal.data
    ? t("appraisal.range", {
        low: fmt.money(appraisal.data.price.low, { compact: true }),
        high: fmt.money(appraisal.data.price.high, { compact: true }),
      })
    : undefined;

  const listing = item.activeListings[0];
  const simPrice = listing?.price ?? item.targetPrice;
  const schedules = useMemo(
    () => effectiveSchedules(workspace.data?.feeSchedules ?? workspace.data?.feeOverrides),
    [workspace.data],
  );
  const sims = useMemo(
    () => (simPrice ? simulateAcross(SIM_PLATFORMS, simPrice, item.acquisitionCost, schedules) : []),
    [simPrice, item.acquisitionCost, schedules],
  );
  const sim = sims.find((s) => s.platform === platform) ?? sims[0];

  const meta: { k: string; v: string }[] = [
    { k: t("items.size"), v: item.size ?? "—" },
    { k: t("items.condition"), v: label.condition(t, item.condition) },
    { k: t("items.materials"), v: item.materials.length ? item.materials.join(", ") : "—" },
    { k: t("items.bin"), v: item.bin ?? "—" },
    { k: t("items.category"), v: label.category(t, item.category) },
    { k: t("items.era"), v: item.era ? label.era(t, item.era) : "—" },
  ];
  if (item.brand) meta.unshift({ k: t("items.brand"), v: item.brand });
  if (item.colors.length) meta.push({ k: t("items.colors"), v: item.colors.join(", ") });

  return (
    <>
      <div className="hd enter d1">
        <div className="flex flex-wrap items-center gap-2">
          {pendingSync ? <StatusPill status="pending" label={t("common.syncLater")} /> : null}
          <StatusPill status={pill.status} label={pill.label} />
          {listing ? (
            <span className="label">
              {t("items.listedOn", {
                platform: label.platform(t, listing.platform),
                price: fmt.money(listing.price, { compact: true }),
              })}
            </span>
          ) : (
            <span className="label">{t("items.age", { days: item.ageDays })}</span>
          )}
        </div>
      </div>

      <FlipTag item={item} aiRange={aiRange} />

      <div className="meta enter d3">
        {meta.map((m) => (
          <div key={m.k}>
            <span className="k">{m.k}</span>
            <span className="v truncate">{m.v}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-2.5 enter d4">
        <SectionHeader title={t("items.simulate")} as="h3" />
        {simPrice ? (
          <>
            <ChipGroup
              value={platform}
              onChange={(p) => p && setPlatform(p)}
              allowEmpty={false}
              size="sm"
              scroll
              aria-label={t("sales.platform")}
              options={SIM_PLATFORMS.map((p) => ({ value: p, label: label.platform(t, p) }))}
            />
            {sim ? (
              <Receipt
                locale={locale}
                rows={[
                  { key: "price", label: listing ? t("items.listedPrice") : t("items.targetPrice"), value: sim.price },
                  {
                    key: "fees",
                    label: t("sales.platformFees", { platform: label.platform(t, sim.platform) }),
                    value: { minor: -sim.fees.minor, currency: sim.fees.currency },
                  },
                  {
                    key: "cost",
                    label: t("sales.acquisition"),
                    value: { minor: -item.acquisitionCost.minor, currency: item.acquisitionCost.currency },
                  },
                  { key: "margin", label: t("sales.netMargin"), value: sim.margin, total: true, signed: true },
                  { key: "roi", label: t("sales.roi"), value: { ratio: sim.roi } },
                ]}
              />
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-ink-2">
            {t("items.noTarget")} ·{" "}
            <Link href={`/app/stock/${item.id}/modifier`} className="font-semibold text-ink underline">
              {t("common.edit")}
            </Link>
          </p>
        )}
      </div>

      <div className="grid gap-2.5 enter d5">
        <SectionHeader title={t("items.photos")} as="h3" action={`${item.photos.length}/8`} />
        <ItemPhotos item={item} />
      </div>

      {item.notes ? <p className="text-[13.5px] text-ink-2 enter d5">{item.notes}</p> : null}

      <ItemActions item={item} />
    </>
  );
}
