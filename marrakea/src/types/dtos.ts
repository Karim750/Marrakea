// ─── Image ───────────────────────────────────────────────────────────────────

export interface ImageDTO {
  url: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl?: string;
}

// ─── Artisan ─────────────────────────────────────────────────────────────────

export interface ArtisanDTO {
  id: string;
  name: string;
  bio?: string | null;
  portrait?: ImageDTO | null;
  territory?: TerritoryDTO | null;
  workshopLocation?: string | null;
  specialty?: string | null;
  yearsExperience?: string | null;
  transmissionMode?: string | null;
  equipment?: string | null;
}

// ─── Territory & Gesture ─────────────────────────────────────────────────────

export interface TerritoryDTO {
  id: string;
  name: string;
  slug: string;
}

export interface GestureDTO {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductPriceDTO {
  amount: number;
  currency: string;
  formattedPrice: string;
}

export type PurchaseMode = 'unique' | 'quantity' | 'preorder';

export interface ProductAvailabilityDTO {
  inStock: boolean;
  purchaseMode: PurchaseMode;
  maxQuantity?: number;
  label: string;
}

export interface ProductDTO {
  id: string;
  slug: string;
  title: string;
  intro: string;
  coverImage: ImageDTO;
  price: ProductPriceDTO;
  availability: ProductAvailabilityDTO;
  gesture?: GestureDTO;
  territory?: TerritoryDTO;
  defaultVariantId: string;
  medusaProductId: string;
}

export interface ProductDetailDTO extends ProductDTO {
  images: ImageDTO[];
  description: string;
  dimensions?: string;
  materials?: string[];
  artisan?: ArtisanDTO;
  acquisition: string;
  referenceSheet?: Record<string, string>;
}

// ─── Article ─────────────────────────────────────────────────────────────────

export interface ArticleDTO {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: ImageDTO;
  publishedAt: string;
  category?: string;
  author?: { name: string; avatar?: ImageDTO };
}

export interface ArticleDetailDTO extends ArticleDTO {
  content: string;
  images?: ImageDTO[];
  relatedProducts?: ProductDTO[];
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface FilterParams {
  gesture?: string;
  territory?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationDTO;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItemDTO {
  productId: string;
  slug: string;
  title: string;
  coverImage: ImageDTO;
  price: ProductPriceDTO;
  quantity: number;
  purchaseMode: PurchaseMode;
  maxQuantity?: number;
}

export interface CartTotalsDTO {
  itemCount: number;
  formattedTotal: string;
}

export interface CartDTO {
  items: CartItemDTO[];
  totals: CartTotalsDTO;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutPayloadItem {
  productId: string;
  quantity: number;
}

export interface CheckoutSessionDTO {
  cartId: string;
  paymentCollectionId: string;
  clientSecret: string;
}

export type CheckoutStatus = 'DRAFT' | 'LOCKED' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';

export interface CheckoutStatusDTO {
  status: CheckoutStatus;
  orderId?: string;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface ContactFormDTO {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ─── Filters metadata ────────────────────────────────────────────────────────

export interface FiltersMetaDTO {
  gestures: GestureDTO[];
  territories: TerritoryDTO[];
}
