/**
 * Environment configuration for the BFF.
 * All env vars are validated at startup.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function optionalBool(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function optionalInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config = {
  // Server
  port: optionalInt('BFF_PORT', 4000),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',

  // Strapi
  strapi: {
    baseUrl: required('STRAPI_BASE_URL'),
    apiToken: required('STRAPI_API_TOKEN'),
    timeout: optionalInt('STRAPI_TIMEOUT', 10000),
  },

  // Medusa
  medusa: {
    baseUrl: required('MEDUSA_BASE_URL'),
    publishableKey: required('MEDUSA_PUBLISHABLE_KEY'),
    regionId: required('MEDUSA_REGION_ID'),
    currencyCode: 'EUR' as const,
    timeout: optionalInt('MEDUSA_TIMEOUT', 10000),
  },

  // Cookies
  cookie: {
    domain: optional('COOKIE_DOMAIN', 'localhost'),
    secure: optionalBool('COOKIE_SECURE', false),
    sameSite: optional('COOKIE_SAMESITE', 'lax') as 'lax' | 'strict' | 'none',
    authCookieName: 'marrakea_auth',
  },

  // Logging
  logLevel: optional('LOG_LEVEL', 'info'),

  // CORS
  cors: {
    origins: optional('CORS_ORIGINS', 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  // Rate limiting
  rateLimit: {
    contact: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
    },
  },
} as const;

export type Config = typeof config;
