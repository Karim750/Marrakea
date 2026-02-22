import cors from 'cors';
import { config } from '../../config/index.js';

/**
 * CORS middleware configured per deployment notes.
 * - Allowlist only (no wildcard in production)
 * - Credentials enabled for cookie-based auth
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.cors.origins.includes(origin)) {
      callback(null, true);
    } else if (!config.isProduction) {
      // In development, be more permissive
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
});
