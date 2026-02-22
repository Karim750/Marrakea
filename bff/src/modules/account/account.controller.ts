import { Request, Response, NextFunction } from 'express';
import { accountService } from './account.service.js';
import { AppError } from '../../shared/errors/AppError.js';
import { setNoCache } from '../../shared/cache/cacheHeaders.js';
import { setAuthCookie, clearAuthCookie, getAuthToken } from '../../shared/cookies/cookieUtils.js';
import {
  RegisterPayloadSchema,
  LoginPayloadSchema,
  CustomerDTOSchema,
  SuccessResponseSchema,
} from '../../shared/dtos/index.js';

/**
 * Account controller with runtime DTO validation.
 */

export class AccountController {
  /**
   * POST /account/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const payload = RegisterPayloadSchema.parse(req.body);

      const { customer, token } = await accountService.register(payload);

      // Set auth cookie
      setAuthCookie(res, token);

      // Validate response
      const validated = CustomerDTOSchema.parse(customer);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /account/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const payload = LoginPayloadSchema.parse(req.body);

      const { customer, token } = await accountService.login(payload);

      // Set auth cookie
      setAuthCookie(res, token);

      // Validate response
      const validated = CustomerDTOSchema.parse(customer);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /account/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get auth token from cookie
      const authToken = getAuthToken(req.headers.cookie);

      if (!authToken) {
        throw AppError.unauthenticated();
      }

      const customer = await accountService.getMe(authToken);

      // Validate response
      const validated = CustomerDTOSchema.parse(customer);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /account/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear auth cookie
      clearAuthCookie(res);

      const response = { success: true };

      // Validate response
      const validated = SuccessResponseSchema.parse(response);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }
}

export const accountController = new AccountController();
