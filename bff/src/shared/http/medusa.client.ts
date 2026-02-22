import { config } from '../../config/index.js';

/**
 * Medusa Store API client.
 * Uses publishable API key for store operations.
 */

interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  variants: MedusaVariant[];
  images?: MedusaImage[];
}

interface MedusaVariant {
  id: string;
  title: string;
  inventory_quantity?: number;
  manage_inventory?: boolean;
  calculated_price?: {
    calculated_amount: number;
    currency_code: string;
  } | null;
  prices?: Array<{
    amount: number;
    currency_code: string;
    region_id?: string;
  }>;
}

interface MedusaImage {
  url: string;
}

interface MedusaCart {
  id: string;
  items: MedusaLineItem[];
  payment_collection?: MedusaPaymentCollection | null;
  completed_at?: string | null;
}

interface MedusaLineItem {
  id: string;
  variant_id: string;
  quantity: number;
}

interface MedusaPaymentCollection {
  id: string;
  status: string;
  payment_sessions?: MedusaPaymentSession[];
}

interface MedusaPaymentSession {
  id: string;
  provider_id: string;
  status: string;
  data?: {
    client_secret?: string;
    [key: string]: unknown;
  };
}

interface MedusaCustomer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
  authToken?: string;
}

class MedusaClient {
  private baseUrl: string;
  private publishableKey: string;
  private regionId: string;
  private currencyCode: string;
  private defaultTimeout: number;

  // Simple in-memory cache for product hydration (per-request deduplication)
  private productCache: Map<string, { data: MedusaProduct; timestamp: number }> = new Map();
  private cacheTtl = 5000; // 5 seconds

  constructor() {
    this.baseUrl = config.medusa.baseUrl;
    this.publishableKey = config.medusa.publishableKey;
    this.regionId = config.medusa.regionId;
    this.currencyCode = config.medusa.currencyCode;
    this.defaultTimeout = config.medusa.timeout;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const timeout = options.timeout || this.defaultTimeout;
    const method = options.method || 'GET';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': this.publishableKey,
    };

    if (options.authToken) {
      headers['Authorization'] = `Bearer ${options.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      // Log request (never log tokens)
      console.log('[MEDUSA]', {
        method,
        path,
        status: response.status,
        duration: `${duration}ms`,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Medusa request failed: ${response.status} ${errorBody}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get a single product by ID with pricing context.
   * Medusa v2: only region_id is needed for pricing (currency determined by region)
   */
  async getProduct(productId: string): Promise<MedusaProduct | null> {
    // Check cache first
    const cached = this.productCache.get(productId);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }

    try {
      const result = await this.request<{ product: MedusaProduct }>(
        `/store/products/${productId}?region_id=${this.regionId}`
      );

      if (result.product) {
        this.productCache.set(productId, { data: result.product, timestamp: Date.now() });
      }

      return result.product || null;
    } catch (error) {
      console.error(`[MEDUSA] Failed to fetch product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Batch hydrate products by IDs.
   * Falls back to individual requests if batch not supported.
   */
  async hydrateProducts(productIds: string[]): Promise<Map<string, MedusaProduct>> {
    const uniqueIds = [...new Set(productIds)];
    const results = new Map<string, MedusaProduct>();

    // Check cache first
    const uncachedIds: string[] = [];
    for (const id of uniqueIds) {
      const cached = this.productCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
        results.set(id, cached.data);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length === 0) {
      return results;
    }

    // Try batch request first
    // Medusa v2: only region_id is needed for pricing (currency determined by region)
    try {
      const idParams = uncachedIds.map((id) => `id[]=${id}`).join('&');
      const response = await this.request<{ products: MedusaProduct[] }>(
        `/store/products?region_id=${this.regionId}&${idParams}&limit=200`
      );

      for (const product of response.products || []) {
        results.set(product.id, product);
        this.productCache.set(product.id, { data: product, timestamp: Date.now() });
      }

      return results;
    } catch {
      // Fallback to individual requests with Promise.all
      console.log('[MEDUSA] Batch hydration failed, falling back to individual requests');

      const fetchPromises = uncachedIds.map((id) => this.getProduct(id));
      const products = await Promise.all(fetchPromises);

      for (let i = 0; i < uncachedIds.length; i++) {
        const product = products[i];
        if (product) {
          results.set(uncachedIds[i], product);
        }
      }

      return results;
    }
  }

  /**
   * Create a new cart with region.
   */
  async createCart(): Promise<MedusaCart> {
    const result = await this.request<{ cart: MedusaCart }>('/store/carts', {
      method: 'POST',
      body: { region_id: this.regionId },
    });
    return result.cart;
  }

  /**
   * Add a line item to a cart.
   */
  async addLineItem(
    cartId: string,
    variantId: string,
    quantity: number
  ): Promise<MedusaCart> {
    const result = await this.request<{ cart: MedusaCart }>(
      `/store/carts/${cartId}/line-items`,
      {
        method: 'POST',
        body: { variant_id: variantId, quantity },
      }
    );
    return result.cart;
  }

  /**
   * Create a Payment Collection for a cart (Medusa v2 flow).
   * This replaces the old /store/carts/{id}/payment-sessions endpoint.
   */
  async createPaymentCollection(cartId: string): Promise<MedusaPaymentCollection> {
    const result = await this.request<{ payment_collection: MedusaPaymentCollection }>(
      '/store/payment-collections',
      {
        method: 'POST',
        body: { cart_id: cartId },
      }
    );
    return result.payment_collection;
  }

  /**
   * Initialize a payment session on a Payment Collection (Medusa v2 flow).
   * For Stripe, provider_id is typically "pp_stripe_stripe".
   * Returns the payment session with client_secret for frontend.
   */
  async initializePaymentSession(
    paymentCollectionId: string,
    providerId: string
  ): Promise<MedusaPaymentSession> {
    const result = await this.request<{
      payment_collection: {
        payment_sessions: MedusaPaymentSession[];
      };
    }>(
      `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      {
        method: 'POST',
        body: { provider_id: providerId },
      }
    );

    // Medusa v2 returns the session inside payment_collection.payment_sessions array
    const sessions = result.payment_collection?.payment_sessions;
    if (!sessions || sessions.length === 0) {
      throw new Error('No payment session created');
    }

    // Return the newly created session (last one in array for the provider)
    const session = sessions.find(s => s.provider_id === providerId) || sessions[sessions.length - 1];
    return session;
  }

  /**
   * Get cart by ID.
   */
  async getCart(cartId: string): Promise<MedusaCart | null> {
    try {
      const result = await this.request<{ cart: MedusaCart }>(`/store/carts/${cartId}`);
      return result.cart;
    } catch {
      return null;
    }
  }

  /**
   * Complete a cart (finalize checkout).
   */
  async completeCart(cartId: string): Promise<{ cart?: MedusaCart; order?: { id: string } }> {
    return this.request(`/store/carts/${cartId}/complete`, { method: 'POST' });
  }

  /**
   * Register a new customer (Medusa v2 two-step flow).
   * Step 1: Create auth identity
   * Step 2: Create customer entity with the auth token
   */
  async register(params: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ token: string; customer: MedusaCustomer }> {
    // Step 1: Register auth identity
    const authResult = await this.request<{ token: string }>(
      '/auth/customer/emailpass/register',
      {
        method: 'POST',
        body: { email: params.email, password: params.password },
      }
    );

    // Step 2: Create customer entity with the auth token
    const customerResult = await this.request<{ customer: MedusaCustomer }>(
      '/store/customers',
      {
        method: 'POST',
        authToken: authResult.token,
        body: {
          email: params.email,
          first_name: params.first_name,
          last_name: params.last_name,
        },
      }
    );

    return {
      token: authResult.token,
      customer: customerResult.customer,
    };
  }

  /**
   * Login a customer.
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    return this.request('/auth/customer/emailpass', {
      method: 'POST',
      body: { email, password },
    });
  }

  /**
   * Get current customer (requires auth token).
   */
  async getMe(authToken: string): Promise<MedusaCustomer> {
    const result = await this.request<{ customer: MedusaCustomer }>('/store/customers/me', {
      authToken,
    });
    return result.customer;
  }

  /**
   * Clear the product cache (useful for testing).
   */
  clearCache(): void {
    this.productCache.clear();
  }
}

export const medusaClient = new MedusaClient();
export type { MedusaProduct, MedusaVariant, MedusaCart, MedusaCustomer, MedusaImage, MedusaPaymentCollection, MedusaPaymentSession };
