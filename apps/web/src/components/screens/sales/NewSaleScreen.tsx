"use client";

import type { ItemDto, Platform, RecordSaleCommand, SaleDto } from "@chine/contract";
import {
  AppIcon,
  BigButton,
  ChipGroup,
  Field,
  ListRow,
  MoneyInput,
  Receipt,
  SnapToggle,
  TextInput,
  useToast,
} from "@chine/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useInstallAfterFirstSale } from "@/components/pwa/InstallPrompt";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useItem, useRecordSale, useWorkspace } from "@/hooks/api";
import { computeSaleEconomics, effectiveSchedules } from "@/hooks/economics";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { usePrefs } from "@/hooks/prefs";
import { useErrorMessage } from "../common/ErrorState";
import { isoDay, label, MAIN_PLATFORMS } from "../common/labels";
import { ItemPicker } from "./ItemPicker";
import { SoldState } from "./SoldState";

/** Nouvelle vente : pièce, plateforme, prix, frais, reçu en direct, puis l'écran Vendu. */
export function NewSaleScreen() {
  const t = useT();
  const fmt = useFormat();
  const { locale } = useLocale();
  const { show } = useToast();
  const describe = useErrorMessage();
  const params = useSearchParams();
  const itemParam = params.get("item") ?? "";
  const workspace = useWorkspace();
  const record = useRecordSale();
  const [, setPrefs] = usePrefs();
  const [prefs] = usePrefs();
  const installAfterSale = useInstallAfterFirstSale();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<ItemDto | null>(null);
  const fromParam = useItem(itemParam, { enabled: Boolean(itemParam) && !picked });
  const item = picked ?? (itemParam ? fromParam.data : undefined) ?? null;

  const [platform, setPlatform] = useState<Platform>("VINTED");
  const [gross, setGross] = useState<number | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [packaging, setPackaging] = useState<number | null>(null);
  const [other, setOther] = useState<number | null>(null);
  const [feesOverride, setFeesOverride] = useState<number | null>(null);
  const [manualFees, setManualFees] = useState(false);
  const [soldAt, setSoldAt] = useState(isoDay());
  const [buyer, setBuyer] = useState("");
  const [showCosts, setShowCosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ sale: SaleDto; pending: boolean } | null>(null);

  // Pré-remplissage depuis la pièce : plateforme et prix de l'annonce active, sinon prix cible.
  useEffect(() => {
    if (!item) return;
    const listing = item.activeListings[0];
    if (listing) setPlatform(listing.platform);
    setGross((g) => g ?? listing?.price.minor ?? item.targetPrice?.minor ?? null);
  }, [item]);

  const currency = item?.acquisitionCost.currency ?? workspace.data?.workspace.currency ?? "EUR";
  const schedules = useMemo(
    () => effectiveSchedules(workspace.data?.feeSchedules ?? workspace.data?.feeOverrides),
    [workspace.data],
  );
  const eco = useMemo(
    () =>
      computeSaleEconomics({
        platform,
        gross: { minor: gross ?? 0, currency },
        acquisitionCost: item?.acquisitionCost ?? { minor: 0, currency },
        ...(shipping ? { shipping: { minor: shipping, currency } } : {}),
        ...(packaging ? { packaging: { minor: packaging, currency } } : {}),
        ...(other ? { other: { minor: other, currency } } : {}),
        ...(manualFees && feesOverride !== null
          ? { feesOverride: { minor: feesOverride, currency } }
          : {}),
        schedules,
      }),
    [
      platform,
      gross,
      currency,
      item,
      shipping,
      packaging,
      other,
      manualFees,
      feesOverride,
      schedules,
    ],
  );

  const submit = async () => {
    if (!item) {
      setError(t("sales.itemRequired"));
      setPickerOpen(true);
      return;
    }
    if (!gross || gross <= 0) {
      setError(t("sales.priceRequired"));
      return;
    }
    setError(null);
    const body: RecordSaleCommand = {
      itemId: item.id,
      platform,
      grossPrice: { minor: gross, currency },
      soldAt,
      ...(shipping ? { shippingCost: { minor: shipping, currency } } : {}),
      ...(packaging ? { packagingCost: { minor: packaging, currency } } : {}),
      ...(other ? { otherCosts: { minor: other, currency } } : {}),
      ...(manualFees && feesOverride !== null
        ? { platformFeesOverride: { minor: feesOverride, currency } }
        : {}),
      ...(buyer.trim() ? { buyer: buyer.trim() } : {}),
    };
    try {
      const result = await record.mutateAsync(body);
      setDone(result);
      setPrefs({ salesRecorded: prefs.salesRecorded + 1 });
      show(result.pending ? t("sales.recordedOffline") : t("sales.recorded"), {
        kind: result.pending ? "offline" : "success",
      });
      installAfterSale();
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const reset = () => {
    setDone(null);
    setPicked(null);
    setGross(null);
    setShipping(null);
    setPackaging(null);
    setOther(null);
    setFeesOverride(null);
    setManualFees(false);
    setBuyer("");
    setSoldAt(isoDay());
    setPickerOpen(true);
  };

  const neg = (minor: number) => ({ minor: -Math.abs(minor), currency });

  return (
    <>
      <TopBar
        title={done ? t("sales.soldTitle") : t("sales.new")}
        kicker={
          done
            ? done.sale.number
              ? t("sales.number", { number: done.sale.number })
              : t("sales.soldOnPlatform", { platform: label.platform(t, done.sale.platform) })
            : (item?.sku ?? t("sales.title"))
        }
        back="/app/ventes"
        avatar={false}
      />
      <Screen>
        {done ? (
          <SoldState sale={done.sale} pending={done.pending} onNewSale={reset} />
        ) : (
          <>
            <div className="grid gap-2 enter d1">
              <span className="label">{t("sales.pickItem")}</span>
              {item ? (
                <div className="list">
                  <ListRow
                    onClick={() => setPickerOpen(true)}
                    thumb={item.photos[0]?.thumbnailUrl ?? item.photoUrls[0]}
                    title={item.title}
                    sub={`${item.sku} · ${t("items.acquisitionCost")} ${fmt.money(item.acquisitionCost, { compact: true })}`}
                    amount={t("common.change")}
                    tone="muted"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-card border border-dashed border-line-2 bg-surface px-4 text-left text-[14px] font-semibold focus-thread"
                  data-testid="sale-pick-item"
                >
                  <span className="inline-flex items-center gap-2">
                    <AppIcon name="tag" size={18} className="text-ink-3" />
                    {itemParam && fromParam.isPending
                      ? t("common.loading")
                      : t("sales.pickItemPlaceholder")}
                  </span>
                  <AppIcon name="chevronRight" size={16} className="text-ink-3" />
                </button>
              )}
              {error && !item ? (
                <p role="alert" className="text-[12.5px] font-semibold text-thread">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 enter d2">
              <span className="label">{t("sales.platform")}</span>
              <ChipGroup
                value={platform}
                onChange={(p) => p && setPlatform(p)}
                allowEmpty={false}
                scroll
                size="sm"
                aria-label={t("sales.platform")}
                options={MAIN_PLATFORMS.map((p) => ({ value: p, label: label.platform(t, p) }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 enter d3">
              <Field
                label={t("sales.grossPrice")}
                required
                error={error && item && (!gross || gross <= 0) ? error : undefined}
              >
                <MoneyInput
                  valueMinor={gross}
                  onChangeMinor={setGross}
                  currency={currency}
                  data-testid="sale-gross"
                />
              </Field>
              <Field label={t("sales.soldAt")}>
                <TextInput
                  type="date"
                  value={soldAt}
                  max={isoDay()}
                  onChange={(e) => setSoldAt(e.target.value)}
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={() => setShowCosts((v) => !v)}
              aria-expanded={showCosts}
              className="enter d3 flex min-h-[40px] items-center justify-between rounded-md text-left text-[13px] font-semibold text-ink-2 focus-thread"
            >
              <span>
                {t("sales.shipping")} · {t("sales.packaging")} · {t("sales.otherCosts")}
              </span>
              <AppIcon name={showCosts ? "chevronUp" : "chevronDown"} size={16} />
            </button>
            {showCosts ? (
              <div className="grid gap-3 enter">
                <div className="grid grid-cols-3 gap-3">
                  <Field label={t("sales.shipping")}>
                    <MoneyInput
                      valueMinor={shipping}
                      onChangeMinor={setShipping}
                      currency={currency}
                    />
                  </Field>
                  <Field label={t("sales.packaging")}>
                    <MoneyInput
                      valueMinor={packaging}
                      onChangeMinor={setPackaging}
                      currency={currency}
                    />
                  </Field>
                  <Field label={t("sales.otherCosts")}>
                    <MoneyInput valueMinor={other} onChangeMinor={setOther} currency={currency} />
                  </Field>
                </div>
                <SnapToggle
                  checked={manualFees}
                  onChange={setManualFees}
                  label={t("sales.feesOverride")}
                  description={t("sales.feesAuto")}
                />
                {manualFees ? (
                  <Field label={t("sales.platformFees", { platform: label.platform(t, platform) })}>
                    <MoneyInput
                      valueMinor={feesOverride}
                      onChangeMinor={setFeesOverride}
                      currency={currency}
                    />
                  </Field>
                ) : null}
                <Field label={t("sales.buyer")} trailing={t("common.optional")}>
                  <TextInput
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    placeholder={t("sales.buyerPlaceholder")}
                    maxLength={120}
                  />
                </Field>
              </div>
            ) : null}

            <div className="enter d4" data-testid="sale-receipt">
              <Receipt
                locale={locale}
                rows={[
                  { key: "gross", label: t("sales.grossPrice"), value: eco.gross },
                  {
                    key: "fees",
                    label: t("sales.platformFees", { platform: label.platform(t, platform) }),
                    value: neg(eco.fees.minor),
                  },
                  ...(shipping
                    ? [{ key: "ship", label: t("sales.shipping"), value: neg(shipping) }]
                    : []),
                  ...(packaging
                    ? [{ key: "pack", label: t("sales.packaging"), value: neg(packaging) }]
                    : []),
                  ...(other
                    ? [{ key: "other", label: t("sales.otherCosts"), value: neg(other) }]
                    : []),
                  { key: "net", label: t("sales.net"), value: eco.net },
                  {
                    key: "acq",
                    label: t("sales.acquisition"),
                    value: neg(item?.acquisitionCost.minor ?? 0),
                  },
                  {
                    key: "margin",
                    label: t("sales.netMargin"),
                    value: eco.margin,
                    total: true,
                    signed: true,
                  },
                  { key: "roi", label: t("sales.roi"), value: { ratio: eco.roi } },
                ]}
              />
            </div>

            <div className="mt-auto pt-2 enter d5">
              <BigButton
                onClick={() => void submit()}
                loading={record.isPending}
                data-testid="sale-submit"
              >
                {t("sales.record")}
              </BigButton>
            </div>
          </>
        )}
      </Screen>
      <ItemPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => {
          setPicked(it);
          setGross(null);
          setPickerOpen(false);
        }}
      />
    </>
  );
}
