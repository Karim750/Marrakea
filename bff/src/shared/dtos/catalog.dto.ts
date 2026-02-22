import { z } from 'zod';
import {
  ImageDTOSchema,
  MoneyDTOSchema,
  AvailabilityDTOSchema,
  createPaginatedResponseSchema,
} from './common.dto.js';

/**
 * Catalog DTOs matching /spec/00-contract.md exactly.
 */

// GestureDTO
export const GestureDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type GestureDTO = z.infer<typeof GestureDTOSchema>;

// TerritoryDTO
export const TerritoryDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type TerritoryDTO = z.infer<typeof TerritoryDTOSchema>;

// ArtisanDTO
export const ArtisanDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().nullish(),
  portrait: ImageDTOSchema.nullish(),
  territory: TerritoryDTOSchema.nullish(),
  workshopLocation: z.string().nullish(),
  specialty: z.string().nullish(),
  yearsExperience: z.string().nullish(),
  transmissionMode: z.string().nullish(),
  equipment: z.string().nullish(),
});
export type ArtisanDTO = z.infer<typeof ArtisanDTOSchema>;

// ProductDTO (list item)
export const ProductDTOSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  coverImage: ImageDTOSchema,
  price: MoneyDTOSchema,
  availability: AvailabilityDTOSchema,
  gesture: GestureDTOSchema,
  territory: TerritoryDTOSchema,
  defaultVariantId: z.string().optional(),
  medusaProductId: z.string(), // Medusa product ID for stock checks
});
export type ProductDTO = z.infer<typeof ProductDTOSchema>;

// ProductDetailDTO
export const ProductDetailDTOSchema = ProductDTOSchema.extend({
  images: z.array(ImageDTOSchema), // secondary images only; coverImage excluded
  description: z.string().optional(), // HTML (sanitized)
  dimensions: z.string().optional(),
  materials: z.array(z.string()).optional(),
  artisan: ArtisanDTOSchema.optional(),
  acquisition: z.string().optional(),
  referenceSheet: z.record(z.string()).optional(),
});
export type ProductDetailDTO = z.infer<typeof ProductDetailDTOSchema>;

// Paginated products response
export const PaginatedProductResponseSchema = createPaginatedResponseSchema(ProductDTOSchema);
export type PaginatedProductResponse = z.infer<typeof PaginatedProductResponseSchema>;

// Query params for product list
export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  gesture: z.string().optional(),
  territory: z.string().optional(),
  sort: z.enum(['newest', 'name_asc', 'price_asc', 'price_desc']).optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
