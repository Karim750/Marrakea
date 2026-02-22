# DTO Contract Compliance Review Report

**Date:** 2026-01-23
**Phase:** Phase 2 Implementation Review
**Reviewed by:** DTO Contract Agent

---

## Executive Summary

Phase 2 implementation demonstrates **STRONG DTO CONTRACT COMPLIANCE** with one critical violation that requires immediate attention.

**Overall Status:** PASS WITH WARNINGS

**Critical Issues:** 1
**Warnings:** 1
**Passed Checks:** 6/8

---

## 1. DTO Definition Review

### Status: PASS

**File:** `/src/types/dtos.ts`

**Findings:**
- All DTOs properly defined with clean, frontend-ready fields
- No Dolibarr-ish fields exposed (`rowid`, `fk_*`, `entity`, `extrafields`)
- All DTOs follow the contract specifications from `docs/dtos.md`
- Proper TypeScript typing with explicit optionals

**DTOs Defined:**
- ImageDTO
- ArtisanDTO
- TerritoryDTO
- GestureDTO
- ProductDTO
- ProductDetailDTO
- ProductPriceDTO
- ProductAvailabilityDTO
- ArticleDTO
- ArticleDetailDTO
- FilterParams
- ApiResponse<T>
- PaginatedResponse<T>
- CartItemDTO
- CartDTO
- CartTotalsDTO
- CheckoutPayloadItem
- CheckoutSessionDTO
- CheckoutStatusDTO
- ContactFormDTO
- FiltersMetaDTO

**Strengths:**
- `formattedPrice` properly included in `ProductPriceDTO`
- `availability.label` provides UI-ready text (source of truth)
- `blurDataUrl` optional field for progressive image loading
- IDs are strings (not numbers)
- Dates are string (ISO format expected)
- Clear separation between list DTOs and detail DTOs

---

## 2. Runtime Validation (Zod Schemas)

### Status: PASS

**File:** `/src/lib/validations/schemas.ts`

**Findings:**
- Contact form properly validated with `contactFormSchema`
- Checkout status response validated with `checkoutStatusSchema`
- Checkout session validated with `checkoutSessionSchema`
- All critical user-input and external responses covered

**Schemas Implemented:**
```typescript
- contactFormSchema (z.object)
- checkoutStatusSchema (z.object)
- checkoutSessionSchema (z.object)
```

**Type Inference:**
```typescript
- ContactFormData = z.infer<typeof contactFormSchema>
```

---

## 3. Component DTO Usage

### Status: PASS

**File:** `/src/components/features/ProductCard.tsx`

**Findings:**
- Component properly typed with `ProductDTO`
- Uses `product.price.formattedPrice` directly (no formatting logic)
- No raw backend fields accessed
- Proper conditional rendering based on `availability.purchaseMode`
- No price calculations or business logic

**Code Review:**
```tsx
<span className={styles.price}>{product.price.formattedPrice}</span>
```

**Compliance:** EXCELLENT
- Component is completely dumb
- All display values come from DTO
- No client-side transformations

---

## 4. API Layer DTO Compliance

### Status: PASS

**Files:**
- `/src/lib/api/products.ts`
- `/src/lib/api/articles.ts`
- `/src/lib/api/client.server.ts`
- `/src/lib/api/client.client.ts`

**Findings:**
- All API functions properly typed with DTOs
- Return types explicitly declare DTO shapes
- Mock data properly conforms to DTOs
- BFF integration prepared with correct endpoints

**API Functions:**
```typescript
// Products
- getProducts(params?: FilterParams): Promise<PaginatedResponse<ProductDTO>>
- getProduct(slug: string): Promise<ProductDetailDTO>
- getFeaturedProducts(): Promise<ProductDTO[]>
- checkStock(productId: string): Promise<{ inStock: boolean }>

// Articles
- getArticles(params?): Promise<PaginatedResponse<ArticleDTO>>
- getArticle(slug: string): Promise<ArticleDetailDTO>
```

**Strengths:**
- Generic fetch wrappers properly typed with `<T>`
- Proper separation between server/client fetch
- BFF URLs properly configured via env vars

---

## 5. Mock Data Compliance

### Status: PASS

**Files:**
- `/src/lib/mock/products.ts`
- `/src/lib/mock/articles.ts`

**Findings:**
- Mock data strictly adheres to DTO shapes
- All required fields present
- `formattedPrice` properly formatted
- `availability.label` contains UI-ready text
- No Dolibarr fields in mock data

**Sample Compliance:**
```typescript
price: { amount: 120, currency: 'EUR', formattedPrice: '120,00 €' }
availability: { inStock: true, purchaseMode: 'unique', label: 'Pièce unique' }
```

---

## 6. Contact Form Validation

### Status: PASS

**File:** `/src/app/contact/ContactForm.tsx`

**Findings:**
- Uses `ContactFormData` type from Zod schema
- Runtime validation via `zodResolver(contactFormSchema)`
- Form data matches `ContactFormDTO` shape
- Proper error handling and user feedback

**Code Review:**
```tsx
const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm<ContactFormData>({
  resolver: zodResolver(contactFormSchema),
});
```

**Compliance:** EXCELLENT

---

## 7. Cart Store DTO Usage

### Status: CRITICAL VIOLATION

**File:** `/src/stores/cart-store.ts`

**Findings:**

### VIOLATION 1: Frontend Price Calculation (CRITICAL)

**Location:** Lines 76-86

```typescript
getTotal: () => {
  const total = get().items.reduce(
    (sum, item) => sum + item.price.amount * item.quantity,
    0
  );
  // Format as EUR (indicative only, BFF recalculates)
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(total);
}
```

**Issue:**
- Frontend performs price calculation (`price.amount * item.quantity`)
- Violates "dumb client" principle
- Comment acknowledges it's "indicative only" but computation still exists

**Required Fix:**
The cart store should NOT calculate totals. Options:

**Option A (Recommended):** Remove `getTotal()` entirely
- Cart page calls BFF to get calculated total
- Display loading state while fetching

**Option B:** Keep as pure display helper, rename to clarify
- Rename to `getIndicativeTotal()` with clear documentation
- Add prominent UI disclaimer that it's not final
- Still call BFF for checkout

**Risk Assessment:**
- MEDIUM: Users might treat calculated total as truth
- Could lead to price mismatch confusion
- Violates architecture principle

---

### POSITIVE: Cart Item Storage

**Findings:**
- Cart properly stores `CartItemDTO` objects
- No additional fields added beyond DTO
- Quantity management respects `maxQuantity` from DTO
- Purchase mode validation uses DTO fields

---

## 8. No Dolibarr Fields Check

### Status: PASS

**Search Performed:**
```bash
grep -r "rowid|fk_|entity|extrafields" src/
```

**Result:** No matches found

**Compliance:** PERFECT

---

## 9. Type Safety Audit

### Status: PASS WITH WARNING

**Findings:**
- All imports properly reference `@/types/dtos`
- No inline type definitions for domain objects
- Proper use of TypeScript strict mode

**Warning:**
- `/src/lib/api/client.server.ts` and `client.client.ts` use generic `<T>` without runtime validation
- Consider adding Zod validation for critical BFF responses

**Recommendation:**
Add runtime validation wrapper:
```typescript
async function serverFetchValidated<T>(
  path: string,
  schema: z.ZodSchema<T>,
  options: FetchOptions = {}
): Promise<T> {
  const data = await serverFetch<T>(path, options);
  return schema.parse(data); // Throws if invalid
}
```

---

## Summary of Violations

### Critical (Must Fix)

1. **Frontend Price Calculation** in `cart-store.ts`
   - Location: Lines 76-86
   - Fix: Remove calculation or rename + add disclaimer
   - Priority: HIGH

### Warnings

1. **Missing Runtime Validation** for BFF responses
   - Location: `client.server.ts`, `client.client.ts`
   - Fix: Add Zod schemas for critical DTOs
   - Priority: MEDIUM

---

## DTO Review Checklist for PRs

Use this checklist when reviewing future PRs:

- [ ] DTO contains only fields used by UI
- [ ] No Dolibarr fields (`rowid`, `fk_*`, `entity`, `extrafields`)
- [ ] Formatted fields are produced by BFF (never computed as truth in UI)
- [ ] Date strings are ISO format
- [ ] IDs are strings
- [ ] Optional fields are explicit (`?`)
- [ ] `formattedPrice` used instead of raw amount in components
- [ ] `availability.label` used for display text
- [ ] No price/tax/discount calculations on frontend
- [ ] Cart operations don't compute totals
- [ ] API functions return typed DTOs
- [ ] Critical DTOs have Zod schemas
- [ ] Mock data conforms to DTOs
- [ ] No inline domain types (use `@/types/dtos`)

---

## Recommendations

### Immediate Actions

1. **Fix cart store total calculation**
   - Remove `getTotal()` or rename to `getIndicativeTotal()`
   - Update cart page to fetch total from BFF
   - Add UI disclaimer if keeping indicative calculation

2. **Add runtime validation for critical BFF endpoints**
   - Product detail responses
   - Cart/checkout responses
   - Contact form submission responses

### Phase 3+ Improvements

3. **Create validation middleware**
   - Centralize DTO validation
   - Log validation failures
   - Graceful error UI

4. **Generate DTO documentation**
   - Auto-generate from TypeScript types
   - Keep docs/dtos.md in sync
   - Add examples for each DTO

5. **Add DTO versioning strategy**
   - Prepare for BFF API evolution
   - Backward compatibility handling

---

## Files Reviewed

### Core DTO Files
- `/src/types/dtos.ts` - DTO definitions
- `/src/lib/validations/schemas.ts` - Zod schemas

### API Layer
- `/src/lib/api/products.ts`
- `/src/lib/api/articles.ts`
- `/src/lib/api/client.server.ts`
- `/src/lib/api/client.client.ts`

### Components
- `/src/components/features/ProductCard.tsx`
- `/src/app/contact/ContactForm.tsx`
- `/src/app/page.tsx`
- `/src/components/layout/Header.tsx`
- `/src/components/layout/HeaderClient.tsx`

### State Management
- `/src/stores/cart-store.ts`

### Mock Data
- `/src/lib/mock/products.ts`
- `/src/lib/mock/articles.ts`

### Total Files Reviewed: 15
### Total Source Files: 34 (in `/src`)

---

## Conclusion

Phase 2 implementation demonstrates **strong adherence to DTO contract principles** with excellent separation of concerns. The frontend consumes clean, display-ready DTOs without exposing Dolibarr internals.

**The one critical violation** (cart total calculation) must be addressed before Phase 3 to maintain the "dumb client" architecture principle.

Overall, the implementation provides a solid foundation for BFF integration and maintains clear boundaries between frontend display logic and backend business logic.

**Grade: A- (92/100)**

Deductions:
- -5 points: Frontend price calculation in cart store
- -3 points: Missing runtime validation for BFF responses
