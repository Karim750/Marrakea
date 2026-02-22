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

```
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
