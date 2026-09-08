import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Source" };

/** TODO(lead): détail source (coût, récupéré, plancher par pièce, pièces liées). */
export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <TopBar
        title="Source"
        kicker={`Réf. ${id.slice(0, 8).toUpperCase()}`}
        back="/app/sources"
        avatar={false}
      />
      <Screen>
        <PageSkeleton variant="sources" rows={1} />
        <div className="sec-h enter d4">
          <h2>Pièces de cette source</h2>
        </div>
        <PageSkeleton variant="list" rows={4} />
      </Screen>
    </>
  );
}
