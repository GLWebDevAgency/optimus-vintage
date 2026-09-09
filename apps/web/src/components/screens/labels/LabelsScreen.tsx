"use client";

import type { ItemDto } from "@chine/contract";
import { AppIcon, Button, EmptyState, SkeletonRow } from "@chine/ui";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useItems, useWorkspace } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { ErrorState } from "../common/ErrorState";

/**
 * Étiquettes QR imprimables (formule Pro) : une étiquette par pièce en stock (SKU, titre,
 * taille, prix cible, QR vers la fiche). Sélection puis « Imprimer » (planche A4, 24 par page).
 */
export function LabelsScreen() {
  const t = useT();
  const fmt = useFormat();
  const workspace = useWorkspace();
  const allowed = workspace.data?.features.includes("QR_LABELS") ?? false;
  const query = useItems(
    { status: ["IN_STOCK", "LISTED", "RESERVED"], sort: "newest" },
    { enabled: allowed },
  );
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (items.length && selected.size === 0)
      setSelected(new Set(items.slice(0, 24).map((i) => i.id)));
  }, [items, selected.size]);

  useEffect(() => {
    let cancelled = false;
    const missing = items.filter((i) => selected.has(i.id) && !codes[i.id]);
    if (missing.length === 0) return;
    void Promise.all(
      missing.map(
        async (i) =>
          [
            i.id,
            await QRCode.toDataURL(`${window.location.origin}/app/stock/${i.id}`, {
              margin: 0,
              width: 240,
            }),
          ] as const,
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setCodes((c) => ({ ...c, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
  }, [items, selected, codes]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const chosen = items.filter((i) => selected.has(i.id));

  return (
    <>
      <TopBar
        title={t("labels.title")}
        kicker={t("labels.kicker", { count: chosen.length })}
        back="/app/reglages"
        avatar={false}
      />
      <Screen>
        {workspace.data && !allowed ? (
          <div className="card flex items-center gap-3 enter d1" data-testid="labels-locked">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brass-soft text-brass">
              <AppIcon name="lock" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{t("labels.title")}</div>
              <div className="text-[12.5px] text-ink-2">{t("labels.lockedBody")}</div>
            </div>
            <Link
              href="/app/reglages#plan"
              className="btn ghost !min-h-[36px] !px-3 !text-[12px] shrink-0"
            >
              {t("billing.plan.PRO")}
            </Link>
          </div>
        ) : null}
        {!allowed ? null : query.isPending && !query.data ? (
          <SkeletonRow count={6} />
        ) : query.isError && !query.data ? (
          <div className="card">
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState title={t("items.empty")} body={t("labels.emptyBody")} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 enter d1 print:hidden">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set(items.map((i) => i.id)))}
                >
                  {t("labels.selectAll")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  {t("labels.selectNone")}
                </Button>
              </div>
              <Button
                onClick={() => window.print()}
                disabled={chosen.length === 0}
                leading={<AppIcon name="qr" size={16} />}
                data-testid="labels-print"
              >
                {t("labels.print")}
              </Button>
            </div>
            <ul className="grid gap-1.5 enter d2 print:hidden" data-testid="labels-picker">
              {items.map((i) => (
                <li key={i.id}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-surface-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-ink"
                      checked={selected.has(i.id)}
                      onChange={() => toggle(i.id)}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      <span className="font-mono text-[12px] text-ink-3">{i.sku}</span> · {i.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {query.hasNextPage ? (
              <Button
                variant="ghost"
                size="sm"
                className="print:hidden"
                onClick={() => void query.fetchNextPage()}
                loading={query.isFetchingNextPage}
              >
                {t("common.loadMore")}
              </Button>
            ) : null}
            <LabelSheet
              items={chosen}
              codes={codes}
              money={(m) => fmt.money(m, { compact: true })}
            />
          </>
        )}
      </Screen>
    </>
  );
}

/** Planche d'étiquettes : visible à l'écran en aperçu réduit, pleine page à l'impression. */
function LabelSheet({
  items,
  codes,
  money,
}: {
  items: readonly ItemDto[];
  codes: Record<string, string>;
  money: (m: ItemDto["acquisitionCost"]) => string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="label-sheet enter d3" data-testid="label-sheet" aria-label="Étiquettes">
      {items.map((i) => (
        <div key={i.id} className="qr-label">
          {codes[i.id] ? (
            // biome-ignore lint/performance/noImgElement: QR en data URL généré côté client, hors next/image
            <img src={codes[i.id]} alt="" className="qr-label-code" />
          ) : (
            <span className="qr-label-code" />
          )}
          <div className="qr-label-text">
            <div className="qr-label-sku">{i.sku}</div>
            <div className="qr-label-title">{i.title}</div>
            <div className="qr-label-meta">
              {[i.brand, i.size].filter(Boolean).join(" · ")}
              {i.targetPrice ? ` · ${money(i.targetPrice)}` : ""}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
