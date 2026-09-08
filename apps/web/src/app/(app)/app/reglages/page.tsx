import type { Metadata } from "next";
import Link from "next/link";
import { AccountCard } from "@/components/settings/AccountCard";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconChevronRight } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Réglages" };

const ROWS: { t: string; s: string }[] = [
  { t: "Formule et facturation", s: "Free · passer Premium" },
  { t: "Plateformes de vente", s: "Vinted · Leboncoin · Vestiaire" },
  { t: "Marge cible et frais", s: "Port, emballage, commission" },
  { t: "Exporter mes données", s: "CSV · à tout moment" },
];

/** TODO(lead): brancher formule, plateformes, préférences de marge, export, suppression de compte. */
export default function SettingsPage() {
  return (
    <>
      <TopBar title="Réglages" kicker="Compte · matière · préférences" back="/app" avatar={false} />
      <Screen>
        <div className="enter d1">
          <AccountCard />
        </div>
        <div className="grid gap-2 enter d2">
          <span className="label">Matière</span>
          <ThemePicker />
        </div>
        <div className="list enter d3">
          {ROWS.map((r) => (
            <div className="settings-row" key={r.t} aria-disabled="true">
              <div>
                <div className="t">{r.t}</div>
                <div className="s">{r.s}</div>
              </div>
              <IconChevronRight className="text-ink-3" />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4 enter d4 grid gap-3">
          <Link href="/auth/deconnexion" className="btn ghost" prefetch={false}>
            Se déconnecter
          </Link>
          <p className="label text-center">Chiné · web · v0.1</p>
        </div>
      </Screen>
    </>
  );
}
