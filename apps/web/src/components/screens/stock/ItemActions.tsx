"use client";

import type { ItemDto, Platform } from "@chine/contract";
import {
  AppIcon,
  BigButton,
  Button,
  ChipGroup,
  Field,
  MoneyInput,
  Sheet,
  TextInput,
  useToast,
} from "@chine/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useChangeItemStatus, useDeleteItem } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { ConfirmSheet } from "../common/ConfirmSheet";
import { useErrorMessage } from "../common/ErrorState";
import { label, MAIN_PLATFORMS } from "../common/labels";

type Open = null | "list" | "unlist" | "writeOff" | "delete";

/** Actions de la fiche : Mettre en ligne / Vendre en bas, puis Retirer, Réserver, Sortir, Modifier, Supprimer. */
export function ItemActions({ item }: { item: ItemDto }) {
  const t = useT();
  const router = useRouter();
  const { show } = useToast();
  const describe = useErrorMessage();
  const change = useChangeItemStatus(item.id);
  const del = useDeleteItem(item.id);
  const [open, setOpen] = useState<Open>(null);
  const [platform, setPlatform] = useState<Platform>(item.activeListings[0]?.platform ?? "VINTED");
  const [priceMinor, setPriceMinor] = useState<number | null>(
    item.activeListings[0]?.price.minor ?? item.targetPrice?.minor ?? null,
  );
  const [url, setUrl] = useState("");
  const [writeOffReason, setWriteOffReason] = useState<"LOST" | "DONATED">("LOST");

  const sellable =
    item.status === "IN_STOCK" || item.status === "LISTED" || item.status === "RESERVED";
  const currency = item.acquisitionCost.currency;

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      show(success, { kind: "success" });
      setOpen(null);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const publish = () =>
    run(
      () =>
        change.mutateAsync({
          action: "list",
          platform,
          price: { minor: priceMinor ?? 0, currency },
          ...(url.trim() ? { url: url.trim() } : {}),
        }),
      item.status === "LISTED" ? t("items.repriced") : t("items.listed"),
    );

  return (
    <>
      <div className="flex flex-wrap gap-2 enter d5">
        {item.status === "LISTED" ? (
          <>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setOpen("list")}
              leading={<AppIcon name="euro" size={14} />}
              data-testid="item-reprice"
            >
              {t("items.reprice")}
            </Button>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setOpen("unlist")}
              leading={<AppIcon name="cloudOff" size={14} />}
            >
              {t("items.unlist")}
            </Button>
          </>
        ) : null}
        {item.status === "IN_STOCK" || item.status === "LISTED" ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={() =>
              void run(() => change.mutateAsync({ action: "reserve" }), t("items.reserved"))
            }
            loading={change.isPending && change.variables?.action === "reserve"}
          >
            {t("items.reserve")}
          </Button>
        ) : null}
        {item.status === "RESERVED" || item.status === "RETURNED" ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={() =>
              void run(() => change.mutateAsync({ action: "restock" }), t("items.restocked"))
            }
            loading={change.isPending && change.variables?.action === "restock"}
          >
            {t("items.restock")}
          </Button>
        ) : null}
        {sellable ? (
          <Button size="sm" variant="subtle" onClick={() => setOpen("writeOff")}>
            {t("items.writeOff")}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="subtle"
          onClick={() => router.push(`/app/stock/${item.id}/modifier`)}
          leading={<AppIcon name="edit" size={14} />}
        >
          {t("common.edit")}
        </Button>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setOpen("delete")}
          leading={<AppIcon name="trash" size={14} />}
          className="!text-thread"
        >
          {t("common.delete")}
        </Button>
      </div>

      {sellable ? (
        <div className="two-btn enter d6">
          <BigButton
            variant="secondary"
            onClick={() => setOpen("list")}
            disabled={item.status === "LISTED"}
            data-testid="item-list"
          >
            {t("items.listOnline")}
          </BigButton>
          <BigButton
            onClick={() => router.push(`/app/ventes/nouvelle?item=${item.id}`)}
            data-testid="item-sell"
          >
            {t("items.sell")}
          </BigButton>
        </div>
      ) : null}

      <Sheet
        open={open === "list"}
        onClose={() => setOpen(null)}
        title={item.status === "LISTED" ? t("items.reprice") : t("items.listSheetTitle")}
        description={item.status === "LISTED" ? t("items.repriceBody") : t("items.listSheetBody")}
        footer={
          <BigButton
            onClick={() => void publish()}
            loading={change.isPending}
            disabled={!priceMinor || priceMinor <= 0}
          >
            {t("items.listConfirm")}
          </BigButton>
        }
      >
        <div className="grid gap-4 py-1">
          <ChipGroup
            value={platform}
            onChange={(p) => p && setPlatform(p)}
            allowEmpty={false}
            scroll
            size="sm"
            aria-label={t("sales.platform")}
            options={MAIN_PLATFORMS.map((p) => ({ value: p, label: label.platform(t, p) }))}
          />
          <Field label={t("items.listPrice")}>
            <MoneyInput
              valueMinor={priceMinor}
              onChangeMinor={setPriceMinor}
              currency={currency}
              data-autofocus
            />
          </Field>
          <Field label={t("items.listUrl")} trailing={t("common.optional")}>
            <TextInput
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
      </Sheet>

      <ConfirmSheet
        open={open === "unlist"}
        onClose={() => setOpen(null)}
        title={t("items.unlistTitle")}
        description={t("items.unlistBody")}
        confirmLabel={t("items.unlist")}
        loading={change.isPending}
        onConfirm={() => run(() => change.mutateAsync({ action: "unlist" }), t("items.unlisted"))}
      />

      <ConfirmSheet
        open={open === "writeOff"}
        onClose={() => setOpen(null)}
        title={t("items.writeOffTitle")}
        description={t("items.writeOffBody")}
        confirmLabel={t("items.writeOff")}
        danger
        loading={change.isPending}
        onConfirm={() =>
          run(
            () => change.mutateAsync({ action: "writeOff", reason: writeOffReason }),
            t("items.writtenOff"),
          )
        }
      >
        <ChipGroup
          value={writeOffReason}
          onChange={(r) => r && setWriteOffReason(r)}
          allowEmpty={false}
          aria-label={t("items.writeOff")}
          options={[
            { value: "LOST", label: t("items.writeOffLost") },
            { value: "DONATED", label: t("items.writeOffDonated") },
          ]}
        />
      </ConfirmSheet>

      <ConfirmSheet
        open={open === "delete"}
        onClose={() => setOpen(null)}
        title={t("items.deleteTitle")}
        description={t("items.deleteConfirm")}
        confirmLabel={t("common.delete")}
        danger
        loading={del.isPending}
        onConfirm={() =>
          run(async () => {
            await del.mutateAsync();
            router.replace("/app/stock");
          }, t("items.deleted"))
        }
      />
    </>
  );
}
