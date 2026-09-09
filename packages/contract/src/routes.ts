/**
 * Table de routes typée de `/api/v1`. Source unique pour le serveur (validation) et le client.
 * Chaque route porte sa méthode, son chemin (`:param`), et ses schémas query / body / response.
 */
import type { z } from "zod";
import {
  AddItemPhotoCommand,
  AppraiseImageCommand,
  CancelSaleCommand,
  ChangeItemStatusCommand,
  CompleteSaleCommand,
  CreateItemCommand,
  CreatePurchaseSourceCommand,
  DeleteAccountCommand,
  GeneratePiecesCommand,
  OpenBillingPortalCommand,
  PrepareUploadCommand,
  ReceivePurchaseSourceCommand,
  RecordSaleCommand,
  RefundSaleCommand,
  ReorderItemPhotosCommand,
  StartCheckoutCommand,
  UpdateItemCommand,
  UpdatePurchaseSourceCommand,
  UpdateSaleCommand,
  UpdateWorkspaceSettingsCommand,
} from "./commands";
import { DeletedDto, PageOf } from "./common";
import {
  AccountDeletedDto,
  AppraisalDto,
  DashboardDto,
  ItemDto,
  RedirectDto,
  SaleDto,
  SourceDto,
  UploadTargetDto,
  WorkspaceExportDto,
  WorkspaceOverviewDto,
} from "./dtos";
import { DashboardQuery, ListItemsQuery, ListSalesQuery, ListSourcesQuery } from "./queries";

export const API_PREFIX = "/api/v1";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RouteDef<
  M extends HttpMethod = HttpMethod,
  P extends string = string,
  Q extends z.ZodType | undefined = z.ZodType | undefined,
  B extends z.ZodType | undefined = z.ZodType | undefined,
  R extends z.ZodType = z.ZodType,
> {
  readonly method: M;
  readonly path: P;
  /** Schéma de la query string ; `undefined` si la route n'en a pas. */
  readonly query: Q;
  /** Schéma du corps ; `undefined` pour GET / DELETE. */
  readonly body: B;
  readonly response: R;
  /** Résumé humain (documentation, logs). */
  readonly summary: string;
}

const route = <
  M extends HttpMethod,
  P extends string,
  R extends z.ZodType,
  Q extends z.ZodType | undefined = undefined,
  B extends z.ZodType | undefined = undefined,
>(
  method: M,
  path: P,
  def: { summary: string; response: R; query?: Q; body?: B },
): RouteDef<M, P, Q, B, R> => ({
  method,
  path,
  summary: def.summary,
  response: def.response,
  query: def.query as Q,
  body: def.body as B,
});

export const routes = {
  /* Espace de travail */
  getWorkspaceOverview: route("GET", "/me", {
    summary: "Espace courant, utilisateur, quotas, facturation",
    response: WorkspaceOverviewDto,
  }),
  updateWorkspaceSettings: route("PATCH", "/workspace/settings", {
    summary: "Réglages de l'espace (devise, marge cible, grilles de frais)",
    body: UpdateWorkspaceSettingsCommand,
    response: WorkspaceOverviewDto,
  }),

  /* Tableau de bord */
  getDashboard: route("GET", "/dashboard", {
    summary: "Synthèse de la période : marge, objectif, dernières ventes",
    query: DashboardQuery,
    response: DashboardDto,
  }),

  /* Sources */
  listSources: route("GET", "/sources", {
    summary: "Sources d'achat avec performance",
    query: ListSourcesQuery,
    response: PageOf(SourceDto),
  }),
  createSource: route("POST", "/sources", {
    summary: "Créer une source (lot, palette, picking, unité)",
    body: CreatePurchaseSourceCommand,
    response: SourceDto,
  }),
  getSource: route("GET", "/sources/:id", { summary: "Détail d'une source", response: SourceDto }),
  updateSource: route("PATCH", "/sources/:id", {
    summary: "Modifier une source",
    body: UpdatePurchaseSourceCommand,
    response: SourceDto,
  }),
  deleteSource: route("DELETE", "/sources/:id", {
    summary: "Supprimer une source vide",
    response: DeletedDto,
  }),
  receiveSource: route("POST", "/sources/:id/receive", {
    summary: "Réceptionner un lot (quantité réellement reçue)",
    body: ReceivePurchaseSourceCommand,
    response: SourceDto,
  }),
  generatePieces: route("POST", "/sources/:id/pieces", {
    summary: "Générer N pièces à détailler depuis la source",
    body: GeneratePiecesCommand,
    response: PageOf(ItemDto),
  }),

  /* Pièces */
  listItems: route("GET", "/items", {
    summary: "Stock : filtres statut, source, recherche, dormant",
    query: ListItemsQuery,
    response: PageOf(ItemDto),
  }),
  createItem: route("POST", "/items", {
    summary: "Créer une pièce (fiche complète ou capture rapide)",
    body: CreateItemCommand,
    response: ItemDto,
  }),
  getItem: route("GET", "/items/:id", { summary: "Détail d'une pièce", response: ItemDto }),
  updateItem: route("PATCH", "/items/:id", {
    summary: "Modifier une pièce",
    body: UpdateItemCommand,
    response: ItemDto,
  }),
  deleteItem: route("DELETE", "/items/:id", {
    summary: "Supprimer une pièce",
    response: DeletedDto,
  }),
  changeItemStatus: route("POST", "/items/:id/status", {
    summary: "Mettre en ligne, retirer, réserver, remettre en stock, sortir",
    body: ChangeItemStatusCommand,
    response: ItemDto,
  }),
  addItemPhoto: route("POST", "/items/:id/photos", {
    summary: "Rattacher une photo téléversée à une pièce",
    body: AddItemPhotoCommand,
    response: ItemDto,
  }),
  removeItemPhoto: route("DELETE", "/items/:id/photos/:photoId", {
    summary: "Retirer une photo d'une pièce (et du stockage)",
    response: ItemDto,
  }),
  reorderItemPhotos: route("PUT", "/items/:id/photos/order", {
    summary: "Réordonner les photos d'une pièce",
    body: ReorderItemPhotosCommand,
    response: ItemDto,
  }),

  /* Ventes */
  listSales: route("GET", "/sales", {
    summary: "Ventes sur une période",
    query: ListSalesQuery,
    response: PageOf(SaleDto),
  }),
  recordSale: route("POST", "/sales", {
    summary: "Enregistrer une vente",
    body: RecordSaleCommand,
    response: SaleDto,
  }),
  getSale: route("GET", "/sales/:id", { summary: "Détail d'une vente", response: SaleDto }),
  updateSale: route("PATCH", "/sales/:id", {
    summary: "Corriger une vente",
    body: UpdateSaleCommand,
    response: SaleDto,
  }),
  cancelSale: route("POST", "/sales/:id/cancel", {
    summary: "Annuler une vente (pièce remise en stock)",
    body: CancelSaleCommand,
    response: SaleDto,
  }),
  completeSale: route("POST", "/sales/:id/complete", {
    summary: "Encaisser une vente en attente (pièce vendue, annonces clôturées)",
    body: CompleteSaleCommand,
    response: SaleDto,
  }),
  refundSale: route("POST", "/sales/:id/refund", {
    summary: "Rembourser une vente (pièce retournée)",
    body: RefundSaleCommand,
    response: SaleDto,
  }),

  /* Expertise IA */
  appraiseImage: route("POST", "/appraisals", {
    summary: "Expertiser une photo (identification, prix, conseil d'achat)",
    body: AppraiseImageCommand,
    response: AppraisalDto,
  }),
  getAppraisal: route("GET", "/appraisals/:id", {
    summary: "Relire une expertise",
    response: AppraisalDto,
  }),

  /* Uploads */
  prepareUpload: route("POST", "/uploads", {
    summary: "Obtenir une URL d'upload direct pour une photo",
    body: PrepareUploadCommand,
    response: UploadTargetDto,
  }),

  /* Facturation */
  startCheckout: route("POST", "/billing/checkout", {
    summary: "Démarrer un paiement Stripe",
    body: StartCheckoutCommand,
    response: RedirectDto,
  }),
  openBillingPortal: route("POST", "/billing/portal", {
    summary: "Ouvrir le portail de facturation",
    body: OpenBillingPortalCommand,
    response: RedirectDto,
  }),

  /* Compte (RGPD) */
  exportAccount: route("GET", "/account/export", {
    summary: "Exporter toutes les données de l'espace (JSON téléchargeable)",
    response: WorkspaceExportDto,
  }),
  deleteAccount: route("DELETE", "/account", {
    summary: "Supprimer définitivement le compte, l'espace, les photos et les sessions",
    body: DeleteAccountCommand,
    response: AccountDeletedDto,
  }),
} as const;

export type Routes = typeof routes;
export type RouteName = keyof Routes;

/** `"/items/:id/photos/:photoId"` → `{ id: string; photoId: string }`. */
export type PathParams<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof PathParams<Rest>]: string }
  : P extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : Record<never, never>;

/** Remplace les `:param` d'un chemin par leurs valeurs encodées. */
export function buildPath<P extends string>(path: P, params: PathParams<P>): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = (params as Record<string, string>)[name];
    if (value === undefined) throw new Error(`Paramètre de route manquant : ${name}`);
    return encodeURIComponent(value);
  });
}
