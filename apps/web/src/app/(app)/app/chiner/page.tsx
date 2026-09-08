import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Chiner" };

/** TODO(lead): capture photo, prix au mètre, lieu détecté, estimation IA, enqueue() dans l'outbox. */
export default function ChinerPage() {
  return (
    <>
      <TopBar title="Nouvelle pièce" kicker="Mode chine" back="/app" avatar={false} />
      <Screen>
        <PageSkeleton variant="chiner" />
      </Screen>
    </>
  );
}
