/** Identifiants typés (branded) : impossible de passer un ItemId là où un SaleId est attendu. */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type UserId = Brand<string, "UserId">;
export type SourceId = Brand<string, "SourceId">;
export type ItemId = Brand<string, "ItemId">;
export type ListingId = Brand<string, "ListingId">;
export type SaleId = Brand<string, "SaleId">;
export type PhotoId = Brand<string, "PhotoId">;
export type AppraisalId = Brand<string, "AppraisalId">;

export const asWorkspaceId = (s: string): WorkspaceId => s as WorkspaceId;
export const asUserId = (s: string): UserId => s as UserId;
export const asSourceId = (s: string): SourceId => s as SourceId;
export const asItemId = (s: string): ItemId => s as ItemId;
export const asListingId = (s: string): ListingId => s as ListingId;
export const asSaleId = (s: string): SaleId => s as SaleId;
export const asPhotoId = (s: string): PhotoId => s as PhotoId;
export const asAppraisalId = (s: string): AppraisalId => s as AppraisalId;
