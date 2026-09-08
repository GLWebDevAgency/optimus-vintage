"use client";

import type { FeeScheduleDto, Platform, WorkspaceOverviewDto } from "@chine/contract";
import { DEFAULT_FEE_SCHEDULES } from "@chine/domain";
import {
  AppIcon,
  BigButton,
  Button,
  Field,
  MoneyInput,
  Sheet,
  TextInput,
  useToast,
} from "@chine/ui";
import { useState } from "react";
import { useUpdateWorkspaceSettings } from "@/hooks/api";
import { useFormat, useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";
import { label, MAIN_PLATFORMS } from "../common/labels";

/** Grilles de frais par plateforme : la grille par défaut, la surcharge éventuelle, un panneau d'édition. */
export function FeeOverrides({ overview }: { overview: WorkspaceOverviewDto }) {
  const t = useT();
  const fmt = useFormat();
  const { show } = useToast();
  const describe = useErrorMessage();
  const update = useUpdateWorkspaceSettings();
  const currency = overview.workspace.currency;
  const [editing, setEditing] = useState<Platform | null>(null);
  const [percent, setPercent] = useState("0");
  const [fixed, setFixed] = useState<number | null>(0);
  const [min, setMin] = useState<number | null>(null);

  const describeSchedule = (s: FeeScheduleDto) =>
    [
      `${s.percent.toLocaleString()} %`,
      s.fixedMinor ? `+ ${fmt.money({ minor: s.fixedMinor, currency })}` : null,
      s.minMinor
        ? t("settings.feeMinNote", { amount: fmt.money({ minor: s.minMinor, currency }) })
        : null,
    ]
      .filter(Boolean)
      .join(" ");

  const open = (p: Platform) => {
    const current = overview.feeOverrides[p] ?? DEFAULT_FEE_SCHEDULES[p];
    setPercent(String(current.percent));
    setFixed(current.fixedMinor);
    setMin(current.minMinor ?? null);
    setEditing(p);
  };

  const save = async (value: FeeScheduleDto | null) => {
    if (!editing) return;
    try {
      await update.mutateAsync({ feeOverrides: { [editing]: value } });
      show(t("settings.saved"), { kind: "success" });
      setEditing(null);
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  const pct = Number(percent.replace(",", "."));
  const valid = Number.isFinite(pct) && pct >= 0 && pct <= 100;

  return (
    <div className="list">
      {MAIN_PLATFORMS.map((p) => {
        const override = overview.feeOverrides[p];
        const def = DEFAULT_FEE_SCHEDULES[p];
        return (
          <button type="button" key={p} className="fee-row" onClick={() => open(p)}>
            <div className="min-w-0">
              <div className="text-[14.5px] font-semibold">{label.platform(t, p)}</div>
              <div className="mono text-[12px] text-ink-3 truncate">
                {override ? describeSchedule(override) : describeSchedule(def)}
              </div>
            </div>
            <span className={`pill ${override ? "online" : "outline text-ink-3"}`}>
              {override ? t("settings.feeCustom") : t("settings.feeUsingDefault")}
            </span>
          </button>
        );
      })}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? t("settings.feeEditTitle", { platform: label.platform(t, editing) }) : ""}
        description={
          editing
            ? t("settings.feeNote", {
                percent: `${DEFAULT_FEE_SCHEDULES[editing].percent} %`,
                fixed: fmt.money({ minor: DEFAULT_FEE_SCHEDULES[editing].fixedMinor, currency }),
              })
            : undefined
        }
        footer={
          <div className="grid gap-2.5">
            <BigButton
              onClick={() =>
                void save({
                  percent: pct,
                  fixedMinor: fixed ?? 0,
                  ...(min ? { minMinor: min } : {}),
                })
              }
              loading={update.isPending}
              disabled={!valid}
            >
              {t("common.save")}
            </BigButton>
            {editing && overview.feeOverrides[editing] ? (
              <Button
                variant="ghost"
                onClick={() => void save(null)}
                disabled={update.isPending}
                leading={<AppIcon name="refresh" size={16} />}
              >
                {t("settings.feeReset")}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-4 py-1">
          {editing && DEFAULT_FEE_SCHEDULES[editing].note ? (
            <p className="text-[12.5px] text-ink-2">{DEFAULT_FEE_SCHEDULES[editing].note}</p>
          ) : null}
          <Field
            label={t("settings.feePercent")}
            error={valid ? undefined : t("errors.field.invalid")}
          >
            <TextInput
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              unit="%"
              data-autofocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("settings.feeFixed")}>
              <MoneyInput valueMinor={fixed} onChangeMinor={setFixed} currency={currency} />
            </Field>
            <Field label={t("settings.feeMin")} trailing={t("common.optional")}>
              <MoneyInput valueMinor={min} onChangeMinor={setMin} currency={currency} />
            </Field>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
