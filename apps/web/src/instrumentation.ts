/**
 * Instrumentation Next.js : initialise Sentry côté serveur (Node et Edge) si un DSN est fourni.
 * Sans DSN, rien n'est chargé : l'app reste silencieuse et sans dépendance réseau.
 */

export async function register(): Promise<void> {
  // Tâches de fond (relais outbox, purges) : runtime Node uniquement, jamais pendant `next build`.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.CHINE_JOBS !== "false") {
    const { startBackgroundJobs } = await import("@/lib/jobs");
    startBackgroundJobs();
  }
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release:
      process.env.SENTRY_RELEASE ?? process.env.APP_COMMIT ?? process.env.RAILWAY_GIT_COMMIT_SHA,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    sendDefaultPii: false,
    beforeSend(event) {
      // Jamais de corps de requête ni de cookies dans les rapports.
      if (event.request) {
        event.request.cookies = undefined;
        event.request.data = undefined;
      }
      return event;
    },
  });
}

export const onRequestError: typeof import("@sentry/nextjs").captureRequestError = async (
  ...args
) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
