# Connecting to the BFF (Backend-For-Frontend)

## Overview

The MARRAKEA frontend can run in two modes:
1. **Mock mode**: Uses local mock data (no BFF required)
2. **BFF mode**: Connects to the operational BFF on `localhost:4000`

## Quick Start - Connect to BFF

The frontend is now pre-configured to connect to the operational BFF on `localhost:4000`.

### Prerequisites

1. **BFF running on localhost:4000**
   - The BFF aggregates data from Strapi (editorial) and Medusa (commerce)
   - Ensure the BFF is started and healthy: `curl http://localhost:4000/health`

2. **Environment configured**
   - `.env.local` already points to `localhost:4000`
   - `NEXT_PUBLIC_USE_MOCK=false` is set

### Start the Frontend

```bash
npm run dev
```

The frontend will now consume real data from the BFF.

## Configuration

### Environment Variables

The frontend uses two BFF URLs:

```bash
# Server-side (Server Components, ISR)
BFF_URL=http://localhost:4000

# Client-side (Client Components, TanStack Query)
NEXT_PUBLIC_BFF_URL=http://localhost:4000

# Feature flag
NEXT_PUBLIC_USE_MOCK=false  # Use real BFF
```

### Switch Between Modes

**To use real BFF (default):**
```bash
# In .env.local
NEXT_PUBLIC_USE_MOCK=false
```

**To use mock data (testing without BFF):**
```bash
# In .env.local
NEXT_PUBLIC_USE_MOCK=true
```

Then restart the dev server:
```bash
npm run dev
```

## API Endpoints

The frontend expects these endpoints on the BFF:

### Catalog
- `GET /catalog/products` - List products (paginated, filtered, sorted)
- `GET /catalog/products/{slug}` - Product detail
- `GET /catalog/products/featured` - Featured products (homepage)
- `GET /catalog/products/{productId}/stock` - Stock check
- `GET /catalog/gestures` - Gesture categories

### Blog
- `GET /blog/articles` - List articles (paginated)
- `GET /blog/articles/{slug}` - Article detail

### Checkout
- `POST /checkout/session` - Create checkout session (Stripe)
- `GET /checkout/status?session_id={id}` - Check checkout status

### Contact
- `POST /contact` - Submit contact form

### Health
- `GET /health` - BFF health check

See **[api-specification-revised.md](./api-specification-revised.md)** for complete API documentation.

## Troubleshooting

### BFF Connection Issues

**Symptom:** Frontend shows errors or empty pages

**Check:**

1. **BFF is running:**
   ```bash
   curl http://localhost:4000/health
   ```
   Expected: `{"status":"healthy","services":{...}}`

2. **CORS enabled:**
   BFF must allow `http://localhost:3000` (frontend dev server)

3. **Environment loaded:**
   ```bash
   # Restart dev server after .env.local changes
   npm run dev
   ```

4. **Check browser console:**
   Look for CORS errors or 404s from `http://localhost:4000`

### Fallback to Mock Mode

If BFF is unavailable, switch to mock mode:

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK=true
```

Restart dev server. Frontend will use local mock data.

### Verify Configuration

Check which mode is active:

```bash
# In browser console (development only)
console.log('USE_MOCK:', process.env.NEXT_PUBLIC_USE_MOCK)
console.log('BFF_URL:', process.env.NEXT_PUBLIC_BFF_URL)
```

Or check the network tab for requests to `localhost:4000`.

## API Contract

The BFF must implement the contract defined in:
- **[api-specification-revised.md](./api-specification-revised.md)** - Complete API spec (v1 revised)
- **[dtos.md](./dtos.md)** - DTO definitions
- **[src/types/dtos.ts](../src/types/dtos.ts)** - TypeScript types

**Key requirements:**
- All responses must match DTOs exactly
- IDs must be stringified (Strapi numeric IDs → `"1"`, `"2"`)
- Price sorting NOT supported in v1 (returns `400 UNSUPPORTED_SORT`)
- `ProductDTO.defaultVariantId` recommended (Medusa variant ID)
- Stock checks via Medusa inventory
- Checkout creates Medusa cart + Stripe session

## Development Workflow

### Testing with Real BFF

1. Start BFF: `cd ../bff && npm run dev` (or equivalent)
2. Verify BFF health: `curl http://localhost:4000/health`
3. Start frontend: `npm run dev`
4. Navigate to `http://localhost:3000`
5. Test pages:
   - `/` (homepage with featured products)
   - `/objets` (catalog with filters/search/sort)
   - `/objets/{slug}` (product detail)
   - `/journal` (articles)
   - `/contact` (contact form)

### Testing with Mock Data

1. Set `NEXT_PUBLIC_USE_MOCK=true` in `.env.local`
2. Start frontend: `npm run dev`
3. No BFF required - all data served from `src/lib/mock/*`

## Architecture

```
┌─────────────┐
│   Next.js   │ ← You are here (localhost:3000)
│  Frontend   │
└──────┬──────┘
       │
       │ HTTP (localhost:4000)
       ↓
┌─────────────┐
│     BFF     │ ← Aggregation layer (localhost:4000)
│  (Node.js)  │
└──────┬──────┘
       │
       ├─→ Strapi (editorial: products, articles, gestures)
       │
       └─→ Medusa (commerce: variants, prices, stock, checkout)
```

## Next Steps

1. **Test all pages** with real BFF data
2. **Compare with mock data** - ensure DTOs match
3. **Report issues** - if BFF responses don't match spec
4. **Iterate** - BFF team adjusts based on frontend needs

## Resources

- **API Spec:** [api-specification-revised.md](./api-specification-revised.md)
- **DTOs:** [dtos.md](./dtos.md)
- **Architecture:** [architecture.md](./architecture.md)
- **Phases:** [phases.md](./phases.md)

---

**Status:** ✅ Ready to connect to BFF on localhost:4000
**Last Updated:** 2024-01-25
