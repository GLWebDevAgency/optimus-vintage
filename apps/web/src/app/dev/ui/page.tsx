import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shell/PageSkeleton";

export const metadata: Metadata = { title: "Showcase UI", robots: { index: false } };

/** TODO(lead): monter ici le showcase de `@chine/ui` (`@chine/ui/preview`). */
export default function DevUiPage() {
  return (
    <main className="wrap landing pt-8 pb-20">
      <p className="eyebrow">Dev · @chine/ui</p>
      <h1 className="mt-3.5 text-[32px] font-bold tracking-[-0.02em]">showcase</h1>
      <p className="lead mt-3 text-[15px]">
        Emplacement réservé au showcase du design system. Rien n'est encore branché ici.
      </p>
      <div className="mt-8 max-w-[420px] grid gap-4">
        <PageSkeleton variant="showcase" />
      </div>
    </main>
  );
}
