"use client";

import { useEffect } from "react";

type Env = Partial<Record<"NEXT_PUBLIC_SENTRY_DSN", string>>;
const env = process.env as Env;

/**
 * Dernier filet de sécurité : erreur non rattrapée dans le layout racine.
 * Rendu volontairement autonome (pas de design system) pour rester affichable quoi qu'il arrive.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F2EDE2",
          color: "#171B27",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#C4283C",
            }}
          >
            Chiné
          </p>
          <h1 style={{ fontSize: 24, margin: "8px 0 12px" }}>Quelque chose a craqué.</h1>
          <p style={{ lineHeight: 1.5 }}>
            L'erreur a été enregistrée. Tu peux réessayer ; si le problème persiste, recharge la
            page.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.6 }}>
              Référence : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 18px",
              borderRadius: 12,
              border: 0,
              background: "#171B27",
              color: "#F7F3EA",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
