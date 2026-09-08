import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconPlus } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Sources" };

/** TODO(lead): sources (lots, palettes, ballots, chine) avec remboursement au fil rouge. */
export default function SourcesPage() {
  return (
    <>
      <TopBar
        title="Sources"
        kicker="Lots · palettes · chine"
        actions={
          <button
            type="button"
            className="avatar !bg-btn !text-btn-ink touch"
            aria-label="Nouvelle source"
          >
            <IconPlus />
          </button>
        }
      />
      <Screen>
        <PageSkeleton variant="sources" rows={4} />
      </Screen>
    </>
  );
}
