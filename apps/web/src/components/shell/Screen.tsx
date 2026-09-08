import type { ReactNode } from "react";

/** Conteneur d'écran : colonne, gouttières 20 px, espace pour la barre d'onglets. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["screen", className].filter(Boolean).join(" ")}>{children}</div>;
}
