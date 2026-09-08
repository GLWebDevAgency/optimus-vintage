import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

/** Cadre commun des écrans d'authentification : logotype, carte-étiquette, pied légal. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="flex justify-center py-2">
        <Wordmark size="md" />
      </div>
      <div className="py-6">{children}</div>
      <p className="label text-center leading-relaxed">
        <Link href="/legal/cgu" className="no-underline">
          CGU
        </Link>
        {" · "}
        <Link href="/legal/confidentialite" className="no-underline">
          Confidentialité
        </Link>
      </p>
    </main>
  );
}
