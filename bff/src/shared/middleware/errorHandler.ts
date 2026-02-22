import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { ZodError } from 'zod';

/**
 * Global error handler middleware.
 * Ensures all errors are returned in the standard contract format:
 * { error: string, code: string, details?: object }
 *
 * Per contract: all transactional endpoints use Cache-Control: no-store
 * Error responses should also be no-store to prevent caching errors.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (never log tokens or auth headers)
  const logData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  };
  console.error('[ERROR]', JSON.stringify(logData, null, 2));

  // Always set no-store for error responses to prevent caching errors
  res.setHeader('Cache-Control', 'no-store');

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = AppError.validationError({
      issues: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    res.status(validationError.statusCode).json(validationError.toJSON());
    return;
  }

  // Handle unknown errors
  const internalError = AppError.internal();
  res.status(internalError.statusCode).json(internalError.toJSON());
}
