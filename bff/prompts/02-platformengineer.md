# Subagent: PlatformEngineer

## Role

Build the BFF infrastructure layer: configuration, HTTP clients, middleware, and server bootstrap.

---

## Inputs

Read before starting:

- `/spec/00-contract.md` — API contract (error format, cache rules, CORS)
- `/spec/01-upstreams-strapi.md` — Strapi API details
- `/spec/02-upstreams-medusa.md` — Medusa API details
- `/spec/07-deployment-notes.md` — Environment and deployment context

---

## Task

### 1. Configuration & Environment

```typescript
// src/config/index.ts
export const config = {
  port: number,
  env: 'development' | 'staging' | 'production',
  strapi: {
    baseUrl: string,
    apiToken: string,
    timeout: number,
  },
  medusa: {
    baseUrl: string,
    apiKey: string,
    timeout: number,
  },
  cors: {
    allowedOrigins: string[],
  },
  rateLimit: {
    windowMs: number,
    max: number,
  },
}
```

Use environment variables with sensible defaults. Validate required vars at startup.

### 2. HTTP Clients

**Strapi Client** (`src/shared/http/strapi.client.ts`):
- Base URL configuration
- API token header injection
- Timeout handling (default: 5s)
- Retry logic (3 attempts, exponential backoff)
- Request/response logging

**Medusa Client** (`src/shared/http/medusa.client.ts`):
- Base URL configuration
- API key header injection
- Session/cookie forwarding for cart operations
- Timeout handling (default: 5s)
- Retry logic (3 attempts, exponential backoff)
- Request/response logging

### 3. Middleware

**CORS** (`src/shared/middleware/cors.ts`):
- Allow configured origins
- Support credentials (cookies)
- Expose necessary headers

**Request ID** (`src/shared/middleware/requestId.ts`):
- Generate UUID for each request
- Attach to `req.requestId`
- Include in response header `X-Request-ID`

**Error Handler** (`src/shared/middleware/errorHandler.ts`):
- Catch all errors
- Transform to standard error format from contract
- Log with requestId
- Don't leak stack traces in production

### 4. Helpers

**Cache Headers** (`src/shared/cache/cacheHeaders.ts`):
```typescript
export const setCacheHeaders = (
  res: Response,
  profile: 'catalog-list' | 'catalog-detail' | 'stock' | 'blog' | 'none'
) => void
```

**Rate Limiter** (`src/shared/rate-limit/rateLimit.ts`):
- Configurable window and max requests
- Return 429 with standard error format
- Per-IP limiting

### 5. Server Bootstrap

**Main Entry** (`src/main.ts` or `src/server.ts`):
- Load and validate config
- Apply global middleware (cors, requestId, json parsing)
- Mount route modules (placeholder imports)
- Apply error handler last
- Graceful shutdown handling
- Health check endpoint (`GET /health`)

---

## Outputs

| File | Description |
|------|-------------|
| `src/config/index.ts` | Configuration loader with validation |
| `src/shared/http/strapi.client.ts` | Strapi HTTP client |
| `src/shared/http/medusa.client.ts` | Medusa HTTP client |
| `src/shared/middleware/cors.ts` | CORS middleware |
| `src/shared/middleware/requestId.ts` | Request ID middleware |
| `src/shared/middleware/errorHandler.ts` | Global error handler |
| `src/shared/cache/cacheHeaders.ts` | Cache header helper |
| `src/shared/rate-limit/rateLimit.ts` | Rate limiting middleware |
| `src/main.ts` | Server entry point |

---

## Validation Checklist

Before marking complete:

- [ ] Config validates required env vars at startup
- [ ] HTTP clients have timeout and retry logic
- [ ] CORS allows credentials and configured origins
- [ ] Request ID generated and propagated
- [ ] Error handler produces contract-compliant format
- [ ] Cache helper covers all profiles from contract
- [ ] Rate limiter returns 429 in standard format
- [ ] Server starts and responds to `/health`
- [ ] Graceful shutdown implemented
