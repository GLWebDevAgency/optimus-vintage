import type { Sale } from "@chine/domain";
import { asWorkspaceId, hasFeature, toIsoDate } from "@chine/domain";
import { z } from "zod";
import { ApiFailure, fail, notFound } from "@/lib/api/respond";
import { parseQuery } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { type CsvCell, csvResponse, decimal, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const ALL = Number.POSITIVE_INFINITY;
const ENTITIES = ["items", "sales", "sources", "comptabilite"] as const;
type Entity = (typeof ENTITIES)[number];

const Query = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { path: ["to"] });

const parseEntity = (raw: string): Entity | undefined => {
  const name = raw.replace(/\.csv$/i, "");
  return (ENTITIES as readonly string[]).includes(name) ? (name as Entity) : undefined;
};

const saleRow = (
  s: Sale,
  item: { sku: string; title: string; brand?: string } | undefined,
): CsvCell[] => {
  const e = s.economics;
  return [
    s.soldAt,
    item?.sku ?? "",
    item?.title ?? "",
    item?.brand ?? "",
    s.platform,
    s.status,
    decimal(s.grossPrice.minor),
    decimal(s.platformFees.minor),
    decimal(s.shippingCost.minor),
    decimal(s.packagingCost.minor),
    decimal(s.otherCosts.minor),
    decimal(e.net.minor),
    decimal(s.acquisitionCost.minor),
    decimal(e.margin.minor),
    e.marginRate === undefined ? "" : (e.marginRate * 100).toFixed(1).replace(".", ","),
    s.buyer ?? "",
    s.grossPrice.currency,
  ];
};
const SALE_HEADERS = [
  "Date",
  "SKU",
  "Désignation",
  "Marque",
  "Plateforme",
  "Statut",
  "Prix de vente",
  "Frais plateforme",
  "Port",
  "Emballage",
  "Autres frais",
  "Net encaissé",
  "Coût d'achat",
  "Marge nette",
  "Taux de marge %",
  "Acheteur",
  "Devise",
];

/**
 * Exports CSV : pièces, ventes, sources (toutes formules) et journal comptable (formule Pro).
 * Format tableur France (`;`, BOM, virgule décimale). Les bornes `from`/`to` filtrent les ventes.
 */
export const GET = withAuth<{ entity: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const entity = parseEntity(ctx.params.entity);
    if (!entity) return fail(notFound("Export"));
    const query = parseQuery(req, Query);
    const workspaceId = asWorkspaceId(ctx.workspaceId);
    const workspace = await deps.workspaces.byId(workspaceId);
    if (!workspace) return fail(notFound("Workspace"));
    const stamp = toIsoDate(deps.clock.now());
    const range = { from: query.from as never, to: query.to as never };

    if (entity === "items") {
      const items = await deps.items.list(workspaceId, { limit: ALL });
      const sources = new Map<string, string>();
      for (const s of await deps.sources.list(workspaceId, { limit: ALL }))
        sources.set(s.id, s.name);
      const rows = items.map((i): CsvCell[] => {
        const p = i.toProps();
        return [
          i.sku,
          i.title,
          i.brand ?? "",
          i.category,
          p.size ?? "",
          i.condition,
          i.status,
          decimal(i.acquisitionCost.minor),
          i.targetPrice ? decimal(i.targetPrice.minor) : "",
          i.retailPrice ? decimal(i.retailPrice.minor) : "",
          sources.get(i.sourceId) ?? "",
          p.bin ?? "",
          toIsoDate(i.createdAt),
          i.acquisitionCost.currency,
        ];
      });
      return csvResponse(
        `chine-pieces-${stamp}.csv`,
        toCsv(
          [
            "SKU",
            "Titre",
            "Marque",
            "Catégorie",
            "Taille",
            "État",
            "Statut",
            "Coût d'achat",
            "Prix cible",
            "Prix neuf",
            "Source",
            "Emplacement",
            "Créée le",
            "Devise",
          ],
          rows,
        ),
      );
    }

    if (entity === "sources") {
      const sources = await deps.sources.list(workspaceId, { limit: ALL });
      const rows = sources.map((s): CsvCell[] => [
        s.purchasedAt,
        s.name,
        s.kind,
        s.supplierKind,
        s.supplierName ?? "",
        decimal(s.goodsCost.minor),
        decimal(s.extraCosts.minor),
        decimal(s.totalInvestment.minor),
        s.announcedQuantity ?? "",
        s.receivedQuantity ?? "",
        s.location?.label ?? "",
        s.goodsCost.currency,
      ]);
      return csvResponse(
        `chine-sources-${stamp}.csv`,
        toCsv(
          [
            "Date",
            "Nom",
            "Type",
            "Fournisseur",
            "Nom du fournisseur",
            "Marchandise",
            "Frais annexes",
            "Investissement",
            "Quantité annoncée",
            "Quantité reçue",
            "Lieu",
            "Devise",
          ],
          rows,
        ),
      );
    }

    if (entity === "comptabilite" && !hasFeature(workspace.plan, "ACCOUNTING_EXPORT")) {
      return fail(
        new ApiFailure("FEATURE_LOCKED", "L'export comptable est réservé à la formule Pro.", {
          feature: "ACCOUNTING_EXPORT",
          minimumPlan: "PRO",
        }),
      );
    }

    const sales = await deps.sales.list(workspaceId, { ...range, limit: ALL });
    const itemsById = new Map<string, { sku: string; title: string; brand?: string }>();
    for (const s of sales) {
      if (itemsById.has(s.itemId)) continue;
      const item = await deps.items.byId(workspaceId, s.itemId);
      if (item)
        itemsById.set(s.itemId, {
          sku: item.sku,
          title: item.title,
          ...(item.brand ? { brand: item.brand } : {}),
        });
    }
    const ordered = [...sales].sort((a, b) => (a.soldAt < b.soldAt ? -1 : 1));
    const rows = ordered.map((s) => saleRow(s, itemsById.get(s.itemId)));
    if (entity === "sales") {
      return csvResponse(`chine-ventes-${stamp}.csv`, toCsv(SALE_HEADERS, rows));
    }

    // Journal comptable : ventes encaissées puis totaux mensuels (chiffre d'affaires à déclarer
    // en micro-entreprise = montant encaissé, frais compris ; les frais restent informatifs).
    const cashed = ordered.filter((s) => s.status === "COMPLETED");
    const months = new Map<string, { gross: number; fees: number; net: number; count: number }>();
    for (const s of cashed) {
      const key = s.soldAt.slice(0, 7);
      const cur = months.get(key) ?? { gross: 0, fees: 0, net: 0, count: 0 };
      months.set(key, {
        gross: cur.gross + s.grossPrice.minor,
        fees: cur.fees + s.platformFees.minor,
        net: cur.net + s.economics.net.minor,
        count: cur.count + 1,
      });
    }
    const summary: CsvCell[][] = [
      [],
      [
        "Mois",
        "Ventes encaissées",
        "Chiffre d'affaires (encaissé)",
        "Frais de plateforme",
        "Net après frais",
      ],
      ...[...months.entries()].map(([m, v]): CsvCell[] => [
        m,
        v.count,
        decimal(v.gross),
        decimal(v.fees),
        decimal(v.net),
      ]),
    ];
    const body =
      toCsv(
        SALE_HEADERS,
        cashed.map((s) => saleRow(s, itemsById.get(s.itemId))),
      ) +
      summary
        .map((r) => r.map((c) => (c === undefined || c === null ? "" : String(c))).join(";"))
        .join("\r\n") +
      "\r\n";
    return csvResponse(`chine-comptabilite-${stamp}.csv`, body);
  },
  { limit: { key: "export:csv", max: 20, windowSeconds: 3600 } },
);
