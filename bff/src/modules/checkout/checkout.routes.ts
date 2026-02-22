import { Router } from 'express';
import { checkoutController } from './checkout.controller.js';

const router = Router();

// POST /checkout/session - Create cart, payment collection, and initialize Stripe
router.post('/session', (req, res, next) => checkoutController.createSession(req, res, next));

// GET /checkout/status - Get checkout status by cart_id
router.get('/status', (req, res, next) => checkoutController.getStatus(req, res, next));

// POST /checkout/complete - Complete checkout after Stripe payment confirmation
router.post('/complete', (req, res, next) => checkoutController.completeCheckout(req, res, next));

export const checkoutRoutes = router;
