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
```

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
