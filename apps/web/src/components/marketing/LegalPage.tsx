import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

interface LegalPageProps {
  eyebrow: string;
  title: ReactNode;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ eyebrow, title, updated, children }: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="wrap landing pt-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3.5 text-[clamp(30px,6vw,44px)] font-bold tracking-[-0.02em]">{title}</h1>
        <p className="label mt-3">Dernière mise à jour · {updated}</p>
        <article className="prose mt-8">{children}</article>
        <SiteFooter />
      </main>
    </>
  );
}
