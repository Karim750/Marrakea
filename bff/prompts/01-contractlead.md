# Subagent: ContractLead

## Role

Define the single authoritative API contract for the MARRAKEA BFF. All other subagents implement against this contract.

---

## Inputs

Read before starting:

- Existing frontend spec (provided separately)
- Prior decisions: Strapi for discovery + artisan content, Medusa for commerce

---

## Task

Produce `/spec/00-contract.md` as the **single source of truth** containing:

### 1. Endpoints Definition

For each endpoint, specify:
- HTTP method + path
- Query parameters (with types, defaults, validation)
- Request body schema (if applicable)
- Response body schema
- Example request/response

### 2. DTOs & ID Rules

- Define all DTOs with field types
- Specify ID format rules (e.g., `prod_*` for products)
- Document `defaultVariantId` requirement and computation logic

### 3. Error Schema

Standard error response format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Define all error codes used across endpoints.

### 4. Caching Headers

Per-endpoint Cache-Control directives:
- Catalog list: `public, max-age=60, stale-while-revalidate=300`
- Product detail: `public, max-age=300, stale-while-revalidate=600`
- Stock: `no-store`
- Blog: `public, max-age=3600`
- etc.

### 5. Security / Cookies / CORS

- Cookie handling for cart session
- CORS configuration (allowed origins, credentials)
- Authentication token handling

### 6. Explicit Decisions

Document these decisions clearly:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `price_asc`/`price_desc` sorting | Return 400 `UNSUPPORTED_SORT` in v1 | Medusa doesn't support price sorting natively |
| Checkout status param | `cart_id` | Aligns with Medusa's cart model |
| API versioning | `/v1` prefix | Future-proofing |
| Pagination style | Offset-based (`page`, `limit`) | Simpler for frontend |

---

## Outputs

| File | Description |
|------|-------------|
| `/spec/00-contract.md` | Complete API contract |
| `/spec/04-edge-cases.md` | Edge cases and handling rules |
| `openapi/bff.yaml` | OpenAPI 3.0 spec matching the contract |
| `docs/contract-decisions.md` | Decision log with rationale |

---

## Validation Checklist

Before marking complete:

- [ ] Every endpoint has request/response examples
- [ ] All DTOs have explicit field types
- [ ] Error codes are enumerated
- [ ] Cache headers are specified per endpoint
- [ ] CORS and cookie strategy documented
- [ ] All explicit decisions documented with rationale
- [ ] OpenAPI spec validates with `swagger-cli validate`
- [ ] OpenAPI matches contract.md exactly
