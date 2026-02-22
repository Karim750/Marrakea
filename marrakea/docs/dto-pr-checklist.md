# DTO Contract Compliance Checklist for Pull Requests

Use this checklist when reviewing any PR that touches DTOs, API calls, components, or state management.

---

## General DTO Compliance

### DTO Structure
- [ ] DTO contains only fields used by UI
- [ ] No Dolibarr backend fields exposed (`rowid`, `fk_*`, `entity`, `extrafields`, `import_key`, `date_creation`, `date_modification`, `tms`)
- [ ] No raw database column names (use camelCase, not snake_case)
- [ ] All IDs are typed as `string` (not `number`)
- [ ] Date fields are `string` type (ISO 8601 format expected)
- [ ] Optional fields explicitly marked with `?`
- [ ] No `any` or `unknown` types in DTOs

### Display-Ready Fields
- [ ] Price always includes `formattedPrice: string` field
- [ ] Availability includes `label: string` for UI display
- [ ] Images include `blurDataUrl?: string` for progressive loading
- [ ] All enum values are string literals (not numbers)
- [ ] Boolean flags are named positively (`isAvailable` not `notAvailable`)

---

## Component Compliance

### DTO Usage in Components
- [ ] Components import DTOs from `@/types/dtos` (not inline types)
- [ ] Components use `formattedPrice` instead of raw `amount`
- [ ] Components use `availability.label` for display text
- [ ] No price calculations in components (`price * quantity`)
- [ ] No date formatting (dates come pre-formatted or use utility)
- [ ] No stock/availability logic (use DTO fields)

### No Business Logic
- [ ] No tax calculations
- [ ] No discount calculations
- [ ] No shipping fee calculations
- [ ] No total price calculations
- [ ] No stock quantity checks (beyond displaying DTO data)

---

## API Layer Compliance

### Type Safety
- [ ] All API functions have explicit return types
- [ ] Return types reference DTOs from `@/types/dtos`
- [ ] Generic types properly constrained (`<T extends SomeDTO>`)
- [ ] Fetch wrappers typed with DTO response shapes

### BFF Integration
- [ ] API endpoints documented
- [ ] Error handling includes graceful fallbacks
- [ ] Loading states properly handled
- [ ] No backend URLs or credentials exposed to client

---

## State Management Compliance

### Cart/Store
- [ ] Store only contains DTO fields (no computed fields)
- [ ] No price totaling logic (or clearly marked as "indicative")
- [ ] No stock management logic
- [ ] Quantity updates respect `maxQuantity` from DTO
- [ ] Purchase mode validation uses DTO fields

### Critical: No Computed Truths
- [ ] No calculations that users might interpret as final
- [ ] Cart total comes from BFF (not computed client-side)
- [ ] Tax/shipping comes from BFF
- [ ] Final checkout price comes from BFF webhook

---

## Runtime Validation (Zod)

### Schema Coverage
- [ ] User input forms have Zod schemas
- [ ] Critical BFF responses validated (checkout, payment status)
- [ ] Validation errors handled gracefully
- [ ] Schema types match DTO types (`z.infer<typeof schema>`)

### Required Schemas
- [ ] Contact form: `contactFormSchema`
- [ ] Checkout status: `checkoutStatusSchema`
- [ ] Checkout session: `checkoutSessionSchema`
- [ ] (Add others as needed)

---

## Mock Data Compliance

### Mock Adherence
- [ ] Mock data strictly follows DTO shapes
- [ ] All required DTO fields present in mocks
- [ ] `formattedPrice` properly formatted in mocks
- [ ] `availability.label` contains realistic UI text
- [ ] Mock IDs are strings (not numbers)
- [ ] Mock dates are ISO 8601 strings

---

## Testing Checklist

### Type Tests
- [ ] TypeScript compiles without errors
- [ ] No `@ts-ignore` or `@ts-expect-error` added
- [ ] Strict mode enabled (`"strict": true`)

### Runtime Tests
- [ ] Components render with mock DTOs
- [ ] API calls properly typed
- [ ] Validation schemas catch invalid input
- [ ] Error boundaries handle fetch failures

---

## Documentation Updates

### When to Update Docs
- [ ] New DTO added → update `docs/dtos.md`
- [ ] DTO fields changed → update `docs/dtos.md`
- [ ] New API endpoint → update `docs/dtos.md` and `docs/architecture.md`
- [ ] Validation added → document in `docs/dtos.md`

---

## Red Flags (REJECT PR)

### Immediate Rejection Criteria
- [ ] Raw Dolibarr fields exposed (`rowid`, `fk_*`, etc.)
- [ ] Frontend calculates final price (not indicative)
- [ ] Business logic in components (tax, discount, shipping)
- [ ] Backend internal IDs exposed to user
- [ ] Inline types instead of DTOs
- [ ] Security vulnerabilities (exposed credentials, SQL, etc.)

---

## Approval Criteria

### Must Pass All
- [x] No DTO contract violations
- [x] All components use DTOs correctly
- [x] No business logic on frontend
- [x] Proper type safety throughout
- [x] Critical flows have runtime validation
- [x] Documentation updated

### Nice to Have
- [ ] Unit tests for DTO transformations
- [ ] Integration tests for API calls
- [ ] Storybook examples with DTOs
- [ ] Performance benchmarks

---

## Example Review Comments

### Good PR
```
✅ LGTM - ProductCard properly uses ProductDTO
- formattedPrice displayed without transformation
- availability.label used for UI text
- No business logic detected
```

### Issues Found
```
❌ CHANGES REQUESTED - Cart total calculation violation
- Line 76: Frontend calculates price * quantity
- Required: Remove calculation or fetch from BFF
- See: docs/dtos.md#cart-contract
```

---

## Quick Reference

### Allowed in Frontend
- Display DTO data as-is
- Sort/filter lists (no data transformation)
- Client-side routing
- UI state management (modals, tabs, etc.)
- Form validation (with Zod)

### NOT Allowed in Frontend
- Price/tax/discount calculations (final values)
- Stock/inventory management
- Order total computation (final value)
- Business rule enforcement
- Raw backend data transformation

### Gray Area (Requires Annotation)
- Indicative totals (must be clearly labeled)
- Optimistic UI updates (must sync with BFF)
- Client-side search (if limited to display)

---

## Contact

Questions about DTO contract compliance?
- See: `docs/dtos.md`
- See: `docs/architecture.md`
- See: `docs/dto-compliance-report.md`

---

**Last Updated:** 2026-01-23
**Version:** 1.0
