# BFF Integration Guide — Phase 6

## Prerequisites

Before connecting the frontend to the real BFF, ensure:

1. **BFF Endpoints Ready**:
   - `GET /catalog/products` (with pagination, filters, sorting)
   - `GET /catalog/products/:slug`
   - `GET /catalog/products/featured`
   - `GET /catalog/products/:id/stock`
   - `GET /blog/articles` (with pagination)
   - `GET /blog/articles/:slug`
   - `POST /checkout/session`
   - `GET /checkout/status?session_id=...`
   - `POST /contact`

2. **DTOs Match Spec**: All BFF responses must match `/src/types/dtos.ts`

3. **CORS Configured**: See CORS requirements below

---

## Environment Configuration

### Development (Mock Data)
```bash
# .env.local
BFF_URL=http://localhost:3001
NEXT_PUBLIC_BFF_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK=true
```

### Staging (Real BFF)
```bash
# .env.local or Vercel environment variables
BFF_URL=https://api-staging.marrakea.com
NEXT_PUBLIC_BFF_URL=https://api-staging.marrakea.com
NEXT_PUBLIC_USE_MOCK=false
```

### Production
```bash
# Vercel environment variables
BFF_URL=https://api.marrakea.com
NEXT_PUBLIC_BFF_URL=https://api.marrakea.com
NEXT_PUBLIC_USE_MOCK=false
```

---

## CORS Configuration (BFF Side)

The BFF **must** send these CORS headers:

### For Preflight (OPTIONS) Requests
```http
Access-Control-Allow-Origin: https://marrakea.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### For Actual Requests
```http
Access-Control-Allow-Origin: https://marrakea.com
Access-Control-Allow-Credentials: true
```

### Important Notes

1. **NO Wildcard Origin** with credentials:
   - ❌ `Access-Control-Allow-Origin: *` + `Access-Control-Allow-Credentials: true` **WILL FAIL**
   - ✅ Must specify exact origin: `https://marrakea.com`

2. **Environment-Specific Origins**:
   - Development: `http://localhost:3000`
   - Staging: `https://staging.marrakea.com`
   - Production: `https://marrakea.com`

3. **Credentials Required**:
   - Frontend sends `credentials: 'include'` on all requests
   - BFF must send `Access-Control-Allow-Credentials: true`
   - Needed for cookie-based sessions (checkout, auth)

---

## Cookie Requirements (BFF Side)

For checkout sessions and authentication, BFF cookies must have:

```http
Set-Cookie: session_id=...; Secure; HttpOnly; SameSite=None; Path=/; Max-Age=3600
```

### Cookie Flags Explained

- **`Secure`**: Only sent over HTTPS (mandatory in production)
- **`HttpOnly`**: Not accessible via JavaScript (prevents XSS)
- **`SameSite=None`**: Required for cross-origin requests with credentials
- **`Path=/`**: Available to all routes
- **`Max-Age`**: Session duration in seconds

**Note**: `SameSite=None` requires `Secure` flag (HTTPS only).

---

## Error Handling

The frontend expects standardized error responses:

### BFF Error Response Format
```json
{
  "error": "User-friendly error message",
  "code": "PRODUCT_NOT_FOUND",
  "status": 404
}
```

### Frontend Handling by Status Code

| Status | Frontend Behavior |
|--------|------------------|
| **200-299** | Success, parse JSON |
| **400** | Bad request, show error message |
| **404** | Not found, show error.tsx or empty state |
| **429** | Rate limited, show retry message |
| **500-599** | Server error, show error boundary |
| **Timeout** | 10s timeout, show "BFF unavailable" |
| **Network Error** | CORS or connection issue, show "Network error" |

---

## Timeout Configuration

Default timeout: **10 seconds**

```typescript
// Server-side (SSR)
await serverFetch('/catalog/products', { timeout: 10000 });

// Client-side
await clientFetch('/checkout/session', { timeout: 10000 });
```

**Recommendation**:
- Catalog/articles: 5s timeout
- Checkout: 15s timeout (Stripe can be slow)
- Stock check: 3s timeout

---

## Cache & Revalidation Strategy

### Server Components (SSR/ISR)

```typescript
// Products catalog - revalidate every 60s
await serverFetch('/catalog/products', {
  revalidate: 60,
  tags: ['products']
});

// Product detail - revalidate every 60s
await serverFetch('/catalog/products/slug', {
  revalidate: 60,
  tags: ['products', 'product-slug']
});

// Featured products - revalidate every 5 minutes
await serverFetch('/catalog/products/featured', {
  revalidate: 300,
  tags: ['products', 'featured']
});

// Articles - revalidate every 5 minutes
await serverFetch('/blog/articles', {
  revalidate: 300,
  tags: ['articles']
});
```

### Client Components (no-store)

```typescript
// Checkout - always fresh
await clientFetch('/checkout/session', { cache: 'no-store' });

// Stock check - always fresh
await clientFetch('/catalog/products/id/stock', { cache: 'no-store' });

// Contact form - always fresh
await clientFetch('/contact', { cache: 'no-store' });
```

### On-Demand Revalidation

When BFF updates data, it can trigger Next.js revalidation:

```bash
# Revalidate all products
POST https://marrakea.com/api/revalidate?tag=products
Authorization: Bearer <REVALIDATION_TOKEN>

# Revalidate specific product
POST https://marrakea.com/api/revalidate?tag=product-slug
```

---

## Image Handling

### Expected Image URLs

BFF must return **absolute HTTPS URLs**:

```json
{
  "coverImage": {
    "url": "https://api.marrakea.com/images/product-123.jpg",
    "alt": "Tapis berbère",
    "width": 1200,
    "height": 1600,
    "blurDataUrl": "data:image/jpeg;base64,..."
  }
}
```

### Next.js Image Optimization

Frontend uses Next.js Image component which:
- Optimizes images automatically (WebP, AVIF)
- Lazy loads images below fold
- Generates responsive srcset
- Requires `remotePatterns` in `next.config.mjs`

**Current allowed patterns**:
```javascript
remotePatterns: [
  { protocol: 'https', hostname: 'api.marrakea.com' },
  { protocol: 'https', hostname: 'api-staging.marrakea.com' },
]
```

### Missing Images

If image URL is broken (404), Next.js will show:
- Placeholder background color (`var(--color-border)`)
- Alt text for accessibility

**BFF should**:
- Always provide `alt` text
- Always provide valid `width` and `height`
- Optionally provide `blurDataUrl` for blur-up effect

---

## Testing Checklist

### Catalog & Products
- [ ] Products list loads with pagination
- [ ] Filters work (gesture, territory, search)
- [ ] Sorting works (price_asc, price_desc, newest, name_asc)
- [ ] Product detail loads correctly
- [ ] Images load and are optimized
- [ ] Stock check returns correct availability
- [ ] Featured products appear on homepage

### Articles (Journal)
- [ ] Articles list loads with pagination
- [ ] Article detail loads correctly
- [ ] Article images load
- [ ] Related products display (if applicable)

### Checkout Flow
- [ ] Create checkout session returns valid Stripe URL
- [ ] Redirect to Stripe Checkout works
- [ ] Success page polls status correctly
- [ ] Status transitions: DRAFT → LOCKED → PAID
- [ ] Cart clears only on PAID status
- [ ] Order ID displays on success

### Error Scenarios
- [ ] BFF down (network error) shows error boundary
- [ ] Product not found (404) shows not-found page
- [ ] Timeout (>10s) shows timeout error
- [ ] Rate limiting (429) shows retry message
- [ ] Invalid session_id shows error on success page

### CORS & Credentials
- [ ] Checkout session creates with cookies
- [ ] Status polling sends cookies
- [ ] No CORS errors in browser console
- [ ] Preflight OPTIONS requests succeed

---

## Switching to Real BFF

1. **Set environment variables**:
   ```bash
   NEXT_PUBLIC_USE_MOCK=false
   BFF_URL=https://api-staging.marrakea.com
   NEXT_PUBLIC_BFF_URL=https://api-staging.marrakea.com
   ```

2. **Restart Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Verify BFF connection**:
   - Open browser console
   - Navigate to `/objets`
   - Check Network tab for requests to BFF
   - Verify DTOs match expected structure

4. **Test checkout flow**:
   - Add item to cart
   - Navigate to `/panier`
   - Click "Passer au paiement"
   - Verify redirect to Stripe Checkout
   - Complete test payment
   - Verify success page polls status

---

## Common Issues

### Issue: CORS Error
**Symptom**: `Access to fetch at '...' has been blocked by CORS policy`

**Solutions**:
1. Verify BFF sends `Access-Control-Allow-Origin` header
2. Verify BFF sends `Access-Control-Allow-Credentials: true`
3. Check origin matches exactly (no trailing slash)

### Issue: Cookies Not Sent
**Symptom**: Checkout session doesn't persist, status polling fails

**Solutions**:
1. Verify `credentials: 'include'` in fetch
2. Verify BFF sends `Access-Control-Allow-Credentials: true`
3. Verify cookies have `SameSite=None; Secure` flags
4. Must be HTTPS in production (cookies with `Secure` flag)

### Issue: Timeout Errors
**Symptom**: `Request timeout: BFF took too long to respond`

**Solutions**:
1. Increase timeout in fetch options
2. Optimize BFF endpoint performance
3. Check BFF server resources (CPU, memory)

### Issue: 404 Not Found
**Symptom**: `BFF error: 404 Not Found`

**Solutions**:
1. Verify BFF endpoint paths match documentation
2. Check BFF routing configuration
3. Verify product/article slugs exist in database

---

## BFF Contract Summary

The BFF **must**:
1. ✅ Respond with DTOs matching `/src/types/dtos.ts`
2. ✅ Send proper CORS headers (origin + credentials)
3. ✅ Set `Secure; HttpOnly; SameSite=None` cookies
4. ✅ Return absolute HTTPS URLs for images
5. ✅ Handle errors with JSON: `{ error, code, status }`
6. ✅ Support pagination, filters, sorting for catalog
7. ✅ Create Stripe checkout sessions
8. ✅ Provide checkout status endpoint with polling support
9. ✅ Respond within 10s (or frontend times out)
10. ✅ Support on-demand revalidation (optional)

The Frontend **guarantees**:
1. ✅ Sends `credentials: 'include'` on all requests
2. ✅ Uses DTOs from `/src/types/dtos.ts` only
3. ✅ Never calculates final prices (BFF truth)
4. ✅ Polls checkout status every 2s while LOCKED
5. ✅ Clears cart only on PAID status
6. ✅ Sends minimal checkout payload (IDs + quantities)
7. ✅ Handles all error codes gracefully
8. ✅ Respects cache policies (no-store on checkout)
9. ✅ Times out requests after 10s
10. ✅ Optimizes images via Next.js Image component

---

## Next Steps After Integration

1. **Monitor errors**: Check error logs for BFF failures
2. **Performance**: Measure BFF response times
3. **SEO**: Verify metadata populated from BFF data
4. **Analytics**: Track checkout funnel conversion
5. **Load testing**: Simulate concurrent users
6. **Security audit**: Verify CORS, cookies, credentials
7. **Production deploy**: Push to Vercel with production BFF URL
