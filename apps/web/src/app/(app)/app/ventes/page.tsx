import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Ventes" };

/** TODO(lead): ventes du mois (marge, objectif cousu), liste par plateforme. */
export default function SalesPage() {
  return (
    <>
      <TopBar title="Ventes" kicker="Ce mois" />
      <Screen>
        <PageSkeleton variant="list" rows={6} />
      </Screen>
    </>
  );
}
