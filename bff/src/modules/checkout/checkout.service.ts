import { medusaClient, MedusaCart } from '../../shared/http/medusa.client.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  CheckoutPayloadItem,
  CheckoutSessionDTO,
  CheckoutStatusDTO,
} from '../../shared/dtos/index.js';

/**
 * Checkout service handling Medusa v2 Payment Collection flow.
 *
 * Flow:
 * 1. Create cart with region
 * 2. Add line items to cart
 * 3. Create Payment Collection for cart
 * 4. Initialize Payment Session (Stripe) on Payment Collection
 * 5. Return client_secret to frontend for Stripe Payment Element
 * 6. Frontend confirms payment with Stripe
 * 7. Complete cart to create order
 */

// Stripe provider ID in Medusa v2
const STRIPE_PROVIDER_ID = 'pp_stripe_stripe';

export class CheckoutService {
  /**
   * Create a checkout session using Medusa v2 Payment Collection flow.
   * Returns cartId, paymentCollectionId, and Stripe client_secret.
   */
  async createSession(items: CheckoutPayloadItem[]): Promise<CheckoutSessionDTO> {
    // Validate items
    for (const item of items) {
      if (item.quantity < 1) {
        throw AppError.invalidQuantity();
      }
    }

    // Step 1: Create cart with region
    const cart = await medusaClient.createCart();
    console.log('[CHECKOUT] Created cart:', cart.id);

    // Step 2: Add line items
    for (const item of items) {
      const variantId = await this.resolveVariantId(item);

      // Check stock before adding
      const product = await medusaClient.getProduct(item.productId);
      if (product) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant?.manage_inventory && (variant.inventory_quantity ?? 0) < item.quantity) {
          throw AppError.outOfStock(item.productId);
        }
      }

      await medusaClient.addLineItem(cart.id, variantId, item.quantity);
      console.log('[CHECKOUT] Added line item:', { variantId, quantity: item.quantity });
    }

    // Step 3: Create Payment Collection for the cart
    let paymentCollection;
    try {
      paymentCollection = await medusaClient.createPaymentCollection(cart.id);
      console.log('[CHECKOUT] Created payment collection:', paymentCollection.id);
    } catch (err) {
      console.error('[CHECKOUT] Failed to create payment collection:', err);
      throw AppError.paymentProviderError();
    }

    // Step 4: Initialize Stripe Payment Session on the Payment Collection
    let paymentSession;
    try {
      paymentSession = await medusaClient.initializePaymentSession(
        paymentCollection.id,
        STRIPE_PROVIDER_ID
      );
      console.log('[CHECKOUT] Initialized payment session:', paymentSession.id);
    } catch (err) {
      console.error('[CHECKOUT] Failed to initialize payment session:', err);
      throw AppError.paymentProviderError();
    }

    // Extract Stripe client_secret from payment session data
    const clientSecret = paymentSession.data?.client_secret;

    return {
      cartId: cart.id,
      paymentCollectionId: paymentCollection.id,
      clientSecret,
    };
  }

  /**
   * Get checkout status by cart ID.
   */
  async getStatus(cartId: string): Promise<CheckoutStatusDTO> {
    const cart = await medusaClient.getCart(cartId);

    if (!cart) {
      throw AppError.cartNotFound();
    }

    // Determine status based on cart state
    const status = this.determineCartStatus(cart);

    return {
      status,
      orderId: undefined, // Set after order completion
    };
  }

  /**
   * Complete the checkout after payment confirmation.
   * Called by frontend after Stripe payment is confirmed.
   */
  async completeCheckout(cartId: string): Promise<{ orderId?: string }> {
    try {
      const result = await medusaClient.completeCart(cartId);

      if (result.order) {
        console.log('[CHECKOUT] Order created:', result.order.id);
        return { orderId: result.order.id };
      }

      // Cart completion failed
      console.error('[CHECKOUT] Cart completion did not create order');
      throw AppError.paymentProviderError();
    } catch (err) {
      console.error('[CHECKOUT] Failed to complete cart:', err);
      throw AppError.paymentProviderError();
    }
  }

  /**
   * Resolve variant ID for a checkout item.
   * Priority: request.variantId > Medusa product.variants[0]
   */
  private async resolveVariantId(item: CheckoutPayloadItem): Promise<string> {
    // If variantId is provided, use it
    if (item.variantId) {
      return item.variantId;
    }

    // Get default variant from Medusa product
    try {
      const product = await medusaClient.getProduct(item.productId);
      if (product && product.variants.length > 0) {
        return product.variants[0].id;
      }
    } catch {
      // Fall through
    }

    throw AppError.productNotFound();
  }

  /**
   * Determine cart status from Medusa cart state.
   */
  private determineCartStatus(cart: MedusaCart): CheckoutStatusDTO['status'] {
    // Completed cart (order created)
    if (cart.completed_at) {
      return 'PAID';
    }

    // Has payment collection with sessions
    if (cart.payment_collection?.payment_sessions?.length) {
      const sessions = cart.payment_collection.payment_sessions;

      // Check if any session is authorized/captured
      const authorizedSession = sessions.find(
        (s) => s.status === 'authorized' || s.status === 'captured'
      );
      if (authorizedSession) {
        return 'LOCKED';
      }

      // Has pending payment sessions
      return 'LOCKED';
    }

    // Has payment collection but no sessions
    if (cart.payment_collection) {
      return 'DRAFT';
    }

    // No payment collection yet
    return 'DRAFT';
  }
}

export const checkoutService = new CheckoutService();
