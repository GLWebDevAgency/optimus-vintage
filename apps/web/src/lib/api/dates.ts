import { type IsoDate, isIsoDate } from "@chine/domain";
import { validationFailed } from "./respond";

/**
 * Le contrat valide les dates calendaires avec `z.iso.date()` (chaînes) ; la couche application
 * attend le type nominal `IsoDate`. Ces aides font la jonction, avec un dernier garde-fou.
 */
export function isoDate(value: string, field = "date"): IsoDate {
  if (!isIsoDate(value)) throw validationFailed("Date invalide (AAAA-MM-JJ attendu).", { field });
  return value;
}

export const isoDateOpt = (value: string | undefined, field = "date"): IsoDate | undefined =>
  value === undefined ? undefined : isoDate(value, field);
