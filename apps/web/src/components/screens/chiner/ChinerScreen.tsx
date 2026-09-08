"use client";

import type { AppraisalDto, ItemDto, SupplierKind } from "@chine/contract";
import { AppIcon, BigButton, TapeMeasure, useToast } from "@chine/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { isApiError, useAppraise, useQuickCapture, useWorkspace } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { usePrefs } from "@/hooks/prefs";
import { useOnline } from "@/lib/offline/network";
import type { PendingCaptureCommand } from "@/lib/offline/pending-photos";
import { useErrorMessage } from "../common/ErrorState";
import { isoDay } from "../common/labels";
import { AppraisalCard, AppraisalOverlay, type AppraisalState } from "./AppraisalCard";
import { CameraCapture } from "./CameraCapture";
import { CaptureSuccess } from "./CaptureSuccess";
import { type CaptureDetails, DetailsSheet, EMPTY_DETAILS, filledDetails } from "./DetailsSheet";
import { type PreparedImage, releaseImage } from "./image";
import { type GeoState, LocationField } from "./LocationField";

const DEFAULT_PRICE_MINOR = 500;

type Done = { readonly kind: "created"; readonly item: ItemDto } | { readonly kind: "deferred" };

/** Chiner : une main, hors ligne. Photo, prix au mètre, lieu détecté. L'IA propose, tu confirmes. */
export function ChinerScreen() {
  const t = useT();
  const fmt = useFormat();
  const online = useOnline();
  const { show } = useToast();
  const describe = useErrorMessage();
  const [prefs, setPrefs] = usePrefs();
  const workspace = useWorkspace();
  const appraise = useAppraise();
  const capture = useQuickCapture();

  const currency = workspace.data?.workspace.currency ?? "EUR";
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [appraisal, setAppraisal] = useState<AppraisalState>({ status: "idle" });
  const [priceMinor, setPriceMinor] = useState<number>(prefs.lastPricePaidMinor ?? DEFAULT_PRICE_MINOR);
  const priceTouched = useRef(false);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [locationLabel, setLocationLabel] = useState(prefs.lastLocationLabel ?? "");
  const [supplierKind, setSupplierKind] = useState<SupplierKind>(
    (prefs.lastSupplierKind as SupplierKind | null) ?? "FLEA_MARKET",
  );
  const [details, setDetails] = useState<CaptureDetails>(EMPTY_DETAILS);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const appraisalRef = useRef<AppraisalDto | null>(null);

  // Préférences chargées après le premier rendu : on les applique si l'utilisateur n'a rien touché.
  const prefsApplied = useRef(false);
  useEffect(() => {
    if (prefsApplied.current) return;
    prefsApplied.current = true;
    if (prefs.lastPricePaidMinor !== null && !priceTouched.current) setPriceMinor(prefs.lastPricePaidMinor);
    if (prefs.lastLocationLabel) setLocationLabel((v) => v || prefs.lastLocationLabel || "");
    if (prefs.lastSupplierKind) setSupplierKind(prefs.lastSupplierKind as SupplierKind);
  }, [prefs]);

  useEffect(() => () => releaseImage(photo), [photo]);

  const applyAppraisal = useCallback((a: AppraisalDto) => {
    appraisalRef.current = a;
    if (!priceTouched.current && a.advice.maxBuyPrice && a.advice.maxBuyPrice.minor > 0) {
      setPriceMinor(a.advice.maxBuyPrice.minor);
    }
    const id = a.identification;
    setDetails((d) => ({
      ...d,
      title: d.title || a.listingCopy?.title || [id.brand, id.model].filter(Boolean).join(" ") || "",
      brand: d.brand || id.brand || "",
      category: d.category || id.category,
      size: d.size || id.size || "",
      condition: d.condition || id.condition,
      retailPriceMinor: d.retailPriceMinor ?? a.price.retailNew?.minor ?? null,
      targetPriceMinor: d.targetPriceMinor ?? (a.price.mid.minor > 0 ? a.price.mid.minor : null),
    }));
  }, []);

  const runAppraisal = useCallback(
    async (image: PreparedImage) => {
      if (!online) {
        setAppraisal({ status: "offline" });
        return;
      }
      const ws = workspace.data;
      if (ws && !ws.features.includes("AI_APPRAISAL")) {
        setAppraisal({ status: "locked" });
        return;
      }
      const quota = ws?.quotas.aiAppraisalsPerMonth;
      if (quota && quota.limit !== null && quota.used >= quota.limit) {
        setAppraisal({ status: "quota" });
        return;
      }
      setAppraisal({ status: "running" });
      try {
        const data = await appraise.mutateAsync({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          wantListingCopy: true,
        });
        setAppraisal({ status: "done", data });
        applyAppraisal(data);
      } catch (e) {
        if (isApiError(e, "FEATURE_LOCKED")) setAppraisal({ status: "locked" });
        else if (isApiError(e, "QUOTA_EXCEEDED")) setAppraisal({ status: "quota" });
        else if (isApiError(e) && (e.code === "NETWORK" || e.code === "TIMEOUT"))
          setAppraisal({ status: "offline" });
        else setAppraisal({ status: "failed", message: describe(e) });
      }
    },
    [online, workspace.data, appraise, applyAppraisal, describe],
  );

  const onPhoto = (image: PreparedImage) => {
    releaseImage(photo);
    setPhoto(image);
    void runAppraisal(image);
  };
  const onRetake = () => {
    releaseImage(photo);
    setPhoto(null);
    appraisalRef.current = null;
    setAppraisal({ status: "idle" });
  };

  const reset = () => {
    onRetake();
    setDetails(EMPTY_DETAILS);
    priceTouched.current = false;
    setDone(null);
  };

  const submit = async () => {
    const clientId = crypto.randomUUID();
    const command: PendingCaptureCommand = {
      mode: "quickCapture",
      clientId,
      pricePaid: { minor: priceMinor, currency },
      supplierKind,
      purchasedAt: isoDay(),
      ...(locationLabel.trim() ? { locationLabel: locationLabel.trim() } : {}),
      ...(geo.status === "ok" && geo.lat !== undefined && geo.lng !== undefined
        ? { lat: geo.lat, lng: geo.lng }
        : {}),
      ...(appraisalRef.current ? { appraisalId: appraisalRef.current.id } : {}),
      ...(details.title.trim() ? { title: details.title.trim() } : {}),
      ...(details.brand.trim() ? { brand: details.brand.trim() } : {}),
      ...(details.category ? { category: details.category } : {}),
      ...(details.condition ? { condition: details.condition } : {}),
      ...(details.size.trim() ? { size: details.size.trim() } : {}),
      ...(details.targetPriceMinor ? { targetPrice: { minor: details.targetPriceMinor, currency } } : {}),
      ...(details.retailPriceMinor ? { retailPrice: { minor: details.retailPriceMinor, currency } } : {}),
      ...(details.notes.trim() ? { notes: details.notes.trim() } : {}),
    };
    try {
      const result = await capture.mutateAsync({
        command,
        ...(photo ? { photo: { blob: photo.blob, mimeType: photo.mimeType } } : {}),
      });
      setPrefs({
        lastPricePaidMinor: priceMinor,
        lastSupplierKind: supplierKind,
        lastLocationLabel: locationLabel.trim() || null,
      });
      if (result.kind === "created") {
        setDone({ kind: "created", item: result.item });
        show(t("chine.added"), { kind: "success" });
      } else {
        setDone({ kind: "deferred" });
        show(t("chine.addedOffline"), { kind: "offline" });
      }
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const filled = filledDetails(details);
  const saving = capture.isPending;
  const successTitle =
    details.title.trim() || t("chine.quickTitle", { date: fmt.date(new Date(), "medium") });

  return (
    <>
      <TopBar
        title={t("chine.title")}
        kicker={online ? t("chine.modeOnline") : t("chine.modeOffline")}
        back="/app"
        avatar={false}
      />
      <Screen>
        {done ? (
          <CaptureSuccess
            item={done.kind === "created" ? done.item : undefined}
            deferred={done.kind === "deferred"}
            previewUrl={photo?.previewUrl}
            title={successTitle}
            pricePaidMinor={priceMinor}
            currency={currency}
            onAnother={reset}
          />
        ) : (
          <>
            <CameraCapture
              photo={photo}
              onPhoto={onPhoto}
              onRetake={onRetake}
              onError={(m) => show(m, { kind: "error" })}
              scanning={appraisal.status === "running"}
              overlay={<AppraisalOverlay state={appraisal} />}
              disabled={saving}
            />
            <AppraisalCard
              state={appraisal}
              onRetry={() => photo && void runAppraisal(photo)}
              onApplyPrice={(m) => {
                priceTouched.current = true;
                setPriceMinor(m);
                show(t("chine.aiApplied"), { kind: "success", duration: 1800 });
              }}
            />

            <div className="enter d3">
              <TapeMeasure
                valueMinor={priceMinor}
                onChange={(m) => {
                  priceTouched.current = true;
                  setPriceMinor(m);
                }}
                currency={currency}
                min={0}
                max={2000}
                label={t("chine.pricePaid")}
                haptics={prefs.haptics}
                disabled={saving}
              />
              <p className="mt-1 text-center text-[12px] text-ink-3">{t("chine.pricePaidHint")}</p>
            </div>

            <LocationField
              geo={geo}
              onGeo={setGeo}
              labelText={locationLabel}
              onLabel={setLocationLabel}
              supplierKind={supplierKind}
              onSupplierKind={setSupplierKind}
              disabled={saving}
            />

            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              disabled={saving}
              className="enter d5 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-field border border-dashed border-line-2 px-3.5 text-left text-[13.5px] font-semibold text-ink focus-thread"
              data-testid="details-open"
            >
              <span className="inline-flex items-center gap-2">
                <AppIcon name="edit" size={16} className="text-ink-3" />
                {t("common.details")}
              </span>
              <span className="label">{filled > 0 ? `${filled} · ` : ""}{t("common.optional")}</span>
            </button>

            <div className="mt-auto pt-2 enter d5">
              <BigButton
                onClick={() => void submit()}
                loading={saving}
                leading={<AppIcon name="plus" size={18} />}
                data-testid="capture-submit"
              >
                {t("chine.addToChine")}
              </BigButton>
            </div>
          </>
        )}
      </Screen>
      <DetailsSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        value={details}
        onChange={setDetails}
        currency={currency}
      />
    </>
  );
}
