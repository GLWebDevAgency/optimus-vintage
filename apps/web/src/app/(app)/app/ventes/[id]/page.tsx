import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Vente" };

/** TODO(lead): détail de vente (tampon, marge nette, reçu, étiquette colis, nouvelle vente). */
export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <TopBar
        title={
          <>
            Vendu <em>sur Vinted</em>
          </>
        }
        kicker={`Vente #${id.slice(0, 6).toUpperCase()}`}
        back="/app/ventes"
        avatar={false}
      />
      <Screen>
        <PageSkeleton variant="sale" />
      </Screen>
    </>
  );
}
