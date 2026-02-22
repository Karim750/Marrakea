import { config } from '../../config/index.js';

/**
 * Strapi HTTP client for server-to-server communication.
 * Uses Bearer token authentication.
 */

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Strapi v5 returns flat items (no nested attributes).
 * Fields are directly on the item object.
 */
interface StrapiItem {
  id: number;
  documentId?: string;
  [key: string]: unknown;
}

interface RequestOptions {
  timeout?: number;
}

class StrapiClient {
  private baseUrl: string;
  private token: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = config.strapi.baseUrl;
    this.token = config.strapi.apiToken;
    this.defaultTimeout = config.strapi.timeout;
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<StrapiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const timeout = options.timeout || this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      // Log request (never log token)
      console.log('[STRAPI]', {
        path,
        status: response.status,
        duration: `${duration}ms`,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[STRAPI] Request failed', {
          path,
          status: response.status,
          body: errorBody,
        });

        if (response.status === 403) {
          throw new Error(`Strapi request forbidden (403) - check API token permissions for: ${path}`);
        }
        throw new Error(`Strapi request failed: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as StrapiResponse<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Normalize Strapi media URL to absolute URL.
   */
  normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${this.baseUrl}${url}`;
  }

  /**
   * GET /api/product-pages with pagination, filters, and populate
   */
  async getProductPages(params: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    gesture?: string;
    territory?: string;
  }): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();

    // Pagination
    searchParams.set('pagination[page]', String(params.page || 1));
    searchParams.set('pagination[pageSize]', String(params.limit || 12));

    // Sort mapping
    if (params.sort === 'newest') {
      searchParams.set('sort[0]', 'publishedAt:desc');
    } else if (params.sort === 'name_asc') {
      searchParams.set('sort[0]', 'title:asc');
    } else {
      searchParams.set('sort[0]', 'publishedAt:desc');
    }

    // Populate relations (Strapi v5 syntax)
    // Note: API token must have permission to access these relations
    searchParams.set('populate[0]', 'cover_image');
    searchParams.set('populate[1]', 'gesture');
    searchParams.set('populate[2]', 'territory');

    // Fields
    searchParams.set('fields[0]', 'title');
    searchParams.set('fields[1]', 'slug');
    searchParams.set('fields[2]', 'intro');
    searchParams.set('fields[3]', 'medusa_product_id');
    searchParams.set('fields[4]', 'medusa_variant_id');

    // Filters
    if (params.search) {
      searchParams.set('filters[$or][0][title][$containsi]', params.search);
      searchParams.set('filters[$or][1][intro][$containsi]', params.search);
    }
    if (params.gesture) {
      searchParams.set('filters[gesture][slug][$eq]', params.gesture);
    }
    if (params.territory) {
      searchParams.set('filters[territory][slug][$eq]', params.territory);
    }

    return this.request<StrapiItem[]>(`/api/product-pages?${searchParams.toString()}`);
  }

  /**
   * GET /api/product-pages by slug with deep populate
   */
  async getProductPageBySlug(slug: string): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();

    searchParams.set('filters[slug][$eq]', slug);
    // Populate relations (Strapi v5 array syntax)
    searchParams.set('populate[0]', 'cover_image');
    searchParams.set('populate[1]', 'images');
    searchParams.set('populate[2]', 'gesture');
    searchParams.set('populate[3]', 'territory');
    searchParams.set('populate[4]', 'artisan.portrait');
    searchParams.set('populate[5]', 'artisan.territory');

    return this.request<StrapiItem[]>(`/api/product-pages?${searchParams.toString()}`);
  }

  /**
   * GET /api/product-pages featured
   */
  async getFeaturedProductPages(): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();

    searchParams.set('filters[is_featured][$eq]', 'true');
    searchParams.set('pagination[page]', '1');
    searchParams.set('pagination[pageSize]', '6');
    searchParams.set('sort[0]', 'featured_rank:asc');
    searchParams.set('sort[1]', 'publishedAt:desc');
    // Populate relations (Strapi v5 array syntax)
    searchParams.set('populate[0]', 'cover_image');
    searchParams.set('populate[1]', 'gesture');
    searchParams.set('populate[2]', 'territory');
    searchParams.set('fields[0]', 'title');
    searchParams.set('fields[1]', 'slug');
    searchParams.set('fields[2]', 'intro');
    searchParams.set('fields[3]', 'medusa_product_id');
    searchParams.set('fields[4]', 'medusa_variant_id');

    return this.request<StrapiItem[]>(`/api/product-pages?${searchParams.toString()}`);
  }

  /**
   * GET /api/gestures
   */
  async getGestures(): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();
    searchParams.set('pagination[page]', '1');
    searchParams.set('pagination[pageSize]', '100');
    searchParams.set('sort[0]', 'name:asc');

    return this.request<StrapiItem[]>(`/api/gestures?${searchParams.toString()}`);
  }

  /**
   * GET /api/territories
   */
  async getTerritories(): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();
    searchParams.set('pagination[page]', '1');
    searchParams.set('pagination[pageSize]', '100');
    searchParams.set('sort[0]', 'name:asc');

    return this.request<StrapiItem[]>(`/api/territories?${searchParams.toString()}`);
  }

  /**
   * GET /api/articles with pagination
   */
  async getArticles(params: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();

    searchParams.set('pagination[page]', String(params.page || 1));
    searchParams.set('pagination[pageSize]', String(params.limit || 10));
    searchParams.set('sort[0]', 'publishedAt:desc');
    // Populate relations (Strapi v5 array syntax)
    searchParams.set('populate[0]', 'cover_image');
    searchParams.set('populate[1]', 'author.avatar');

    if (params.category) {
      searchParams.set('filters[category][$eq]', params.category);
    }

    return this.request<StrapiItem[]>(`/api/articles?${searchParams.toString()}`);
  }

  /**
   * GET /api/articles by slug with related products
   */
  async getArticleBySlug(slug: string): Promise<StrapiResponse<StrapiItem[]>> {
    const searchParams = new URLSearchParams();

    searchParams.set('filters[slug][$eq]', slug);
    // Populate relations (Strapi v5 array syntax)
    searchParams.set('populate[0]', 'cover_image');
    searchParams.set('populate[1]', 'author.avatar');
    searchParams.set('populate[2]', 'related_products.cover_image');
    searchParams.set('populate[3]', 'related_products.gesture');
    searchParams.set('populate[4]', 'related_products.territory');

    return this.request<StrapiItem[]>(`/api/articles?${searchParams.toString()}`);
  }
}

export const strapiClient = new StrapiClient();
export type { StrapiResponse, StrapiItem };
