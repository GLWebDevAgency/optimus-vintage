"use client";

import { CATEGORIES, type Category, type Condition, CONDITIONS, type SourceDto } from "@chine/contract";
import {
  AppIcon,
  BigButton,
  Button,
  EmptyState,
  Field,
  List,
  Select,
  Sheet,
  SkeletonRow,
  Stamp,
  StitchProgress,
  TextInput,
  useToast,
} from "@chine/ui";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useDeleteSource, useGeneratePieces, useItems, useReceiveSource, useSource } from "@/hooks/api";
import { useFormat, useLocale, useT } from "@/hooks/i18n";
import { ConfirmSheet } from "../common/ConfirmSheet";
import { ErrorState, useErrorMessage } from "../common/ErrorState";
import { label } from "../common/labels";
import { LoadMore } from "../common/LoadMore";
import { ItemRow } from "../stock/ItemRow";

/** Détail d'une source : performance, plancher, réception, génération de pièces, pièces rattachées. */
export function SourceScreen({ id }: { id: string }) {
  const t = useT();
  const fmt = useFormat();
  const query = useSource(id);
  const source = query.data;
  return (
    <>
      <TopBar
        title={source?.name ?? t("sources.one")}
        kicker={
          source
            ? `${label.sourceKind(t, source.kind)} · ${fmt.date(source.purchasedAt, "medium")}`
            : t("sources.one")
        }
        back="/app/sources"
        avatar={false}
      />
      <Screen>
        {!source && query.isPending ? (
          <PageSkeleton variant="sources" rows={2} />
        ) : !source ? (
          <div className="card enter d2">
            <ErrorState error={query.error} onRetry={() => void query.refetch()} title={t("sources.notFound")} />
          </div>
        ) : (
          <SourceBody source={source} />
        )}
      </Screen>
    </>
  );
}

function SourceBody({ source }: { source: SourceDto }) {
  const t = useT();
  const fmt = useFormat();
  const { intl } = useLocale();
  const router = useRouter();
  const { show } = useToast();
  const describe = useErrorMessage();
  const p = source.performance;
  const items = useItems({ sourceId: source.id, sort: "newest" });
  const receive = useReceiveSource(source.id);
  const generate = useGeneratePieces(source.id);
  const del = useDeleteSource(source.id);
  const [open, setOpen] = useState<null | "receive" | "generate" | "delete">(null);
  const [received, setReceived] = useState(String(source.receivedQuantity ?? source.announcedQuantity ?? ""));
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState(source.name);
  const [category, setCategory] = useState<Category | "">("");
  const [condition, setCondition] = useState<Condition | "">("");

  const pct = (r: number) => new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(r);
  const list = items.data?.pages.flatMap((pg) => pg.items) ?? [];
  const total = items.data?.pages[0]?.total ?? 0;
  const remaining = (source.effectiveQuantity ?? source.itemCount) - p.soldCount - p.writtenOffCount;
  const receivable = source.kind !== "UNIT";

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      show(msg, { kind: "success" });
      setOpen(null);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const perf: { k: string; v: string; tone?: string }[] = [
    { k: t("sources.invested"), v: fmt.money(source.totalInvestment) },
    { k: t("sources.recovered"), v: fmt.money(p.recovered), tone: "text-brass" },
    { k: t("sources.remaining"), v: fmt.money(p.remainingToRecover), tone: p.isAmortized ? undefined : "text-thread" },
    { k: t("sources.roi"), v: p.roi !== undefined ? fmt.percent(p.roi, { signed: true }) : "—" },
    ...(p.floorPriceBreakEven ? [{ k: t("sources.floorPriceBreakEven"), v: fmt.money(p.floorPriceBreakEven) }] : []),
    ...(p.floorPriceTarget ? [{ k: t("sources.floorPriceTarget"), v: fmt.money(p.floorPriceTarget) }] : []),
    { k: t("sources.averageUnitCost"), v: source.averageUnitCost ? fmt.money(source.averageUnitCost) : "—" },
    { k: t("sources.stockValue"), v: fmt.money(p.stockValueAtCost) },
  ];

  return (
    <>
      <div className="card shadow relative grid gap-3 enter d2" data-testid="source-performance">
        {p.isAmortized ? (
          <span className="absolute right-4 top-3">
            <Stamp tone="brass" size="sm" delay={0.8}>
              {t("sources.amortized")}
            </Stamp>
          </span>
        ) : null}
        <div>
          <span className="label">{t("sources.performance")}</span>
          <div className="mt-1 font-display italic text-[34px] leading-none tabular">
            {fmt.money(p.recovered, { compact: true })}
            <small className="ml-1 font-ui not-italic text-[13px] font-semibold text-ink-2">
              / {fmt.money(source.totalInvestment, { compact: true })}
            </small>
          </div>
        </div>
        <StitchProgress
          value={Math.min(1, p.recoveryRate)}
          tone={p.isAmortized ? "brass" : "thread"}
          label={t("sources.recoveryRate", { percent: pct(p.recoveryRate) })}
          valueLabel={t("sources.soldAndStock", { sold: p.soldCount, stock: Math.max(0, remaining) })}
        />
        {!p.isAmortized && p.floorPriceBreakEven && remaining > 0 ? (
          <p className="text-[13px] text-thread font-semibold">
            {t("sources.floorHint", { count: remaining, amount: fmt.money(p.floorPriceBreakEven, { compact: true }) })}
          </p>
        ) : null}
      </div>

      <div className="meta enter d3">
        {perf.map((m) => (
          <div key={m.k}>
            <span className="k">{m.k}</span>
            <span className={`v ${m.tone ?? ""}`}>{m.v}</span>
          </div>
        ))}
      </div>

      <div className="meta enter d3">
        <div>
          <span className="k">{t("sources.supplier")}</span>
          <span className="v truncate">{source.supplierName ?? label.supplierKind(t, source.supplierKind)}</span>
        </div>
        <div>
          <span className="k">{t("sources.location")}</span>
          <span className="v truncate">{source.location?.label ?? "—"}</span>
        </div>
        {receivable ? (
          <div>
            <span className="k">{t("sources.announcedQuantity")}</span>
            <span className="v">
              {source.announcedQuantity ?? "—"}
              {source.receivedQuantity !== undefined ? ` · ${t("sources.receivedShort", { count: source.receivedQuantity })}` : ""}
            </span>
          </div>
        ) : null}
        {source.shrinkageRate !== undefined && source.shrinkageRate > 0 ? (
          <div>
            <span className="k">{t("sources.receive")}</span>
            <span className="v text-thread">{t("sources.shrinkage", { percent: pct(source.shrinkageRate) })}</span>
          </div>
        ) : null}
        <div>
          <span className="k">{t("sources.allocation")}</span>
          <span className="v">{t(`sources.allocationLabel.${source.allocationPolicy}` as "sources.allocationLabel.EVEN")}</span>
        </div>
        {source.weightKg ? (
          <div>
            <span className="k">{t("sources.weight")}</span>
            <span className="v">{new Intl.NumberFormat(intl, { style: "unit", unit: "kilogram", maximumFractionDigits: 1 }).format(source.weightKg)}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 enter d4">
        {receivable ? (
          <Button size="sm" variant="subtle" onClick={() => setOpen("receive")} leading={<AppIcon name="box" size={14} />}>
            {t("sources.receive")}
          </Button>
        ) : null}
        {source.kind !== "UNIT" ? (
          <Button size="sm" variant="subtle" onClick={() => setOpen("generate")} leading={<AppIcon name="plus" size={14} />} data-testid="source-generate">
            {t("sources.generatePieces")}
          </Button>
        ) : null}
        <Button size="sm" variant="subtle" onClick={() => router.push(`/app/sources/${source.id}/modifier` as Route)} leading={<AppIcon name="edit" size={14} />}>
          {t("common.edit")}
        </Button>
        {source.itemCount === 0 ? (
          <Button size="sm" variant="subtle" onClick={() => setOpen("delete")} leading={<AppIcon name="trash" size={14} />} className="!text-thread">
            {t("common.delete")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2.5 enter d5">
        <div className="sec-h">
          <h2>{t("sources.itemsOfSource")}</h2>
          <span className="text-ink-2 text-xs font-semibold">{t("common.pieces", { count: total })}</span>
        </div>
        {items.isPending ? (
          <SkeletonRow count={3} />
        ) : items.isError ? (
          <div className="card">
            <ErrorState error={items.error} onRetry={() => void items.refetch()} compact />
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState compact title={t("sources.noItems")} />
          </div>
        ) : (
          <>
            <List>
              {list.map((it) => (
                <ItemRow key={it.id} item={it} />
              ))}
            </List>
            <LoadMore shown={list.length} total={total} hasMore={Boolean(items.hasNextPage)} loading={items.isFetchingNextPage} onMore={() => void items.fetchNextPage()} />
          </>
        )}
      </div>

      <Sheet
        open={open === "receive"}
        onClose={() => setOpen(null)}
        title={t("sources.receiveTitle")}
        description={t("sources.receiveHint")}
        footer={
          <BigButton
            onClick={() => void run(() => receive.mutateAsync(Number(received)), t("sources.received"))}
            loading={receive.isPending}
            disabled={!/^\d+$/.test(received.trim())}
          >
            {t("sources.receive")}
          </BigButton>
        }
      >
        <div className="grid gap-4 py-1">
          <Field label={t("sources.receivedQuantity")} hint={source.announcedQuantity ? t("sources.announcedShort", { count: source.announcedQuantity }) : undefined}>
            <TextInput inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value)} data-autofocus />
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={open === "generate"}
        onClose={() => setOpen(null)}
        title={t("sources.generateTitle")}
        description={t("sources.generateBody")}
        footer={
          <BigButton
            onClick={() =>
              void run(async () => {
                const page = await generate.mutateAsync({
                  count: Number(count),
                  ...(prefix.trim() ? { titlePrefix: prefix.trim().slice(0, 60) } : {}),
                  ...(category ? { category } : {}),
                  ...(condition ? { condition } : {}),
                });
                return page;
              }, t("sources.generated", { count: Number(count) }))
            }
            loading={generate.isPending}
            disabled={!/^\d+$/.test(count.trim()) || Number(count) < 1 || Number(count) > 500}
            data-testid="generate-confirm"
          >
            {t("sources.generatePieces")}
          </BigButton>
        }
      >
        <div className="grid gap-4 py-1">
          <Field label={t("sources.generateCount")} hint={t("sources.generatePiecesHint", { count: Number(count) || 0 })}>
            <TextInput inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} data-autofocus />
          </Field>
          <Field label={t("sources.generatePrefix")}>
            <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder={t("sources.generatePrefixPlaceholder")} maxLength={60} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("items.category")} trailing={t("common.optional")}>
              <Select value={category} onChange={setCategory} placeholder="—" options={CATEGORIES.map((c) => ({ value: c, label: label.category(t, c) }))} />
            </Field>
            <Field label={t("items.condition")} trailing={t("common.optional")}>
              <Select value={condition} onChange={setCondition} placeholder="—" options={CONDITIONS.map((c) => ({ value: c, label: label.condition(t, c) }))} />
            </Field>
          </div>
        </div>
      </Sheet>

      <ConfirmSheet
        open={open === "delete"}
        onClose={() => setOpen(null)}
        title={t("common.delete")}
        description={t("sources.deleteConfirm")}
        confirmLabel={t("common.delete")}
        danger
        loading={del.isPending}
        onConfirm={() =>
          run(async () => {
            await del.mutateAsync();
            router.replace("/app/sources");
          }, t("sources.deleted"))
        }
      />
    </>
  );
}
