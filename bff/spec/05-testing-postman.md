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
