"use client";

import type { Currency } from "@chine/contract";
import { BigButton, Button, Field, MoneyInput, Sheet, useToast } from "@chine/ui";
import { useEffect, useState } from "react";
import { useUpdateWorkspaceSettings } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { useErrorMessage } from "../common/ErrorState";

interface GoalSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly currency: Currency;
  readonly currentMinor: number | null;
}

/** Objectif mensuel de marge nette : saisie, enregistrement (`PATCH /workspace/settings`), retrait. */
export function GoalSheet({ open, onClose, currency, currentMinor }: GoalSheetProps) {
  const t = useT();
  const { show } = useToast();
  const describe = useErrorMessage();
  const update = useUpdateWorkspaceSettings();
  const [minor, setMinor] = useState<number | null>(currentMinor);

  useEffect(() => {
    if (open) setMinor(currentMinor);
  }, [open, currentMinor]);

  const save = async (value: number | null) => {
    try {
      await update.mutateAsync({ monthlyGoal: value === null ? null : { minor: value, currency } });
      show(t("dashboard.goalSaved"), { kind: "success" });
      onClose();
    } catch (e) {
      show(describe(e), { kind: "error" });
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("dashboard.goalSheetTitle")}
      description={t("dashboard.goalSheetBody")}
      footer={
        <div className="grid gap-2.5">
          <BigButton
            onClick={() => void save(minor)}
            loading={update.isPending}
            disabled={minor === null || minor <= 0}
            data-testid="goal-save"
          >
            {t("common.save")}
          </BigButton>
          {currentMinor !== null ? (
            <Button variant="ghost" onClick={() => void save(null)} disabled={update.isPending}>
              {t("dashboard.removeGoal")}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 py-1">
        <Field label={t("dashboard.goalAmount")} hint={t("settings.monthlyGoalHint")}>
          <MoneyInput
            valueMinor={minor}
            onChangeMinor={setMinor}
            currency={currency}
            data-autofocus
            data-testid="goal-input"
          />
        </Field>
      </div>
    </Sheet>
  );
}
