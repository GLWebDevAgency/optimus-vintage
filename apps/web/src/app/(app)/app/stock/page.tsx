import type { Metadata } from "next";
import Link from "next/link";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Stock" };

/** TODO(lead): liste des pièces (filtres statut, recherche, tri), pagination. */
export default function StockPage() {
  return (
    <>
      <TopBar
        title="Stock"
        kicker="Pièces · en stock · en ligne"
        actions={
          <Link
            href="/app/chiner"
            className="avatar !bg-btn !text-btn-ink"
            aria-label="Ajouter une pièce"
          >
            <IconPlus />
          </Link>
        }
      />
      <Screen>
        <PageSkeleton variant="list" rows={7} />
      </Screen>
    </>
  );
}
