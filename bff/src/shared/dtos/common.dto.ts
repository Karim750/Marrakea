import { z } from 'zod';

/**
 * Common DTOs used across multiple modules.
 * All schemas match /spec/00-contract.md exactly.
 */

// ImageDTO
export const ImageDTOSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  blurDataUrl: z.string().optional(),
});
export type ImageDTO = z.infer<typeof ImageDTOSchema>;

// MoneyDTO
export const MoneyDTOSchema = z.object({
  amount: z.number(),
  currency: z.literal('EUR'),
  formattedPrice: z.string(),
});
export type MoneyDTO = z.infer<typeof MoneyDTOSchema>;

// AvailabilityDTO
export const AvailabilityDTOSchema = z.object({
  inStock: z.boolean(),
  purchaseMode: z.enum(['unique', 'standard']),
  label: z.string(),
});
export type AvailabilityDTO = z.infer<typeof AvailabilityDTOSchema>;

// Pagination
export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// PaginatedResponse<T>
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: PaginationSchema,
  });
}

// ErrorResponse
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.unknown()).optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Success response (for logout, contact)
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// Stock response
export const StockResponseSchema = z.object({
  inStock: z.boolean(),
});
export type StockResponse = z.infer<typeof StockResponseSchema>;
