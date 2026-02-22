import { Response } from 'express';
import { serialize, parse } from 'cookie';
import { config } from '../../config/index.js';

/**
 * Cookie utilities for handling httpOnly auth cookies.
 * Per deployment notes:
 * - httpOnly: true
 * - secure: true in production
 * - sameSite: none in production (cross-site)
 */

export function setAuthCookie(res: Response, token: string): void {
  const cookie = serialize(config.cookie.authCookieName, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.isProduction ? config.cookie.domain : undefined,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearAuthCookie(res: Response): void {
  const cookie = serialize(config.cookie.authCookieName, '', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.isProduction ? config.cookie.domain : undefined,
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function getAuthToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  return cookies[config.cookie.authCookieName] || null;
}
