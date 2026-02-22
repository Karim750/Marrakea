# MARRAKEA BFF — Contract (v1)

**Status:** Ready for implementation
**Audience:** Frontend Next.js + BFF implementation
**Architecture:** Strapi (editorial/discovery) + Medusa (commerce) + BFF (DTO aggregation)

---

## 0) Purpose

This document is the **single source of truth** for the BFF API contract consumed by the Next.js frontend.

The BFF:
- **Aggregates** Strapi and Medusa data
- **Implements business logic** (pricing, stock interpretation, checkout orchestration)
- Returns **DTOs** (strict schema + runtime validation)
- Never exposes raw upstream structures to the frontend

---

## 1) Global Conventions

### 1.1 Base URL
- Production: `https://api.marrakea.com`
- Dev: `{{BFF_URL}}` (e.g. `http://localhost:4000`)

### 1.2 Versioning (Decision)
**No `/v1` URL prefix** in v1 to match frontend expectations.
If needed later: introduce `/v2/...` only for breaking changes.

### 1.3 Content vs Commerce Separation
- **Strapi = discovery/editorial**
  - ProductPage, Artisan, Gesture, Territory, Article
- **Medusa = commerce**
  - Product, Variant, Price, Inventory, Cart, Customer, Payment

### 1.4 Linking Rule (Critical)
Strapi ProductPage must contain:
- `medusa_product_id` (required)
- `medusa_variant_id` (recommended)

The BFF never tries to infer links from Strapi numeric IDs.

### 1.5 ID Rules (Decision)
- Strapi IDs are numeric → returned as **strings** (e.g. `"12"`)
- Medusa IDs are unchanged (e.g. `prod_*`, `variant_*`, `cart_*`, `order_*`)

### 1.6 Standard Error Response
All errors MUST follow:

```json
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 1.7 Caching Strategy

* Public content endpoints use CDN-friendly caching (`s-maxage` + `stale-while-revalidate`)
* Checkout/account/contact/stock are `no-store`

See §7 for exact headers.

---

## 2) DTO Definitions (Contract)

> All DTOs below are normative. The BFF must validate responses at runtime.

### 2.1 Common DTOs

#### ImageDTO

```ts
type ImageDTO = {
  url: string
  alt: string
  width?: number
  height?: number
  blurDataUrl?: string
}
```

#### MoneyDTO

```ts
type MoneyDTO = {
  amount: number
  currency: "EUR"
  formattedPrice: string
}
```

#### AvailabilityDTO

```ts
type AvailabilityDTO = {
  inStock: boolean
  purchaseMode: "unique" | "standard"
  label: string
}
```

#### PaginatedResponse<T>

```ts
type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

#### ErrorResponse

```ts
type ErrorResponse = {
  error: string
  code: string
  details?: Record<string, unknown>
}
```

---

### 2.2 Catalog DTOs

#### GestureDTO

```ts
type GestureDTO = {
  id: string
  name: string
  slug: string
}
```

#### TerritoryDTO

```ts
type TerritoryDTO = {
  id: string
  name: string
  slug: string
}
```

#### ArtisanDTO

```ts
type ArtisanDTO = {
  id: string
  name: string
  bio?: string
  portrait?: ImageDTO
  territory?: TerritoryDTO
  workshopLocation?: string
  specialty?: string
  yearsExperience?: string
  transmissionMode?: string
  equipment?: string
}
```

#### ProductDTO (List item)

```ts
type ProductDTO = {
  id: string
  slug: string
  title: string
  intro?: string
  coverImage: ImageDTO
  price: MoneyDTO
  availability: AvailabilityDTO
  gesture: GestureDTO
  territory: TerritoryDTO

  /**
   * Optional v1, strongly recommended to avoid N+1 during checkout.
   * Should match the single "unique" variant for most products.
   */
  defaultVariantId?: string
}
```

#### ProductDetailDTO

```ts
type ProductDetailDTO = ProductDTO & {
  images: ImageDTO[]               // secondary images only; coverImage excluded
  description?: string             // HTML (sanitized)
  dimensions?: string
  materials?: string[]
  artisan?: ArtisanDTO
  acquisition?: string
  referenceSheet?: Record<string, string>
}
```

---

### 2.3 Blog DTOs

#### ArticleDTO

```ts
type ArticleDTO = {
  id: string
  slug: string
  title: string
  excerpt?: string
  coverImage: ImageDTO
  publishedAt: string
  category?: string
  author?: {
    name: string
    avatar?: ImageDTO
  }
}
```

#### ArticleDetailDTO

```ts
type ArticleDetailDTO = ArticleDTO & {
  content: string                 // HTML (sanitized)
  images?: ImageDTO[]
  relatedProducts?: ProductDTO[]  // max 4 items
}
```

---

### 2.4 Checkout DTOs

#### CheckoutPayloadItem

```ts
type CheckoutPayloadItem = {
  productId: string
  quantity: number
  variantId?: string
}
```

#### CheckoutSessionDTO

```ts
type CheckoutSessionDTO = {
  cartId: string
  checkoutUrl?: string
}
```

#### CheckoutStatusDTO

```ts
type CheckoutStatusDTO = {
  status: "DRAFT" | "LOCKED" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED"
  orderId?: string
}
```

---

### 2.5 Account DTOs

#### RegisterPayload

```ts
type RegisterPayload = {
  email: string
  password: string
  firstName?: string
  lastName?: string
}
```

#### LoginPayload

```ts
type LoginPayload = {
  email: string
  password: string
}
```

#### CustomerDTO

```ts
type CustomerDTO = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}
```

---

## 3) Catalog Endpoints

### 3.1 GET `/catalog/products`

List paginated products.

#### Query params

| Param     |   Type | Required | Notes                                           |
| --------- | -----: | -------: | ----------------------------------------------- |
| page      |    int |       no | default 1                                       |
| limit     |    int |       no | default 12                                      |
| search    | string |       no | title/intro search                              |
| gesture   | string |       no | gesture.slug                                    |
| territory | string |       no | territory.slug                                  |
| sort      | string |       no | `newest`, `name_asc`, `price_asc`, `price_desc` |

#### Sorting (Decision)

* Supported in v1: `newest`, `name_asc`
* Unsupported in v1: `price_asc`, `price_desc` → **400 UNSUPPORTED_SORT**

#### Response

`PaginatedResponse<ProductDTO>`

#### Errors

* 400 `UNSUPPORTED_SORT`

#### Cache

`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

---

### 3.2 GET `/catalog/products/{slug}`

Return product detail by slug.

#### Path param

* `slug` (string)

#### Response

`ProductDetailDTO`

#### Errors

* 404 `PRODUCT_NOT_FOUND`

#### Cache

`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

---

### 3.3 GET `/catalog/products/featured`

Return featured products (max 6).

#### Response

`ProductDTO[]`

#### Cache

`Cache-Control: public, s-maxage=300, stale-while-revalidate=600`

---

### 3.4 GET `/catalog/products/{productId}/stock`

Return realtime stock state (client-side safe).

#### Response

```json
{ "inStock": true }
```

#### Cache

`Cache-Control: no-store`

---

### 3.5 GET `/catalog/gestures`

Return gestures.

#### Response

`GestureDTO[]`

#### Cache

`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`

---

### 3.6 GET `/catalog/territories`

Return territories.

#### Response

`TerritoryDTO[]`

#### Cache

`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`

---

## 4) Blog Endpoints

### 4.1 GET `/blog/articles`

List paginated articles.

#### Query params

| Param    |   Type | Required | Notes       |
| -------- | -----: | -------: | ----------- |
| page     |    int |       no | default 1   |
| limit    |    int |       no | default 10  |
| category | string |       no | exact match |

#### Response

`PaginatedResponse<ArticleDTO>`

#### Cache

`Cache-Control: public, s-maxage=120, stale-while-revalidate=300`

---

### 4.2 GET `/blog/articles/{slug}`

Get article detail by slug.

#### Response

`ArticleDetailDTO` (includes `relatedProducts` max 4)

#### Errors

* 404 `ARTICLE_NOT_FOUND`

#### Cache

`Cache-Control: public, s-maxage=120, stale-while-revalidate=300`

---

## 5) Checkout Endpoints

### 5.1 POST `/checkout/session`

Create a Medusa-native checkout session (cart + payment session).
May return a hosted `checkoutUrl` depending on Stripe mode.

#### Request body

`CheckoutPayloadItem[]`

#### Response

`CheckoutSessionDTO`

#### Errors

* 400 `INVALID_QUANTITY`
* 404 `PRODUCT_NOT_FOUND`
* 409 `OUT_OF_STOCK`
* 500 `PAYMENT_PROVIDER_ERROR`

#### Cache

`Cache-Control: no-store`

---

### 5.2 GET `/checkout/status?cart_id=...` (Decision)

Return status of checkout for polling.

#### Query params

* `cart_id` (string, required)

#### Response

`CheckoutStatusDTO`

#### Cache

`Cache-Control: no-store`

---

## 6) Account Endpoints

### 6.1 POST `/account/register`

Register customer (Medusa auth).

* Request: `RegisterPayload`
* Response: `CustomerDTO`

Cache: `no-store`

---

### 6.2 POST `/account/login`

Login customer and set session cookie.

* Request: `LoginPayload`
* Response: `CustomerDTO`

Cache: `no-store`

---

### 6.3 GET `/account/me`

Return current logged in customer.

* Response: `CustomerDTO`

Errors:

* 401 `UNAUTHENTICATED`

Cache: `no-store`

---

### 6.4 POST `/account/logout`

Clear session cookie.

Response:

```json
{ "success": true }
```

Cache: `no-store`

---

## 7) Contact Endpoint

### 7.1 POST `/contact`

Request:

```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "subject": "Question sur un produit",
  "message": "Bonjour ..."
}
```

Response:

```json
{ "success": true, "message": "Message envoyé avec succès" }
```

Errors:

* 400 `INVALID_EMAIL`
* 429 `RATE_LIMIT_EXCEEDED`

Cache: `no-store`

---

## 8) Health Endpoint

### 8.1 GET `/health`

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-25T12:00:00Z",
  "services": { "strapi": "up", "medusa": "up" }
}
```

Cache: `no-store`
