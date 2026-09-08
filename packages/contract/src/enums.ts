/**
 * Énumérations du contrat HTTP.
 * Copie volontaire des valeurs de `@chine/domain` : le contrat est consommé par le web ET
 * par l'app Expo, sans dépendre du build du domaine. Un test vérifie l'alignement.
 */
import { z } from "zod";

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY"] as const;
export const PLATFORMS = [
  "VINTED",
  "VESTIAIRE",
  "LEBONCOIN",
  "DEPOP",
  "EBAY",
  "ETSY",
  "WHATNOT",
  "INSTAGRAM",
  "IN_PERSON",
  "OTHER",
] as const;
export const ITEM_STATUSES = [
  "IN_STOCK",
  "LISTED",
  "RESERVED",
  "SOLD",
  "RETURNED",
  "LOST",
  "DONATED",
] as const;
export const CATEGORIES = [
  "JACKET",
  "COAT",
  "KNITWEAR",
  "SWEATSHIRT",
  "SHIRT",
  "TSHIRT",
  "POLO",
  "PANTS",
  "JEANS",
  "SHORTS",
  "DRESS",
  "SKIRT",
  "SUIT",
  "TRACKSUIT",
  "SHOES",
  "BOOTS",
  "SNEAKERS",
  "BAG",
  "HAT",
  "SCARF",
  "BELT",
  "JEWELRY",
  "ACCESSORY",
  "OTHER",
] as const;
export const CONDITIONS = [
  "NEW_WITH_TAGS",
  "NEW",
  "EXCELLENT",
  "VERY_GOOD",
  "GOOD",
  "FAIR",
  "POOR",
] as const;
export const GENDERS = ["WOMEN", "MEN", "UNISEX", "KIDS"] as const;
export const ERAS = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
  "UNKNOWN",
] as const;
export const SOURCE_KINDS = ["LOT", "PALLET", "PICKING", "UNIT"] as const;
export const SUPPLIER_KINDS = [
  "WHOLESALER",
  "ONLINE_B2B",
  "FLEA_MARKET",
  "THRIFT_STORE",
  "PERSONAL",
  "AUCTION",
  "OTHER",
] as const;
export const ALLOCATION_POLICIES = ["EVEN", "BY_WEIGHT", "MANUAL"] as const;
export const SALE_STATUSES = ["COMPLETED", "PENDING", "CANCELLED", "REFUNDED"] as const;
export const LISTING_STATUSES = ["ACTIVE", "ENDED", "SOLD"] as const;
export const PLANS = ["FREE", "PREMIUM", "PRO", "BUSINESS"] as const;
export const FEATURES = [
  "AI_APPRAISAL",
  "AI_LISTING_COPY",
  "ADVANCED_ANALYTICS",
  "PDF_REPORTS",
  "CSV_EXPORT",
  "ACCOUNTING_EXPORT",
  "QR_LABELS",
  "API_ACCESS",
  "MULTI_USER",
  "CUSTOM_BRANDING",
] as const;
export const MEMBER_ROLES = ["OWNER", "MANAGER", "SELLER"] as const;
export const LOCALES = ["fr", "en", "de"] as const;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DASHBOARD_PERIODS = ["7d", "30d", "month", "3m", "year", "all"] as const;
export const ITEM_SORTS = ["newest", "oldest", "cost_desc", "cost_asc", "title"] as const;

/** Codes d'erreur renvoyés par l'API (domaine + application + transport). */
export const API_ERROR_CODES = [
  "NOT_FOUND",
  "FORBIDDEN",
  "UNAUTHORIZED",
  "QUOTA_EXCEEDED",
  "FEATURE_LOCKED",
  "VALIDATION_FAILED",
  "INVALID_TRANSITION",
  "INVARIANT_VIOLATION",
  "CURRENCY_MISMATCH",
  "NEGATIVE_COST",
  "NEGATIVE_PRICE",
  "TITLE_REQUIRED",
  "NAME_REQUIRED",
  "QUANTITY_REQUIRED",
  "UNIT_QUANTITY",
  "NOT_RECEIVABLE",
  "INVALID_SKU",
  "INVALID_FEES",
  "PHOTO_LIMIT",
  "APPRAISAL_FAILED",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "CONFLICT",
  "NETWORK",
  "INTERNAL",
] as const;

export const CurrencyDto = z.enum(CURRENCIES);
export const PlatformDto = z.enum(PLATFORMS);
export const ItemStatusDto = z.enum(ITEM_STATUSES);
export const CategoryDto = z.enum(CATEGORIES);
export const ConditionDto = z.enum(CONDITIONS);
export const GenderDto = z.enum(GENDERS);
export const EraDto = z.enum(ERAS);
export const SourceKindDto = z.enum(SOURCE_KINDS);
export const SupplierKindDto = z.enum(SUPPLIER_KINDS);
export const AllocationPolicyDto = z.enum(ALLOCATION_POLICIES);
export const SaleStatusDto = z.enum(SALE_STATUSES);
export const ListingStatusDto = z.enum(LISTING_STATUSES);
export const PlanDto = z.enum(PLANS);
export const FeatureDto = z.enum(FEATURES);
export const MemberRoleDto = z.enum(MEMBER_ROLES);
export const LocaleDto = z.enum(LOCALES);
export const ImageMimeTypeDto = z.enum(IMAGE_MIME_TYPES);
export const DashboardPeriodDto = z.enum(DASHBOARD_PERIODS);
export const ItemSortDto = z.enum(ITEM_SORTS);
export const ApiErrorCodeDto = z.enum(API_ERROR_CODES);

export type Currency = z.infer<typeof CurrencyDto>;
export type Platform = z.infer<typeof PlatformDto>;
export type ItemStatus = z.infer<typeof ItemStatusDto>;
export type Category = z.infer<typeof CategoryDto>;
export type Condition = z.infer<typeof ConditionDto>;
export type Gender = z.infer<typeof GenderDto>;
export type Era = z.infer<typeof EraDto>;
export type SourceKind = z.infer<typeof SourceKindDto>;
export type SupplierKind = z.infer<typeof SupplierKindDto>;
export type AllocationPolicy = z.infer<typeof AllocationPolicyDto>;
export type SaleStatus = z.infer<typeof SaleStatusDto>;
export type ListingStatus = z.infer<typeof ListingStatusDto>;
export type Plan = z.infer<typeof PlanDto>;
export type Feature = z.infer<typeof FeatureDto>;
export type MemberRole = z.infer<typeof MemberRoleDto>;
export type Locale = z.infer<typeof LocaleDto>;
export type ImageMimeType = z.infer<typeof ImageMimeTypeDto>;
export type DashboardPeriod = z.infer<typeof DashboardPeriodDto>;
export type ItemSort = z.infer<typeof ItemSortDto>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeDto>;
