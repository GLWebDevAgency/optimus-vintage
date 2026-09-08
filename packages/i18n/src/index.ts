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
} from "./format.js";
export { interpolate } from "./interpolate.js";
export { de } from "./messages/de.js";
export { en } from "./messages/en.js";
export { fr } from "./messages/fr.js";
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
} from "./t.js";
export type {
  DeepPartial,
  DeepString,
  Locale,
  MessageKey,
  Messages,
  Params,
  ParamValue,
} from "./types.js";
export { DEFAULT_LOCALE, LOCALES } from "./types.js";
