import { z } from 'zod';
import { ImageDTOSchema, createPaginatedResponseSchema } from './common.dto.js';
import { ProductDTOSchema } from './catalog.dto.js';

/**
 * Blog DTOs matching /spec/00-contract.md exactly.
 */

// Author (embedded in ArticleDTO)
export const AuthorSchema = z.object({
  name: z.string(),
  avatar: ImageDTOSchema.optional(),
});
export type Author = z.infer<typeof AuthorSchema>;

// ArticleDTO
export const ArticleDTOSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().optional(),
  coverImage: ImageDTOSchema,
  publishedAt: z.string(),
  category: z.string().optional(),
  author: AuthorSchema.optional(),
});
export type ArticleDTO = z.infer<typeof ArticleDTOSchema>;

// ArticleDetailDTO
export const ArticleDetailDTOSchema = ArticleDTOSchema.extend({
  content: z.string(), // HTML (sanitized)
  images: z.array(ImageDTOSchema).optional(),
  relatedProducts: z.array(ProductDTOSchema).max(4).optional(), // max 4 items
});
export type ArticleDetailDTO = z.infer<typeof ArticleDetailDTOSchema>;

// Paginated articles response
export const PaginatedArticleResponseSchema = createPaginatedResponseSchema(ArticleDTOSchema);
export type PaginatedArticleResponse = z.infer<typeof PaginatedArticleResponseSchema>;

// Query params for article list
export const ArticleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
});
export type ArticleListQuery = z.infer<typeof ArticleListQuerySchema>;
