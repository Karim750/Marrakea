import { Router } from 'express';
import { catalogController } from './catalog.controller.js';

const router = Router();

// GET /catalog/products - must be before :slug to avoid conflict
router.get('/products', (req, res, next) => catalogController.listProducts(req, res, next));

// GET /catalog/products/featured - must be before :slug to avoid conflict
router.get('/products/featured', (req, res, next) => catalogController.getFeatured(req, res, next));

// GET /catalog/products/:slug
router.get('/products/:slug', (req, res, next) => catalogController.getProductBySlug(req, res, next));

// GET /catalog/products/:productId/stock
router.get('/products/:productId/stock', (req, res, next) => catalogController.getStock(req, res, next));

// GET /catalog/gestures
router.get('/gestures', (req, res, next) => catalogController.listGestures(req, res, next));

// GET /catalog/territories
router.get('/territories', (req, res, next) => catalogController.listTerritories(req, res, next));

export const catalogRoutes = router;
