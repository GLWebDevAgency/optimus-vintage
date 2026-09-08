/**
 * Journal structuré minimal (une ligne JSON par entrée), sans dépendance.
 * Niveaux : debug < info < warn < error < silent. `LOG_LEVEL` pilote le seuil ;
 * défaut `info` (et `silent` en test pour garder la sortie des tests propre).
 *
 * Règle : on ne journalise jamais un corps de requête, un cookie, un jeton ni un secret.
 * Les champs passés ici sont des identifiants, des chemins, des statuts et des durées.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
const ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

export type LogFields = Readonly<Record<string, string | number | boolean | null | undefined>>;

/** Clés que l'on refuse de journaliser même par erreur. */
const FORBIDDEN_KEYS = /(secret|password|token|cookie|authorization|apikey|api_key)/i;

function resolveLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw && raw in ORDER) return raw as LogLevel;
  return process.env.NODE_ENV === "test" ? "silent" : "info";
}

let threshold = resolveLevel();

/** Change le seuil à chaud (tests, diagnostics). */
export function setLogLevel(level: LogLevel): void {
  threshold = level;
}

function write(level: Exclude<LogLevel, "silent">, msg: string, fields: LogFields): void {
  if (ORDER[level] < ORDER[threshold]) return;
  const entry: Record<string, unknown> = { level, time: new Date().toISOString(), msg };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || FORBIDDEN_KEYS.test(key)) continue;
    entry[key] = value;
  }
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Logger dérivé qui ajoute des champs à chaque entrée (requestId, route…). */
  child(bound: LogFields): Logger;
}

function createLogger(bound: LogFields = {}): Logger {
  const merge = (fields?: LogFields): LogFields => ({ ...bound, ...(fields ?? {}) });
  return {
    debug: (msg, fields) => write("debug", msg, merge(fields)),
    info: (msg, fields) => write("info", msg, merge(fields)),
    warn: (msg, fields) => write("warn", msg, merge(fields)),
    error: (msg, fields) => write("error", msg, merge(fields)),
    child: (more) => createLogger(merge(more)),
  };
}

export const log: Logger = createLogger();

/** Résumé sûr d'une exception (nom + message, jamais la stack en production). */
export function describeError(e: unknown): LogFields {
  if (e instanceof Error) {
    return {
      errorName: e.name,
      errorMessage: e.message,
      ...(process.env.NODE_ENV !== "production" && e.stack ? { stack: e.stack } : {}),
    };
  }
  return { errorMessage: String(e) };
}

const seen = new Set<string>();
/** Journalise un message une seule fois par processus (avertissements de configuration). */
export function warnOnce(key: string, msg: string, fields?: LogFields): void {
  if (seen.has(key)) return;
  seen.add(key);
  log.warn(msg, fields);
}
