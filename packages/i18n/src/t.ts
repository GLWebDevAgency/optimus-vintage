/** Accès typé aux messages : `t("items.status.SOLD")`, `t("common.pieces", { count: 3 })`. */
import { interpolate } from "./interpolate.js";
import { de } from "./messages/de.js";
import { en } from "./messages/en.js";
import { fr } from "./messages/fr.js";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type MessageKey,
  type Messages,
  type Params,
} from "./types.js";

type Tree = { readonly [k: string]: string | Tree };

function deepMerge(base: Tree, patch: Tree | undefined): Tree {
  if (!patch) return base;
  const out: Record<string, string | Tree> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    const b = base[k];
    out[k] = typeof v === "string" || typeof b !== "object" ? v : deepMerge(b, v as Tree);
  }
  return out;
}

const catalog: Record<Locale, Messages> = {
  fr,
  en,
  de: deepMerge(fr as unknown as Tree, de as Tree) as unknown as Messages,
};

/** Messages complets d'une locale (le DE est complété par le FR). */
export const getMessages = (locale: Locale): Messages => catalog[locale];

export const isLocale = (s: unknown): s is Locale =>
  typeof s === "string" && (LOCALES as readonly string[]).includes(s);

/** `"fr-FR"`, `"en-GB,en;q=0.9"`, `navigator.language` → locale supportée. */
export function resolveLocale(input: string | readonly string[] | null | undefined): Locale {
  const candidates = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];
  for (const raw of candidates) {
    const tag = String(raw).split(";")[0]?.trim().toLowerCase() ?? "";
    const base = tag.split("-")[0] ?? "";
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export type TFunction = (key: MessageKey, params?: Params) => string;

/** Traduit une clé pour une locale, avec repli sur le français puis sur la clé. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const raw = lookup(catalog[locale], key) ?? lookup(fr, key) ?? key;
  return interpolate(raw, params, intlLocale(locale));
}

/** Fabrique un `t` lié à une locale (à mettre dans un contexte React côté app). */
export function createT(locale: Locale): TFunction {
  return (key, params) => translate(locale, key, params);
}

/** Vérifie qu'une clé existe (utile pour des clés construites dynamiquement). */
export const hasKey = (key: string): key is MessageKey => lookup(fr, key) !== undefined;

/** Locale BCP 47 utilisée par `Intl` pour une locale d'app. */
export const intlLocale = (locale: Locale): string =>
  ({ fr: "fr-FR", en: "en-GB", de: "de-DE" })[locale];

/** Liste plate des clés (tests, outillage). */
export function flattenKeys(tree: object, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : flattenKeys(v as object, `${prefix}${k}.`),
  );
}
