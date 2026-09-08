import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { OutboxReplayer } from "@/components/offline/OutboxReplayer";
import { TabBar } from "@/components/shell/TabBar";
import { auth } from "@/lib/auth";

/**
 * Coquille mobile de l'app : zones sûres, contenu, barre d'onglets fixe.
 * Le proxy (src/proxy.ts) filtre déjà sur la présence du cookie ; ici on vérifie la session réelle.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  // `headers()` d'abord : la page bascule en rendu dynamique avant même d'instancier Better Auth.
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/auth/connexion");

  return (
    <div className="app-shell">
      <main id="main" className="app-main">
        {children}
      </main>
      <TabBar />
      <OutboxReplayer />
    </div>
  );
}
