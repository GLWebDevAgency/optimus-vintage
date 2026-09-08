// @chine/i18n — messages FR/EN/DE, t() typé, formatage Intl. Zéro dépendance.

export {
  currencySymbol,
  type DateStyle,
  daysBetween,
  formatDate,
  formatMoney,
  formatMoneyParts,
  formatNumber,
  formatPercent,
  formatRelative,
  formatUnit,
  type MoneyFormatOptions,
  type MoneyLike,
  type MoneyParts,
  minorUnits,
  type PercentOptions,
  toAmount,
  toMinor,
} from "./format";
export { interpolate } from "./interpolate";
export { de } from "./messages/de";
export { en } from "./messages/en";
export { fr } from "./messages/fr";
export {
  createT,
  flattenKeys,
  getMessages,
  hasKey,
  intlLocale,
  isLocale,
  resolveLocale,
  type TFunction,
  translate,
} from "./t";
export type {
  DeepPartial,
  DeepString,
  Locale,
  MessageKey,
  Messages,
  Params,
  ParamValue,
} from "./types";
export { DEFAULT_LOCALE, LOCALES } from "./types";
