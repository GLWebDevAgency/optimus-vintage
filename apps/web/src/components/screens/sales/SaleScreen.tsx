"use client";

import type { SaleDto } from "@chine/contract";
import {
  AppIcon,
  Button,
  Field,
  Receipt,
  SnapToggle,
  Stamp,
  StatusPill,
  Tally,
  TextInput,
  useToast,
} from "@chine/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useCancelSale, useRefundSale, useSale } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { usePendingPath } from "@/hooks/offline";
import { ConfirmSheet } from "../common/ConfirmSheet";
import { ErrorState, useErrorMessage } from "../common/ErrorState";
import { label, salePill } from "../common/labels";

/** Détail d'une vente : tampon, reçu complet, statut, annulation / remboursement. */
export function SaleScreen({ id }: { id: string }) {
  const t = useT();
  const query = useSale(id);
  const sale = query.data;
  return (
    <>
      <TopBar
        title={
          sale ? (
            <>
              {t("sales.stampSold")}{" "}
              <em>{t("sales.soldOnPlatform", { platform: label.platform(t, sale.platform) })}</em>
            </>
          ) : (
            t("sales.detailTitle")
          )
        }
        kicker={sale?.number ? t("sales.number", { number: sale.number }) : t("sales.one")}
        back="/app/ventes"
        avatar={false}
      />
      <Screen>
        {!sale && query.isPending ? (
          <PageSkeleton variant="sale" />
        ) : !sale ? (
          <div className="card enter d2">
            <ErrorState
              error={query.error}
              onRetry={() => void query.refetch()}
              title={t("sales.notFound")}
            />
          </div>
        ) : (
          <SaleBody sale={sale} />
        )}
      </Screen>
    </>
  );
}

function SaleBody({ sale }: { sale: SaleDto }) {
  const t = useT();
  const fmt = useFormat();
  const { locale, intl } = useLocale();
  const router = useRouter();
  const { show } = useToast();
  const describe = useErrorMessage();
  const cancel = useCancelSale(sale.id);
  const refund = useRefundSale(sale.id);
  const pending = usePendingPath(`/sales/${encodeURIComponent(sale.id)}/`);
  const [open, setOpen] = useState<null | "cancel" | "refund">(null);
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const eco = sale.economics;
  const neg = (m: { minor: number; currency: string }) => ({
    minor: -Math.abs(m.minor),
    currency: m.currency,
  });
  const pct = (r: number) =>
    new Intl.NumberFormat(intl, {
      style: "percent",
      maximumFractionDigits: 0,
      signDisplay: "exceptZero",
    }).format(r);
  const active = sale.status === "COMPLETED" || sale.status === "PENDING";

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      show(msg, { kind: "success" });
      setOpen(null);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  return (
    <>
      <div className="sale-hero enter d2">
        <div className="ring overflow-hidden">
          {sale.item?.thumbnailUrl ? (
            // biome-ignore lint/performance/noImgElement: photo distante ou URL d'objet, hors next/image
            <img src={sale.item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <AppIcon name="shirt" size={56} className="text-indigo" />
          )}
        </div>
        {sale.status === "COMPLETED" ? (
          <Stamp size="lg" className="absolute top-[26px]" still>
            {t("sales.stampSold")}
          </Stamp>
        ) : null}
        <p className="caption">
          <b className="text-ink">{sale.item?.title ?? t("items.one")}</b> ·{" "}
          {fmt.money(sale.grossPrice)}
          {sale.buyer ? ` · ${t("sales.buyer").toLowerCase()} ${sale.buyer}` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <StatusPill status={salePill(sale.status)} label={label.saleStatus(t, sale.status)} />
          {pending ? <StatusPill status="pending" label={t("common.syncLater")} /> : null}
          <span className="label self-center">{fmt.date(sale.soldAt, "long")}</span>
        </div>
      </div>

      <div className="margin-card enter d3">
        <div className="top">
          <div>
            <span className="k">{t("sales.netMargin")}</span>
            <div className="v">
              <Tally
                value={eco.margin}
                locale={locale}
                size="card"
                tone={eco.margin.minor < 0 ? "thread" : "brass"}
                signed
                duration={0.8}
              />
            </div>
          </div>
          {eco.roi !== undefined ? (
            <span className="pill sold">
              {t("sales.roi")} {pct(eco.roi)}
            </span>
          ) : null}
        </div>
        <Receipt
          bare
          locale={locale}
          rows={[
            { key: "gross", label: t("sales.grossPrice"), value: eco.gross },
            {
              key: "fees",
              label: t("sales.platformFees", { platform: label.platform(t, sale.platform) }),
              value: neg(eco.fees),
            },
            { key: "ship", label: t("sales.shipping"), value: neg(sale.shippingCost) },
            { key: "pack", label: t("sales.packaging"), value: neg(sale.packagingCost) },
            ...(sale.otherCosts.minor > 0
              ? [{ key: "other", label: t("sales.otherCosts"), value: neg(sale.otherCosts) }]
              : []),
            { key: "net", label: t("sales.net"), value: eco.net },
            { key: "acq", label: t("sales.acquisition"), value: neg(sale.acquisitionCost) },
            {
              key: "margin",
              label: t("sales.netMargin"),
              value: eco.margin,
              total: true,
              signed: true,
            },
            ...(eco.marginRate !== undefined
              ? [{ key: "rate", label: t("sales.marginRate"), value: { ratio: eco.marginRate } }]
              : []),
          ]}
        />
      </div>

      {sale.notes ? <p className="text-[13.5px] text-ink-2 enter d4">{sale.notes}</p> : null}

      <div className="flex flex-wrap gap-2 enter d4">
        <Button
          size="sm"
          variant="subtle"
          onClick={() => router.push(`/app/stock/${sale.itemId}`)}
          leading={<AppIcon name="tag" size={14} />}
        >
          {t("sales.viewItem")}
        </Button>
        {active ? (
          <Button size="sm" variant="subtle" onClick={() => setOpen("cancel")}>
            {t("sales.cancel")}
          </Button>
        ) : null}
        {sale.status === "COMPLETED" ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={() => setOpen("refund")}
            className="!text-thread"
          >
            {t("sales.refund")}
          </Button>
        ) : null}
      </div>

      <ConfirmSheet
        open={open === "cancel"}
        onClose={() => setOpen(null)}
        title={t("sales.cancelTitle")}
        description={t("sales.cancelConfirm")}
        confirmLabel={t("sales.cancel")}
        danger
        loading={cancel.isPending}
        onConfirm={() =>
          run(
            () => cancel.mutateAsync(reason.trim() ? { reason: reason.trim() } : {}),
            t("sales.cancelled"),
          )
        }
      >
        <Field label={t("sales.reason")} trailing={t("common.optional")}>
          <TextInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("sales.reasonPlaceholder")}
            maxLength={120}
          />
        </Field>
      </ConfirmSheet>

      <ConfirmSheet
        open={open === "refund"}
        onClose={() => setOpen(null)}
        title={t("sales.refundTitle")}
        description={t("sales.refundConfirm")}
        confirmLabel={t("sales.refund")}
        danger
        loading={refund.isPending}
        onConfirm={() =>
          run(
            () =>
              refund.mutateAsync({ restock, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
            t("sales.refunded"),
          )
        }
      >
        <SnapToggle checked={restock} onChange={setRestock} label={t("sales.refundRestock")} />
        <Field label={t("sales.reason")} trailing={t("common.optional")}>
          <TextInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("sales.reasonPlaceholder")}
            maxLength={120}
          />
        </Field>
      </ConfirmSheet>
    </>
  );
}
