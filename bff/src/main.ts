import 'dotenv/config';
import express from 'express';
import { config } from './config/index.js';
import { requestIdMiddleware } from './shared/middleware/requestId.js';
import { corsMiddleware } from './shared/middleware/cors.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { router } from './routes.js';

const app = express();

// Trust proxy for correct IP detection (rate limiting, logging)
app.set('trust proxy', 1);

// Middleware stack
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use(router);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`[BFF] Server running on port ${config.port}`);
  console.log(`[BFF] Environment: ${config.nodeEnv}`);
  console.log(`[BFF] Strapi: ${config.strapi.baseUrl}`);
  console.log(`[BFF] Medusa: ${config.medusa.baseUrl}`);
});

export { app };
