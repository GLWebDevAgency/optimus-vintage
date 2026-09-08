import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Modifier" back="/app/sources" avatar={false} />
      <Screen>
        <PageSkeleton variant="settings" />
      </Screen>
    </>
  );
}
