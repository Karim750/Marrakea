import { strapiClient, StrapiItem } from '../../shared/http/strapi.client.js';
import { medusaClient, MedusaProduct, MedusaVariant } from '../../shared/http/medusa.client.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  ArticleDTO,
  ArticleDetailDTO,
  PaginatedArticleResponse,
  ProductDTO,
  ImageDTO,
} from '../../shared/dtos/index.js';

/**
 * Blog service handling Strapi articles with Medusa product hydration for related products.
 */

// Format price as EUR
// Medusa v2 returns prices in actual currency units (not cents)
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Map Strapi media to ImageDTO
// Strapi v5: media fields are flat objects, not nested under data.attributes
function mapImage(
  media: Record<string, unknown> | null | undefined,
  normalizeUrl: (url: string | null | undefined) => string | null
): ImageDTO | null {
  if (!media) return null;

  // Strapi v4 fallback: check for nested data.attributes structure
  const data = (media as { data?: { attributes?: Record<string, unknown> } }).data;
  const source = data?.attributes || media;

  const url = normalizeUrl(source.url as string | null);
  if (!url) return null;

  return {
    url,
    alt: (source.alternativeText as string) || (source.name as string) || '',
    width: source.width as number | undefined,
    height: source.height as number | undefined,
  };
}

// Map Strapi taxonomy (gesture/territory) to DTO
// Strapi v5: relations are flat objects with id, name, slug directly
function mapTaxonomy(item: Record<string, unknown> | null | undefined): { id: string; name: string; slug: string } | null {
  if (!item) return null;

  // Strapi v4 fallback: check for nested data structure
  const data = (item as { data?: { id: number; attributes?: Record<string, unknown> } }).data;
  if (data) {
    return {
      id: String(data.id),
      name: (data.attributes?.name as string) || '',
      slug: (data.attributes?.slug as string) || '',
    };
  }

  // Strapi v5: direct flat format
  const id = (item as { id?: number }).id;
  if (!id) return null;

  return {
    id: String(id),
    name: (item.name as string) || '',
    slug: (item.slug as string) || '',
  };
}

// Extract price from Medusa variant
// Medusa v2: prices are in actual currency units (1300 = 1300.00 EUR)
function extractPrice(variant: MedusaVariant): { amount: number; currency: 'EUR'; formattedPrice: string } | null {
  if (variant.calculated_price?.calculated_amount != null) {
    const amount = variant.calculated_price.calculated_amount;
    return {
      amount,
      currency: 'EUR',
      formattedPrice: formatPrice(amount),
    };
  }

  if (variant.prices && variant.prices.length > 0) {
    const eurPrice = variant.prices.find((p) => p.currency_code === 'EUR');
    if (eurPrice) {
      return {
        amount: eurPrice.amount,
        currency: 'EUR',
        formattedPrice: formatPrice(eurPrice.amount),
      };
    }
  }

  return null;
}

// Extract availability from Medusa variant
function extractAvailability(variant: MedusaVariant) {
  let inStock = true;
  if (variant.manage_inventory) {
    inStock = (variant.inventory_quantity ?? 0) >= 1;
  }
  return {
    inStock,
    purchaseMode: 'unique' as const,
    label: inStock ? 'Disponible' : 'Indisponible',
  };
}

export class BlogService {
  /**
   * List articles with pagination.
   */
  async listArticles(params: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedArticleResponse> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const response = await strapiClient.getArticles({
      page,
      limit,
      category: params.category,
    });

    const articles: ArticleDTO[] = (response.data || []).map((item) =>
      this.mapToArticleDTO(item)
    );

    const pagination = response.meta?.pagination;

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total: pagination?.total || 0,
        totalPages: pagination?.pageCount || 0,
      },
    };
  }

  /**
   * Get article detail by slug with related products.
   */
  async getArticleBySlug(slug: string): Promise<ArticleDetailDTO> {
    const response = await strapiClient.getArticleBySlug(slug);
    const items = response.data || [];

    if (items.length === 0) {
      throw AppError.articleNotFound();
    }

    const item = items[0];
    return this.mapToArticleDetailDTO(item);
  }

  /**
   * Map Strapi article to ArticleDTO.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  private mapToArticleDTO(item: StrapiItem): ArticleDTO {
    const coverImage = mapImage(
      item.cover_image as Record<string, unknown>,
      (url) => strapiClient.normalizeMediaUrl(url)
    );

    // Map author (Strapi v5: flat object, v4: nested under data.attributes)
    let author: { name: string; avatar?: ImageDTO } | undefined;
    const authorData = item.author as Record<string, unknown> | undefined;
    if (authorData) {
      // Strapi v4 fallback
      const nestedData = (authorData as { data?: { attributes?: Record<string, unknown> } }).data;
      const authorSource = nestedData?.attributes || authorData;
      const name = authorSource.name as string | undefined;
      if (name) {
        const avatar = mapImage(
          authorSource.avatar as Record<string, unknown>,
          (url) => strapiClient.normalizeMediaUrl(url)
        );
        author = {
          name,
          avatar: avatar || undefined,
        };
      }
    }

    return {
      id: String(item.id),
      slug: (item.slug as string) || '',
      title: (item.title as string) || '',
      excerpt: item.excerpt as string | undefined,
      coverImage: coverImage || { url: '', alt: '' },
      publishedAt: (item.publishedAt as string) || new Date().toISOString(),
      category: item.category as string | undefined,
      author,
    };
  }

  /**
   * Map Strapi article to ArticleDetailDTO with related products.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  private async mapToArticleDetailDTO(item: StrapiItem): Promise<ArticleDetailDTO> {
    const base = this.mapToArticleDTO(item);

    // Note: CMS article schema does not have an 'images' field (only 'cover_image')
    // If images field is added to CMS in the future, uncomment and enable populate in strapi.client.ts

    // Map related products (hydrate from Medusa)
    // Strapi v5: array directly, v4: nested under data
    const relatedRaw = item.related_products;
    let relatedProductsData: StrapiItem[] = [];
    if (Array.isArray(relatedRaw)) {
      relatedProductsData = relatedRaw as StrapiItem[];
    } else if (relatedRaw && typeof relatedRaw === 'object') {
      // Strapi v4 fallback
      const nested = (relatedRaw as { data?: StrapiItem[] }).data;
      if (nested) {
        relatedProductsData = nested;
      }
    }

    const relatedProducts = await this.hydrateRelatedProducts(relatedProductsData);

    return {
      ...base,
      content: (item.content_html as string) || '',
      images: undefined, // CMS article schema does not have images field
      relatedProducts: relatedProducts.length > 0 ? relatedProducts.slice(0, 4) : undefined,
    };
  }

  /**
   * Hydrate related products from Strapi items with Medusa data.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  private async hydrateRelatedProducts(strapiItems: StrapiItem[]): Promise<ProductDTO[]> {
    if (strapiItems.length === 0) return [];

    // Extract Medusa product IDs
    const medusaProductIds: string[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;
      if (medusaId) {
        medusaProductIds.push(medusaId);
      }
    }

    // Batch hydrate
    const medusaProducts = await medusaClient.hydrateProducts(medusaProductIds);

    // Map to ProductDTO
    const products: ProductDTO[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;

      if (!medusaId) continue;

      const medusaProduct = medusaProducts.get(medusaId);
      if (!medusaProduct || medusaProduct.variants.length === 0) continue;

      const variant = medusaProduct.variants[0];
      const price = extractPrice(variant);
      if (!price) continue;

      const gesture = mapTaxonomy(item.gesture as Record<string, unknown>);
      const territory = mapTaxonomy(item.territory as Record<string, unknown>);
      if (!gesture || !territory) continue;

      const coverImage = mapImage(
        item.cover_image as Record<string, unknown>,
        (url) => strapiClient.normalizeMediaUrl(url)
      );
      if (!coverImage) continue;

      products.push({
        id: String(item.id),
        slug: (item.slug as string) || '',
        title: (item.title as string) || '',
        intro: item.intro as string | undefined,
        coverImage,
        price,
        availability: extractAvailability(variant),
        gesture,
        territory,
        defaultVariantId: (item.medusa_variant_id as string) || variant.id,
        medusaProductId: medusaProduct.id,
      });
    }

    return products;
  }
}

export const blogService = new BlogService();
