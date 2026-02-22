import { strapiClient, StrapiItem } from '../../shared/http/strapi.client.js';
import { medusaClient, MedusaProduct, MedusaVariant } from '../../shared/http/medusa.client.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  ProductDTO,
  ProductDetailDTO,
  GestureDTO,
  TerritoryDTO,
  ImageDTO,
  MoneyDTO,
  AvailabilityDTO,
  ArtisanDTO,
  PaginatedProductResponse,
} from '../../shared/dtos/index.js';

/**
 * Catalog service handling Strapi + Medusa data aggregation.
 */

// Format price as EUR
// Medusa v2 returns prices in actual currency units (not cents)
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Extract price from Medusa variant
// Medusa v2: prices are in actual currency units (1300 = 1300.00 EUR)
function extractPrice(variant: MedusaVariant, productId: string): MoneyDTO {
  // Prefer calculated_price
  if (variant.calculated_price?.calculated_amount != null) {
    const amount = variant.calculated_price.calculated_amount;
    return {
      amount,
      currency: 'EUR',
      formattedPrice: formatPrice(amount),
    };
  }

  // Fallback to prices array
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

  // Price not resolvable - strict v1 policy
  throw AppError.priceNotResolvable(productId);
}

// Extract availability from Medusa variant
function extractAvailability(variant: MedusaVariant): AvailabilityDTO {
  let inStock = true;

  // Check inventory if managed
  if (variant.manage_inventory) {
    inStock = (variant.inventory_quantity ?? 0) >= 1;
  }

  return {
    inStock,
    purchaseMode: 'unique', // v1: all items are unique
    label: inStock ? 'Disponible' : 'Indisponible',
  };
}

// Map Strapi media to ImageDTO
// Strapi v5: media fields are flat objects, not nested under data.attributes
function mapImage(
  media: Record<string, unknown> | null | undefined,
  normalizeUrl: (url: string | null | undefined) => string | null
): ImageDTO | null {
  if (!media) return null;

  // Strapi v5: fields are directly on the object
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

// Map Strapi gesture/territory to DTO
// Strapi v5: relations are flat objects with id, name, slug directly
// Strapi v4 fallback: check for nested data.attributes structure
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

// Map Strapi artisan to ArtisanDTO
// Strapi v5: relations are flat objects
// Strapi v4 fallback: check for nested data.attributes structure
function mapArtisan(
  artisan: Record<string, unknown> | null | undefined,
  normalizeUrl: (url: string | null | undefined) => string | null
): ArtisanDTO | null {
  if (!artisan) return null;

  // Strapi v4 fallback: check for nested data structure
  const data = (artisan as { data?: { id: number; attributes?: Record<string, unknown> } }).data;
  const source = data?.attributes || artisan;
  const id = data?.id || (artisan as { id?: number }).id;

  if (!id) return null;

  const territory = mapTaxonomy(source.territory as Record<string, unknown>);

  return {
    id: String(id),
    name: (source.name as string) || '',
    bio: source.bio as string | undefined,
    portrait: mapImage(source.portrait as Record<string, unknown>, normalizeUrl) || undefined,
    territory: territory || undefined,
    workshopLocation: source.workshopLocation as string | undefined,
    specialty: source.specialty as string | undefined,
    yearsExperience: source.yearsExperience != null ? String(source.yearsExperience) : undefined,
    transmissionMode: source.transmissionMode as string | undefined,
    equipment: source.equipment as string | undefined,
  };
}

export class CatalogService {
  /**
   * List products with pagination and filters.
   */
  async listProducts(params: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    gesture?: string;
    territory?: string;
  }): Promise<PaginatedProductResponse> {
    const page = params.page || 1;
    const limit = params.limit || 12;

    // Get product pages from Strapi
    const strapiResponse = await strapiClient.getProductPages({
      page,
      limit,
      sort: params.sort,
      search: params.search,
      gesture: params.gesture,
      territory: params.territory,
    });

    const strapiItems = strapiResponse.data || [];
    const pagination = strapiResponse.meta?.pagination;

    // Extract Medusa product IDs for hydration
    // Note: Strapi v5 returns flat items (no nested attributes)
    const medusaProductIds: string[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;
      if (medusaId) {
        medusaProductIds.push(medusaId);
      }
    }

    // Batch hydrate Medusa products
    const medusaProducts = await medusaClient.hydrateProducts(medusaProductIds);

    // Map to ProductDTO, dropping ghost products silently
    const products: ProductDTO[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;

      if (!medusaId) {
        console.log('[CATALOG] GHOST_PRODUCT_REFERENCE: missing medusa_product_id', { strapiId: item.id });
        continue;
      }

      const medusaProduct = medusaProducts.get(medusaId);
      if (!medusaProduct) {
        console.log('[CATALOG] GHOST_PRODUCT_REFERENCE: Medusa product not found', { strapiId: item.id, medusaId });
        continue;
      }

      try {
        const product = this.mapToProductDTO(item, medusaProduct);
        products.push(product);
      } catch (err) {
        // Log price resolution failures but continue with other products
        console.error('[CATALOG] Failed to map product', { strapiId: item.id, medusaId, error: (err as Error).message });
      }
    }

    return {
      data: products,
      pagination: {
        page,
        limit,
        total: pagination?.total || 0,
        totalPages: pagination?.pageCount || 0,
      },
    };
  }

  /**
   * Get product detail by slug.
   */
  async getProductBySlug(slug: string): Promise<ProductDetailDTO> {
    // Get product page from Strapi
    const strapiResponse = await strapiClient.getProductPageBySlug(slug);
    const strapiItems = strapiResponse.data || [];

    if (strapiItems.length === 0) {
      throw AppError.productNotFound();
    }

    const item = strapiItems[0];
    // Note: Strapi v5 returns flat items (no nested attributes)
    const medusaId = item.medusa_product_id as string | undefined;

    if (!medusaId) {
      throw AppError.productNotFound();
    }

    // Get Medusa product
    const medusaProduct = await medusaClient.getProduct(medusaId);
    if (!medusaProduct) {
      throw AppError.productNotFound();
    }

    return this.mapToProductDetailDTO(item, medusaProduct);
  }

  /**
   * Get featured products (max 6).
   */
  async getFeaturedProducts(): Promise<ProductDTO[]> {
    const strapiResponse = await strapiClient.getFeaturedProductPages();
    const strapiItems = strapiResponse.data || [];

    // Extract Medusa product IDs
    // Note: Strapi v5 returns flat items (no nested attributes)
    const medusaProductIds: string[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;
      if (medusaId) {
        medusaProductIds.push(medusaId);
      }
    }

    // Batch hydrate
    const medusaProducts = await medusaClient.hydrateProducts(medusaProductIds);

    // Map, dropping ghost products
    const products: ProductDTO[] = [];
    for (const item of strapiItems) {
      const medusaId = item.medusa_product_id as string | undefined;
      if (!medusaId) continue;

      const medusaProduct = medusaProducts.get(medusaId);
      if (!medusaProduct) continue;

      try {
        products.push(this.mapToProductDTO(item, medusaProduct));
      } catch {
        // Skip products with price resolution issues
      }
    }

    return products.slice(0, 6);
  }

  /**
   * Get stock status for a product.
   */
  async getStock(productId: string): Promise<{ inStock: boolean }> {
    const product = await medusaClient.getProduct(productId);
    if (!product || !product.variants || product.variants.length === 0) {
      return { inStock: false };
    }

    const variant = product.variants[0];
    const availability = extractAvailability(variant);
    return { inStock: availability.inStock };
  }

  /**
   * List all gestures.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  async listGestures(): Promise<GestureDTO[]> {
    const response = await strapiClient.getGestures();
    return (response.data || []).map((item) => ({
      id: String(item.id),
      name: (item.name as string) || '',
      slug: (item.slug as string) || '',
    }));
  }

  /**
   * List all territories.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  async listTerritories(): Promise<TerritoryDTO[]> {
    const response = await strapiClient.getTerritories();
    return (response.data || []).map((item) => ({
      id: String(item.id),
      name: (item.name as string) || '',
      slug: (item.slug as string) || '',
    }));
  }

  /**
   * Map Strapi item + Medusa product to ProductDTO.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  private mapToProductDTO(strapiItem: StrapiItem, medusaProduct: MedusaProduct): ProductDTO {
    const variant = medusaProduct.variants[0];

    if (!variant) {
      throw AppError.priceNotResolvable(medusaProduct.id);
    }

    const gesture = mapTaxonomy(strapiItem.gesture as Record<string, unknown>);
    const territory = mapTaxonomy(strapiItem.territory as Record<string, unknown>);

    if (!gesture || !territory) {
      console.error('[CATALOG] Missing gesture or territory - check Strapi API token permissions for populate', {
        strapiId: strapiItem.id,
        hasGesture: !!strapiItem.gesture,
        hasTerritory: !!strapiItem.territory,
      });
      throw new Error('Missing gesture or territory - Strapi API token may lack populate permissions');
    }

    const coverImage = mapImage(
      strapiItem.cover_image as Record<string, unknown>,
      (url) => strapiClient.normalizeMediaUrl(url)
    );

    if (!coverImage) {
      console.error('[CATALOG] Missing cover_image - check Strapi API token permissions for populate', {
        strapiId: strapiItem.id,
        hasCoverImage: !!strapiItem.cover_image,
      });
      throw new Error('Missing cover image - Strapi API token may lack populate permissions');
    }

    return {
      id: String(strapiItem.id),
      slug: (strapiItem.slug as string) || '',
      title: (strapiItem.title as string) || '',
      intro: strapiItem.intro as string | undefined,
      coverImage,
      price: extractPrice(variant, medusaProduct.id),
      availability: extractAvailability(variant),
      gesture,
      territory,
      defaultVariantId: (strapiItem.medusa_variant_id as string) || variant.id,
      medusaProductId: medusaProduct.id,
    };
  }

  /**
   * Map Strapi item + Medusa product to ProductDetailDTO.
   * Note: Strapi v5 returns flat items (no nested attributes).
   */
  private mapToProductDetailDTO(strapiItem: StrapiItem, medusaProduct: MedusaProduct): ProductDetailDTO {
    const base = this.mapToProductDTO(strapiItem, medusaProduct);

    // Map secondary images (excluding cover)
    // Strapi v5: images is an array directly, not nested under data
    const imagesRaw = strapiItem.images;
    const imagesArray = Array.isArray(imagesRaw) ? imagesRaw : [];
    const images: ImageDTO[] = [];
    for (const img of imagesArray) {
      const mapped = mapImage(
        img as Record<string, unknown>,
        (url) => strapiClient.normalizeMediaUrl(url)
      );
      if (mapped) {
        images.push(mapped);
      }
    }

    // Map artisan
    const artisan = mapArtisan(
      strapiItem.artisan as Record<string, unknown>,
      (url) => strapiClient.normalizeMediaUrl(url)
    );

    // Map materials
    let materials: string[] | undefined;
    if (strapiItem.materials) {
      if (Array.isArray(strapiItem.materials)) {
        materials = strapiItem.materials as string[];
      } else if (typeof strapiItem.materials === 'string') {
        materials = [strapiItem.materials];
      }
    }

    // Map reference sheet
    let referenceSheet: Record<string, string> | undefined;
    if (strapiItem.reference_sheet && typeof strapiItem.reference_sheet === 'object') {
      referenceSheet = strapiItem.reference_sheet as Record<string, string>;
    }

    return {
      ...base,
      images,
      description: strapiItem.description_html as string | undefined,
      dimensions: strapiItem.dimensions as string | undefined,
      materials,
      artisan: artisan || undefined,
      acquisition: strapiItem.acquisition as string | undefined,
      referenceSheet,
    };
  }
}

export const catalogService = new CatalogService();
