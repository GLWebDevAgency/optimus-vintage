"use client";

import { BigButton, Field, Sheet, TextInput } from "@chine/ui";
import { type ReactNode, useEffect, useState } from "react";
import { useT } from "@/hooks/i18n";

interface ConfirmSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly confirmLabel: ReactNode;
  readonly onConfirm: () => void | Promise<void>;
  readonly loading?: boolean;
  /** Bouton de confirmation en fil rouge (action destructive). */
  readonly danger?: boolean;
  /** Mot à recopier pour déverrouiller la confirmation (« SUPPRIMER »). */
  readonly typeToConfirm?: string;
  readonly children?: ReactNode;
  readonly error?: ReactNode;
}

/** Panneau de confirmation : deux boutons, option de mot à recopier pour les actions définitives. */
export function ConfirmSheet({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  danger,
  typeToConfirm,
  children,
  error,
}: ConfirmSheetProps) {
  const t = useT();
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const locked = Boolean(typeToConfirm) && typed.trim() !== typeToConfirm;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      dismissable={!loading}
      footer={
        <div className="grid grid-cols-2 gap-2.5">
          <BigButton variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </BigButton>
          <BigButton
            onClick={() => void onConfirm()}
            loading={loading}
            disabled={locked}
            className={danger ? "!bg-thread !text-white" : undefined}
            data-testid="confirm-sheet-confirm"
          >
            {confirmLabel}
          </BigButton>
        </div>
      }
    >
      <div className="grid gap-4 py-1">
        {children}
        {typeToConfirm ? (
          <Field label={t("settings.deleteTypeToConfirm", { word: typeToConfirm })}>
            <TextInput
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder={typeToConfirm}
              data-autofocus
            />
          </Field>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13px] font-semibold text-thread">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
