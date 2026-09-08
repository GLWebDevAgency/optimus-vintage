/** Briques communes du contrat : argent, dates, pagination, enveloppes. */
import { z } from "zod";
import { CurrencyDto } from "./enums";

/** Montant en unités mineures entières (2000 = 20,00 €). Jamais de flottant. */
export const MoneyDto = z.object({
  minor: z.number().int().safe(),
  currency: CurrencyDto,
});
export type MoneyDto = z.infer<typeof MoneyDto>;

/** Montant strictement positif (prix de vente, prix affiché). */
export const PositiveMoneyDto = MoneyDto.refine((m) => m.minor > 0, {
  message: "Le montant doit être strictement positif",
});
/** Montant nul ou positif (coûts, frais). */
export const NonNegativeMoneyDto = MoneyDto.refine((m) => m.minor >= 0, {
  message: "Le montant ne peut pas être négatif",
});

/** Date calendaire `YYYY-MM-DD` (achat, vente). */
export const IsoDateDto = z.iso.date();
export type IsoDateDto = z.infer<typeof IsoDateDto>;

/** Horodatage ISO 8601 complet (créé le, mis à jour le). */
export const IsoDateTimeDto = z.iso.datetime({ offset: true });
export type IsoDateTimeDto = z.infer<typeof IsoDateTimeDto>;

/** Identifiant opaque (UUID ou ULID selon l'infrastructure). */
export const IdDto = z.string().min(1).max(64);

export const PAGE_LIMIT_MAX = 100;
export const PAGE_LIMIT_DEFAULT = 30;

/** Booléen tolérant aux query strings (`"true"` / `"1"` / `"false"` / `"0"`). */
export const QueryBooleanDto = z.preprocess((v) => {
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0 || v === "") return false;
  return v;
}, z.boolean());

/** Liste tolérante : `a,b` ou `?k=a&k=b` ou tableau JSON. */
export const queryList = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (Array.isArray(v)) return v.flatMap((x) => (typeof x === "string" ? x.split(",") : [x]));
    if (typeof v === "string") return v.split(",").filter(Boolean);
    return v;
  }, z.array(item));

export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
  offset: z.coerce.number().int().min(0).default(0),
});
export type PaginationQuery = z.input<typeof PaginationQuery>;

/** Enveloppe d'erreur : `{ error: { code, message, details? } }`. */
export const ApiError = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

/** Enveloppe de succès : `{ data: T }`. */
export const ok = <T extends z.ZodType>(data: T) => z.object({ data });
export type Ok<T> = { data: T };

/** Page de résultats, à l'intérieur de l'enveloppe `data`. */
export const PageOf = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
  });
export type PageOf<T> = { items: T[]; total: number; limit: number; offset: number };

export const DeletedDto = z.object({ id: IdDto, deleted: z.literal(true) });
export type DeletedDto = z.infer<typeof DeletedDto>;

export const GeoPointDto = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPointDto = z.infer<typeof GeoPointDto>;

export const LocationDto = z.object({
  label: z.string().trim().min(1).max(160),
  point: GeoPointDto.optional(),
});
export type LocationDto = z.infer<typeof LocationDto>;

/** Grille de frais d'une plateforme (surcharge par espace de travail). */
export const FeeScheduleDto = z.object({
  percent: z.number().min(0).max(100),
  fixedMinor: z.number().int().min(0),
  minMinor: z.number().int().min(0).optional(),
  note: z.string().max(200).optional(),
});
export type FeeScheduleDto = z.infer<typeof FeeScheduleDto>;

export const TargetMarginDto = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PERCENT"), value: z.number().min(0).max(1000) }),
  z.object({ kind: z.literal("AMOUNT_MINOR"), value: z.number().int().min(0) }),
]);
export type TargetMarginDto = z.infer<typeof TargetMarginDto>;

export const MeasurementsDto = z.object({
  chestCm: z.number().min(0).max(300).optional(),
  lengthCm: z.number().min(0).max(300).optional(),
  shoulderCm: z.number().min(0).max(300).optional(),
  sleeveCm: z.number().min(0).max(300).optional(),
  waistCm: z.number().min(0).max(300).optional(),
  inseamCm: z.number().min(0).max(300).optional(),
});
export type MeasurementsDto = z.infer<typeof MeasurementsDto>;
