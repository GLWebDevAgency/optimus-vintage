import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TodayKicker } from "@/components/shell/TodayKicker";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Aujourd'hui" };

/** TODO(lead): brancher le rapport de période (marge nette, objectif, compteurs, dernières ventes). */
export default function TodayPage() {
  return (
    <>
      <TopBar title="Aujourd'hui" kicker={<TodayKicker />} />
      <Screen>
        <PageSkeleton variant="today" />
      </Screen>
    </>
  );
}
