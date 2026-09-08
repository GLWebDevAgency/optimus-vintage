"use client";

import type { ItemDto } from "@chine/contract";
import { AppIcon, BigButton, Stamp, StatusPill } from "@chine/ui";
import { useRouter } from "next/navigation";
import { useFormat, useT } from "@/hooks/i18n";

interface CaptureSuccessProps {
  readonly item?: ItemDto;
  readonly deferred: boolean;
  readonly previewUrl?: string;
  readonly title: string;
  readonly pricePaidMinor: number;
  readonly currency: string;
  readonly onAnother: () => void;
}

/** Après « Ajouter à la chine » : le tampon tombe, puis « Chiner une autre » / « Voir la pièce ». */
export function CaptureSuccess({
  item,
  deferred,
  previewUrl,
  title,
  pricePaidMinor,
  currency,
  onAnother,
}: CaptureSuccessProps) {
  const t = useT();
  const fmt = useFormat();
  const router = useRouter();
  return (
    <div className="grid flex-1 content-start gap-4" data-testid="capture-success">
      <div className="sale-hero enter d1">
        <div className="ring overflow-hidden">
          {previewUrl ? (
            // biome-ignore lint/performance/noImgElement: photo distante ou URL d'objet, hors next/image
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <AppIcon name="shirt" size={56} className="text-indigo" />
          )}
        </div>
        <Stamp size="lg" className="absolute top-[26px]">
          {t("chine.stamp")}
        </Stamp>
        <p className="caption">
          <b className="text-ink">{title}</b> ·{" "}
          {fmt.money({ minor: pricePaidMinor, currency }, { compact: true })}
          {item?.sku ? ` · ${item.sku}` : ""}
        </p>
        {deferred ? (
          <div className="grid justify-items-center gap-1">
            <StatusPill status="pending" label={t("common.syncLater")} />
            <span className="text-[12px] text-ink-3">{t("chine.pendingSyncHint")}</span>
          </div>
        ) : null}
      </div>
      <div className="two-btn enter d3 !mt-6">
        <BigButton variant="secondary" onClick={onAnother} data-testid="capture-another">
          {t("chine.anotherOne")}
        </BigButton>
        <BigButton
          onClick={() => router.push(item ? `/app/stock/${item.id}` : "/app/stock")}
          data-testid="capture-view"
        >
          {item ? t("chine.viewItem") : t("nav.stock")}
        </BigButton>
      </div>
    </div>
  );
}
