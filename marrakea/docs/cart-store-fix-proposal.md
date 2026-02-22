# Cart Store Total Calculation - Fix Proposal

**Issue:** Cart store computes price totals on frontend, violating "dumb client" principle.

**Location:** `/src/stores/cart-store.ts` lines 76-86

---

## Current Violation

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

**Problems:**
1. Frontend performs business logic calculation
2. Users might interpret as final price
3. No tax, discount, or shipping consideration
4. Violates architecture contract

---

## Option A: Remove Client Calculation (RECOMMENDED)

### Approach
Remove `getTotal()` entirely. Cart page fetches real-time total from BFF.

### Implementation

**1. Update cart-store.ts**

```typescript
// Remove getTotal() method entirely
interface CartState {
  items: CartItemDTO[];
  addItem: (_item: Omit<CartItemDTO, 'quantity'>) => void;
  removeItem: (_productId: string) => void;
  updateQuantity: (_productId: string, _quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  // getTotal: () => string; // REMOVED
}
```

**2. Create BFF cart API** (`/src/lib/api/cart.ts`)

```typescript
import type { CartDTO } from '@/types/dtos';

export async function getCartWithTotals(
  items: CartItemDTO[]
): Promise<CartDTO> {
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

  if (USE_MOCK) {
    // Mock calculation for development
    const total = items.reduce(
      (sum, item) => sum + item.price.amount * item.quantity,
      0
    );

    return {
      items,
      totals: {
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        formattedTotal: new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(total),
      },
    };
  }

  // Real BFF call
  const { clientFetch } = await import('./client.client');
  return clientFetch<CartDTO>('/cart/calculate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
```

**3. Update cart page** (`/src/app/panier/page.tsx`)

```tsx
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useQuery } from '@tanstack/react-query';
import { getCartWithTotals } from '@/lib/api/cart';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', items],
    queryFn: () => getCartWithTotals(items),
    enabled: items.length > 0,
  });

  return (
    <div>
      {/* Render cart items */}
      {cart && (
        <div>
          <p>Total: {cart.totals.formattedTotal}</p>
        </div>
      )}
      {isLoading && <p>Calculating total...</p>}
    </div>
  );
}
```

### Pros
- ✅ Zero business logic on frontend
- ✅ BFF is source of truth for pricing
- ✅ Tax/discount/shipping can be added later
- ✅ Fully compliant with architecture

### Cons
- ⚠️ Requires BFF endpoint implementation
- ⚠️ Network latency for total display
- ⚠️ More complex (API call required)

---

## Option B: Rename + Disclaimer (ACCEPTABLE)

### Approach
Keep calculation but rename to clarify it's not final. Add prominent UI disclaimer.

### Implementation

**1. Update cart-store.ts**

```typescript
interface CartState {
  items: CartItemDTO[];
  addItem: (_item: Omit<CartItemDTO, 'quantity'>) => void;
  removeItem: (_productId: string) => void;
  updateQuantity: (_productId: string, _quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getIndicativeTotal: () => string; // RENAMED from getTotal
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // ... other methods ...

      /**
       * INDICATIVE ONLY - NOT FINAL PRICE
       * Does not include tax, shipping, or discounts.
       * BFF recalculates final price at checkout.
       */
      getIndicativeTotal: () => {
        const subtotal = get().items.reduce(
          (sum, item) => sum + item.price.amount * item.quantity,
          0
        );
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(subtotal);
      },
    }),
    {
      name: 'marrakea-cart',
    }
  )
);
```

**2. Update cart page UI with disclaimer**

```tsx
'use client';

import { useCartStore } from '@/stores/cart-store';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const indicativeTotal = useCartStore((state) => state.getIndicativeTotal());

  return (
    <div>
      {/* Cart items */}

      <div className={styles.totalSection}>
        <p className={styles.indicativeLabel}>
          Sous-total indicatif *
        </p>
        <p className={styles.total}>{indicativeTotal}</p>

        <p className={styles.disclaimer}>
          * Prix indicatif hors taxes et frais de port.
          Le montant final sera calculé lors du paiement.
        </p>

        <Button href="/checkout" variant="primary">
          Passer commande
        </Button>
      </div>
    </div>
  );
}
```

**3. Add CSS for disclaimer**

```css
.indicativeLabel {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

.disclaimer {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-warning-bg);
  border-left: 3px solid var(--color-warning);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
```

### Pros
- ✅ Simple implementation
- ✅ Works with current Phase 2 scope
- ✅ Clear communication to users
- ✅ No BFF endpoint needed yet

### Cons
- ⚠️ Still performs calculation (even if labeled)
- ⚠️ Users might ignore disclaimer
- ⚠️ Doesn't scale (can't add tax/shipping)
- ⚠️ Partially violates architecture principle

---

## Option C: Hybrid Approach (FUTURE-PROOF)

### Approach
Use Option B for Phase 2, prepare for Option A in Phase 3+.

### Implementation

**Phase 2 (Now):**
1. Implement Option B (rename + disclaimer)
2. Document debt in TODO
3. Add feature flag for future BFF call

**Phase 3+ (Later):**
1. Implement BFF `/cart/calculate` endpoint
2. Add `getCartWithTotals()` API function
3. Update cart page to use BFF
4. Remove `getIndicativeTotal()` from store

### Feature Flag Example

```typescript
const USE_BFF_CART_TOTAL = process.env.NEXT_PUBLIC_USE_BFF_CART_TOTAL === 'true';

// In cart page
const indicativeTotal = !USE_BFF_CART_TOTAL
  ? useCartStore((state) => state.getIndicativeTotal())
  : null;

const { data: cart } = useQuery({
  queryKey: ['cart', items],
  queryFn: () => getCartWithTotals(items),
  enabled: USE_BFF_CART_TOTAL && items.length > 0,
});

const displayTotal = USE_BFF_CART_TOTAL
  ? cart?.totals.formattedTotal
  : indicativeTotal;
```

### Pros
- ✅ Allows phased implementation
- ✅ Doesn't block Phase 2 progress
- ✅ Prepares for proper BFF integration
- ✅ Easy rollout with feature flag

### Cons
- ⚠️ Maintains temporary technical debt
- ⚠️ Requires discipline to follow through

---

## Recommendation Matrix

| Scenario | Recommended Option |
|----------|-------------------|
| BFF ready now | Option A |
| BFF not ready, urgent Phase 2 | Option B |
| BFF planned soon | Option C |
| High compliance requirement | Option A |

---

## Decision: Option C (Hybrid)

**Rationale:**
1. Phase 2 focuses on UI structure
2. BFF integration is Phase 6
3. Clear path to compliance
4. Doesn't block current work

**Implementation Timeline:**
- **Now (Phase 2):** Implement Option B
- **Phase 3-5:** Monitor user feedback
- **Phase 6 (BFF Integration):** Implement Option A

---

## Action Items

### Immediate (Phase 2)
1. [ ] Rename `getTotal()` to `getIndicativeTotal()`
2. [ ] Add JSDoc comment with warning
3. [ ] Update cart page with disclaimer UI
4. [ ] Add CSS for disclaimer styling
5. [ ] Update tests

### Future (Phase 6)
1. [ ] Create `lib/api/cart.ts` with `getCartWithTotals()`
2. [ ] Update cart page to use BFF total
3. [ ] Remove `getIndicativeTotal()` from store
4. [ ] Update DTO docs
5. [ ] Remove disclaimer UI

---

## Testing Checklist

### Manual Tests
- [ ] Cart displays indicative total
- [ ] Disclaimer is prominent and readable
- [ ] Total updates when quantity changes
- [ ] Mobile layout is correct
- [ ] Accessibility: screen reader announces disclaimer

### Unit Tests
```typescript
describe('getIndicativeTotal', () => {
  it('calculates subtotal correctly', () => {
    // ...
  });

  it('formats as EUR', () => {
    // ...
  });

  it('returns zero for empty cart', () => {
    // ...
  });
});
```

---

## Documentation Updates

1. Update `docs/dtos.md`:
   - Document `getIndicativeTotal()` as temporary
   - Add note about future BFF migration

2. Update `docs/checkout.md`:
   - Clarify cart total vs checkout total
   - Document BFF as source of truth

3. Update `docs/phases.md`:
   - Add "Migrate cart total to BFF" to Phase 6

---

**Status:** Awaiting decision
**Priority:** HIGH
**Estimated effort:** 2-4 hours (Option B/C), 1-2 days (Option A)
