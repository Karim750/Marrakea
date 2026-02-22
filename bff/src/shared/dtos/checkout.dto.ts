import { z } from 'zod';

/**
 * Checkout DTOs matching /spec/00-contract.md exactly.
 */

// CheckoutPayloadItem (request body item)
export const CheckoutPayloadItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  variantId: z.string().optional(),
});
export type CheckoutPayloadItem = z.infer<typeof CheckoutPayloadItemSchema>;

// CheckoutPayload (request body - array of items)
export const CheckoutPayloadSchema = z.array(CheckoutPayloadItemSchema).min(1);
export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;

// CheckoutSessionDTO (response)
// Medusa v2 Payment Collection flow returns client_secret for Stripe Payment Element
export const CheckoutSessionDTOSchema = z.object({
  cartId: z.string(),
  paymentCollectionId: z.string(),
  clientSecret: z.string().optional(), // Stripe client_secret for Payment Element
  checkoutUrl: z.string().optional(), // Legacy: Stripe hosted checkout URL
});
export type CheckoutSessionDTO = z.infer<typeof CheckoutSessionDTOSchema>;

// CheckoutStatusDTO (response)
export const CheckoutStatusDTOSchema = z.object({
  status: z.enum(['DRAFT', 'LOCKED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED']),
  orderId: z.string().optional(),
});
export type CheckoutStatusDTO = z.infer<typeof CheckoutStatusDTOSchema>;

// Query params for checkout status
export const CheckoutStatusQuerySchema = z.object({
  cart_id: z.string(),
});
export type CheckoutStatusQuery = z.infer<typeof CheckoutStatusQuerySchema>;
