import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Pièce" };

/** TODO(lead): fiche pièce (étiquette recto/verso, méta, reçu, actions Mettre en ligne / Vendre). */
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <TopBar
        title="Pièce"
        kicker={`Réf. ${id.slice(0, 8).toUpperCase()}`}
        back="/app/stock"
        avatar={false}
      />
      <Screen>
        <PageSkeleton variant="item" />
      </Screen>
    </>
  );
}
