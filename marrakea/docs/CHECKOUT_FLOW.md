# Checkout Flow - Medusa v2 Integration

## Overview

The BFF checkout follows the Medusa v2 Payment Collection flow with Stripe integration.

## API Endpoints

### 1. POST /checkout/session

Creates a cart, payment collection, and initializes Stripe payment session.

**Request:**
```json
[
  {
    "productId": "prod_01KFTPFT7E96F3PD196BREWXJ0",
    "quantity": 1,
    "variantId": "variant_01KFTPFT85X47PPJV63BFAAAQB"  // optional
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

**Important:**
- `productId` must be the **Medusa product ID** (starts with `prod_`), NOT the Strapi ID
- `variantId` is optional - if not provided, uses the first variant from the product
- `clientSecret` is used with Stripe Payment Element on the frontend

### 2. GET /checkout/status?cart_id={cartId}

Check the status of a checkout session.

**Response:**
```json
{
  "status": "DRAFT" | "LOCKED" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED",
  "orderId": "order_01KFX..."  // only present when status is PAID
}
```

**Status meanings:**
- `DRAFT`: Cart created, payment not started
- `LOCKED`: Payment session initialized, awaiting payment
- `PAID`: Payment completed, order created
- `CANCELLED`: Checkout was cancelled
- `EXPIRED`: Payment session expired
- `FAILED`: Payment failed

### 3. POST /checkout/complete

Complete the checkout after Stripe payment confirmation.

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

## Frontend Integration

### Step 1: Get Product Data

When displaying products, the BFF returns `medusaProductId`:

```json
{
  "id": "7",                                        // Strapi ID (for display/URLs)
  "slug": "vase-terre-rouge",
  "medusaProductId": "prod_01KFTPFT7E96F3PD196BREWXJ0",  // Use this for checkout!
  "defaultVariantId": "variant_01KFTPFT85X47PPJV63BFAAAQB"
}
```

### Step 2: Create Checkout Session

```typescript
// Use medusaProductId, NOT the Strapi id!
const items = cart.map(item => ({
  productId: item.medusaProductId,  // ✅ Correct: "prod_01KFT..."
  // productId: item.id,            // ❌ Wrong: "7"
  quantity: item.quantity,
  variantId: item.variantId         // optional
}));

const response = await fetch('http://localhost:4000/checkout/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(items)
});

const { cartId, clientSecret } = await response.json();
```

### Step 3: Stripe Payment Element

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...');

// Wrap checkout in Elements provider
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm cartId={cartId} />
</Elements>

// Payment form component
function CheckoutForm({ cartId }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?cart_id=${cartId}`,
      },
    });

    if (error) {
      // Handle error (card declined, etc.)
      console.error(error.message);
    }
    // If successful, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Pay Now</button>
    </form>
  );
}
```

### Step 4: Complete Checkout (Confirmation Page)

After Stripe redirects back to your confirmation page:

```typescript
// On /checkout/confirmation page
const searchParams = new URLSearchParams(window.location.search);
const cartId = searchParams.get('cart_id');
const paymentStatus = searchParams.get('redirect_status'); // 'succeeded' or 'failed'

if (paymentStatus === 'succeeded') {
  const response = await fetch('http://localhost:4000/checkout/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart_id: cartId })
  });

  const { orderId } = await response.json();
  // Show order confirmation with orderId
}
```

## Common Issues

### 1. "Product not found" Error

**Cause:** Using Strapi ID instead of Medusa product ID

**Wrong:**
```json
[{"productId": "7", "quantity": 1}]
```

**Correct:**
```json
[{"productId": "prod_01KFTPFT7E96F3PD196BREWXJ0", "quantity": 1}]
```

**Fix:** Use `product.medusaProductId` from the BFF response, not `product.id`.

### 2. "Payment provider error" (500 from Medusa)

**Cause:** Stripe not configured in Medusa

**Fix:** Configure Stripe payment provider in Medusa with provider ID `pp_stripe_stripe`.

### 3. Empty clientSecret

**Cause:** Stripe payment session not initialized properly

**Fix:** Check Medusa logs for Stripe configuration errors.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
└─────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ 1. POST /checkout/session │                           │
        │    [{ productId, qty }]   │                           │
        ▼                           │                           │
┌─────────────────────────────────────────────────────────────────────┐
│                             BFF                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Create cart (POST /store/carts)                          │   │
│  │ 2. Add line items (POST /store/carts/{id}/line-items)       │   │
│  │ 3. Create payment collection (POST /store/payment-collections)│  │
│  │ 4. Init payment session (POST /store/payment-collections/   │   │
│  │    {id}/payment-sessions with provider_id: pp_stripe_stripe)│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ { cartId, clientSecret }  │                           │
        ▼                           │                           │
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. stripe.confirmPayment({ clientSecret, elements })        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ (Stripe handles payment)  │                           │
        ▼                           │                           │
┌─────────────────────────────────────────────────────────────────────┐
│                           STRIPE                                    │
│  Payment confirmation → Redirect to return_url                      │
└─────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ 3. POST /checkout/complete│                           │
        │    { cart_id }            │                           │
        ▼                           │                           │
┌─────────────────────────────────────────────────────────────────────┐
│                             BFF                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Complete cart (POST /store/carts/{id}/complete)             │   │
│  │ → Creates order in Medusa                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ { orderId }               │                           │
        ▼                           │                           │
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│  Show order confirmation                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Environment Requirements

### Medusa Configuration

1. Stripe payment provider must be installed and configured
2. Provider ID: `pp_stripe_stripe`
3. Region must have Stripe enabled as a payment provider

### BFF Environment Variables

```env
MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_REGION_ID=reg_01KFR...
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_BFF_URL=http://localhost:4000
```
