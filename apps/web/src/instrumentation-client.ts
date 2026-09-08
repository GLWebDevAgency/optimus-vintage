/**
 * Instrumentation client : Sentry navigateur si `NEXT_PUBLIC_SENTRY_DSN` est défini.
 * Chargé paresseusement pour ne rien coûter aux utilisateurs quand l'observabilité est désactivée.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: 0.05,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      sendDefaultPii: false,
    });
  });
}

export const onRouterTransitionStart = async (href: string, navigationType: string) => {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRouterTransitionStart(href, navigationType);
};
