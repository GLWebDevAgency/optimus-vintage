"use client";

import { CURRENCIES, LOCALES, type WorkspaceOverviewDto } from "@chine/contract";
import { type Locale, type MessageKey, minorUnits } from "@chine/i18n";
import { Button, Field, MoneyInput, Segmented, Select, TextInput, useToast } from "@chine/ui";
import { type FormEvent, useState } from "react";
import { useUpdateWorkspaceSettings } from "@/hooks/api";
import { useLocale, useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";

/** Boutique : nom, devise, langue, préfixe de référence, marge cible (% ou montant), seuil dormant. */
export function WorkspaceForm({ overview }: { overview: WorkspaceOverviewDto }) {
  const t = useT();
  const { setLocale } = useLocale();
  const { show } = useToast();
  const describe = useErrorMessage();
  const update = useUpdateWorkspaceSettings();
  const ws = overview.workspace;
  const [name, setName] = useState(ws.name);
  const [currency, setCurrency] = useState(ws.currency);
  const [locale, setLocaleState] = useState<Locale>(ws.locale);
  const [skuPrefix, setSkuPrefix] = useState(ws.skuPrefix);
  const [kind, setKind] = useState<"PERCENT" | "AMOUNT_MINOR">(ws.targetMargin.kind);
  const [percent, setPercent] = useState(
    ws.targetMargin.kind === "PERCENT" ? String(ws.targetMargin.value) : "100",
  );
  const [amountMinor, setAmountMinor] = useState<number | null>(
    ws.targetMargin.kind === "AMOUNT_MINOR"
      ? ws.targetMargin.value
      : 10 * 10 ** minorUnits(ws.currency),
  );
  const [dormant, setDormant] = useState(String(ws.dormantThresholdDays));
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name !== ws.name ||
    currency !== ws.currency ||
    locale !== ws.locale ||
    skuPrefix !== ws.skuPrefix ||
    kind !== ws.targetMargin.kind ||
    (kind === "PERCENT"
      ? Number(percent) !== ws.targetMargin.value
      : amountMinor !== ws.targetMargin.value) ||
    Number(dormant) !== ws.dormantThresholdDays;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z]{1,4}$/.test(skuPrefix)) {
      setError(t("auth.skuPrefixHint"));
      return;
    }
    const pct = Number(percent.replace(",", "."));
    if (kind === "PERCENT" && (!Number.isFinite(pct) || pct < 0 || pct > 1000)) {
      setError(t("errors.field.invalid"));
      return;
    }
    const days = Number(dormant);
    if (!Number.isInteger(days) || days < 7 || days > 365) {
      setError(t("errors.field.invalid"));
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({
        name: name.trim() || ws.name,
        currency,
        locale,
        skuPrefix,
        targetMargin: kind === "PERCENT" ? { kind, value: pct } : { kind, value: amountMinor ?? 0 },
        dormantThresholdDays: days,
      });
      setLocale(locale);
      show(t("settings.saved"), { kind: "success" });
    } catch (err) {
      show(describe(err), { kind: "error" });
    }
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="card grid gap-4"
      noValidate
      data-testid="workspace-form"
    >
      <Field label={t("settings.workspaceName")}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("settings.currency")} hint={t("settings.currencyHint")}>
          <Select
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field label={t("settings.language")} hint={t("settings.localeHint")}>
          <Select
            value={locale}
            onChange={setLocaleState}
            options={LOCALES.map((l) => ({
              value: l,
              label: t(`settings.languageLabel.${l}` as MessageKey),
            }))}
          />
        </Field>
      </div>
      <Field
        label={t("settings.skuPrefix")}
        hint={t("settings.skuPrefixExample", { prefix: skuPrefix || "CH" })}
      >
        <TextInput
          value={skuPrefix}
          onChange={(e) =>
            setSkuPrefix(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(0, 4),
            )
          }
          maxLength={4}
          autoCapitalize="characters"
        />
      </Field>
      <Field label={t("settings.dormantThreshold")}>
        <TextInput
          inputMode="numeric"
          value={dormant}
          onChange={(e) => setDormant(e.target.value)}
          unit="j"
          maxLength={3}
        />
      </Field>
      <div className="grid gap-2">
        <span className="label">{t("settings.targetMargin")}</span>
        <Segmented
          size="sm"
          value={kind}
          onChange={setKind}
          aria-label={t("settings.targetMarginKind")}
          options={[
            { value: "PERCENT", label: t("settings.targetMarginPercent") },
            { value: "AMOUNT_MINOR", label: t("settings.targetMarginAmount") },
          ]}
        />
        {kind === "PERCENT" ? (
          <TextInput
            inputMode="decimal"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            unit="%"
            aria-label={t("settings.targetMarginPercent")}
          />
        ) : (
          <MoneyInput
            valueMinor={amountMinor}
            onChangeMinor={setAmountMinor}
            currency={currency}
            aria-label={t("settings.targetMarginAmount")}
          />
        )}
      </div>
      {error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-thread">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span className="label">{dirty ? t("settings.unsaved") : ""}</span>
        <Button type="submit" size="sm" loading={update.isPending} disabled={!dirty}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
