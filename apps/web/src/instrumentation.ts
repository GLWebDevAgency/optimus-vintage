/**
 * Instrumentation Next.js : initialise Sentry côté serveur (Node et Edge) si un DSN est fourni.
 * Sans DSN, rien n'est chargé : l'app reste silencieuse et sans dépendance réseau.
 */
type Env = Partial<
  Record<
    | "SENTRY_DSN"
    | "SENTRY_ENVIRONMENT"
    | "NODE_ENV"
    | "SENTRY_RELEASE"
    | "VERCEL_GIT_COMMIT_SHA"
    | "SENTRY_TRACES_SAMPLE_RATE",
    string
  >
>;
const env = process.env as Env;

export async function register(): Promise<void> {
  if (!env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE ?? env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
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
  if (!env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
