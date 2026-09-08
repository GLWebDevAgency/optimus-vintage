import type { Metadata } from "next";
import { Suspense } from "react";
import { StockScreen } from "@/components/screens/stock/StockScreen";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Stock" };

export default function StockPage() {
  return (
    <Suspense
      fallback={
        <>
          <TopBar title="Stock" />
          <Screen>
            <PageSkeleton variant="list" rows={7} />
          </Screen>
        </>
      }
    >
      <StockScreen />
    </Suspense>
  );
}
