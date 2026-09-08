import type { Metadata } from "next";
import { Suspense } from "react";
import { NewSaleScreen } from "@/components/screens/sales/NewSaleScreen";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Nouvelle vente" };

export default function NewSalePage() {
  return (
    <Suspense
      fallback={
        <>
          <TopBar title="Nouvelle vente" back="/app/ventes" avatar={false} />
          <Screen>
            <PageSkeleton variant="sale" />
          </Screen>
        </>
      }
    >
      <NewSaleScreen />
    </Suspense>
  );
}
