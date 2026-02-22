import { Response } from 'express';

/**
 * Cache header utilities per contract caching strategy.
 * Public content endpoints use CDN-friendly caching.
 * Transactional endpoints use no-store.
 */

type CacheProfile =
  | 'products'        // s-maxage=60, swr=300
  | 'featured'        // s-maxage=300, swr=600
  | 'taxonomies'      // s-maxage=3600, swr=86400
  | 'articles'        // s-maxage=120, swr=300
  | 'no-store';       // no-store

const cacheProfiles: Record<CacheProfile, string> = {
  products: 'public, s-maxage=60, stale-while-revalidate=300',
  featured: 'public, s-maxage=300, stale-while-revalidate=600',
  taxonomies: 'public, s-maxage=3600, stale-while-revalidate=86400',
  articles: 'public, s-maxage=120, stale-while-revalidate=300',
  'no-store': 'no-store',
};

/**
 * Sets the Cache-Control header based on the profile.
 */
export function setCacheHeaders(res: Response, profile: CacheProfile): void {
  res.setHeader('Cache-Control', cacheProfiles[profile]);
}

/**
 * Sets no-store cache header for transactional endpoints.
 */
export function setNoCache(res: Response): void {
  setCacheHeaders(res, 'no-store');
}
