# MARRAKEA BFF — Contract Decisions (v1)

This document summarizes all locked decisions for v1. These are non-negotiable unless `/spec/00-contract.md` is updated first.

---

## D1: No URL Version Prefix

**Decision:** No `/v1` prefix on BFF routes.

**Rationale:** Aligns with frontend expectations. Future breaking changes will use `/v2/...`.

**Example:**
- Correct: `GET /catalog/products`
- Incorrect: `GET /v1/catalog/products`

---

## D2: Price Sorting Not Supported

**Decision:** `sort=price_asc` and `sort=price_desc` return **400 UNSUPPORTED_SORT**.

**Rationale:** Pagination is driven by Strapi (discovery layer). Global price sort would require cross-system coordination that is out of scope for v1.

**Supported sorts in v1:**
- `newest` (default) → `publishedAt:desc`
- `name_asc` → `title:asc`

**Error response:**
```json
{
  "error": "Sorting by price is not supported in v1",
  "code": "UNSUPPORTED_SORT",
  "details": { "supported": ["newest", "name_asc"] }
}
```

---

## D3: Checkout Status Uses `cart_id`

**Decision:** `/checkout/status` uses query parameter `cart_id` (not `session_id`).

**Rationale:** Medusa-native coherent naming. The cart is the authoritative checkout artifact.

**Example:**
```
GET /checkout/status?cart_id=cart_01HXYZ...
```

---

## D4: Strapi IDs Returned as Strings

**Decision:** All Strapi IDs (numeric in database) are returned as **strings** in DTOs.

**Rationale:** Consistency and type safety. Frontend should not assume numeric IDs.

**Example:**
```json
{
  "id": "12",
  "name": "Tissage",
  "slug": "tissage"
}
```

---

## D5: Linking Rule (Strapi ↔ Medusa)

**Decision:** Strapi ProductPage must store:
- `medusa_product_id` (required)
- `medusa_variant_id` (recommended)

**Rationale:** The BFF never infers links from Strapi numeric IDs. Explicit mapping is required.

**Impact:**
- Products without `medusa_product_id` cannot be hydrated with price/availability
- Missing `medusa_variant_id` may cause N+1 during checkout variant resolution

---

## D6: `defaultVariantId` is Optional

**Decision:** `ProductDTO.defaultVariantId` is optional in v1.

**Rationale:** Strongly recommended to avoid N+1 during checkout, but not strictly required.

**Implementation:**
- Prefer `medusa_variant_id` from Strapi if available
- Fallback to `product.variants[0].id` from Medusa

---

## D7: Price Resolution is Strict

**Decision:** If price cannot be resolved from Medusa, return **500 PRICE_NOT_RESOLVABLE**.

**Rationale:** Frontend requires `price` field always present. Silent failures would cause inconsistent UI.

**Resolution order:**
1. `variant.calculated_price` (preferred)
2. `variant.prices[]` filtered by EUR + region
3. If still null → error

---

## D8: Ghost Product Policy

**Decision:**
- List endpoints: drop silently + log `GHOST_PRODUCT_REFERENCE`
- Detail endpoints: return **404 PRODUCT_NOT_FOUND**

**Rationale:** Strapi may reference Medusa products that no longer exist. Lists should remain usable; details should fail explicitly.

---

## D9: `ProductDetailDTO.images` Excludes Cover

**Decision:** The `images` array in `ProductDetailDTO` must **exclude** `coverImage`.

**Rationale:** Prevents duplication. Cover image is always in `coverImage` field; secondary images are in `images` array.

---

## D10: Error Format is Mandatory

**Decision:** All errors must return:
```json
{
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**No exceptions.** The `details` field is optional but must be present if additional context is available.

---

## D11: Cache Headers per Endpoint Type

**Decision:**

| Endpoint Type | Cache-Control |
|---------------|---------------|
| Product list/detail | `public, s-maxage=60, stale-while-revalidate=300` |
| Featured products | `public, s-maxage=300, stale-while-revalidate=600` |
| Gestures/Territories | `public, s-maxage=3600, stale-while-revalidate=86400` |
| Articles | `public, s-maxage=120, stale-while-revalidate=300` |
| Checkout/Account/Contact/Stock/Health | `no-store` |

---

## D12: Auth Token in httpOnly Cookie

**Decision:** Medusa customer token is stored in an httpOnly cookie by the BFF.

**Cookie settings:**
- `httpOnly: true`
- `secure: true` in production
- `sameSite: none` in production (for cross-site)
- `domain: .marrakea.com` for subdomain sharing

**Frontend requirement:** Must call with `credentials: "include"`.

---

## D13: No N+1 for Product Hydration

**Decision:** Batch hydrate Medusa products when possible.

**Implementation:**
- Prefer `GET /store/products?id[]=...` batch endpoint
- Fallback: dedupe + short in-memory cache (5s TTL) + `Promise.all`

---

## D14: Rate Limiting on Contact

**Decision:** Contact endpoint is rate-limited.

**Default limits:**
- 5 requests per minute per IP

**Error response:**
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": { "retryAfter": 60 }
}
```

---

## Summary Table

| ID | Decision | Status |
|----|----------|--------|
| D1 | No `/v1` prefix | Locked |
| D2 | Price sort → 400 | Locked |
| D3 | `cart_id` for status | Locked |
| D4 | Strapi IDs as strings | Locked |
| D5 | Explicit Medusa linking | Locked |
| D6 | `defaultVariantId` optional | Locked |
| D7 | Strict price resolution | Locked |
| D8 | Ghost product policy | Locked |
| D9 | Images exclude cover | Locked |
| D10 | Error format mandatory | Locked |
| D11 | Cache headers per type | Locked |
| D12 | httpOnly auth cookie | Locked |
| D13 | Batch hydration | Locked |
| D14 | Contact rate limiting | Locked |
