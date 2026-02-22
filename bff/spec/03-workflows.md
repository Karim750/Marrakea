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
