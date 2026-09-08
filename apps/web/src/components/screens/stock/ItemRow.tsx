"use client";

import type { ItemDto } from "@chine/contract";
import { AppIcon, ListRow, StatusPill } from "@chine/ui";
import { NextLink } from "@/components/ui/NextLink";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import type { PendingCapture } from "@/hooks/offline";
import { itemPill, label } from "../common/labels";

/** Ligne du stock : vignette, titre, référence · âge, pastille de statut, prix cible. */
export function ItemRow({ item, pendingSync }: { item: ItemDto; pendingSync?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const pill = itemPill(t, item.status, item.isDormant);
  const age = item.status === "SOLD" || item.status === "LOST" || item.status === "DONATED"
    ? label.itemStatus(t, item.status)
    : t("items.ageShort", { days: item.ageDays });
  return (
    <ListRow
      href={`/app/stock/${item.id}`}
      Link={NextLink}
      thumb={item.photos[0]?.thumbnailUrl ?? item.photoUrls[0]}
      title={item.title}
      sub={`${item.sku} · ${age}${item.brand ? ` · ${item.brand}` : ""}`}
      amount={item.targetPrice ? { ...item.targetPrice } : undefined}
      tone="neutral"
      signed={false}
      locale={locale}
      trailing={
        pendingSync ? (
          <StatusPill status="pending" label={t("common.syncLater")} />
        ) : (
          <StatusPill status={pill.status} label={pill.label} />
        )
      }
    />
  );
}

/** Capture hors ligne, pas encore créée côté serveur. */
export function PendingItemRow({ capture }: { capture: PendingCapture }) {
  const t = useT();
  const fmt = useFormat();
  const c = capture.command;
  const price = c.pricePaid ? fmt.money({ minor: c.pricePaid.minor, currency: c.pricePaid.currency }, { compact: true }) : "";
  return (
    <ListRow
      thumb={capture.photoUrl ?? <AppIcon name="camera" size={18} />}
      title={c.title ?? t("items.pendingItemTitle")}
      sub={[price, c.locationLabel ?? label.supplierKindShort(t, c.supplierKind ?? "OTHER")]
        .filter(Boolean)
        .join(" · ")}
      trailing={
        <StatusPill
          status={capture.stage === "failed" ? "dormant" : "pending"}
          label={capture.stage === "failed" ? t("pwa.failedBanner", { count: 1 }) : t("common.syncLater")}
        />
      }
      className={capture.stage === "failed" ? "opacity-80" : undefined}
    />
  );
}
