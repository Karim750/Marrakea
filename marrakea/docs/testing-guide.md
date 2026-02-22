# Testing Guide — BFF Integration (Phase 6)

## Manual Testing Checklist

### Pre-Test Setup

- [ ] Environment variables configured correctly
- [ ] `NEXT_PUBLIC_USE_MOCK=false`
- [ ] BFF URL points to staging/production
- [ ] Next.js dev server restarted
- [ ] Browser console open (check for errors)
- [ ] Network tab open (monitor requests)

---

## 1. Catalog & Products

### 1.1 Product Listing (/objets)

**Happy Path**:
- [ ] Navigate to `/objets`
- [ ] Verify products load (12 per page by default)
- [ ] Verify product cards show: image, title, price, gesture
- [ ] Verify images load correctly (no broken images)
- [ ] Verify "lazy" loading works (scroll to load more)

**Pagination**:
- [ ] Click "Next page"
- [ ] Verify URL updates with `?page=2`
- [ ] Verify different products load
- [ ] Click "Previous page"
- [ ] Verify returns to page 1

**Filters**:
- [ ] Select a gesture filter
- [ ] Verify URL updates with `?gesture=...`
- [ ] Verify products filtered correctly
- [ ] Select a territory filter
- [ ] Verify URL updates with `?territory=...`
- [ ] Verify products filtered correctly
- [ ] Clear filters
- [ ] Verify all products return

**Search**:
- [ ] Enter search term (e.g., "tapis")
- [ ] Verify URL updates with `?search=tapis`
- [ ] Verify search results match term
- [ ] Clear search
- [ ] Verify all products return

**Sorting**:
- [ ] Sort by "Price: Low to High"
- [ ] Verify URL updates with `?sort=price_asc`
- [ ] Verify products sorted correctly
- [ ] Sort by "Price: High to Low"
- [ ] Verify products sorted correctly
- [ ] Sort by "Newest"
- [ ] Verify products sorted correctly

**Error Scenarios**:
- [ ] Disconnect network → verify error boundary shows
- [ ] Enter invalid filter → verify graceful handling
- [ ] BFF returns 500 → verify error message displays

---

### 1.2 Product Detail (/objets/[slug])

**Happy Path**:
- [ ] Click on a product card
- [ ] Verify redirects to `/objets/[slug]`
- [ ] Verify product detail loads:
  - Gallery with multiple images
  - Title, price, intro
  - Gesture, territory, materials
  - Dimensions
  - Description (HTML content)
  - "Fiche de référence" section
  - "Atelier & artisan" section
- [ ] Verify all images load
- [ ] Click gallery thumbnails → verify main image changes
- [ ] Verify metadata (check browser tab title)

**Add to Cart**:
- [ ] Click "Ajouter au panier" button
- [ ] Verify button shows "✓ Ajouté au panier" for 2s
- [ ] Verify cart badge updates in header
- [ ] Click cart badge → verify drawer opens
- [ ] Verify product appears in cart drawer

**Stock Check** (if implemented):
- [ ] Verify "En stock" or "Sur commande" label displays
- [ ] Try product with `inStock: false`
- [ ] Verify appropriate message displays

**Error Scenarios**:
- [ ] Navigate to `/objets/invalid-slug`
- [ ] Verify 404 page displays
- [ ] BFF returns 404 → verify not-found page
- [ ] Image URL broken → verify placeholder shows

---

### 1.3 Featured Products (Homepage)

**Happy Path**:
- [ ] Navigate to `/`
- [ ] Scroll to "Objets sélectionnés" section
- [ ] Verify 4 featured products load
- [ ] Verify images load correctly
- [ ] Click on a product → verify redirects to detail page

**Error Scenarios**:
- [ ] BFF returns empty array → verify section hidden or shows placeholder

---

## 2. Journal (Articles)

### 2.1 Article Listing (/journal)

**Happy Path**:
- [ ] Navigate to `/journal`
- [ ] Verify articles load (12 per page)
- [ ] Verify article cards show: cover image, title, excerpt, date
- [ ] Verify images load correctly

**Pagination**:
- [ ] Click "Next page"
- [ ] Verify URL updates with `?page=2`
- [ ] Verify different articles load

**Error Scenarios**:
- [ ] BFF returns 500 → verify error boundary

---

### 2.2 Article Detail (/journal/[slug])

**Happy Path**:
- [ ] Click on an article card
- [ ] Verify redirects to `/journal/[slug]`
- [ ] Verify article detail loads:
  - Cover image
  - Title, excerpt, date
  - Content (HTML)
  - Author info (if present)
  - Related products (if present)
- [ ] Verify images in content load
- [ ] Verify metadata (browser tab title)

**Related Products**:
- [ ] Scroll to "Related Products" section (if present)
- [ ] Verify product cards display
- [ ] Click on a product → verify redirects to product detail

**Error Scenarios**:
- [ ] Navigate to `/journal/invalid-slug`
- [ ] Verify 404 page displays

---

## 3. Cart & Checkout

### 3.1 Cart Drawer

**Happy Path**:
- [ ] Click cart badge in header
- [ ] Verify drawer slides in from right
- [ ] Verify cart items display with:
  - Image
  - Title
  - Price
  - Quantity controls (if `purchaseMode: 'quantity'`)
  - "Pièce unique" label (if `purchaseMode: 'unique'`)
- [ ] Verify total displays (marked as "indicatif")

**Quantity Controls**:
- [ ] Click "+" button on quantity item
- [ ] Verify quantity increases
- [ ] Verify total updates
- [ ] Click "-" button
- [ ] Verify quantity decreases
- [ ] Click "-" when quantity is 1
- [ ] Verify item removed from cart

**Remove Item**:
- [ ] Click "Retirer" button
- [ ] Verify item removed from cart
- [ ] Verify total updates
- [ ] Verify cart badge updates

**Checkout**:
- [ ] Click "Passer au paiement" button
- [ ] Verify redirects to Stripe Checkout URL
- [ ] Verify URL contains `session_id` parameter

**Error Scenarios**:
- [ ] BFF returns 500 on checkout → verify error message displays
- [ ] Network error → verify "Erreur" message shows

---

### 3.2 Cart Page (/panier)

**Happy Path**:
- [ ] Navigate to `/panier`
- [ ] Verify cart items display in list format
- [ ] Verify sticky summary sidebar on desktop
- [ ] Verify responsive layout on mobile (summary below items)

**Empty State**:
- [ ] Remove all items from cart
- [ ] Verify "Votre panier est vide" message
- [ ] Verify "Découvrir les objets" link displays
- [ ] Click link → verify redirects to `/objets`

**Error Scenarios**:
- [ ] Force error in cart page → verify error.tsx displays
- [ ] Click "Réessayer" → verify page reloads

---

### 3.3 Success Page (/panier/success)

**Happy Path** (requires test Stripe payment):
- [ ] Complete checkout with test card
- [ ] Verify redirects to `/panier/success?session_id=...`
- [ ] Verify loading state displays ("Vérification...")
- [ ] Verify polling starts (check Network tab for repeated requests)
- [ ] Wait for status to change to `LOCKED` or `PAID`
- [ ] When `PAID`:
  - Verify success icon displays (✓)
  - Verify "Commande confirmée !" message
  - Verify order ID displays
  - Verify cart is cleared
  - Verify cart badge shows 0

**Status: LOCKED**:
- [ ] If BFF returns `LOCKED` status
- [ ] Verify "Confirmation en cours..." message
- [ ] Verify spinner animation
- [ ] Verify polling continues every 2s

**Status: CANCELLED**:
- [ ] Cancel payment on Stripe
- [ ] Verify redirects to `/panier/success?session_id=...`
- [ ] Verify "Commande annulée" message
- [ ] Verify cart is NOT cleared
- [ ] Verify "Retour au panier" link displays

**Status: EXPIRED**:
- [ ] Use expired session_id
- [ ] Verify "Session expirée" message
- [ ] Verify "Retour au panier" link displays

**Status: FAILED**:
- [ ] Force payment failure (use test card that declines)
- [ ] Verify "Paiement échoué" message
- [ ] Verify "Retour au panier" link displays

**Missing session_id**:
- [ ] Navigate to `/panier/success` (no query param)
- [ ] Verify "Session invalide" message
- [ ] Verify "Retour au panier" link displays

**Error Scenarios**:
- [ ] BFF down during polling → verify error message
- [ ] Timeout (>60s) → verify timeout message
- [ ] Network error → verify "Erreur de vérification"

---

## 4. Contact Form

**Happy Path**:
- [ ] Navigate to `/contact`
- [ ] Fill in all fields:
  - Name
  - Email (valid format)
  - Subject
  - Message
- [ ] Click "Envoyer" button
- [ ] Verify success message displays
- [ ] Verify form resets

**Validation**:
- [ ] Submit form with empty fields → verify validation errors
- [ ] Enter invalid email → verify email validation error
- [ ] Enter very long message → verify character limit (if any)

**Error Scenarios**:
- [ ] BFF returns 500 → verify error message displays
- [ ] Network error → verify "Erreur" message
- [ ] Timeout → verify timeout message

---

## 5. SEO & Metadata

### 5.1 Product Pages

- [ ] Open `/objets/[slug]` in browser
- [ ] View page source (Ctrl+U or Cmd+Option+U)
- [ ] Verify `<title>` tag contains product name
- [ ] Verify `<meta name="description">` contains product intro
- [ ] Verify OpenGraph tags:
  - `og:title`
  - `og:description`
  - `og:image` (product cover image)
- [ ] Verify JSON-LD schema:
  - `@type: "Product"`
  - `name`, `description`, `image`, `offers`

### 5.2 Article Pages

- [ ] Open `/journal/[slug]` in browser
- [ ] View page source
- [ ] Verify `<title>` tag contains article title
- [ ] Verify `<meta name="description">` contains excerpt
- [ ] Verify OpenGraph tags
- [ ] Verify JSON-LD schema (if applicable)

### 5.3 Sitemap

- [ ] Navigate to `/sitemap.xml`
- [ ] Verify XML displays correctly
- [ ] Verify product URLs present
- [ ] Verify article URLs present
- [ ] Verify static page URLs present

### 5.4 Robots.txt

- [ ] Navigate to `/robots.txt`
- [ ] Verify file displays correctly
- [ ] Verify sitemap URL included

---

## 6. Performance

### 6.1 Lighthouse Audit

- [ ] Open DevTools → Lighthouse
- [ ] Run audit for:
  - Performance
  - Accessibility
  - Best Practices
  - SEO
- [ ] Verify scores:
  - Performance: >90
  - Accessibility: >90
  - Best Practices: >90
  - SEO: >90

### 6.2 Core Web Vitals

- [ ] Check Largest Contentful Paint (LCP) < 2.5s
- [ ] Check First Input Delay (FID) < 100ms
- [ ] Check Cumulative Layout Shift (CLS) < 0.1

### 6.3 Image Optimization

- [ ] Inspect product images in Network tab
- [ ] Verify Next.js serves optimized formats (WebP, AVIF)
- [ ] Verify lazy loading on images below fold
- [ ] Verify responsive srcset attributes

---

## 7. Cross-Browser Testing

### Browsers to Test

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Key Tests per Browser

- [ ] Product catalog loads
- [ ] Cart drawer opens/closes
- [ ] Checkout redirect works
- [ ] Images load correctly
- [ ] CSS layout correct (no broken styles)
- [ ] Forms submit correctly

---

## 8. Mobile Testing

### Devices to Test

- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)

### Key Tests

- [ ] Navigation menu works (if mobile menu implemented)
- [ ] Product grid is responsive (3-col → 2-col → 1-col)
- [ ] Cart drawer is usable on mobile
- [ ] Touch interactions work (swipe, tap, scroll)
- [ ] Forms are usable (keyboard doesn't obscure inputs)
- [ ] Checkout flow works on mobile

---

## 9. Accessibility

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Verify forms can be submitted with Enter
- [ ] Verify modals can be closed with Esc
- [ ] Verify no keyboard traps

### Screen Reader

- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify ARIA labels read correctly
- [ ] Verify heading hierarchy logical (h1 → h2 → h3)
- [ ] Verify images have alt text
- [ ] Verify form labels associated with inputs

### Color Contrast

- [ ] Verify text has sufficient contrast (WCAG AA: 4.5:1)
- [ ] Verify interactive elements have sufficient contrast
- [ ] Test with color blindness simulator

---

## 10. Security

### CORS

- [ ] Verify no CORS errors in browser console
- [ ] Verify preflight OPTIONS requests succeed
- [ ] Verify cookies sent with credentials

### Cookies

- [ ] Open DevTools → Application → Cookies
- [ ] Verify session cookies have:
  - `Secure` flag (HTTPS only)
  - `HttpOnly` flag
  - `SameSite=None` (cross-origin)
- [ ] Verify cookies persist after page refresh

### No Sensitive Data Exposure

- [ ] Inspect Network tab → Response payloads
- [ ] Verify no API keys, secrets, or tokens exposed
- [ ] Verify no PII in console.log statements
- [ ] Verify checkout payload only contains productId + quantity

---

## 11. Error Recovery

### BFF Down

- [ ] Stop BFF server
- [ ] Refresh product catalog page
- [ ] Verify error boundary displays
- [ ] Verify "Réessayer" button works
- [ ] Start BFF server
- [ ] Click "Réessayer"
- [ ] Verify page loads correctly

### Timeout

- [ ] Simulate slow BFF response (>10s)
- [ ] Verify timeout error displays
- [ ] Verify retry logic (if implemented)

### Invalid Data

- [ ] BFF returns malformed JSON → verify error handling
- [ ] BFF returns DTO with missing fields → verify graceful degradation
- [ ] BFF returns wrong DTO type → verify type error caught

---

## 12. Load Testing (Optional)

### Tools

- [ ] Use Apache Bench, k6, or Artillery
- [ ] Simulate 10-100 concurrent users
- [ ] Test endpoints:
  - `/objets`
  - `/objets/[slug]`
  - `/panier/success` (polling)

### Metrics to Track

- [ ] Response time (p50, p95, p99)
- [ ] Error rate (< 1%)
- [ ] Throughput (requests/sec)
- [ ] BFF CPU/memory usage

---

## Testing Summary

| Category | Tests | Pass | Fail | Notes |
|----------|-------|------|------|-------|
| Catalog & Products | 15 | | | |
| Journal | 8 | | | |
| Cart & Checkout | 20 | | | |
| Contact Form | 6 | | | |
| SEO & Metadata | 8 | | | |
| Performance | 6 | | | |
| Cross-Browser | 6 | | | |
| Mobile | 6 | | | |
| Accessibility | 10 | | | |
| Security | 8 | | | |
| Error Recovery | 6 | | | |
| **TOTAL** | **99** | | | |

---

## Sign-Off Criteria

Phase 6 is complete when:

- [ ] All critical tests pass (catalog, products, cart, checkout)
- [ ] Zero CORS errors
- [ ] Zero console errors in production build
- [ ] Lighthouse scores > 90
- [ ] All major browsers tested
- [ ] Mobile experience tested
- [ ] Accessibility audit passed
- [ ] Security audit passed
- [ ] BFF contract verified (DTOs match)
- [ ] Staging deployment successful

---

## Next Phase

After Phase 6 sign-off, proceed to **Phase 7 (Production Optimization)**:
- Bundle analysis
- SEO final audit
- Analytics integration
- Vercel production deployment
