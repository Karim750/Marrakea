# DTO Reference Documentation

**Source of Truth:** `/src/types/dtos.ts`

This document provides detailed reference for all DTOs used in the MARRAKEA frontend.

---

## Core Principles

1. **Display-Ready:** All DTOs contain formatted, UI-ready data
2. **No Backend Leakage:** Zero Dolibarr fields (`rowid`, `fk_*`, etc.)
3. **Type Safety:** Strict TypeScript with explicit optionals
4. **Consistency:** Predictable field names and structures

---

## Image DTOs

### ImageDTO

Represents an optimized image with optional blur placeholder.

```typescript
interface ImageDTO {
  url: string;           // Full image URL (CDN or local)
  alt: string;           // Accessibility description
  width: number;         // Intrinsic width in pixels
  height: number;        // Intrinsic height in pixels
  blurDataUrl?: string;  // Optional base64 blur placeholder
}
```

**Usage:**
- Product cover images
- Product gallery images
- Article cover images
- Artisan portraits

**Example:**
```typescript
const image: ImageDTO = {
  url: 'https://cdn.marrakea.com/products/vase-001.jpg',
  alt: 'Vase en terre rouge de Safi',
  width: 800,
  height: 800,
  blurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
};
```

---

## Territory & Gesture

### TerritoryDTO

Moroccan region/city where artisan works.

```typescript
interface TerritoryDTO {
  id: string;    // Unique identifier
  name: string;  // Display name (e.g., "Marrakech")
  slug: string;  // URL-safe slug (e.g., "marrakech")
}
```

**Example:**
```typescript
const territory: TerritoryDTO = {
  id: 't1',
  name: 'Marrakech',
  slug: 'marrakech',
};
```

### GestureDTO

Artisanal craft/technique (poterie, tissage, zellige, etc.).

```typescript
interface GestureDTO {
  id: string;    // Unique identifier
  name: string;  // Display name (e.g., "Poterie")
  slug: string;  // URL-safe slug (e.g., "poterie")
}
```

**Example:**
```typescript
const gesture: GestureDTO = {
  id: 'g1',
  name: 'Poterie',
  slug: 'poterie',
};
```

---

## Artisan

### ArtisanDTO

Represents an artisan who creates products.

```typescript
interface ArtisanDTO {
  id: string;              // Unique identifier
  name: string;            // Full name
  bio: string;             // Biography (HTML or plain text)
  portrait?: ImageDTO;     // Optional portrait photo
  territory?: TerritoryDTO; // Optional region
}
```

**Example:**
```typescript
const artisan: ArtisanDTO = {
  id: 'art_001',
  name: 'Hassan El Fassi',
  bio: 'Maître potier depuis 30 ans...',
  portrait: { /* ImageDTO */ },
  territory: { id: 't2', name: 'Fès', slug: 'fes' },
};
```

---

## Product DTOs

### ProductPriceDTO

Price information with pre-formatted display value.

```typescript
interface ProductPriceDTO {
  amount: number;        // Numeric amount (for sorting/comparison)
  currency: string;      // ISO currency code (e.g., "EUR")
  formattedPrice: string; // UI-ready formatted price (e.g., "120,00 €")
}
```

**CRITICAL:** Always use `formattedPrice` in UI. Never format `amount` client-side.

**Example:**
```typescript
const price: ProductPriceDTO = {
  amount: 120,
  currency: 'EUR',
  formattedPrice: '120,00 €',
};

// Component usage
<span>{product.price.formattedPrice}</span> // ✅ CORRECT
<span>{product.price.amount} €</span>       // ❌ WRONG
```

### PurchaseMode

Purchase availability mode.

```typescript
type PurchaseMode = 'unique' | 'quantity' | 'preorder';
```

- **unique:** Single item, cannot add multiple to cart
- **quantity:** Multiple items available, limited by `maxQuantity`
- **preorder:** Made to order, typically 4-6 weeks lead time

### ProductAvailabilityDTO

Availability information with UI-ready label.

```typescript
interface ProductAvailabilityDTO {
  inStock: boolean;       // Is product available?
  purchaseMode: PurchaseMode; // Purchase mode
  maxQuantity?: number;   // Max quantity (only if purchaseMode === 'quantity')
  label: string;          // UI-ready availability text (SOURCE OF TRUTH)
}
```

**CRITICAL:** Always use `label` for display. Never generate availability text client-side.

**Examples:**
```typescript
// Unique item
const availability1: ProductAvailabilityDTO = {
  inStock: true,
  purchaseMode: 'unique',
  label: 'Pièce unique',
};

// Quantity item
const availability2: ProductAvailabilityDTO = {
  inStock: true,
  purchaseMode: 'quantity',
  maxQuantity: 5,
  label: 'Disponible (5 en stock)',
};

// Preorder
const availability3: ProductAvailabilityDTO = {
  inStock: true,
  purchaseMode: 'preorder',
  label: 'Sur commande (4-6 semaines)',
};

// Sold out
const availability4: ProductAvailabilityDTO = {
  inStock: false,
  purchaseMode: 'unique',
  label: 'Vendu',
};
```

### ProductDTO

Product list item (catalog, homepage, search results).

```typescript
interface ProductDTO {
  id: string;                       // Unique identifier
  slug: string;                     // URL slug
  title: string;                    // Product name
  intro: string;                    // Short description (1-2 sentences)
  coverImage: ImageDTO;             // Main product image
  price: ProductPriceDTO;           // Price information
  availability: ProductAvailabilityDTO; // Availability
  gesture?: GestureDTO;             // Optional craft type
  territory?: TerritoryDTO;         // Optional region
}
```

**Usage:**
- Product grids
- Featured products section
- Search results
- Related products

### ProductDetailDTO

Extended product information (product detail page).

```typescript
interface ProductDetailDTO extends ProductDTO {
  images: ImageDTO[];              // Gallery images (2-6 photos)
  description: string;             // Full description (HTML)
  dimensions?: string;             // Dimensions text (e.g., "H 35cm × Ø 18cm")
  materials?: string[];            // Materials list
  artisan?: ArtisanDTO;            // Artisan information
  acquisition: string;             // Acquisition info (shipping, lead time, etc.)
  referenceSheet?: Record<string, string>; // Key-value specs
}
```

**Usage:**
- Product detail page (`/objets/[slug]`)

**Example:**
```typescript
const product: ProductDetailDTO = {
  id: 'prod_001',
  slug: 'vase-terre-rouge',
  title: 'Vase en terre rouge',
  intro: 'Vase artisanal façonné à la main...',
  coverImage: { /* ImageDTO */ },
  price: { amount: 120, currency: 'EUR', formattedPrice: '120,00 €' },
  availability: { inStock: true, purchaseMode: 'unique', label: 'Pièce unique' },
  gesture: { id: 'g1', name: 'Poterie', slug: 'poterie' },
  territory: { id: 't2', name: 'Safi', slug: 'safi' },

  // Extended fields
  images: [/* ImageDTO[] */],
  description: '<p>Ce vase en terre rouge...</p>',
  dimensions: 'H 35cm × Ø 18cm',
  materials: ['Terre rouge de Safi', 'Engobe naturel'],
  artisan: { /* ArtisanDTO */ },
  acquisition: 'Pièce unique. Expédition sous 3-5 jours...',
  referenceSheet: {
    'Hauteur': '35 cm',
    'Diamètre': '18 cm',
    'Poids': '1,2 kg',
  },
};
```

---

## Article DTOs

### ArticleDTO

Blog article list item.

```typescript
interface ArticleDTO {
  id: string;              // Unique identifier
  slug: string;            // URL slug
  title: string;           // Article title
  excerpt: string;         // Short excerpt (1-2 paragraphs)
  coverImage: ImageDTO;    // Cover image
  publishedAt: string;     // ISO 8601 date string
  category?: string;       // Category name (e.g., "Savoir-faire")
  author?: {               // Optional author info
    name: string;
    avatar?: ImageDTO;
  };
}
```

**Usage:**
- Article list (`/journal`)
- Related articles

### ArticleDetailDTO

Extended article information (article detail page).

```typescript
interface ArticleDetailDTO extends ArticleDTO {
  content: string;                // Full article content (HTML)
  images?: ImageDTO[];            // Additional images in article
  relatedProducts?: ProductDTO[]; // Related products (0-4)
}
```

**Usage:**
- Article detail page (`/journal/[slug]`)

---

## Filter & Pagination

### FilterParams

Query parameters for filtering product catalog.

```typescript
interface FilterParams {
  gesture?: string;   // Gesture slug (e.g., "poterie")
  territory?: string; // Territory slug (e.g., "marrakech")
  search?: string;    // Search query
  page?: number;      // Page number (1-indexed)
  limit?: number;     // Items per page (default: 12)
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
}
```

**Usage:**
```typescript
const filters: FilterParams = {
  gesture: 'poterie',
  territory: 'safi',
  search: 'vase',
  page: 1,
  limit: 12,
  sort: 'price_asc',
};

const products = await getProducts(filters);
```

### PaginationDTO

Pagination metadata.

```typescript
interface PaginationDTO {
  page: number;       // Current page (1-indexed)
  limit: number;      // Items per page
  total: number;      // Total items across all pages
  totalPages: number; // Total number of pages
}
```

### PaginatedResponse<T>

Generic paginated response wrapper.

```typescript
interface PaginatedResponse<T> {
  data: T[];                  // Items for current page
  pagination: PaginationDTO;  // Pagination metadata
}
```

**Usage:**
```typescript
const response: PaginatedResponse<ProductDTO> = {
  data: [/* ProductDTO[] */],
  pagination: {
    page: 1,
    limit: 12,
    total: 48,
    totalPages: 4,
  },
};
```

### ApiResponse<T>

Generic API response wrapper (error handling).

```typescript
interface ApiResponse<T> {
  data: T;          // Response data
  error?: string;   // Optional error message
}
```

---

## Cart DTOs

### CartItemDTO

Single item in cart.

```typescript
interface CartItemDTO {
  productId: string;        // Product ID
  slug: string;             // Product slug (for routing)
  title: string;            // Product title
  coverImage: ImageDTO;     // Product image
  price: ProductPriceDTO;   // Product price
  quantity: number;         // Quantity in cart
  purchaseMode: PurchaseMode; // Purchase mode
  maxQuantity?: number;     // Max quantity (if mode === 'quantity')
}
```

**CRITICAL:** CartItemDTO contains `price` but frontend should NOT calculate totals.

**Usage:**
- Cart store (`useCartStore`)
- Cart page
- Checkout payload

### CartTotalsDTO

Cart totals (computed by BFF, not frontend).

```typescript
interface CartTotalsDTO {
  itemCount: number;         // Total number of items
  formattedTotal: string;    // Formatted total price (from BFF)
}
```

**CRITICAL:** `formattedTotal` comes from BFF, never computed client-side.

### CartDTO

Full cart with items and totals.

```typescript
interface CartDTO {
  items: CartItemDTO[];      // Cart items
  totals: CartTotalsDTO;     // Totals (from BFF)
}
```

**Usage:**
- Cart page with BFF integration (Phase 6+)
- Checkout summary

---

## Checkout DTOs

### CheckoutPayloadItem

Minimal checkout item (sent to BFF).

```typescript
interface CheckoutPayloadItem {
  productId: string;   // Product ID
  quantity: number;    // Quantity
}
```

**CRITICAL:** Checkout payload is minimal. BFF recalculates everything.

**Usage:**
```typescript
const payload: CheckoutPayloadItem[] = [
  { productId: 'prod_001', quantity: 1 },
  { productId: 'prod_002', quantity: 2 },
];

const session = await createCheckoutSession(payload);
```

### CheckoutSessionDTO

Checkout session response from BFF.

```typescript
interface CheckoutSessionDTO {
  checkoutUrl: string;  // Redirect URL to payment provider
}
```

**Usage:**
```typescript
const session: CheckoutSessionDTO = {
  checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_...',
};

// Redirect user
window.location.href = session.checkoutUrl;
```

### CheckoutStatus

Checkout status enum.

```typescript
type CheckoutStatus =
  | 'DRAFT'      // Just created, not paid
  | 'LOCKED'     // Payment in progress
  | 'PAID'       // Payment successful
  | 'CANCELLED'  // User cancelled
  | 'EXPIRED'    // Session expired
  | 'FAILED';    // Payment failed
```

### CheckoutStatusDTO

Checkout status response (polling endpoint).

```typescript
interface CheckoutStatusDTO {
  status: CheckoutStatus; // Current status
  orderId?: string;       // Order ID (only if PAID)
}
```

**Usage:**
```typescript
// Poll every 2 seconds
const statusResponse: CheckoutStatusDTO = {
  status: 'PAID',
  orderId: 'order_12345',
};

// Redirect to success page
if (statusResponse.status === 'PAID') {
  router.push(`/commande/${statusResponse.orderId}`);
}
```

---

## Contact DTO

### ContactFormDTO

Contact form submission data.

```typescript
interface ContactFormDTO {
  name: string;     // Sender name
  email: string;    // Sender email
  subject: string;  // Message subject
  message: string;  // Message content
}
```

**Usage:**
```typescript
const formData: ContactFormDTO = {
  name: 'Jean Dupont',
  email: 'jean@example.com',
  subject: 'Question sur un produit',
  message: 'Bonjour, je voudrais...',
};

await submitContactForm(formData);
```

**Validation:** See `lib/validations/schemas.ts` → `contactFormSchema`

---

## Filters Metadata

### FiltersMetaDTO

Available filter options for UI.

```typescript
interface FiltersMetaDTO {
  gestures: GestureDTO[];     // Available gestures
  territories: TerritoryDTO[]; // Available territories
}
```

**Usage:**
```typescript
const filtersMeta: FiltersMetaDTO = {
  gestures: [
    { id: 'g1', name: 'Poterie', slug: 'poterie' },
    { id: 'g2', name: 'Tissage', slug: 'tissage' },
  ],
  territories: [
    { id: 't1', name: 'Marrakech', slug: 'marrakech' },
    { id: 't2', name: 'Fès', slug: 'fes' },
  ],
};

// Render filter UI
{filtersMeta.gestures.map(g => (
  <FilterButton key={g.id} value={g.slug}>
    {g.name}
  </FilterButton>
))}
```

---

## Usage Guidelines

### DO ✅

- Import DTOs from `@/types/dtos`
- Use `formattedPrice` for display
- Use `availability.label` for display
- Keep components dumb (no calculations)
- Add Zod schemas for critical DTOs
- Validate BFF responses at runtime

### DON'T ❌

- Create inline types for domain objects
- Compute price totals on frontend (final values)
- Format `amount` client-side (use `formattedPrice`)
- Generate availability text (use `label`)
- Expose Dolibarr fields (`rowid`, `fk_*`)
- Use `any` or `unknown` for DTOs

---

## Zod Schemas

Critical DTOs with runtime validation:

```typescript
// lib/validations/schemas.ts

export const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export const checkoutStatusSchema = z.object({
  status: z.enum(['DRAFT', 'LOCKED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED']),
  orderId: z.string().optional(),
});

export const checkoutSessionSchema = z.object({
  checkoutUrl: z.string().url(),
});
```

---

## API Functions Reference

### Products API

```typescript
// lib/api/products.ts

getProducts(params?: FilterParams): Promise<PaginatedResponse<ProductDTO>>
getProduct(slug: string): Promise<ProductDetailDTO>
getFeaturedProducts(): Promise<ProductDTO[]>
checkStock(productId: string): Promise<{ inStock: boolean }>
```

### Articles API

```typescript
// lib/api/articles.ts

getArticles(params?): Promise<PaginatedResponse<ArticleDTO>>
getArticle(slug: string): Promise<ArticleDetailDTO>
```

### Cart API (Phase 6+)

```typescript
// lib/api/cart.ts

getCartWithTotals(items: CartItemDTO[]): Promise<CartDTO>
```

---

## Changelog

### v1.0 (2026-01-23)
- Initial DTO contract definition
- All Phase 2 DTOs documented
- Zod schemas added for critical flows

---

**Maintained by:** DTO Contract Agent
**Last updated:** 2026-01-23
