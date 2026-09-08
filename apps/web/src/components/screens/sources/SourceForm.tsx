"use client";

import {
  ALLOCATION_POLICIES,
  type AllocationPolicy,
  type CreatePurchaseSourceCommand,
  type Currency,
  SOURCE_KINDS,
  type SourceDto,
  type SourceKind,
  SUPPLIER_KINDS,
  type SupplierKind,
  type UpdatePurchaseSourceCommand,
} from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import {
  AppIcon,
  BigButton,
  ChipGroup,
  Field,
  MoneyInput,
  SectionHeader,
  Select,
  Textarea,
  TextInput,
  useToast,
} from "@chine/ui";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useCreateSource, useUpdateSource } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";
import { isoDay, label } from "../common/labels";

interface FormState {
  kind: SourceKind;
  name: string;
  supplierName: string;
  supplierKind: SupplierKind;
  purchasedAt: string;
  goodsMinor: number | null;
  extraMinor: number | null;
  announcedQuantity: string;
  weightKg: string;
  location: string;
  allocationPolicy: AllocationPolicy;
  notes: string;
}

const init = (s?: SourceDto): FormState => ({
  kind: s?.kind ?? "LOT",
  name: s?.name ?? "",
  supplierName: s?.supplierName ?? "",
  supplierKind: s?.supplierKind ?? "WHOLESALER",
  purchasedAt: s?.purchasedAt ?? isoDay(),
  goodsMinor: s?.goodsCost.minor ?? null,
  extraMinor: s?.extraCosts.minor ?? null,
  announcedQuantity: s?.announcedQuantity ? String(s.announcedQuantity) : "",
  weightKg: s?.weightKg ? String(s.weightKg) : "",
  location: s?.location?.label ?? "",
  allocationPolicy: s?.allocationPolicy ?? "EVEN",
  notes: s?.notes ?? "",
});

const num = (s: string): number | undefined => {
  const v = Number(s.replace(",", ".").trim());
  return s.trim() !== "" && Number.isFinite(v) && v > 0 ? v : undefined;
};

/** Formulaire de source (création ou modification) : type → champs conditionnels. */
export function SourceForm({ source, currency }: { source?: SourceDto; currency: Currency }) {
  const t = useT();
  const router = useRouter();
  const { show } = useToast();
  const describe = useErrorMessage();
  const create = useCreateSource();
  const update = useUpdateSource(source?.id ?? "");
  const [f, setF] = useState<FormState>(() => init(source));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const pending = create.isPending || update.isPending;
  const needsQuantity = f.kind === "LOT" || f.kind === "PALLET";
  const cur = source?.goodsCost.currency ?? currency;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!f.name.trim()) errs.name = t("errors.field.required");
    if (f.goodsMinor === null) errs.goodsMinor = t("errors.field.required");
    const qty = num(f.announcedQuantity);
    if (needsQuantity && (!qty || !Number.isInteger(qty)))
      errs.announcedQuantity = t("errors.code.QUANTITY_REQUIRED");
    if (!f.purchasedAt) errs.purchasedAt = t("errors.field.date");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const weight = num(f.weightKg);
    try {
      if (source) {
        const body: UpdatePurchaseSourceCommand = {
          name: f.name.trim(),
          supplierName: f.supplierName.trim() || null,
          supplierKind: f.supplierKind,
          purchasedAt: f.purchasedAt,
          goodsCost: { minor: f.goodsMinor ?? 0, currency: cur },
          extraCosts: { minor: f.extraMinor ?? 0, currency: cur },
          ...(f.kind !== "UNIT" ? { announcedQuantity: qty ?? null } : {}),
          weightKg: weight ?? null,
          location: f.location.trim() ? { label: f.location.trim() } : null,
          allocationPolicy: f.allocationPolicy,
          notes: f.notes.trim() || null,
        };
        const saved = await update.mutateAsync(body);
        show(t("sources.updated"), { kind: "success" });
        router.replace(`/app/sources/${saved.id}`);
      } else {
        const body: CreatePurchaseSourceCommand = {
          kind: f.kind,
          name: f.name.trim(),
          ...(f.supplierName.trim() ? { supplierName: f.supplierName.trim() } : {}),
          supplierKind: f.supplierKind,
          purchasedAt: f.purchasedAt,
          goodsCost: { minor: f.goodsMinor ?? 0, currency: cur },
          ...(f.extraMinor ? { extraCosts: { minor: f.extraMinor, currency: cur } } : {}),
          ...(f.kind === "UNIT" ? { announcedQuantity: 1 } : qty ? { announcedQuantity: qty } : {}),
          ...(weight ? { weightKg: weight } : {}),
          ...(f.location.trim() ? { location: { label: f.location.trim() } } : {}),
          allocationPolicy: f.allocationPolicy,
          ...(f.notes.trim() ? { notes: f.notes.trim() } : {}),
        };
        const saved = await create.mutateAsync(body);
        show(t("sources.created"), { kind: "success" });
        router.replace(`/app/sources/${saved.id}`);
      }
    } catch (err) {
      show(describe(err), { kind: "error" });
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-5" noValidate>
      {!source ? (
        <div className="grid gap-2">
          <span className="label">{t("sources.kind")}</span>
          <ChipGroup
            value={f.kind}
            onChange={(k) => k && set("kind", k)}
            allowEmpty={false}
            aria-label={t("sources.kind")}
            options={SOURCE_KINDS.map((k) => ({ value: k, label: label.sourceKind(t, k) }))}
          />
          <p className="text-[12.5px] text-ink-2">
            {t(`sources.kindHint.${f.kind}` as MessageKey)}
          </p>
        </div>
      ) : null}

      <Field label={t("sources.name")} required error={errors.name}>
        <TextInput
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={t("sources.namePlaceholder")}
          maxLength={140}
          data-testid="source-name"
        />
      </Field>

      <SectionHeader title={t("sources.supplier")} as="h3" />
      <ChipGroup
        value={f.supplierKind}
        onChange={(k) => k && set("supplierKind", k)}
        allowEmpty={false}
        size="sm"
        scroll
        aria-label={t("sources.supplier")}
        options={SUPPLIER_KINDS.map((k) => ({ value: k, label: label.supplierKindShort(t, k) }))}
      />
      <Field label={t("sources.supplierName")} trailing={t("common.optional")}>
        <TextInput
          value={f.supplierName}
          onChange={(e) => set("supplierName", e.target.value)}
          maxLength={120}
        />
      </Field>

      <SectionHeader title={t("sources.where")} as="h3" />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("sources.purchasedAt")} required error={errors.purchasedAt}>
          <TextInput
            type="date"
            value={f.purchasedAt}
            max={isoDay()}
            onChange={(e) => set("purchasedAt", e.target.value)}
          />
        </Field>
        <Field label={t("sources.location")} trailing={t("common.optional")}>
          <TextInput
            value={f.location}
            onChange={(e) => set("location", e.target.value)}
            leading={<AppIcon name="pin" size={16} />}
            maxLength={160}
          />
        </Field>
      </div>

      <SectionHeader title={t("sources.costs")} as="h3" />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("sources.goodsCost")} required error={errors.goodsMinor}>
          <MoneyInput
            valueMinor={f.goodsMinor}
            onChangeMinor={(m) => set("goodsMinor", m)}
            currency={cur}
            data-testid="source-goods"
          />
        </Field>
        <Field label={t("sources.extraCosts")} hint={t("sources.extraCostsHint")}>
          <MoneyInput
            valueMinor={f.extraMinor}
            onChangeMinor={(m) => set("extraMinor", m)}
            currency={cur}
          />
        </Field>
      </div>

      {f.kind !== "UNIT" ? (
        <>
          <SectionHeader title={t("sources.quantityAndWeight")} as="h3" />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("sources.announcedQuantity")}
              required={needsQuantity}
              error={errors.announcedQuantity}
            >
              <TextInput
                inputMode="numeric"
                value={f.announcedQuantity}
                onChange={(e) => set("announcedQuantity", e.target.value)}
                maxLength={5}
              />
            </Field>
            <Field label={t("sources.weight")} trailing={t("common.optional")}>
              <TextInput
                inputMode="decimal"
                value={f.weightKg}
                onChange={(e) => set("weightKg", e.target.value)}
                unit={t("sources.weightUnit")}
                maxLength={7}
              />
            </Field>
          </div>
          <Field label={t("sources.allocation")}>
            <Select
              value={f.allocationPolicy}
              onChange={(v) => set("allocationPolicy", v)}
              options={ALLOCATION_POLICIES.map((p) => ({
                value: p,
                label: t(`sources.allocationLabel.${p}` as MessageKey),
              }))}
            />
          </Field>
        </>
      ) : null}

      <Field label={t("common.notes")} trailing={t("common.optional")}>
        <Textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          maxLength={2000}
        />
      </Field>

      <div className="mt-2 pb-2">
        <BigButton type="submit" loading={pending} data-testid="source-save">
          {source ? t("common.save") : t("common.create")}
        </BigButton>
      </div>
    </form>
  );
}
