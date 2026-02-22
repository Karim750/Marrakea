import { Router } from 'express';
import { healthRoutes } from './modules/health/health.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { blogRoutes } from './modules/blog/blog.routes.js';
import { checkoutRoutes } from './modules/checkout/checkout.routes.js';
import { accountRoutes } from './modules/account/account.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';

const router = Router();

// Health endpoint
router.use('/health', healthRoutes);

// Catalog endpoints
router.use('/catalog', catalogRoutes);

// Blog endpoints
router.use('/blog', blogRoutes);

// Checkout endpoints
router.use('/checkout', checkoutRoutes);

// Account endpoints
router.use('/account', accountRoutes);

// Contact endpoint
router.use('/contact', contactRoutes);

export { router };
