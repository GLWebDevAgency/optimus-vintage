"use client";

import { AppIcon, Button, useToast } from "@chine/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAccount, fetchAccountExport } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { signOut } from "@/lib/auth-client";
import { ConfirmSheet } from "../common/ConfirmSheet";
import { useErrorMessage } from "../common/ErrorState";
import { isoDay } from "../common/labels";

const CSV = [
  { entity: "items", key: "settings.csvItems" },
  { entity: "sales", key: "settings.csvSales" },
  { entity: "sources", key: "settings.csvSources" },
] as const;

/** Données : exports CSV (tableur), journal comptable (Pro), export JSON, suppression du compte. */
export function DataSection({ features = [] }: { features?: readonly string[] }) {
  const t = useT();
  const accounting = features.includes("ACCOUNTING_EXPORT");
  const router = useRouter();
  const qc = useQueryClient();
  const { show } = useToast();
  const describe = useErrorMessage();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportJson = async () => {
    setExporting(true);
    try {
      const blob = await fetchAccountExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chine-export-${isoDay()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      show(describe(e), { kind: "error" });
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      qc.clear();
      await signOut();
      show(t("settings.deleteRequested"), { kind: "success" });
      router.replace("/");
    } catch (e) {
      setError(describe(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card grid gap-3">
      <div>
        <div className="text-[14.5px] font-semibold">{t("settings.exportCsv")}</div>
        <div className="text-[12.5px] text-ink-2">{t("settings.csvHint")}</div>
      </div>
      {/* Liens directs (GET + cookie) : fonctionnent aussi dans une PWA iOS, où le téléchargement
          d'un blob est ignoré. */}
      <div className="grid grid-cols-3 gap-2" data-testid="csv-exports">
        {CSV.map((c) => (
          <a
            key={c.entity}
            href={`/api/v1/export/${c.entity}.csv`}
            className="btn ghost !min-h-[40px] !text-[12.5px]"
          >
            {t(c.key)}
          </a>
        ))}
      </div>
      {accounting ? (
        <a
          href="/api/v1/export/comptabilite.csv"
          className="btn ghost"
          data-testid="csv-accounting"
        >
          {t("settings.exportAccounting")}
        </a>
      ) : (
        <p className="text-[12.5px] text-ink-3">{t("settings.accountingLocked")}</p>
      )}
      <div className="border-t border-line pt-3">
        <div className="text-[14.5px] font-semibold">{t("settings.exportJson")}</div>
        <div className="text-[12.5px] text-ink-2">{t("settings.exportHint")}</div>
      </div>
      <Button
        variant="ghost"
        onClick={() => void exportJson()}
        loading={exporting}
        leading={<AppIcon name="share" size={16} />}
      >
        {t("settings.exportJson")}
      </Button>
      <div className="border-t border-line pt-3">
        <span className="label text-thread">{t("settings.dangerZone")}</span>
        <p className="mt-1 text-[12.5px] text-ink-2">{t("settings.deleteAccountConfirm")}</p>
        <Button
          variant="ghost"
          className="mt-2 !text-thread"
          onClick={() => setOpen(true)}
          leading={<AppIcon name="trash" size={16} />}
          data-testid="delete-account"
        >
          {t("settings.deleteAccount")}
        </Button>
      </div>
      <ConfirmSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("settings.deleteAccountTitle")}
        description={t("settings.deleteAccountConfirm")}
        confirmLabel={t("common.delete")}
        danger
        loading={deleting}
        typeToConfirm={t("settings.deleteWord")}
        onConfirm={remove}
        error={error}
      />
    </div>
  );
}
