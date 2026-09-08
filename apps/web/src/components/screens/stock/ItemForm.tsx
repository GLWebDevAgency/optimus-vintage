"use client";

import {
  CATEGORIES,
  type Category,
  type Condition,
  CONDITIONS,
  type Era,
  ERAS,
  type Gender,
  GENDERS,
  type ItemDto,
  type MeasurementsDto,
  type UpdateItemCommand,
} from "@chine/contract";
import type { MessageKey } from "@chine/i18n";
import { BigButton, ChipGroup, Field, MoneyInput, SectionHeader, Textarea, TextInput, useToast } from "@chine/ui";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useUpdateItem } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";
import { label, SIZE_PRESETS } from "../common/labels";

const MEASURES: (keyof MeasurementsDto)[] = ["chestCm", "lengthCm", "shoulderCm", "sleeveCm", "waistCm", "inseamCm"];

interface FormState {
  title: string;
  brand: string;
  category: Category;
  gender: Gender | null;
  size: string;
  condition: Condition;
  era: Era | null;
  colors: string;
  materials: string;
  acquisitionMinor: number | null;
  retailMinor: number | null;
  targetMinor: number | null;
  bin: string;
  notes: string;
  measurements: Record<keyof MeasurementsDto, string>;
}

const fromItem = (item: ItemDto): FormState => ({
  title: item.title,
  brand: item.brand ?? "",
  category: item.category,
  gender: item.gender ?? null,
  size: item.size ?? "",
  condition: item.condition,
  era: item.era ?? null,
  colors: item.colors.join(", "),
  materials: item.materials.join(", "),
  acquisitionMinor: item.acquisitionCost.minor,
  retailMinor: item.retailPrice?.minor ?? null,
  targetMinor: item.targetPrice?.minor ?? null,
  bin: item.bin ?? "",
  notes: item.notes ?? "",
  measurements: Object.fromEntries(
    MEASURES.map((k) => [k, item.measurements?.[k] !== undefined ? String(item.measurements[k]) : ""]),
  ) as Record<keyof MeasurementsDto, string>,
});

const splitTags = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);

/** Formulaire complet de la pièce (`PATCH /items/:id`). */
export function ItemForm({ item }: { item: ItemDto }) {
  const t = useT();
  const router = useRouter();
  const { show } = useToast();
  const describe = useErrorMessage();
  const update = useUpdateItem(item.id);
  const [f, setF] = useState<FormState>(() => fromItem(item));
  const [error, setError] = useState<string | null>(null);
  const currency = item.acquisitionCost.currency;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) {
      setError(t("errors.code.TITLE_REQUIRED"));
      return;
    }
    setError(null);
    const measurements: MeasurementsDto = {};
    for (const k of MEASURES) {
      const raw = f.measurements[k].replace(",", ".").trim();
      if (raw !== "" && Number.isFinite(Number(raw))) measurements[k] = Number(raw);
    }
    const body: UpdateItemCommand = {
      title: f.title.trim(),
      brand: f.brand.trim() || null,
      category: f.category,
      gender: f.gender,
      size: f.size.trim() || null,
      condition: f.condition,
      era: f.era,
      colors: splitTags(f.colors),
      materials: splitTags(f.materials),
      measurements: Object.keys(measurements).length ? measurements : null,
      ...(f.acquisitionMinor !== null ? { acquisitionCost: { minor: f.acquisitionMinor, currency } } : {}),
      retailPrice: f.retailMinor ? { minor: f.retailMinor, currency } : null,
      targetPrice: f.targetMinor ? { minor: f.targetMinor, currency } : null,
      bin: f.bin.trim() || null,
      notes: f.notes.trim() || null,
    };
    try {
      await update.mutateAsync(body);
      show(t("items.saved"), { kind: "success" });
      router.replace(`/app/stock/${item.id}`);
    } catch (err) {
      show(describe(err), { kind: "error" });
    }
  };

  const sizeIsPreset = (SIZE_PRESETS as readonly string[]).includes(f.size);

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-5" noValidate>
      <Field label={t("items.itemTitle")} required error={error ?? undefined}>
        <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={140} data-testid="item-title" />
      </Field>
      <Field label={t("items.brand")}>
        <TextInput value={f.brand} onChange={(e) => set("brand", e.target.value)} maxLength={120} autoCapitalize="words" />
      </Field>

      <div className="grid gap-2">
        <span className="label">{t("items.category")}</span>
        <ChipGroup
          value={f.category}
          onChange={(c) => c && set("category", c)}
          allowEmpty={false}
          size="sm"
          aria-label={t("items.category")}
          options={CATEGORIES.map((c) => ({ value: c, label: label.category(t, c) }))}
        />
      </div>

      <div className="grid gap-2">
        <span className="label">{t("items.gender")}</span>
        <ChipGroup
          value={f.gender}
          onChange={(g) => set("gender", g)}
          size="sm"
          aria-label={t("items.gender")}
          options={GENDERS.map((g) => ({ value: g, label: label.gender(t, g) }))}
        />
      </div>

      <div className="grid gap-2">
        <span className="label">{t("items.size")}</span>
        <ChipGroup
          value={sizeIsPreset ? f.size : null}
          onChange={(s) => set("size", s ?? "")}
          size="sm"
          scroll
          aria-label={t("items.size")}
          options={SIZE_PRESETS.map((s) => ({ value: s, label: s }))}
        />
        <TextInput
          value={f.size}
          onChange={(e) => set("size", e.target.value)}
          placeholder={t("items.sizes.custom")}
          maxLength={24}
          aria-label={t("items.sizes.custom")}
        />
      </div>

      <div className="grid gap-2">
        <span className="label">{t("items.condition")}</span>
        <ChipGroup
          value={f.condition}
          onChange={(c) => c && set("condition", c)}
          allowEmpty={false}
          size="sm"
          aria-label={t("items.condition")}
          options={CONDITIONS.map((c) => ({ value: c, label: label.condition(t, c) }))}
        />
      </div>

      <div className="grid gap-2">
        <span className="label">{t("items.era")}</span>
        <ChipGroup
          value={f.era}
          onChange={(e) => set("era", e)}
          size="sm"
          scroll
          aria-label={t("items.era")}
          options={ERAS.map((e) => ({ value: e, label: label.era(t, e) }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("items.colors")} hint={t("items.tagsHint")}>
          <TextInput value={f.colors} onChange={(e) => set("colors", e.target.value)} placeholder={t("items.colorsPlaceholder")} />
        </Field>
        <Field label={t("items.materials")}>
          <TextInput value={f.materials} onChange={(e) => set("materials", e.target.value)} placeholder={t("items.materialsPlaceholder")} />
        </Field>
      </div>

      <SectionHeader title={t("items.acquisitionCost")} as="h3" />
      <div className="grid grid-cols-3 gap-3">
        <Field label={t("items.acquisitionCost")}>
          <MoneyInput valueMinor={f.acquisitionMinor} onChangeMinor={(m) => set("acquisitionMinor", m)} currency={currency} />
        </Field>
        <Field label={t("items.retailShort")}>
          <MoneyInput valueMinor={f.retailMinor} onChangeMinor={(m) => set("retailMinor", m)} currency={currency} />
        </Field>
        <Field label={t("items.targetPrice")}>
          <MoneyInput valueMinor={f.targetMinor} onChangeMinor={(m) => set("targetMinor", m)} currency={currency} data-testid="item-target" />
        </Field>
      </div>

      <SectionHeader title={t("items.measurements")} as="h3" action={t("items.measurementsHint")} />
      <div className="grid grid-cols-3 gap-3">
        {MEASURES.map((k) => (
          <Field key={k} label={t(`items.measurement.${k}` as MessageKey)}>
            <TextInput
              inputMode="decimal"
              value={f.measurements[k]}
              onChange={(e) => setF((s) => ({ ...s, measurements: { ...s.measurements, [k]: e.target.value } }))}
              unit={t("items.measurement.unit")}
              maxLength={6}
            />
          </Field>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Field label={t("items.bin")}>
          <TextInput value={f.bin} onChange={(e) => set("bin", e.target.value)} maxLength={24} placeholder="B-07" />
        </Field>
        <Field label={t("common.notes")}>
          <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={2000} />
        </Field>
      </div>

      <div className="mt-2 pb-2">
        <BigButton type="submit" loading={update.isPending} data-testid="item-save">
          {t("common.save")}
        </BigButton>
      </div>
    </form>
  );
}
