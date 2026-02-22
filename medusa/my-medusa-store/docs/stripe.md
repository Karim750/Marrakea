# Stripe Payment Integration (Medusa v2)

This document explains how to configure Stripe payments for this Medusa v2 backend.

## Prerequisites

- A Stripe account (https://dashboard.stripe.com)
- Stripe API keys (use TEST keys for development)

## Environment Variables

Add these to your `.env` file:

```bash
# Stripe Secret Key (backend only)
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_API_KEY=sk_test_xxx

# Stripe Webhook Secret
# Get from: Stripe Dashboard > Developers > Webhooks > Your endpoint > Signing secret
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Important:**
- `STRIPE_API_KEY` is your **Secret Key** (starts with `sk_test_` for test mode)
- The **Publishable Key** (`pk_test_...`) is used only in your storefront, not in the backend
- Never commit real API keys to version control

## Medusa Config

The Stripe provider is configured in `medusa-config.ts`:

```typescript
modules: [
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "@medusajs/payment-stripe",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            capture: true,
          },
        },
      ],
    },
  },
],
```

## Webhook Configuration

Stripe uses webhooks to notify Medusa of payment events (successful charges, refunds, disputes, etc.).

### Webhook Endpoint URL

In Medusa v2, the webhook endpoint follows this pattern:

```
{BACKEND_URL}/hooks/payment/stripe_stripe
```

For local development:
```
http://localhost:9000/hooks/payment/stripe_stripe
```

For production:
```
https://your-medusa-backend.com/hooks/payment/stripe_stripe
```

### Setting Up Webhooks in Stripe Dashboard

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL: `{BACKEND_URL}/hooks/payment/stripe_stripe`
4. Select events to listen to (recommended minimum):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.amount_capturable_updated`
   - `charge.refunded`
   - `charge.refund.updated`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`) and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

### Local Development with Stripe CLI

For local testing, use the Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local Medusa backend
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe

# The CLI will display a webhook signing secret (whsec_...)
# Use this as STRIPE_WEBHOOK_SECRET for local development
```

## Provider ID Reference

In Medusa v2, payment provider IDs follow this pattern:

| Context | ID Format |
|---------|-----------|
| Config (`medusa-config.ts`) | `stripe` |
| Database / Admin API | `pp_stripe_stripe` |
| Webhook path | `stripe_stripe` |
| Storefront selection | `pp_stripe_stripe` |

When selecting a payment provider in your storefront cart, use `pp_stripe_stripe`.

## Enabling Stripe in Admin

1. Start your Medusa backend
2. Go to Admin UI: http://localhost:9000/app
3. Navigate to **Settings > Regions**
4. Select your region (e.g., "Europe")
5. In the **Payment Providers** section, enable **Stripe**
6. Save changes

## Verification

### Check Provider Registration

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:9000/auth/user/emailpass \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"supersecret"}' | jq -r '.token')

# Check region's payment providers
curl -s "http://localhost:9000/admin/regions/{region_id}?fields=*payment_providers" \
  -H "Authorization: Bearer $TOKEN" | jq '.region.payment_providers'
```

Expected output should include:
```json
[
  {
    "id": "pp_stripe_stripe",
    "is_enabled": true
  }
]
```

### Link Stripe to a Region via API

```bash
curl -X POST "http://localhost:9000/admin/regions/{region_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_providers":["pp_stripe_stripe"]}'
```

You can also add multiple Stripe payment methods:
- `pp_stripe_stripe` - Card payments
- `pp_stripe-ideal_stripe` - iDEAL (Netherlands)
- `pp_stripe-bancontact_stripe` - Bancontact (Belgium)
- `pp_stripe-giropay_stripe` - Giropay (Germany)
- `pp_stripe-przelewy24_stripe` - Przelewy24 (Poland)
```

### Test Checkout Flow

1. Create a cart with a region that has Stripe enabled
2. Add line items
3. Initialize payment session with provider `pp_stripe_stripe`
4. Use Stripe test card: `4242 4242 4242 4242`

## Troubleshooting

### "No payment provider found"
- Ensure `STRIPE_API_KEY` is set in your environment
- Restart the Medusa backend after adding env vars
- Check that Stripe is enabled for the region in Admin

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- For local dev, use the secret provided by `stripe listen`
- Make sure the webhook URL path is correct: `/hooks/payment/stripe_stripe`

### Provider not showing in Admin
- Run database migrations: `yarn medusa db:migrate`
- Check Medusa logs for module registration errors
- Verify the `@medusajs/payment-stripe` package is installed

## Test Cards

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 3220` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined (generic) |

Use any future expiry date and any 3-digit CVC.
