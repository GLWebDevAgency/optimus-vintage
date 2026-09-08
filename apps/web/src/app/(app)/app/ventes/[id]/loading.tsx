import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Vente" back="/app/ventes" avatar={false} />
      <Screen>
        <PageSkeleton variant="sale" />
      </Screen>
    </>
  );
}
