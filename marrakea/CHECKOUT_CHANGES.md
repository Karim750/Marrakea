# Checkout Flow Implementation - Summary of Changes

This document summarizes all changes made to align the frontend checkout implementation with the Medusa v2 Payment Collection flow documented in `docs/CHECKOUT_FLOW.md`.

## Overview

The checkout flow has been updated to use **Stripe Payment Element** integrated directly in the frontend, replacing the previous redirect-based approach. The implementation now follows the Medusa v2 Payment Collection flow with proper cart management.

---

## Key Changes

### 1. Updated DTOs (`src/types/dtos.ts`)

**Before:**
```typescript
export interface CheckoutSessionDTO {
  checkoutUrl: string;
}
```

**After:**
```typescript
export interface CheckoutSessionDTO {
  cartId: string;
  paymentCollectionId: string;
  clientSecret: string;
}
```

This aligns with the BFF response structure documented in CHECKOUT_FLOW.md.

---

### 2. Updated Checkout API (`src/lib/api/checkout.ts`)

#### Changes Made:
- **Changed `getCheckoutStatus` parameter**: Now uses `cart_id` instead of `session_id`
- **Updated mock responses**: Reflect new DTO structure
- **Added `completeCheckout` function**: Calls `POST /checkout/complete` with `cart_id`

#### New Function:
```typescript
export async function completeCheckout(cartId: string): Promise<{ orderId: string }> {
  const res = await fetch(`${BFF_URL}/checkout/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart_id: cartId }),
    cache: 'no-store',
    credentials: 'include',
  });
  return res.json();
}
```

---

### 3. Integrated Stripe Payment Element

#### New Component: `CheckoutForm.tsx`
- Renders Stripe Payment Element
- Handles `stripe.confirmPayment()` on form submission
- Redirects to `/panier/success?cart_id={cartId}` with `redirect_status`
- Displays payment errors inline

#### Updated `CartPageClient.tsx`
The cart page now has **three states**:

1. **Empty State**: Shows message + link to catalog
2. **Cart View**: Display items with quantity controls and summary
3. **Checkout View**: Shows order summary + Stripe Payment Element side-by-side

**Flow:**
1. User clicks "Passer au paiement"
2. Frontend calls `createCheckoutSession(items)`
3. BFF returns `{ cartId, paymentCollectionId, clientSecret }`
4. Component switches to checkout view with Stripe Elements
5. User enters payment details and submits
6. Stripe redirects to success page

---

### 4. Updated Success Page (`SuccessPageClient.tsx`)

#### New Flow:
1. **Extract URL params**: `cart_id` and `redirect_status`
2. **If `redirect_status === 'succeeded'`**: Call `completeCheckout(cart_id)` to finalize order
3. **Poll status**: Query `/checkout/status?cart_id={cartId}` every 2 seconds
4. **Status-based UI**:
   - `DRAFT/LOCKED`: Loading spinner with polling
   - `PAID`: Success message with order ID
   - `CANCELLED/EXPIRED/FAILED`: Error states with retry options

#### Key Features:
- Waits for `completeCheckout()` to succeed before polling status
- Handles Stripe redirect statuses (`succeeded`, `failed`)
- Clears cart only when status is `PAID`
- Graceful error handling with actionable messages

---

### 5. Fixed Product ID Mapping (`AddToCartButton.tsx`)

**Critical Fix:**
```typescript
// Before (WRONG - using Strapi ID)
productId: product.id

// After (CORRECT - using Medusa product ID)
productId: product.medusaProductId
```

This ensures the checkout payload sends the correct Medusa product IDs (`prod_*`) to the BFF, not Strapi IDs.

---

### 6. Simplified Cart Drawer (`CartDrawer.tsx`)

**Before:** Attempted to create checkout session and redirect to external URL
**After:** Simply closes drawer and navigates to `/panier` page

**Reasoning:** The full Stripe Payment Element integration requires proper layout and form handling, which is better suited for the dedicated cart page.

---

### 7. Updated Validation Schemas (`src/lib/validations/schemas.ts`)

```typescript
// Updated to match new DTO structure
export const checkoutSessionSchema = z.object({
  cartId: z.string(),
  paymentCollectionId: z.string(),
  clientSecret: z.string(),
});
```

---

### 8. Added Stripe Dependencies (`package.json`)

```json
{
  "dependencies": {
    "@stripe/react-stripe-js": "^2.8.1",
    "@stripe/stripe-js": "^4.10.0"
  }
}
```

---

### 9. Updated Environment Variables (`.env.example`)

Added Stripe publishable key configuration:

```env
# Payment Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## API Endpoints Used

### 1. `POST /checkout/session`
**Request:**
```json
[
  {
    "productId": "prod_01KFTPFT7E96F3PD196BREWXJ0",  // Medusa product ID
    "quantity": 1
  }
]
```

**Response:**
```json
{
  "cartId": "cart_01KFX...",
  "paymentCollectionId": "pay_col_01KFX...",
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### 2. `GET /checkout/status?cart_id={cartId}`
**Response:**
```json
{
  "status": "PAID",
  "orderId": "order_01KFX..."
}
```

### 3. `POST /checkout/complete`
**Request:**
```json
{
  "cart_id": "cart_01KFX..."
}
```

**Response:**
```json
{
  "orderId": "order_01KFX..."
}
```

---

## User Flow (End-to-End)

### Step 1: Add to Cart
1. User views product page
2. Clicks "Ajouter au panier"
3. Product added with `medusaProductId` (not Strapi ID)

### Step 2: View Cart
1. User navigates to `/panier` or opens cart drawer
2. Sees cart items with quantity controls
3. Clicks "Passer au paiement"

### Step 3: Checkout
1. Frontend calls BFF: `POST /checkout/session` with product IDs
2. BFF creates Medusa cart + payment collection + Stripe session
3. Frontend receives `clientSecret` and renders Stripe Payment Element
4. User enters card details (handled by Stripe iFrame)
5. User clicks "Payer maintenant"
6. Stripe validates payment and redirects to success page

### Step 4: Confirmation
1. Stripe redirects to `/panier/success?cart_id=XXX&redirect_status=succeeded`
2. Frontend calls BFF: `POST /checkout/complete` with `cart_id`
3. BFF completes Medusa cart → creates order
4. Frontend polls `GET /checkout/status?cart_id=XXX` until status is `PAID`
5. Display order confirmation with `orderId`
6. Cart is cleared from localStorage

---

## Files Modified

### Core Logic
- `src/types/dtos.ts` - Updated `CheckoutSessionDTO`
- `src/lib/api/checkout.ts` - Updated API calls, added `completeCheckout()`
- `src/lib/validations/schemas.ts` - Updated validation schema

### Components
- `src/components/features/cart/CartPageClient.tsx` - Full Stripe integration
- `src/components/features/cart/CheckoutForm.tsx` - **NEW** - Stripe form
- `src/components/features/cart/SuccessPageClient.tsx` - Updated flow with `completeCheckout()`
- `src/components/features/cart/CartDrawer.tsx` - Simplified to redirect to `/panier`
- `src/components/features/product/AddToCartButton.tsx` - Fixed product ID mapping

### Styles
- `src/components/features/cart/CartPageClient.module.css` - Added checkout layout styles
- `src/components/features/cart/CheckoutForm.module.css` - **NEW** - Stripe form styles

### Configuration
- `package.json` - Added Stripe dependencies
- `.env.example` - Added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Environment Setup Required

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
NEXT_PUBLIC_BFF_URL=http://localhost:4000
NEXT_PUBLIC_USE_MOCK=false
```

### 3. BFF Requirements
The BFF must be configured with:
- Medusa v2 integration
- Stripe payment provider (provider ID: `pp_stripe_stripe`)
- Endpoints: `/checkout/session`, `/checkout/status`, `/checkout/complete`

---

## Important Notes

### Security
- ✅ Frontend never calculates final prices (BFF handles all pricing)
- ✅ Stripe `clientSecret` is used for secure payment initialization
- ✅ Payment confirmation happens server-side via Medusa webhooks
- ✅ Frontend only displays status after BFF confirms order creation

### Product IDs
⚠️ **Critical:** Always use `medusaProductId` for checkout, never Strapi IDs:
- ✅ Correct: `"productId": "prod_01KFTPFT7E96F3PD196BREWXJ0"`
- ❌ Wrong: `"productId": "7"`

### Mock Mode
When `NEXT_PUBLIC_USE_MOCK=true`, the checkout flow returns mock data without calling the BFF or Stripe.

---

## Testing Checklist

- [ ] Add product to cart (verify `medusaProductId` is stored)
- [ ] View cart page with items
- [ ] Click "Passer au paiement" → Stripe form appears
- [ ] Enter test card (4242 4242 4242 4242)
- [ ] Submit payment → redirects to success page
- [ ] Success page polls status → shows order confirmation
- [ ] Cart is cleared after successful order
- [ ] Test error states (cancelled, expired, failed)
- [ ] Test cart drawer → redirects to `/panier`

---

## Stripe Test Cards

- **Success:** 4242 4242 4242 4242
- **Declined:** 4000 0000 0000 0002
- **Requires Auth:** 4000 0027 6000 3184

Use any future expiry date and any 3-digit CVC.

---

## Migration from Old Flow

### Before (Redirect-based)
```typescript
const { checkoutUrl } = await createCheckoutSession(items);
window.location.href = checkoutUrl; // External redirect
```

### After (Embedded Stripe)
```typescript
const { cartId, clientSecret } = await createCheckoutSession(items);
// Render Stripe Payment Element with clientSecret
// User completes payment in-app
// Stripe redirects to /panier/success with cart_id
```

---

## Questions?

Refer to:
- `docs/CHECKOUT_FLOW.md` - Complete BFF integration guide
- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element)
- [Medusa v2 Payment Collections](https://docs.medusajs.com/v2/resources/commerce-modules/payment)
