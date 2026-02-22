Write all the files : below are the **full, commit-ready markdown contents** for each file in `/spec`, with **consistent formatting** and **final decisions embedded**:

* ✅ **No `/v1` prefix** (aligns with frontend)
* ✅ `sort=price_asc|price_desc` → **400 UNSUPPORTED_SORT** in v1
* ✅ `/checkout/status` uses **`cart_id`** (Medusa-native coherent)
* ✅ Strapi IDs returned as **strings**
* ✅ `defaultVariantId` is **optional v1** but recommended

---

## `/spec/00-contract.md`

````markdown
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
````

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

````

---

## `/spec/01-upstreams-strapi.md`

```markdown
# Upstreams — Strapi (v1)

This file defines the **exact Strapi Content API queries** used by the BFF.
The BFF is a server-to-server consumer; it uses an API token.

---

## 1) Authentication

All requests include:

- `Authorization: Bearer {{STRAPI_API_TOKEN}}`

Base URL:

- `{{STRAPI_BASE_URL}}` (e.g. `http://localhost:1337`)

---

## 2) Strapi Data Model Assumptions

Content types (API IDs):
- `territories`
- `gestures`
- `artisans`
- `product-pages`
- `articles`

Draft/Publish:
- If enabled, the BFF will only receive **published** entries.
- Unpublished entries must behave as **not found** in BFF detail endpoints.

Media:
- Strapi media URLs may be relative; BFF should normalize to absolute URLs.

---

## 3) Product Catalog — Queries

### 3.1 List ProductPages
Used by: `GET /catalog/products`

> Notes:
> - `populate=*` is NOT allowed in production queries. Use explicit populate.
> - Fields limited to what the list needs.

Query template:

````

GET /api/product-pages
?pagination[page]={page}
&pagination[pageSize]={limit}
&sort[0]={SORT}
&populate[cover_image]=true
&populate[gesture]=true
&populate[territory]=true
&fields[0]=title
&fields[1]=slug
&fields[2]=intro
&fields[3]=medusa_product_id
&fields[4]=medusa_variant_id

```

Optional filters:

Search:
```

&filters[$or][0][title][$containsi]={search}
&filters[$or][1][intro][$containsi]={search}

```

Gesture slug:
```

&filters[gesture][slug][$eq]={gesture}

```

Territory slug:
```

&filters[territory][slug][$eq]={territory}

```

Sort mapping:
- `newest` → `publishedAt:desc`
- `name_asc` → `title:asc`

### 3.2 ProductPage Detail by slug
Used by: `GET /catalog/products/{slug}`

```

GET /api/product-pages
?filters[slug][$eq]={slug}
&populate[cover_image]=true
&populate[images]=true
&populate[gesture]=true
&populate[territory]=true
&populate[artisan][populate][portrait]=true
&populate[artisan][populate][territory]=true

```

### 3.3 Featured ProductPages
Used by: `GET /catalog/products/featured`

```

GET /api/product-pages
?filters[is_featured][$eq]=true
&pagination[page]=1
&pagination[pageSize]=6
&sort[0]=featured_rank:asc
&sort[1]=publishedAt:desc
&populate[cover_image]=true
&populate[gesture]=true
&populate[territory]=true
&fields[0]=title
&fields[1]=slug
&fields[2]=intro
&fields[3]=medusa_product_id
&fields[4]=medusa_variant_id

```

---

## 4) Taxonomies — Queries

### 4.1 Gestures
Used by: `GET /catalog/gestures`

```

GET /api/gestures
?pagination[page]=1
&pagination[pageSize]=100
&sort[0]=name:asc

```

### 4.2 Territories
Used by: `GET /catalog/territories`

```

GET /api/territories
?pagination[page]=1
&pagination[pageSize]=100
&sort[0]=name:asc

```

---

## 5) Blog — Queries

### 5.1 Articles list
Used by: `GET /blog/articles`

```

GET /api/articles
?pagination[page]={page}
&pagination[pageSize]={limit}
&sort[0]=publishedAt:desc
&populate[cover_image]=true
&populate[author][populate][avatar]=true

```

Optional category filter:
```

&filters[category][$eq]={category}

```

### 5.2 Article detail (with related products)
Used by: `GET /blog/articles/{slug}`

```

GET /api/articles
?filters[slug][$eq]={slug}
&populate[cover_image]=true
&populate[images]=true
&populate[author][populate][avatar]=true
&populate[related_products][populate][cover_image]=true
&populate[related_products][populate][gesture]=true
&populate[related_products][populate][territory]=true
&populate[related_products][fields][0]=title
&populate[related_products][fields][1]=slug
&populate[related_products][fields][2]=intro
&populate[related_products][fields][3]=medusa_product_id
&populate[related_products][fields][4]=medusa_variant_id

````

---

## 6) Response Shape Reminder (Strapi v4)

List endpoints return:

```json
{
  "data": [{ "id": 1, "attributes": { ... } }],
  "meta": { "pagination": { ... } }
}
````

BFF must:

* stringify `id`
* map `attributes.*` into DTO fields
* map media into `ImageDTO`

````

---

## `/spec/02-upstreams-medusa.md`

```markdown
# Upstreams — Medusa Store API (v1)

This file defines the **exact Medusa Store API calls** used by the BFF.
All calls are server-to-server, but use the Store API for stable customer-facing behavior.

---

## 1) Authentication / Headers

Base URL:
- `{{MEDUSA_BASE_URL}}` (e.g. `http://localhost:9000`)

Headers for all Store calls:
- `x-publishable-api-key: {{MEDUSA_PUBLISHABLE_KEY}}`

Pricing resolution parameters (required):
- `region_id={{MEDUSA_REGION_ID}}`
- `currency_code=EUR`

---

## 2) Product Hydration

### 2.1 Batch hydrate (preferred if supported)
Used in: catalog list, featured, relatedProducts

````

GET /store/products
?region_id={REGION_ID}
&currency_code=EUR
&id[]={prod_1}
&id[]={prod_2}
&limit=200

```

If Medusa does not support `id[]`, fallback to per-id fetch with dedupe+short cache:

### 2.2 Single product
```

GET /store/products/{product_id}?region_id={REGION_ID}&currency_code=EUR

```

---

## 3) Pricing Resolution Rules (Critical)

The frontend DTO requires `price` always present.

### Decision (v1 strict)
If Medusa does not return a resolvable price for the default variant:
- return `500 PRICE_NOT_RESOLVABLE`

### Default price selection rules
- For v1 (unique items), choose:
  - `default_variant = product.variants[0]`
- Resolve:
  - prefer `default_variant.calculated_price` if not null
  - otherwise try `default_variant.prices[]` selecting EUR and matching region rules
  - if still missing: `PRICE_NOT_RESOLVABLE`

---

## 4) Stock / Availability

### Availability inference (v1)
For unique items:
- inStock = true if inventory quantity >= 1 (preferred)
- else if inventory not accessible in Store API:
  - infer from variant purchasability fields if present
  - else treat as in stock unless `manage_inventory=true` and quantity known as 0 via any available endpoint
- When in doubt, prefer correctness: if cannot verify reliably, return `inStock=false` and log.

BFF endpoint `/catalog/products/{productId}/stock` must be `no-store`.

---

## 5) Checkout (Medusa-native)

The BFF implements checkout as cart orchestration.

### 5.1 Create cart
```

POST /store/carts
Content-Type: application/json

{ "region_id": "{REGION_ID}" }

```

### 5.2 Add line item
```

POST /store/carts/{cart_id}/line-items
Content-Type: application/json

{ "variant_id": "variant_...", "quantity": 1 }

```

### 5.3 Create payment sessions
```

POST /store/carts/{cart_id}/payment-sessions

```

### 5.4 Select payment provider (Stripe)
```

POST /store/carts/{cart_id}/payment-session
Content-Type: application/json

{ "provider_id": "stripe" }

```

### 5.5 Complete cart (optional; depends on integration)
```

POST /store/carts/{cart_id}/complete

```

> Note: Depending on your Medusa Stripe setup, you may obtain:
> - a hosted checkout url, OR
> - a payment intent client secret, OR
> - an order created on completion
> In v1 BFF contract, we allow `checkoutUrl?` optional.

---

## 6) Checkout Status (Decision: cart_id)

The BFF endpoint:
- `GET /checkout/status?cart_id=...`

BFF should read cart/order state from Medusa.

Possible upstream reads (implementation-dependent):
- `GET /store/carts/{cart_id}` (if available)
- `GET /store/orders/{order_id}` (if order id known)
- If only the completion endpoint returns order id, BFF stores it.

Status mapping to contract:
- DRAFT: cart exists, payment not started
- LOCKED: payment session exists / in progress
- PAID: order confirmed / payment captured
- CANCELLED: user cancelled
- EXPIRED: cart/session expired
- FAILED: payment failed

---

## 7) Customer Account

### 7.1 Register
```

POST /auth/customer/emailpass/register
Content-Type: application/json

{ "email": "...", "password": "...", "first_name": "...", "last_name": "..." }

```

### 7.2 Login
```

POST /auth/customer/emailpass
Content-Type: application/json

{ "email": "...", "password": "..." }

```

Expected: returns a token usable as Bearer for Store requests.

### 7.3 Me
```

GET /store/customers/me
Authorization: Bearer {token}

```

BFF stores token in httpOnly cookie and sends it as Bearer upstream.
```

---

## `/spec/03-workflows.md`

```markdown
# Workflows & Call Sequences (v1)

This document describes the **order of calls** for end-to-end workflows.
It is used to validate the architecture in Postman before BFF implementation.

---

## 1) Catalog Page (Objects Listing)

### Frontend → BFF call order
1) `GET /catalog/gestures`
2) `GET /catalog/territories`
3) `GET /catalog/products?page=1&limit=12&sort=newest`

### BFF internal upstream calls
- Strapi:
  - list ProductPages with filters/pagination/populate
- Medusa:
  - hydrate products by `medusa_product_id` (batch preferred)
- Merge:
  - Strapi provides title/slug/intro/images/gesture/territory
  - Medusa provides price/availability/defaultVariantId (if missing from Strapi)

---

## 2) Product Detail Page (Object Detail)

### Frontend → BFF
- `GET /catalog/products/{slug}`

### BFF internal upstream calls
- Strapi:
  - detail ProductPage by slug with deep populate:
    - cover_image, images, gesture, territory, artisan (portrait + territory)
- Medusa:
  - get product by `medusa_product_id`
- Merge:
  - compute `images` array excluding coverImage
  - include artisan block from Strapi
  - add price + availability from Medusa

---

## 3) Checkout (Medusa-native)

### Frontend → BFF
1) `POST /checkout/session`
   - body: `[ { productId, quantity, variantId? } ]`
2) Redirect (optional) if `checkoutUrl` is returned
3) Poll:
   - `GET /checkout/status?cart_id={cartId}` (every 2s until terminal)

### BFF internal upstream sequence
1) `POST /store/carts` (region)
2) For each item:
   - resolve variant_id:
     - prefer request.variantId
     - else use Strapi ProductPage.medusa_variant_id
     - else fallback to Medusa product.variants[0].id
   - `POST /store/carts/{cart_id}/line-items`
3) `POST /store/carts/{cart_id}/payment-sessions`
4) `POST /store/carts/{cart_id}/payment-session` `{ provider_id: "stripe" }`
5) Optionally:
   - `POST /store/carts/{cart_id}/complete`

---

## 4) Account (Customer)

### Frontend → BFF
- Register: `POST /account/register`
- Login: `POST /account/login` (sets cookie)
- Me: `GET /account/me`
- Logout: `POST /account/logout`

### BFF internal upstream calls
- Medusa Auth:
  - register/login to obtain token
- Store API:
  - `GET /store/customers/me` using Bearer token
- Cookie:
  - BFF stores token in httpOnly cookie and injects it upstream

---

## 5) Blog + Related Products

### Frontend → BFF
- list: `GET /blog/articles?page=1&limit=10`
- detail: `GET /blog/articles/{slug}`

### BFF internal upstream calls
- Strapi:
  - articles list/detail with author & media
  - article detail includes related ProductPages
- Medusa:
  - hydrate related products by medusa_product_id
- Merge:
  - return ArticleDetailDTO with `relatedProducts` limited to max 4
```

---

## `/spec/04-edge-cases.md`

````markdown
# Edge Cases & Error Policy (v1)

This document defines how the BFF must behave in non-happy paths.
It prevents random behavior and frontend inconsistencies.

---

## 1) Unsupported Sorting (R1)

### Case
Frontend requests:
- `sort=price_asc` or `sort=price_desc`

### Decision (v1)
Global price sort is **not supported** because pagination is driven by Strapi (discovery).
BFF MUST return:

- HTTP 400
```json
{
  "error": "Sorting by price is not supported in v1",
  "code": "UNSUPPORTED_SORT",
  "details": { "supported": ["newest", "name_asc"] }
}
````

---

## 2) Ghost Product References (Strapi → Medusa mismatch)

### Case

Strapi ProductPage contains `medusa_product_id` that no longer exists in Medusa.

### Policy

* List endpoints: **drop silently** and log `GHOST_PRODUCT_REFERENCE`
* Detail endpoint: **404 PRODUCT_NOT_FOUND**

Example 404:

```json
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## 3) Empty Data Responses from Strapi (Not an error)

### Case

Strapi returns 200 but empty list because filters match nothing (e.g. `slug=string`)

### Policy

* List endpoints: return empty list with pagination
* Detail endpoints: return 404 if no match

---

## 4) Draft/Publish Issues

### Case

Content exists in Strapi but is not published (Draft/Publish enabled)

### Policy

BFF cannot access unpublished content via Content API.

* treat as 404 for detail endpoints

---

## 5) Price Not Resolvable (Critical)

### Case

Medusa returns product but `calculated_price` is null and no resolvable price exists.

### Decision (v1 strict)

Return HTTP 500:

```json
{
  "error": "Price could not be resolved for product",
  "code": "PRICE_NOT_RESOLVABLE",
  "details": { "productId": "prod_..." }
}
```

---

## 6) Stock / Out of stock

### Case

Stock check fails or confirms no stock.

### Policy

* checkout creation returns 409:

```json
{
  "error": "Product out of stock",
  "code": "OUT_OF_STOCK",
  "productId": "prod_..."
}
```

---

## 7) Checkout Provider Misconfiguration

### Case

Stripe provider not enabled / payment session creation fails.

### Policy

* return 500 `PAYMENT_PROVIDER_ERROR`

---

## 8) Auth Errors

### Invalid credentials

* 401:

```json
{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

### Missing session

* 401:

```json
{
  "error": "Not authenticated",
  "code": "UNAUTHENTICATED"
}
```

---

## 9) Rate limiting (Contact)

### Policy

* 429:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": { "retryAfter": 60 }
}
```

````

---

## `/spec/05-testing-postman.md`

```markdown
# Postman Test Plan (v1)

Goal: validate upstream coherence and the BFF contract end-to-end.

---

## 1) Phase A — Upstreams Only (Before BFF)

### A1) Strapi sanity checks
1) `GET /api/gestures?pagination[page]=1&pagination[pageSize]=25&sort[0]=name:asc`
2) `GET /api/territories?...`
3) `GET /api/artisans?...`
4) `GET /api/product-pages?...populate...`
5) `GET /api/articles?...populate...`

Validate:
- published entries appear
- populate returns required linked data
- ProductPage includes `medusa_product_id`

### A2) Medusa store checks
1) `GET /store/products?region_id=...`
2) Verify product appears and has variants
3) Verify pricing is resolvable for store context (price not null)

### A3) Medusa checkout (native)
1) `POST /store/carts` `{region_id}`
2) `POST /store/carts/{cartId}/line-items` `{variant_id, quantity}`
3) `POST /store/carts/{cartId}/payment-sessions`
4) `POST /store/carts/{cartId}/payment-session` `{provider_id:"stripe"}`

If supported:
5) `POST /store/carts/{cartId}/complete`

---

## 2) Phase B — BFF End-to-End (After implementation)

## Folder: Catalog
- GET `/catalog/gestures`
- GET `/catalog/territories`
- GET `/catalog/products?page=1&limit=12&sort=newest`
- GET `/catalog/products/{slug}`
- GET `/catalog/products/featured`
- GET `/catalog/products/{productId}/stock`

Assertions:
- ProductDTO includes `price.formattedPrice`
- `images` excludes `coverImage` on detail
- IDs are strings for Strapi items

## Folder: Blog
- GET `/blog/articles?page=1&limit=10`
- GET `/blog/articles/{slug}`

Assertions:
- `relatedProducts` max 4
- related products are full ProductDTO (have price/availability)

## Folder: Checkout
- POST `/checkout/session`
- GET `/checkout/status?cart_id={{cartId}}` (poll)

Assertions:
- session returns `cartId`
- status transitions to terminal

## Folder: Account
- POST `/account/register`
- POST `/account/login`
- GET `/account/me`
- POST `/account/logout`

Assertions:
- cookie set on login
- /me returns customer

## Folder: Contact
- POST `/contact`
- Confirm rate limit returns 429 after threshold

---

## 3) Recommended Postman Environment Variables

- `BFF_URL`
- `STRAPI_BASE_URL`
- `STRAPI_API_TOKEN`
- `MEDUSA_BASE_URL`
- `MEDUSA_PUBLISHABLE_KEY`
- `MEDUSA_REGION_ID`

Runtime variables set by tests:
- `product_slug`
- `medusa_product_id`
- `variant_id`
- `cart_id`
- `article_slug`
````

---

## `/spec/06-seeding-assumptions.md`

```markdown
# Seeding Assumptions (v1)

This defines the **minimal data** required in Strapi and Medusa so the BFF can function.

---

## 1) Strapi Content Types (Required Fields)

## 1.1 Territory (`territories`)
Required:
- `name` (string)
- `slug` (uid)

## 1.2 Gesture (`gestures`)
Required:
- `name` (string)
- `slug` (uid)

## 1.3 Artisan (`artisans`)
Required:
- `name` (string)
Recommended:
- `bio` (text)
- `portrait` (media single)
- `territory` (relation to territories)
Optional:
- `workshopLocation`, `specialty`, `yearsExperience`, `transmissionMode`, `equipment`

## 1.4 ProductPage (`product-pages`)
Required:
- `title` (string)
- `slug` (uid)
- `cover_image` (media single)
- `gesture` (relation)
- `territory` (relation)
- `medusa_product_id` (string)  ✅ critical
Recommended:
- `medusa_variant_id` (string) ✅ avoid N+1 checkout
Optional:
- `intro`
- `images` (media multiple)
- `description_html` (rich text/html)
- `dimensions` (string)
- `materials` (repeatable string)
- `acquisition` (text)
- `reference_sheet` (json object)
- `artisan` (relation)
- `is_featured` (boolean)
- `featured_rank` (number)

## 1.5 Article (`articles`)
Required:
- `title`, `slug`, `content` (html/rich), `cover_image`, `publishedAt`
Optional:
- `excerpt`, `images`
- `author` (component: name + avatar)
- `related_products` (relation to product-pages)

---

## 2) Medusa Required Setup

- A valid region exists:
  - `MEDUSA_REGION_ID` configured and active
- At least one product exists with:
  - `product.id = prod_*`
  - at least one variant `variant_*`
  - store-visible pricing resolvable in the store API context
- Inventory is configured for unique items:
  - quantity ≥ 1 for in-stock
  - quantity = 0 for out-of-stock

---

## 3) Linking Rule (Strapi ↔ Medusa)

- Strapi is authoritative for slug/storytelling
- Medusa is authoritative for commerce ids

The ProductPage stores:
- `medusa_product_id`
- `medusa_variant_id`

BFF uses them to fetch commerce data and merge into DTOs.
```

---

## `/spec/07-deployment-notes.md`

```markdown
# Deployment Notes (v1)

Operational notes for deploying the BFF in staging/production.

---

## 1) Environment Variables

Required:
- `BFF_PORT=4000`
- `NODE_ENV=development|production`
- `STRAPI_BASE_URL=http://localhost:1337`
- `STRAPI_API_TOKEN=...`
- `MEDUSA_BASE_URL=http://localhost:9000`
- `MEDUSA_PUBLISHABLE_KEY=...`
- `MEDUSA_REGION_ID=...`

Recommended:
- `COOKIE_DOMAIN=.marrakea.com`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `LOG_LEVEL=info`

---

## 2) CORS

Allow origins:
- `https://marrakea.com`
- `https://www.marrakea.com`
- `http://localhost:3000`

Must set:
- `Access-Control-Allow-Credentials: true`
- No wildcard origin in production

---

## 3) Cookies / Sessions

The BFF stores Medusa customer token in an httpOnly cookie:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: none` in production (cross-site)
- `domain: .marrakea.com` if needed for subdomains

Frontend must call with:
- `credentials: "include"`

---

## 4) Reverse Proxy / Trust Proxy

If behind a proxy (nginx/vercel), enable trust proxy so rate limiting and IP logging work:
- trust `X-Forwarded-For`

---

## 5) Observability

- Generate `requestId` per incoming request
- Log upstream calls with:
  - url path
  - status
  - duration
- Never log tokens or authorization headers

---

## 6) Caching

Catalog and blog endpoints must set Cache-Control per contract:
- list/detail products: `s-maxage=60`
- featured: `s-maxage=300`
- gestures/territories: `s-maxage=3600`
- articles: `s-maxage=120`
All transactional endpoints: `no-store`

---

## 7) Release checklist

- ✅ Strapi content types created
- ✅ product-pages populated with medusa ids
- ✅ Medusa region + pricing working in Store API
- ✅ Postman upstream tests passing
- ✅ BFF Postman collection green
- ✅ CORS + cookies verified in browser
```
