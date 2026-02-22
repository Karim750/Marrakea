This repository uses Claude Code to generate and maintain a **Backend-For-Frontend (BFF)** for the Marrakea Next.js frontend.

**Architecture**
- **Strapi** = editorial / discovery (ProductPages, Artisans, Gestures, Territories, Articles)
- **Medusa** = commerce (Products, Variants, Prices, Inventory, Carts, Customers, Payments)
- **BFF** = contract-enforcing aggregator returning strict DTOs

---

## 0) Golden Rule: The Contract Is Law

The canonical contract is:

- `/spec/00-contract.md`

Everything must conform to it:
- DTOs must match exactly
- error shape must match exactly
- caching headers must match exactly
- any change must update `/spec/00-contract.md` first

**If implementation conflicts with the contract, fix the implementation — not the frontend.**

---

## 1) Repository Spec Sources (Read-First)

Before coding anything, Claude must read:

- `/spec/00-contract.md` (single source of truth)
- `/spec/01-upstreams-strapi.md` (exact Strapi queries)
- `/spec/02-upstreams-medusa.md` (exact Medusa queries)
- `/spec/03-workflows.md` (call sequences)
- `/spec/04-edge-cases.md` (error policy)
- `/spec/05-testing-postman.md` (E2E verification)
- `/spec/06-seeding-assumptions.md` (required data model)
- `/spec/07-deployment-notes.md` (CORS/cookies/env)

---

## 2) Final Decisions (Locked for v1)

These are non-negotiable v1 decisions unless `/spec/00-contract.md` is updated:

1) **No `/v1` prefix** on BFF routes  
2) `sort=price_asc|price_desc` → **400 UNSUPPORTED_SORT** (v1)  
3) `/checkout/status` uses **`cart_id`** (not `session_id`)  
4) **Strapi IDs are returned as strings** (e.g. `"12"`)  
5) **Linking rule**: Strapi ProductPage must store `medusa_product_id` (required) and `medusa_variant_id` (recommended)

---

## 3) Implementation Principles

### 3.1 DTO Enforcement
- Every controller response must be validated by runtime schemas (Zod).
- No upstream raw objects leave the BFF.
- If a required DTO field cannot be computed, return a typed error.

### 3.2 Error Handling (Single Format)
All errors return:

```json
{ "error": "…", "code": "…", "details": {} }
````

No exceptions.

### 3.3 No N+1 (Performance)

For list endpoints (products list, featured, relatedProducts):

* Prefer Medusa batch hydration if supported
* Else use dedupe + short in-memory cache (per-request + short TTL)

### 3.4 Ghost Product Policy

If Strapi references a Medusa product that doesn’t exist:

* List endpoints: drop silently + log
* Detail endpoints: 404 `PRODUCT_NOT_FOUND`

### 3.5 Price Resolution (Strict)

If price cannot be resolved from Medusa:

* Return 500 `PRICE_NOT_RESOLVABLE` (v1 strict)

### 3.6 Images

* BFF does not resize or proxy images.
* It maps Strapi media + Medusa images to `ImageDTO` and returns URLs.
* `ProductDetailDTO.images` MUST exclude `coverImage`.

### 3.7 Security

* CORS allowlist only (no wildcard in prod)
* Cookies are httpOnly; `credentials: include` compatible
* Never log tokens

---

## 4) Minimal Modules & Ownership

Implementation should follow these modules:

* `src/modules/catalog` → `/catalog/*`
* `src/modules/blog` → `/blog/*`
* `src/modules/checkout` → `/checkout/*`
* `src/modules/account` → `/account/*`
* `src/modules/contact` → `/contact`
* `src/shared` → http clients, dtos, middleware, errors, cache, rate limit

---

## 5) Required Files to Generate

Claude should ensure these exist and stay consistent:

### Contract / API

* `/spec/*` (already committed)
* `openapi/bff.yaml` (generated from `/spec/00-contract.md`)

### Runtime validation

* `src/shared/dtos/*` (Zod schemas matching DTOs)

### Infrastructure

* `src/shared/http/strapi.client.ts`
* `src/shared/http/medusa.client.ts`
* `src/shared/middleware/errorHandler.ts`
* `src/shared/middleware/requestId.ts`
* `src/shared/cache/cacheHeaders.ts`
* `src/shared/rate-limit/rateLimit.ts`

### Testing

* `tests/postman/MARRAKEA_BFF.postman_collection.json`
* `tests/postman/MARRAKEA_BFF.postman_environment.json`

---

## 6) Environment Variables (Development)

Required:

* `BFF_PORT=4000`
* `STRAPI_BASE_URL=http://localhost:1337`
* `STRAPI_API_TOKEN=...`
* `MEDUSA_BASE_URL=http://localhost:9000`
* `MEDUSA_PUBLISHABLE_KEY=...`
* `MEDUSA_REGION_ID=...`

Recommended:

* `COOKIE_DOMAIN=localhost`
* `COOKIE_SECURE=false`
* `COOKIE_SAMESITE=lax`
* `LOG_LEVEL=debug`

---

## 7) How to Validate Before Shipping

### 7.1 Upstreams sanity

Follow `/spec/05-testing-postman.md` Phase A:

* Strapi content exists & published
* Medusa store pricing resolves

### 7.2 BFF E2E

Run Phase B:

* all endpoints return DTOs
* caching headers correct
* errors match spec
* checkout flow returns `cartId` and status polling works
* account login + /me works

---

## 8) Claude Code Working Mode

When asked to modify behavior:

1. Update `/spec/00-contract.md` FIRST if contract changes
2. Update OpenAPI `openapi/bff.yaml`
3. Update implementation + Zod schemas
4. Update Postman tests if needed

Never introduce a breaking change without updating the contract.

---

## 9) Quick Commands (Optional)

If you have scripts, list them here (adapt to your repo):

* `npm run dev` — start BFF
* `npm run test:postman` — run Newman against local BFF
* `npm run lint` — lint

---

## 10) Notes for Future v2

Potential v2 improvements:

* support global price sorting via `cached_price` sync into Strapi
* add on-demand revalidation endpoints
* full webhook-driven checkout status mapping
* structured observability (OpenTelemetry)

For now, v1 prioritizes correctness, traceability, and contract stability.

```
::contentReference[oaicite:0]{index=0}
