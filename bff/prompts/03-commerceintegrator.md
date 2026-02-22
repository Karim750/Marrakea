# Subagent: CommerceIntegrator

## Role

Implement catalog, checkout, and account modules by orchestrating Strapi (discovery/content) and Medusa (commerce/pricing).

---

## Inputs

Read before starting:

- `/spec/00-contract.md` — API contract (DTOs, endpoints, errors)
- `/spec/01-upstreams-strapi.md` — Strapi API details
- `/spec/02-upstreams-medusa.md` — Medusa API details
- `/spec/03-workflows.md` — Data flow patterns
- `/spec/04-edge-cases.md` — Edge case handling

---

## Task

### 1. Catalog Module

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/catalog/products` | List products with filters |
| GET | `/v1/catalog/products/{slug}` | Product detail by slug |
| GET | `/v1/catalog/products/featured` | Featured products |
| GET | `/v1/catalog/products/{productId}/stock` | Real-time stock check |
| GET | `/v1/catalog/gestures` | Gift gesture categories |
| GET | `/v1/catalog/territories` | Available territories |

**Data Flow:**
1. Strapi provides: product discovery, artisan stories, images, gestures, territories
2. Medusa provides: pricing, stock, variant details
3. BFF merges into unified `ProductDTO`

**Performance Rules:**
- Avoid N+1: batch hydrate Medusa data for list endpoints
- If batch not possible: dedupe product IDs, short cache (60s)
- Use parallel requests where possible

**Ghost Product Handling:**
- List endpoints: silently drop products not found in Medusa
- Detail endpoint: return 404 `PRODUCT_NOT_FOUND`

**Sorting:**
- `price_asc` / `price_desc`: return 400 `UNSUPPORTED_SORT`
- Other sorts: delegate to Strapi

### 2. Checkout Module

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/checkout/session` | Create/resume checkout session |
| GET | `/v1/checkout/status` | Get checkout status by cart_id |

**Data Flow:**
1. Session creates or retrieves Medusa cart
2. Status returns cart state with line items hydrated

**Session Management:**
- Use cookies for cart_id persistence
- Support anonymous and authenticated carts

### 3. Account Module

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/account/register` | Create customer account |
| POST | `/v1/account/login` | Authenticate customer |
| GET | `/v1/account/me` | Get current customer profile |
| POST | `/v1/account/logout` | Clear session |

**Data Flow:**
- All operations proxy to Medusa customer API
- Manage auth tokens via httpOnly cookies

### 4. Shared DTOs

Create Zod schemas in `src/shared/dtos/`:

```typescript
// product.dto.ts
export const ProductDTO = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  defaultVariantId: z.string(),
  price: PriceDTO,
  images: z.array(ImageDTO),
  artisan: ArtisanDTO.optional(),
  // ... per contract
})

// Validate before every response
export const validateProductDTO = (data: unknown) => ProductDTO.parse(data)
```

### 5. Mapping Layer

Create mappers that transform upstream responses:

```typescript
// src/modules/catalog/mappers/product.mapper.ts
export const mapToProductDTO = (
  strapiProduct: StrapiProduct,
  medusaProduct: MedusaProduct
): ProductDTO => {
  // Merge logic
  // Compute defaultVariantId
  // Return validated DTO
}
```

---

## Outputs

| File | Description |
|------|-------------|
| `src/modules/catalog/catalog.controller.ts` | Route handlers |
| `src/modules/catalog/catalog.service.ts` | Business logic |
| `src/modules/catalog/catalog.routes.ts` | Route definitions |
| `src/modules/catalog/mappers/*.ts` | Data mappers |
| `src/modules/checkout/checkout.controller.ts` | Route handlers |
| `src/modules/checkout/checkout.service.ts` | Business logic |
| `src/modules/checkout/checkout.routes.ts` | Route definitions |
| `src/modules/account/account.controller.ts` | Route handlers |
| `src/modules/account/account.service.ts` | Business logic |
| `src/modules/account/account.routes.ts` | Route definitions |
| `src/shared/dtos/product.dto.ts` | Product Zod schema |
| `src/shared/dtos/checkout.dto.ts` | Checkout Zod schema |
| `src/shared/dtos/account.dto.ts` | Account Zod schema |
| `src/modules/catalog/__tests__/*.test.ts` | Unit tests |

---

## Validation Checklist

Before marking complete:

- [ ] All endpoints match contract exactly
- [ ] Zod validation on every response
- [ ] `defaultVariantId` computed correctly
- [ ] N+1 avoided on list endpoints
- [ ] Ghost products handled per policy
- [ ] Price sorting returns 400
- [ ] Checkout session uses cookies
- [ ] Account tokens in httpOnly cookies
- [ ] Mappers have unit tests
- [ ] Error responses use standard format
