/** Commandes (corps de requête) : miroir des cas d'usage de la couche application. */
import { z } from "zod";
import {
  FeeScheduleDto,
  IdDto,
  IsoDateDto,
  LocationDto,
  MeasurementsDto,
  MoneyDto,
  NonNegativeMoneyDto,
  PositiveMoneyDto,
  TargetMarginDto,
} from "./common";
import {
  AllocationPolicyDto,
  CategoryDto,
  ConditionDto,
  CurrencyDto,
  EraDto,
  GenderDto,
  ImageMimeTypeDto,
  LocaleDto,
  PlatformDto,
  SourceKindDto,
  SupplierKindDto,
} from "./enums";

const Title = z.string().trim().min(1).max(140);
const ShortText = z.string().trim().max(120);
const Notes = z.string().max(2000);
const Tags = z.array(z.string().trim().min(1).max(40)).max(12);
const PhotoKeys = z.array(z.string().min(1).max(256)).max(8);

/* ───────────── Sources ───────────── */

export const CreatePurchaseSourceCommand = z
  .object({
    kind: SourceKindDto,
    name: Title,
    supplierName: ShortText.optional(),
    supplierKind: SupplierKindDto,
    purchasedAt: IsoDateDto,
    goodsCost: NonNegativeMoneyDto,
    extraCosts: NonNegativeMoneyDto.optional(),
    announcedQuantity: z.number().int().min(1).max(10_000).optional(),
    weightKg: z.number().positive().max(10_000).optional(),
    location: LocationDto.optional(),
    allocationPolicy: AllocationPolicyDto.optional(),
    notes: Notes.optional(),
  })
  .superRefine((c, ctx) => {
    if ((c.kind === "LOT" || c.kind === "PALLET") && !c.announcedQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["announcedQuantity"],
        message: "Un lot ou une palette doit annoncer une quantité",
      });
    }
    if (c.kind === "UNIT" && c.announcedQuantity !== undefined && c.announcedQuantity !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["announcedQuantity"],
        message: "Un achat unitaire porte une seule pièce",
      });
    }
    if (c.extraCosts && c.extraCosts.currency !== c.goodsCost.currency) {
      ctx.addIssue({ code: "custom", path: ["extraCosts"], message: "Devises différentes" });
    }
  });
export type CreatePurchaseSourceCommand = z.input<typeof CreatePurchaseSourceCommand>;

export const UpdatePurchaseSourceCommand = z.object({
  name: Title.optional(),
  supplierName: ShortText.nullable().optional(),
  supplierKind: SupplierKindDto.optional(),
  purchasedAt: IsoDateDto.optional(),
  goodsCost: NonNegativeMoneyDto.optional(),
  extraCosts: NonNegativeMoneyDto.optional(),
  announcedQuantity: z.number().int().min(1).max(10_000).nullable().optional(),
  weightKg: z.number().positive().max(10_000).nullable().optional(),
  location: LocationDto.nullable().optional(),
  allocationPolicy: AllocationPolicyDto.optional(),
  notes: Notes.nullable().optional(),
});
export type UpdatePurchaseSourceCommand = z.input<typeof UpdatePurchaseSourceCommand>;

export const ReceivePurchaseSourceCommand = z.object({
  receivedQuantity: z.number().int().min(0).max(10_000),
});
export type ReceivePurchaseSourceCommand = z.input<typeof ReceivePurchaseSourceCommand>;

/** Génère N pièces « à détailler » à partir d'une source (lot, palette). */
export const GeneratePiecesCommand = z
  .object({
    count: z.number().int().min(1).max(500),
    category: CategoryDto.optional(),
    condition: ConditionDto.optional(),
    titlePrefix: z.string().trim().min(1).max(60).optional(),
    /** Poids par pièce (kg) : requis quand la source alloue au poids. */
    weightsKg: z.array(z.number().positive()).max(500).optional(),
  })
  .refine((c) => !c.weightsKg || c.weightsKg.length === c.count, {
    path: ["weightsKg"],
    message: "Un poids par pièce",
  });
export type GeneratePiecesCommand = z.input<typeof GeneratePiecesCommand>;

/* ───────────── Pièces ───────────── */

const ItemFields = {
  title: Title,
  brand: ShortText.optional(),
  category: CategoryDto,
  gender: GenderDto.optional(),
  size: z.string().trim().max(24).optional(),
  condition: ConditionDto,
  era: EraDto.optional(),
  colors: Tags.optional(),
  materials: Tags.optional(),
  measurements: MeasurementsDto.optional(),
  retailPrice: PositiveMoneyDto.optional(),
  targetPrice: PositiveMoneyDto.optional(),
  bin: z.string().trim().max(24).optional(),
  notes: Notes.optional(),
  photoKeys: PhotoKeys.optional(),
  appraisalId: IdDto.optional(),
};

/** Création classique : depuis une source existante, fiche complète. */
export const CreateItemStandardCommand = z.object({
  mode: z.literal("standard"),
  sourceId: IdDto,
  /** Omis → coût alloué par la politique de la source. */
  acquisitionCost: NonNegativeMoneyDto.optional(),
  ...ItemFields,
});

/**
 * Capture rapide « Chiner » : une main, hors ligne. Le serveur crée (ou rattache) une
 * source unitaire au lieu détecté, puis la pièce avec le prix payé.
 */
export const CreateItemQuickCaptureCommand = z.object({
  mode: z.literal("quickCapture"),
  pricePaid: NonNegativeMoneyDto,
  supplierKind: SupplierKindDto,
  locationLabel: z.string().trim().max(160).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  photoKeys: PhotoKeys,
  appraisalId: IdDto.optional(),
  purchasedAt: IsoDateDto.optional(),
  /** Identifiant local (offline) pour rendre la création idempotente lors de la synchro. */
  clientId: z.string().min(1).max(64).optional(),
  title: Title.optional(),
  brand: ShortText.optional(),
  category: CategoryDto.optional(),
  condition: ConditionDto.optional(),
  size: z.string().trim().max(24).optional(),
  targetPrice: PositiveMoneyDto.optional(),
  retailPrice: PositiveMoneyDto.optional(),
  notes: Notes.optional(),
});

export const CreateItemCommand = z.discriminatedUnion("mode", [
  CreateItemStandardCommand,
  CreateItemQuickCaptureCommand,
]);
export type CreateItemCommand = z.input<typeof CreateItemCommand>;
export type CreateItemStandardCommand = z.input<typeof CreateItemStandardCommand>;
export type CreateItemQuickCaptureCommand = z.input<typeof CreateItemQuickCaptureCommand>;

export const UpdateItemCommand = z.object({
  title: Title.optional(),
  brand: ShortText.nullable().optional(),
  category: CategoryDto.optional(),
  gender: GenderDto.nullable().optional(),
  size: z.string().trim().max(24).nullable().optional(),
  condition: ConditionDto.optional(),
  era: EraDto.nullable().optional(),
  colors: Tags.optional(),
  materials: Tags.optional(),
  measurements: MeasurementsDto.nullable().optional(),
  acquisitionCost: NonNegativeMoneyDto.optional(),
  retailPrice: PositiveMoneyDto.nullable().optional(),
  targetPrice: PositiveMoneyDto.nullable().optional(),
  bin: z.string().trim().max(24).nullable().optional(),
  notes: Notes.nullable().optional(),
  /** Ordre final des photos (ids) ; les clés nouvelles sont ajoutées à la fin. */
  photoIds: z.array(IdDto).max(8).optional(),
  addPhotoKeys: PhotoKeys.optional(),
});
export type UpdateItemCommand = z.input<typeof UpdateItemCommand>;

export const ChangeItemStatusCommand = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list"),
    platform: PlatformDto,
    price: PositiveMoneyDto,
    url: z.url().optional(),
  }),
  z.object({ action: z.literal("unlist") }),
  z.object({ action: z.literal("reserve") }),
  z.object({ action: z.literal("restock") }),
  z.object({ action: z.literal("writeOff"), reason: z.enum(["LOST", "DONATED"]) }),
]);
export type ChangeItemStatusCommand = z.input<typeof ChangeItemStatusCommand>;

/* ───────────── Photos d'une pièce ───────────── */

/** Rattache une photo déjà téléversée (clé renvoyée par l'upload) à une pièce. */
export const AddItemPhotoCommand = z.object({
  key: z.string().min(1).max(256),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurhash: z.string().max(120).optional(),
});
export type AddItemPhotoCommand = z.input<typeof AddItemPhotoCommand>;

/** Ordre final des photos d'une pièce (toutes les photos, par identifiant). */
export const ReorderItemPhotosCommand = z.object({
  photoIds: z.array(IdDto).min(1).max(8),
});
export type ReorderItemPhotosCommand = z.input<typeof ReorderItemPhotosCommand>;

/* ───────────── Ventes ───────────── */

export const RecordSaleCommand = z
  .object({
    itemId: IdDto,
    platform: PlatformDto,
    grossPrice: NonNegativeMoneyDto,
    soldAt: IsoDateDto,
    shippingCost: NonNegativeMoneyDto.optional(),
    packagingCost: NonNegativeMoneyDto.optional(),
    otherCosts: NonNegativeMoneyDto.optional(),
    /** Frais plateforme saisis à la main ; sinon calculés par la grille. */
    platformFeesOverride: NonNegativeMoneyDto.optional(),
    status: z.enum(["COMPLETED", "PENDING"]).optional(),
    buyer: ShortText.optional(),
    notes: Notes.optional(),
  })
  .superRefine((c, ctx) => {
    const cur = c.grossPrice.currency;
    for (const k of [
      "shippingCost",
      "packagingCost",
      "otherCosts",
      "platformFeesOverride",
    ] as const) {
      const m = c[k];
      if (m && m.currency !== cur)
        ctx.addIssue({ code: "custom", path: [k], message: "Devise différente du prix" });
    }
  });
export type RecordSaleCommand = z.input<typeof RecordSaleCommand>;

export const UpdateSaleCommand = z.object({
  platform: PlatformDto.optional(),
  grossPrice: NonNegativeMoneyDto.optional(),
  platformFees: NonNegativeMoneyDto.optional(),
  shippingCost: NonNegativeMoneyDto.optional(),
  packagingCost: NonNegativeMoneyDto.optional(),
  otherCosts: NonNegativeMoneyDto.optional(),
  soldAt: IsoDateDto.optional(),
  buyer: ShortText.nullable().optional(),
  notes: Notes.nullable().optional(),
});
export type UpdateSaleCommand = z.input<typeof UpdateSaleCommand>;

/** Annulation avant expédition : la pièce revient en stock. */
export const CancelSaleCommand = z.object({ reason: ShortText.optional() });
export type CancelSaleCommand = z.input<typeof CancelSaleCommand>;

/** Remboursement après retour : la pièce passe en RETOURNÉE. */
export const RefundSaleCommand = z.object({
  reason: ShortText.optional(),
  /** Remettre directement la pièce en stock (sinon statut RETURNED). */
  restock: z.boolean().optional(),
});
export type RefundSaleCommand = z.input<typeof RefundSaleCommand>;

/* ───────────── Expertise IA ───────────── */

export const APPRAISAL_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
/** Base64 : 4 caractères pour 3 octets. */
const APPRAISAL_IMAGE_MAX_CHARS = Math.ceil(APPRAISAL_IMAGE_MAX_BYTES / 3) * 4;

export const AppraiseImageCommand = z.object({
  imageBase64: z
    .string()
    .min(1)
    .max(APPRAISAL_IMAGE_MAX_CHARS, { message: "Image trop lourde (8 Mo max)" })
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, { message: "Base64 invalide" }),
  mimeType: ImageMimeTypeDto,
  hints: z
    .object({
      brand: ShortText.optional(),
      category: CategoryDto.optional(),
      purchasePriceMinor: z.number().int().min(0).optional(),
    })
    .optional(),
  wantListingCopy: z.boolean().optional(),
  /** Rattacher l'expertise à une pièce existante. */
  itemId: IdDto.optional(),
});
export type AppraiseImageCommand = z.input<typeof AppraiseImageCommand>;

/* ───────────── Upload ───────────── */

export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export const PrepareUploadCommand = z.object({
  mimeType: ImageMimeTypeDto,
  byteSize: z.number().int().min(1).max(UPLOAD_MAX_BYTES).optional(),
  purpose: z.enum(["item-photo", "avatar"]).default("item-photo"),
});
export type PrepareUploadCommand = z.input<typeof PrepareUploadCommand>;

/* ───────────── Espace de travail ───────────── */

export const UpdateWorkspaceSettingsCommand = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currency: CurrencyDto.optional(),
  locale: LocaleDto.optional(),
  targetMargin: TargetMarginDto.optional(),
  skuPrefix: z
    .string()
    .regex(/^[A-Z]{1,4}$/, { message: "1 à 4 lettres majuscules" })
    .optional(),
  /** Surcharges de grilles de frais par plateforme ; `null` rétablit la grille par défaut. */
  feeOverrides: z.partialRecord(PlatformDto, FeeScheduleDto.nullable()).optional(),
  dormantThresholdDays: z.number().int().min(7).max(365).optional(),
  monthlyGoal: MoneyDto.nullable().optional(),
});
export type UpdateWorkspaceSettingsCommand = z.input<typeof UpdateWorkspaceSettingsCommand>;

/* ───────────── Compte (RGPD) ───────────── */

/** Suppression définitive : le mot de confirmation est exigé tel quel. */
export const DeleteAccountCommand = z.object({ confirm: z.literal("SUPPRIMER") });
export type DeleteAccountCommand = z.input<typeof DeleteAccountCommand>;

/* ───────────── Facturation ───────────── */

export const StartCheckoutCommand = z.object({
  plan: z.enum(["PREMIUM", "PRO", "BUSINESS"]),
  interval: z.enum(["monthly", "yearly"]),
  returnUrl: z.url(),
});
export type StartCheckoutCommand = z.input<typeof StartCheckoutCommand>;

export const OpenBillingPortalCommand = z.object({ returnUrl: z.url() });
export type OpenBillingPortalCommand = z.input<typeof OpenBillingPortalCommand>;
