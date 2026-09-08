"use client";

/**
 * Accès à l'API `/api/v1` : client typé de `@chine/contract` + hooks TanStack Query par route.
 * Lecture hors ligne d'abord (cache persisté) ; mutations différables via l'outbox quand le
 * réseau manque (capture rapide, changement de statut, vente).
 */
import {
  type ApiClient,
  ApiClientError,
  type AppraisalDto,
  type AppraiseImageCommand,
  type CancelSaleCommand,
  type ChangeItemStatusCommand,
  type CreatePurchaseSourceCommand,
  createApiClient,
  type DashboardDto,
  type DashboardPeriod,
  type GeneratePiecesCommand,
  type ImageMimeType,
  type ItemDto,
  type ItemSort,
  type ItemStatus,
  type ListingDto,
  type MoneyDto,
  type PageOf,
  type Platform,
  type RecordSaleCommand,
  type RefundSaleCommand,
  type SaleDto,
  type SourceDto,
  type SourceKind,
  type StartCheckoutCommand,
  type UpdateItemCommand,
  type UpdatePurchaseSourceCommand,
  type UpdateSaleCommand,
  type UpdateWorkspaceSettingsCommand,
  type WorkspaceOverviewDto,
} from "@chine/contract";
import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isOnline } from "@/lib/offline/network";
import { enqueue } from "@/lib/offline/outbox";
import {
  type PendingCaptureCommand,
  savePendingCapture,
  uploadPhoto,
} from "@/lib/offline/pending-photos";
import { computeSaleEconomics, effectiveSchedules } from "./economics";

/* ────────────────────────────── Client ────────────────────────────── */

export const api: ApiClient = createApiClient({
  baseUrl: "",
  fetch: (url, init) => fetch(url, { ...init, credentials: "same-origin" }),
});

/** Erreur de transport (pas de réseau, délai) : la mutation peut être différée. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof ApiClientError && (e.code === "NETWORK" || e.code === "TIMEOUT");
}

export function isApiError(e: unknown, code?: string): e is ApiClientError {
  return e instanceof ApiClientError && (code === undefined || e.code === code);
}

/* ────────────────────────────── Clés ────────────────────────────── */

export interface ItemsFilter {
  readonly status?: readonly ItemStatus[];
  readonly search?: string;
  readonly sort?: ItemSort;
  readonly sourceId?: string;
  readonly dormantOnly?: boolean;
}
export interface SalesFilter {
  readonly from?: string;
  readonly to?: string;
  readonly platform?: Platform;
  readonly sourceId?: string;
  readonly itemId?: string;
}
export interface SourcesFilter {
  readonly kind?: SourceKind;
  readonly search?: string;
  readonly amortized?: boolean;
}

export const keys = {
  workspace: ["workspace"] as const,
  dashboard: (period: DashboardPeriod) => ["dashboard", period] as const,
  dashboards: ["dashboard"] as const,
  items: (filter: ItemsFilter) => ["items", filter] as const,
  itemLists: ["items"] as const,
  item: (id: string) => ["item", id] as const,
  sources: (filter: SourcesFilter) => ["sources", filter] as const,
  sourceLists: ["sources"] as const,
  source: (id: string) => ["source", id] as const,
  sales: (filter: SalesFilter) => ["sales", filter] as const,
  saleLists: ["sales"] as const,
  sale: (id: string) => ["sale", id] as const,
  appraisal: (id: string) => ["appraisal", id] as const,
};

const PAGE = 50;

async function invalidate(qc: QueryClient, ...roots: readonly (readonly string[])[]) {
  await Promise.all(roots.map((k) => qc.invalidateQueries({ queryKey: k })));
}

/* ────────────────────────────── Lectures ────────────────────────────── */

export function useWorkspace() {
  return useQuery({
    queryKey: keys.workspace,
    queryFn: ({ signal }) => api.getWorkspaceOverview({ signal }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboard(period: DashboardPeriod) {
  return useQuery({
    queryKey: keys.dashboard(period),
    queryFn: ({ signal }) => api.getDashboard({ query: { period }, signal }),
  });
}

/** Stock paginé par 50 (« Charger plus »). */
export function useItems(filter: ItemsFilter, options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: keys.items(filter),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.listItems({
        query: {
          limit: PAGE,
          offset: pageParam,
          ...(filter.status && filter.status.length > 0 ? { status: [...filter.status] } : {}),
          ...(filter.search ? { search: filter.search } : {}),
          ...(filter.sort ? { sort: filter.sort } : {}),
          ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
          ...(filter.dormantOnly ? { dormantOnly: true } : {}),
        },
        signal,
      }),
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total ? last.offset + last.items.length : undefined,
    enabled: options.enabled ?? true,
  });
}

/** Cherche une pièce dans les listes déjà chargées (rendu immédiat de la fiche). */
export function findItemInCache(qc: QueryClient, id: string): ItemDto | undefined {
  for (const [, data] of qc.getQueriesData<{ pages: PageOf<ItemDto>[] }>({
    queryKey: keys.itemLists,
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((it) => it.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function useItem(id: string, options: { enabled?: boolean } = {}) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.item(id),
    queryFn: ({ signal }) => api.getItem({ params: { id }, signal }),
    placeholderData: () => findItemInCache(qc, id),
    enabled: options.enabled ?? Boolean(id),
  });
}

export function useSources(filter: SourcesFilter = {}) {
  return useInfiniteQuery({
    queryKey: keys.sources(filter),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.listSources({
        query: {
          limit: PAGE,
          offset: pageParam,
          ...(filter.kind ? { kind: filter.kind } : {}),
          ...(filter.search ? { search: filter.search } : {}),
          ...(filter.amortized !== undefined ? { amortized: filter.amortized } : {}),
        },
        signal,
      }),
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total ? last.offset + last.items.length : undefined,
  });
}

function findSourceInCache(qc: QueryClient, id: string): SourceDto | undefined {
  for (const [, data] of qc.getQueriesData<{ pages: PageOf<SourceDto>[] }>({
    queryKey: keys.sourceLists,
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((s) => s.id === id);
      if (hit) return hit;
    }
  }
  return undefined;
}

export function useSource(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.source(id),
    queryFn: ({ signal }) => api.getSource({ params: { id }, signal }),
    placeholderData: () => findSourceInCache(qc, id),
    enabled: Boolean(id),
  });
}

export function useSales(filter: SalesFilter = {}) {
  return useInfiniteQuery({
    queryKey: keys.sales(filter),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      api.listSales({
        query: {
          limit: PAGE,
          offset: pageParam,
          ...(filter.from ? { from: filter.from } : {}),
          ...(filter.to ? { to: filter.to } : {}),
          ...(filter.platform ? { platform: filter.platform } : {}),
          ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
          ...(filter.itemId ? { itemId: filter.itemId } : {}),
        },
        signal,
      }),
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total ? last.offset + last.items.length : undefined,
  });
}

function findSaleInCache(qc: QueryClient, id: string): SaleDto | undefined {
  for (const [, data] of qc.getQueriesData<{ pages: PageOf<SaleDto>[] }>({
    queryKey: keys.saleLists,
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.items.find((s) => s.id === id);
      if (hit) return hit;
    }
  }
  const dash = qc.getQueriesData<DashboardDto>({ queryKey: keys.dashboards });
  for (const [, d] of dash) {
    const hit = d?.lastSales.find((s) => s.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function useSale(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.sale(id),
    queryFn: ({ signal }) => api.getSale({ params: { id }, signal }),
    placeholderData: () => findSaleInCache(qc, id),
    enabled: Boolean(id),
  });
}

export function useAppraisal(id: string | undefined) {
  return useQuery({
    queryKey: keys.appraisal(id ?? ""),
    queryFn: ({ signal }) => api.getAppraisal({ params: { id: id ?? "" }, signal }),
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/* ────────────────────────────── Espace de travail ────────────────────────────── */

export function useUpdateWorkspaceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWorkspaceSettingsCommand) => api.updateWorkspaceSettings({ body }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: keys.workspace });
      const previous = qc.getQueryData<WorkspaceOverviewDto>(keys.workspace);
      if (previous) {
        const { feeOverrides, monthlyGoal, ...rest } = body;
        qc.setQueryData<WorkspaceOverviewDto>(keys.workspace, {
          ...previous,
          workspace: {
            ...previous.workspace,
            ...(rest.name !== undefined ? { name: rest.name } : {}),
            ...(rest.currency !== undefined ? { currency: rest.currency } : {}),
            ...(rest.locale !== undefined ? { locale: rest.locale } : {}),
            ...(rest.targetMargin !== undefined ? { targetMargin: rest.targetMargin } : {}),
            ...(rest.skuPrefix !== undefined ? { skuPrefix: rest.skuPrefix } : {}),
            ...(rest.dormantThresholdDays !== undefined
              ? { dormantThresholdDays: rest.dormantThresholdDays }
              : {}),
            ...(monthlyGoal !== undefined
              ? monthlyGoal === null
                ? { monthlyGoal: undefined }
                : { monthlyGoal }
              : {}),
          },
          ...(feeOverrides
            ? {
                feeOverrides: Object.fromEntries(
                  Object.entries({ ...previous.feeOverrides, ...feeOverrides }).filter(
                    ([, v]) => v !== null && v !== undefined,
                  ),
                ) as WorkspaceOverviewDto["feeOverrides"],
              }
            : {}),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.workspace, ctx.previous);
    },
    onSuccess: (data) => qc.setQueryData(keys.workspace, data),
    onSettled: () => invalidate(qc, keys.workspace, keys.dashboards),
  });
}

/* ────────────────────────────── Pièces ────────────────────────────── */

export type QuickCaptureInput = {
  readonly command: PendingCaptureCommand;
  readonly photo?: { readonly blob: Blob; readonly mimeType: ImageMimeType };
};
export type QuickCaptureResult =
  | { readonly kind: "created"; readonly item: ItemDto }
  | { readonly kind: "deferred"; readonly clientId: string };

/**
 * Capture rapide « Chiner » : upload de la photo puis `POST /items` ; hors ligne (ou réseau
 * perdu en route), la photo et la commande attendent dans IndexedDB et la pièce apparaît
 * tout de suite en stock avec la pastille « Sync plus tard ».
 */
export function useQuickCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuickCaptureInput): Promise<QuickCaptureResult> => {
      if (!isOnline()) {
        const clientId = await savePendingCapture(input);
        return { kind: "deferred", clientId };
      }
      try {
        const photoKeys: string[] = [];
        if (input.photo) {
          const { key } = await uploadPhoto(api, input.photo.blob, input.photo.mimeType);
          photoKeys.push(key);
        }
        const item = await api.createItem({ body: { ...input.command, photoKeys } });
        return { kind: "created", item };
      } catch (e) {
        if (!isNetworkError(e)) throw e;
        const clientId = await savePendingCapture(input);
        return { kind: "deferred", clientId };
      }
    },
    onSuccess: (result) => {
      if (result.kind === "created") qc.setQueryData(keys.item(result.item.id), result.item);
    },
    onSettled: () => invalidate(qc, keys.itemLists, keys.dashboards, keys.sourceLists),
  });
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateItemCommand) => api.updateItem({ params: { id }, body }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: keys.item(id) });
      const previous = qc.getQueryData<ItemDto>(keys.item(id));
      if (previous) {
        const { photoIds, addPhotoKeys, ...fields } = body;
        const optimistic: ItemDto = { ...previous };
        for (const [k, v] of Object.entries(fields)) {
          if (v === undefined) continue;
          (optimistic as Record<string, unknown>)[k] = v === null ? undefined : v;
        }
        if (photoIds) {
          const byId = new Map(previous.photos.map((p) => [p.id, p]));
          const photos = photoIds.flatMap((pid) => {
            const p = byId.get(pid);
            return p ? [p] : [];
          });
          optimistic.photos = photos;
          optimistic.photoUrls = photos.map((p) => p.url);
        }
        void addPhotoKeys;
        qc.setQueryData(keys.item(id), optimistic);
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.item(id), ctx.previous);
    },
    onSuccess: (item) => qc.setQueryData(keys.item(id), item),
    onSettled: () => invalidate(qc, keys.item(id), keys.itemLists, keys.dashboards),
  });
}

/** Ajoute une photo à une pièce : upload puis `POST /items/:id/photos`. */
export function useAddItemPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: {
      blob: Blob;
      mimeType: ImageMimeType;
      width?: number;
      height?: number;
    }) => {
      const { key } = await uploadPhoto(api, photo.blob, photo.mimeType);
      return api.addItemPhoto({
        params: { id },
        body: {
          key,
          ...(photo.width ? { width: photo.width } : {}),
          ...(photo.height ? { height: photo.height } : {}),
        },
      });
    },
    onSuccess: (item) => qc.setQueryData(keys.item(id), item),
    onSettled: () => invalidate(qc, keys.item(id), keys.itemLists),
  });
}

export function useRemoveItemPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => api.removeItemPhoto({ params: { id, photoId } }),
    onMutate: async (photoId) => {
      await qc.cancelQueries({ queryKey: keys.item(id) });
      const previous = qc.getQueryData<ItemDto>(keys.item(id));
      if (previous) {
        const photos = previous.photos.filter((p) => p.id !== photoId);
        qc.setQueryData<ItemDto>(keys.item(id), {
          ...previous,
          photos,
          photoUrls: photos.map((p) => p.url),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.item(id), ctx.previous);
    },
    onSuccess: (item) => qc.setQueryData(keys.item(id), item),
    onSettled: () => invalidate(qc, keys.item(id), keys.itemLists),
  });
}

export function useReorderItemPhotos(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoIds: string[]) =>
      api.reorderItemPhotos({ params: { id }, body: { photoIds } }),
    onMutate: async (photoIds) => {
      await qc.cancelQueries({ queryKey: keys.item(id) });
      const previous = qc.getQueryData<ItemDto>(keys.item(id));
      if (previous) {
        const byId = new Map(previous.photos.map((p) => [p.id, p]));
        const photos = photoIds.flatMap((pid) => {
          const p = byId.get(pid);
          return p ? [p] : [];
        });
        qc.setQueryData<ItemDto>(keys.item(id), {
          ...previous,
          photos,
          photoUrls: photos.map((p) => p.url),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.item(id), ctx.previous);
    },
    onSuccess: (item) => qc.setQueryData(keys.item(id), item),
    onSettled: () => invalidate(qc, keys.item(id), keys.itemLists),
  });
}

export function useDeleteItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteItem({ params: { id } }),
    onSuccess: () => qc.removeQueries({ queryKey: keys.item(id) }),
    onSettled: () => invalidate(qc, keys.itemLists, keys.dashboards, keys.sourceLists),
  });
}

export type ItemWithSync = ItemDto & { readonly pendingSync?: boolean };

function optimisticStatus(item: ItemDto, body: ChangeItemStatusCommand): ItemWithSync {
  const now = new Date().toISOString();
  switch (body.action) {
    case "list": {
      const listing: ListingDto = {
        id: `local-${crypto.randomUUID()}`,
        itemId: item.id,
        platform: body.platform,
        price: body.price as MoneyDto,
        listedAt: now.slice(0, 10),
        ...(body.url ? { url: body.url } : {}),
        status: "ACTIVE",
      };
      return {
        ...item,
        status: "LISTED",
        listedAt: now,
        activeListings: [listing],
        pendingSync: true,
      };
    }
    case "unlist":
      return { ...item, status: "IN_STOCK", activeListings: [], pendingSync: true };
    case "reserve":
      return { ...item, status: "RESERVED", pendingSync: true };
    case "restock":
      return { ...item, status: "IN_STOCK", activeListings: [], pendingSync: true };
    case "writeOff":
      return {
        ...item,
        status: body.reason === "LOST" ? "LOST" : "DONATED",
        activeListings: [],
        pendingSync: true,
      };
  }
}

/** Mettre en ligne, retirer, réserver, remettre en stock, sortir — différable hors ligne. */
export function useChangeItemStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ChangeItemStatusCommand): Promise<ItemWithSync> => {
      const current = qc.getQueryData<ItemDto>(keys.item(id)) ?? findItemInCache(qc, id);
      const defer = async () => {
        await enqueue({ method: "POST", path: `/items/${encodeURIComponent(id)}/status`, body });
        if (!current) throw new ApiClientError("NETWORK", "Hors ligne", 0);
        return optimisticStatus(current, body);
      };
      if (!isOnline()) return defer();
      try {
        return await api.changeItemStatus({ params: { id }, body });
      } catch (e) {
        if (isNetworkError(e)) return defer();
        throw e;
      }
    },
    onSuccess: (item) => qc.setQueryData(keys.item(id), item),
    onSettled: () => invalidate(qc, keys.item(id), keys.itemLists, keys.dashboards),
  });
}

/* ────────────────────────────── Ventes ────────────────────────────── */

export type RecordedSale = {
  readonly sale: SaleDto;
  /** Vente en attente de synchronisation (calculée localement). */
  readonly pending: boolean;
};

function localSale(
  body: RecordSaleCommand,
  item: ItemDto | undefined,
  overview: WorkspaceOverviewDto | undefined,
  id: string,
): SaleDto {
  const gross = body.grossPrice as MoneyDto;
  const cur = gross.currency;
  const zero: MoneyDto = { minor: 0, currency: cur };
  const acquisitionCost = item?.acquisitionCost ?? zero;
  const eco = computeSaleEconomics({
    platform: body.platform,
    gross,
    acquisitionCost,
    ...(body.shippingCost ? { shipping: body.shippingCost as MoneyDto } : {}),
    ...(body.packagingCost ? { packaging: body.packagingCost as MoneyDto } : {}),
    ...(body.otherCosts ? { other: body.otherCosts as MoneyDto } : {}),
    ...(body.platformFeesOverride ? { feesOverride: body.platformFeesOverride as MoneyDto } : {}),
    schedules: effectiveSchedules(overview?.feeSchedules ?? overview?.feeOverrides),
  });
  const now = new Date().toISOString();
  return {
    id,
    workspaceId: overview?.workspace.id ?? item?.workspaceId ?? "",
    itemId: body.itemId,
    sourceId: item?.sourceId ?? "",
    platform: body.platform,
    grossPrice: gross,
    platformFees: eco.fees,
    shippingCost: (body.shippingCost as MoneyDto | undefined) ?? zero,
    packagingCost: (body.packagingCost as MoneyDto | undefined) ?? zero,
    otherCosts: (body.otherCosts as MoneyDto | undefined) ?? zero,
    acquisitionCost,
    soldAt: body.soldAt,
    status: body.status ?? "COMPLETED",
    ...(body.buyer ? { buyer: body.buyer } : {}),
    ...(body.notes ? { notes: body.notes } : {}),
    createdAt: now,
    updatedAt: now,
    economics: eco,
    ...(item
      ? {
          item: {
            id: item.id,
            sku: item.sku,
            title: item.title,
            ...(item.brand ? { brand: item.brand } : {}),
            ...(item.photos[0]?.thumbnailUrl ?? item.photoUrls[0]
              ? { thumbnailUrl: item.photos[0]?.thumbnailUrl ?? item.photoUrls[0] }
              : {}),
            status: "SOLD",
          },
        }
      : {}),
  };
}

/** Enregistrer une vente — différable hors ligne (reçu calculé localement en attendant). */
export function useRecordSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RecordSaleCommand): Promise<RecordedSale> => {
      const item =
        qc.getQueryData<ItemDto>(keys.item(body.itemId)) ?? findItemInCache(qc, body.itemId);
      const overview = qc.getQueryData<WorkspaceOverviewDto>(keys.workspace);
      const defer = async () => {
        const id = await enqueue({ method: "POST", path: "/sales", body });
        const sale = localSale(body, item, overview, id);
        if (item) {
          qc.setQueryData<ItemWithSync>(keys.item(item.id), {
            ...item,
            status: "SOLD",
            soldAt: sale.createdAt,
            pendingSync: true,
          });
        }
        return { sale, pending: true };
      };
      if (!isOnline()) return defer();
      try {
        const sale = await api.recordSale({ body });
        return { sale, pending: false };
      } catch (e) {
        if (isNetworkError(e)) return defer();
        throw e;
      }
    },
    onSuccess: ({ sale, pending }) => {
      if (!pending) qc.setQueryData(keys.sale(sale.id), sale);
    },
    onSettled: (result) =>
      invalidate(
        qc,
        keys.saleLists,
        keys.itemLists,
        keys.dashboards,
        keys.sourceLists,
        ...(result ? [keys.item(result.sale.itemId), keys.source(result.sale.sourceId)] : []),
      ),
  });
}

export function useUpdateSale(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSaleCommand) => api.updateSale({ params: { id }, body }),
    onSuccess: (sale) => qc.setQueryData(keys.sale(id), sale),
    onSettled: () => invalidate(qc, keys.sale(id), keys.saleLists, keys.dashboards),
  });
}

export function useCancelSale(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CancelSaleCommand = {}) => api.cancelSale({ params: { id }, body }),
    onSuccess: (sale) => qc.setQueryData(keys.sale(id), sale),
    onSettled: (sale) =>
      invalidate(
        qc,
        keys.sale(id),
        keys.saleLists,
        keys.itemLists,
        keys.dashboards,
        keys.sourceLists,
        ...(sale ? [keys.item(sale.itemId)] : []),
      ),
  });
}

export function useRefundSale(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RefundSaleCommand = {}) => api.refundSale({ params: { id }, body }),
    onSuccess: (sale) => qc.setQueryData(keys.sale(id), sale),
    onSettled: (sale) =>
      invalidate(
        qc,
        keys.sale(id),
        keys.saleLists,
        keys.itemLists,
        keys.dashboards,
        keys.sourceLists,
        ...(sale ? [keys.item(sale.itemId)] : []),
      ),
  });
}

/* ────────────────────────────── Sources ────────────────────────────── */

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchaseSourceCommand) => api.createSource({ body }),
    onSuccess: (source) => qc.setQueryData(keys.source(source.id), source),
    onSettled: () => invalidate(qc, keys.sourceLists, keys.workspace),
  });
}

export function useUpdateSource(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePurchaseSourceCommand) => api.updateSource({ params: { id }, body }),
    onSuccess: (source) => qc.setQueryData(keys.source(id), source),
    onSettled: () => invalidate(qc, keys.source(id), keys.sourceLists, keys.itemLists),
  });
}

export function useDeleteSource(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteSource({ params: { id } }),
    onSuccess: () => qc.removeQueries({ queryKey: keys.source(id) }),
    onSettled: () => invalidate(qc, keys.sourceLists, keys.workspace),
  });
}

export function useReceiveSource(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receivedQuantity: number) =>
      api.receiveSource({ params: { id }, body: { receivedQuantity } }),
    onSuccess: (source) => qc.setQueryData(keys.source(id), source),
    onSettled: () => invalidate(qc, keys.source(id), keys.sourceLists, keys.itemLists),
  });
}

export function useGeneratePieces(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GeneratePiecesCommand) => api.generatePieces({ params: { id }, body }),
    onSettled: () =>
      invalidate(qc, keys.source(id), keys.sourceLists, keys.itemLists, keys.dashboards),
  });
}

/* ────────────────────────────── Expertise IA ────────────────────────────── */

export function useAppraise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AppraiseImageCommand) => api.appraiseImage({ body }),
    onSuccess: (a: AppraisalDto) => {
      qc.setQueryData(keys.appraisal(a.id), a);
      void invalidate(qc, keys.workspace);
    },
  });
}

/* ────────────────────────────── Facturation ────────────────────────────── */

export function useStartCheckout() {
  return useMutation({
    mutationFn: (body: StartCheckoutCommand) => api.startCheckout({ body }),
  });
}

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: (returnUrl: string) => api.openBillingPortal({ body: { returnUrl } }),
  });
}

/* ────────────────────────────── Compte (RGPD) ────────────────────────────── */

/** `GET /account/export` → fichier JSON téléchargeable. */
export async function fetchAccountExport(): Promise<Blob> {
  const data = await api.exportAccount();
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

/** `DELETE /account` avec le mot de confirmation exigé par le contrat. */
export async function deleteAccount(): Promise<void> {
  await api.deleteAccount({ body: { confirm: "SUPPRIMER" } });
}
