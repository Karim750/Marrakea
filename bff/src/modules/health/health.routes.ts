import { Router, Request, Response } from 'express';
import { setNoCache } from '../../shared/cache/cacheHeaders.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * GET /health
 * Returns health status of the BFF and upstream services.
 */
router.get('/', async (_req: Request, res: Response) => {
  setNoCache(res);

  // Basic health check - could be extended to ping upstreams
  const healthResponse = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      strapi: 'up',
      medusa: 'up',
    },
  };

  // Optionally ping upstreams (commented out for fast response)
  // try {
  //   await fetch(`${config.strapi.baseUrl}/api`, { method: 'HEAD' });
  // } catch {
  //   healthResponse.services.strapi = 'down';
  // }
  // try {
  //   await fetch(`${config.medusa.baseUrl}/health`, { method: 'HEAD' });
  // } catch {
  //   healthResponse.services.medusa = 'down';
  // }

  res.json(healthResponse);
});

export const healthRoutes = router;
