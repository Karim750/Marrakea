import { Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service.js';
import { setNoCache } from '../../shared/cache/cacheHeaders.js';
import {
  CheckoutPayloadSchema,
  CheckoutSessionDTOSchema,
  CheckoutStatusQuerySchema,
  CheckoutStatusDTOSchema,
} from '../../shared/dtos/index.js';

/**
 * Checkout controller with runtime DTO validation.
 */

export class CheckoutController {
  /**
   * POST /checkout/session
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const items = CheckoutPayloadSchema.parse(req.body);

      const session = await checkoutService.createSession(items);

      // Validate response
      const validated = CheckoutSessionDTOSchema.parse(session);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /checkout/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query params
      const query = CheckoutStatusQuerySchema.parse(req.query);

      const status = await checkoutService.getStatus(query.cart_id);

      // Validate response
      const validated = CheckoutStatusDTOSchema.parse(status);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /checkout/complete
   * Called after Stripe payment confirmation to finalize the order.
   */
  async completeCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const { cart_id } = req.body as { cart_id?: string };
      if (!cart_id) {
        res.status(400).json({ error: 'cart_id is required', code: 'VALIDATION_ERROR' });
        return;
      }

      const result = await checkoutService.completeCheckout(cart_id);

      setNoCache(res);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const checkoutController = new CheckoutController();
