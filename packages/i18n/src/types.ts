import type { fr } from "./messages/fr";

export const LOCALES = ["fr", "en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Même forme que `fr`, feuilles élargies en `string`. */
export type DeepString<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};
export type DeepPartial<T> = {
  readonly [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]>;
};
export type Messages = DeepString<typeof fr>;

/** Chemins pointés vers les feuilles : `"nav.today"`, `"items.status.SOLD"`… */
export type MessageKey = Leaves<typeof fr>;
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type ParamValue = string | number | boolean | Date | null | undefined;
export type Params = Readonly<Record<string, ParamValue>>;
