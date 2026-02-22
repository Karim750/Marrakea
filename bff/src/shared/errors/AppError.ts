/**
 * Custom application error class that matches the contract error format.
 * All errors returned to the client must use this class.
 */

export type ErrorCode =
  // Catalog
  | 'UNSUPPORTED_SORT'
  | 'PRODUCT_NOT_FOUND'
  | 'PRICE_NOT_RESOLVABLE'
  | 'GHOST_PRODUCT_REFERENCE'
  // Blog
  | 'ARTICLE_NOT_FOUND'
  // Checkout
  | 'INVALID_QUANTITY'
  | 'OUT_OF_STOCK'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'CART_NOT_FOUND'
  // Account
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'REGISTRATION_FAILED'
  // Contact
  | 'INVALID_EMAIL'
  | 'RATE_LIMIT_EXCEEDED'
  // Generic
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && Object.keys(this.details).length > 0
        ? { details: this.details }
        : {}),
    };
  }

  // Factory methods for common errors

  static unsupportedSort(supported: string[]): AppError {
    return new AppError(400, 'UNSUPPORTED_SORT', 'Sorting by price is not supported in v1', {
      supported,
    });
  }

  static productNotFound(): AppError {
    return new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }

  static priceNotResolvable(productId: string): AppError {
    return new AppError(500, 'PRICE_NOT_RESOLVABLE', 'Price could not be resolved for product', {
      productId,
    });
  }

  static articleNotFound(): AppError {
    return new AppError(404, 'ARTICLE_NOT_FOUND', 'Article not found');
  }

  static invalidQuantity(): AppError {
    return new AppError(400, 'INVALID_QUANTITY', 'Invalid quantity provided');
  }

  static outOfStock(productId: string): AppError {
    return new AppError(409, 'OUT_OF_STOCK', 'Product out of stock', { productId });
  }

  static paymentProviderError(): AppError {
    return new AppError(500, 'PAYMENT_PROVIDER_ERROR', 'Payment provider error');
  }

  static cartNotFound(): AppError {
    return new AppError(404, 'CART_NOT_FOUND', 'Cart not found');
  }

  static invalidCredentials(): AppError {
    return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  static unauthenticated(): AppError {
    return new AppError(401, 'UNAUTHENTICATED', 'Not authenticated');
  }

  static invalidEmail(): AppError {
    return new AppError(400, 'INVALID_EMAIL', 'Invalid email address');
  }

  static rateLimitExceeded(retryAfter: number): AppError {
    return new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests', { retryAfter });
  }

  static validationError(details: Record<string, unknown>): AppError {
    return new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}
