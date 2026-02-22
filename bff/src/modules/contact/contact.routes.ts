import { Router } from 'express';
import { contactController } from './contact.controller.js';
import { createRateLimiter } from '../../shared/rate-limit/rateLimit.js';
import { config } from '../../config/index.js';

const router = Router();

// Rate limiter for contact endpoint
const contactRateLimiter = createRateLimiter(
  config.rateLimit.contact.windowMs,
  config.rateLimit.contact.maxRequests
);

// POST /contact (with rate limiting)
router.post('/', contactRateLimiter, (req, res, next) => contactController.submit(req, res, next));

export const contactRoutes = router;
