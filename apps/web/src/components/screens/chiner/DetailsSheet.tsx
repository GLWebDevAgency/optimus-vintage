"use client";

import { CATEGORIES, type Category, type Condition, CONDITIONS, type Currency } from "@chine/contract";
import { BigButton, Field, MoneyInput, Select, Sheet, Textarea, TextInput } from "@chine/ui";
import { useT } from "@/hooks/i18n";
import { label } from "../common/labels";

export interface CaptureDetails {
  title: string;
  brand: string;
  category: Category | "";
  size: string;
  condition: Condition | "";
  retailPriceMinor: number | null;
  targetPriceMinor: number | null;
  notes: string;
}

export const EMPTY_DETAILS: CaptureDetails = {
  title: "",
  brand: "",
  category: "",
  size: "",
  condition: "",
  retailPriceMinor: null,
  targetPriceMinor: null,
  notes: "",
};

/** Nombre de champs renseignés (pour le compteur du bouton « Détails »). */
export const filledDetails = (d: CaptureDetails): number =>
  [d.title, d.brand, d.category, d.size, d.condition, d.notes].filter((v) => v.trim() !== "").length +
  (d.retailPriceMinor ? 1 : 0) +
  (d.targetPriceMinor ? 1 : 0);

interface DetailsSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value: CaptureDetails;
  readonly onChange: (next: CaptureDetails) => void;
  readonly currency: Currency;
}

/** Champs facultatifs de la capture : titre, marque, catégorie, taille, état, prix neuf, prix cible, notes. */
export function DetailsSheet({ open, onClose, value, onChange, currency }: DetailsSheetProps) {
  const t = useT();
  const set = <K extends keyof CaptureDetails>(k: K, v: CaptureDetails[K]) => onChange({ ...value, [k]: v });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("chine.detailsSheetTitle")}
      description={t("chine.detailsSheetBody")}
      footer={
        <BigButton onClick={onClose} data-testid="details-done">
          {t("common.done")}
        </BigButton>
      }
    >
      <div className="grid gap-4 py-1">
        <Field label={t("items.itemTitle")}>
          <TextInput
            value={value.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("items.titlePlaceholder")}
            maxLength={140}
            data-autofocus
            data-testid="details-title"
          />
        </Field>
        <Field label={t("items.brand")}>
          <TextInput
            value={value.brand}
            onChange={(e) => set("brand", e.target.value)}
            maxLength={120}
            autoCapitalize="words"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("items.category")}>
            <Select
              value={value.category}
              onChange={(v) => set("category", v)}
              placeholder="—"
              options={CATEGORIES.map((c) => ({ value: c, label: label.category(t, c) }))}
            />
          </Field>
          <Field label={t("items.size")}>
            <TextInput
              value={value.size}
              onChange={(e) => set("size", e.target.value)}
              maxLength={24}
              placeholder="M · 40 · 42"
            />
          </Field>
        </div>
        <Field label={t("items.condition")}>
          <Select
            value={value.condition}
            onChange={(v) => set("condition", v)}
            placeholder="—"
            options={CONDITIONS.map((c) => ({ value: c, label: label.condition(t, c) }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("items.retailPrice")}>
            <MoneyInput
              valueMinor={value.retailPriceMinor}
              onChangeMinor={(m) => set("retailPriceMinor", m)}
              currency={currency}
            />
          </Field>
          <Field label={t("items.targetPrice")}>
            <MoneyInput
              valueMinor={value.targetPriceMinor}
              onChangeMinor={(m) => set("targetPriceMinor", m)}
              currency={currency}
            />
          </Field>
        </div>
        <Field label={t("common.notes")} trailing={t("common.optional")}>
          <Textarea
            value={value.notes}
            onChange={(e) => set("notes", e.target.value)}
            maxLength={2000}
            rows={3}
          />
        </Field>
      </div>
    </Sheet>
  );
}
