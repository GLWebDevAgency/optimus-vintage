"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { useT } from "@/hooks/i18n";
import { ErrorState } from "./ErrorState";

interface SegmentErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly title: string;
  readonly back?: Route;
}

/** Corps commun des `error.tsx` de segment : barre, état d'erreur, « Réessayer » (reset). */
export function SegmentError({ error, reset, title, back }: SegmentErrorProps) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <TopBar title={title} kicker={t("errors.boundaryTitle")} back={back} avatar={false} />
      <Screen>
        <div className="card enter d2">
          <ErrorState error={error} onRetry={reset} title={t("errors.boundaryTitle")} />
        </div>
      </Screen>
    </>
  );
}
