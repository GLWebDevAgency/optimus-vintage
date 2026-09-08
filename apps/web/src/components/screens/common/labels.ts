import type {
  Category,
  Condition,
  DashboardPeriod,
  Era,
  Gender,
  ItemStatus,
  Platform,
  SaleStatus,
  SourceKind,
  SupplierKind,
} from "@chine/contract";
import type { MessageKey, TFunction } from "@chine/i18n";
import type { PillStatus } from "@chine/ui";
import { pillStatusOf } from "@chine/ui";

/** Libellés traduits des énumérations du contrat. */
export const label = {
  platform: (t: TFunction, p: Platform) => t(`sales.platformLabel.${p}` as MessageKey),
  category: (t: TFunction, c: Category) => t(`items.categoryLabel.${c}` as MessageKey),
  condition: (t: TFunction, c: Condition) => t(`items.conditionLabel.${c}` as MessageKey),
  era: (t: TFunction, e: Era) => t(`items.eraLabel.${e}` as MessageKey),
  gender: (t: TFunction, g: Gender) => t(`items.genderLabel.${g}` as MessageKey),
  itemStatus: (t: TFunction, s: ItemStatus) => t(`items.status.${s}` as MessageKey),
  saleStatus: (t: TFunction, s: SaleStatus) => t(`sales.status.${s}` as MessageKey),
  sourceKind: (t: TFunction, k: SourceKind) => t(`sources.kindLabel.${k}` as MessageKey),
  sourceKindPlural: (t: TFunction, k: SourceKind) => t(`sources.kindPlural.${k}` as MessageKey),
  supplierKind: (t: TFunction, k: SupplierKind) =>
    t(`sources.supplierKindLabel.${k}` as MessageKey),
  supplierKindShort: (t: TFunction, k: SupplierKind) =>
    t(`sources.supplierKindShort.${k}` as MessageKey),
  period: (t: TFunction, p: DashboardPeriod) => t(`dashboard.period.${p}` as MessageKey),
  periodShort: (t: TFunction, p: DashboardPeriod) => t(`dashboard.periodShort.${p}` as MessageKey),
};

/** Pastille de statut d'une pièce, libellé traduit. */
export function itemPill(
  t: TFunction,
  status: ItemStatus,
  dormant = false,
): { status: PillStatus; label: string } {
  const pill = pillStatusOf(status, dormant);
  return {
    status: pill,
    label: pill === "dormant" ? t("dashboard.dormant") : label.itemStatus(t, status),
  };
}

export const salePill = (status: SaleStatus): PillStatus =>
  status === "COMPLETED"
    ? "sold"
    : status === "PENDING"
      ? "pending"
      : status === "REFUNDED"
        ? "returned"
        : "lost";

/** Plateformes proposées en premier (les plus courantes en France). */
export const MAIN_PLATFORMS: readonly Platform[] = [
  "VINTED",
  "LEBONCOIN",
  "VESTIAIRE",
  "DEPOP",
  "EBAY",
  "ETSY",
  "WHATNOT",
  "INSTAGRAM",
  "IN_PERSON",
  "OTHER",
];

/** Lieux d'achat proposés dans l'écran Chiner, dans l'ordre du geste. */
export const CAPTURE_SUPPLIER_KINDS: readonly SupplierKind[] = [
  "FLEA_MARKET",
  "THRIFT_STORE",
  "WHOLESALER",
  "ONLINE_B2B",
  "PERSONAL",
  "AUCTION",
  "OTHER",
];

export const SIZE_PRESETS = ["XXS", "XS", "S", "M", "L", "XL", "XXL"] as const;

/** `YYYY-MM-DD` local. */
export function isoDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Bornes `from` / `to` d'une période du tableau de bord (calendrier local). */
export function periodRange(period: DashboardPeriod, now = new Date()): { from?: string; to: string } {
  const to = isoDay(now);
  const d = new Date(now);
  switch (period) {
    case "7d":
      d.setDate(d.getDate() - 6);
      return { from: isoDay(d), to };
    case "30d":
      d.setDate(d.getDate() - 29);
      return { from: isoDay(d), to };
    case "month":
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    case "3m":
      d.setMonth(d.getMonth() - 3);
      return { from: isoDay(d), to };
    case "year":
      return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to };
    default:
      return { to };
  }
}

/** Texte lisible d'une période : « septembre », « 30 jours », « 2026 ». */
export function periodLabel(t: TFunction, period: DashboardPeriod, intl: string, now = new Date()) {
  if (period === "month") return new Intl.DateTimeFormat(intl, { month: "long" }).format(now);
  if (period === "year") return String(now.getFullYear());
  return label.period(t, period).toLowerCase();
}

/** Nom court d'un fichier de photo (type MIME → extension). */
export const mimeExt = (mime: string) => (mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg");
