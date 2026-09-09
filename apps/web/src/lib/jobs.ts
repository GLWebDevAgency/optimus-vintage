import { getContainer } from "@/lib/container";
import { describeError, log } from "@/lib/log";

/**
 * Tâches de fond du processus web (une instance Railway = un planificateur suffit) :
 * relais de l'outbox d'événements, purge des limites de débit, des clés d'idempotence et des
 * événements Stripe traités. Démarré par `instrumentation.ts` (runtime Node uniquement).
 */
const INTERVAL_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const GLOBAL_KEY = Symbol.for("chine.web.jobs");
type Store = { [GLOBAL_KEY]?: NodeJS.Timeout };

async function tick(): Promise<void> {
  const deps = await getContainer();
  const now = Date.now();
  // Les événements de domaine n'ont pas encore de consommateur externe : ils sont journalisés
  // (niveau debug) puis marqués publiés, ce qui borne la table.
  const relay = await deps.outboxRelay.relayPending(async (event) => {
    log.debug("événement de domaine", { type: event.type, workspaceId: event.workspaceId });
  });
  const [rateLimits, idempotency, stripeEvents] = await Promise.all([
    deps.rateLimiter.purgeExpired(),
    deps.idempotency.purge(new Date(now - DAY_MS)),
    deps.stripe ? deps.stripe.purgeEvents(new Date(now - 30 * DAY_MS)) : Promise.resolve(0),
  ]);
  if (relay.processed || rateLimits || idempotency || stripeEvents) {
    log.info("tâches de fond", {
      relayed: relay.published,
      relayFailed: relay.failed,
      rateLimits,
      idempotency,
      stripeEvents,
    });
  }
}

/** Idempotent : un seul planificateur par processus, premier passage 30 s après le démarrage. */
export function startBackgroundJobs(): void {
  const store = globalThis as unknown as Store;
  if (store[GLOBAL_KEY]) return;
  const run = () => {
    tick().catch((e: unknown) => log.warn("tâche de fond en échec", describeError(e)));
  };
  const first = setTimeout(run, 30_000);
  first.unref();
  const timer = setInterval(run, INTERVAL_MS);
  timer.unref();
  store[GLOBAL_KEY] = timer;
}
