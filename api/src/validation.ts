/**
 * 📋 Zod Validation Schemas
 * 
 * Enterprise-grade input validation for all API endpoints.
 * Ensures data integrity and provides clear error messages.
 */

import { z } from 'zod';

// ============ COMMON SCHEMAS ============

const decimalString = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal (e.g., 100.00)');
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');
const positiveInt = z.coerce.number().int().positive('Must be a positive integer');

// ============ LOT SCHEMAS ============

export const createLotSchema = z.object({
  name: z.string().max(255).optional().nullable(),
  provider: z.string().min(1, 'Provider is required').max(255),
  buyDate: dateString,
  type: z.enum(['BULK', 'PIECEWISE']).default('BULK'),
  totalCost: decimalString,
  additionalFees: decimalString.optional().default('0'),
  initialQuantity: positiveInt,
  currency: z.string().length(3).default('EUR'),
});

export const updateLotSchema = createLotSchema.partial();

export const lotIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============ ITEM SCHEMAS ============

export const createItemSchema = z.object({
  lotId: positiveInt,
  brand: z.string().max(255).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  size: z.string().max(20).optional().nullable(),
  condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor']).optional().nullable(),
  unitCost: decimalString,
  status: z.enum(['STOCK', 'ONLINE', 'SOLD', 'RETURNED', 'LOST']).default('STOCK'),
  photos: z.string().optional().nullable(),
});

export const createItemBatchSchema = z.array(createItemSchema).min(1).max(500);

export const updateItemSchema = createItemSchema.partial();

export const updateItemStatusSchema = z.object({
  status: z.enum(['STOCK', 'ONLINE', 'SOLD', 'RETURNED', 'LOST']),
});

export const itemIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const itemQuerySchema = z.object({
  lotId: z.coerce.number().int().positive().optional(),
  status: z.enum(['STOCK', 'ONLINE', 'SOLD', 'RETURNED', 'LOST']).optional(),
});

// ============ SALE SCHEMAS ============

export const createSaleSchema = z.object({
  itemId: z.number().int().positive().optional().nullable(),
  lotId: positiveInt,
  platform: z.enum(['VINTED', 'DEPOP', 'EBAY', 'LEBONCOIN', 'OTHER']).default('VINTED'),
  priceGross: decimalString,
  platformFees: decimalString.optional().default('0'),
  shippingFees: decimalString.optional().default('0'),
  miscFees: decimalString.optional().default('0'),
  priceNet: decimalString,
  saleDate: dateString,
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED', 'REFUNDED']).default('COMPLETED'),
});

export const saleIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const saleQuerySchema = z.object({
  lotId: z.coerce.number().int().positive().optional(),
  itemId: z.coerce.number().int().positive().optional(),
});

// ============ TYPE EXPORTS ============

export type CreateLotInput = z.infer<typeof createLotSchema>;
export type UpdateLotInput = z.infer<typeof updateLotSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

// ============ VALIDATION HELPER ============

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { success: false, error: errorMessages };
}
