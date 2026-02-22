import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Simple in-memory rate limiter.
 * For production, consider using Redis-based rate limiting.
 */
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const store: RateLimitStore = {};

  // Clean up expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, windowMs);

  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Use IP as the key (trust X-Forwarded-For if behind proxy)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, maxRequests - store[key].count);
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

    if (store[key].count > maxRequests) {
      throw AppError.rateLimitExceeded(retryAfter);
    }

    next();
  };
}
