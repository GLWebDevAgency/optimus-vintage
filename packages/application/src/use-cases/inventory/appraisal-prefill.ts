import type { Appraisal, Category, Condition, Currency, Era, Money } from "@chine/domain";

/** Ce qu'une expertise IA permet de préremplir sur une pièce. */
export interface ItemPrefill {
  readonly title?: string;
  readonly brand?: string;
  readonly category?: Category;
  readonly condition?: Condition;
  readonly era?: Era;
  readonly size?: string;
  readonly colors?: readonly string[];
  readonly materials?: readonly string[];
  readonly retailPrice?: Money;
  readonly targetPrice?: Money;
}

const sameCurrency = (m: Money | null, currency: Currency): Money | undefined =>
  m && m.currency === currency ? m : undefined;

export function prefillFromAppraisal(a: Appraisal, currency: Currency): ItemPrefill {
  const id = a.identification;
  const brand = id.brand ?? undefined;
  const title =
    a.listingCopy?.title ?? ([brand, id.model].filter(Boolean).join(" ").trim() || undefined);
  const retailPrice = sameCurrency(a.price.retailNew, currency);
  const targetPrice = sameCurrency(a.price.mid, currency);
  return {
    ...(title ? { title } : {}),
    ...(brand ? { brand } : {}),
    category: id.category,
    condition: id.condition,
    era: id.era,
    ...(id.size ? { size: id.size } : {}),
    colors: id.colors,
    materials: id.materials,
    ...(retailPrice ? { retailPrice } : {}),
    ...(targetPrice ? { targetPrice } : {}),
  };
}
