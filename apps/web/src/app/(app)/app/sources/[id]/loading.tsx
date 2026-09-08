import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Source" back="/app/sources" avatar={false} />
      <Screen>
        <PageSkeleton variant="sources" />
      </Screen>
    </>
  );
}
