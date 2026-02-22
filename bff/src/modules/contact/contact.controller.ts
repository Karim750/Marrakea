import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { setNoCache } from '../../shared/cache/cacheHeaders.js';
import {
  ContactPayloadSchema,
  ContactResponseSchema,
} from '../../shared/dtos/index.js';

/**
 * Contact controller with validation.
 * Note: Actual email sending is not implemented - this is a placeholder.
 * In production, integrate with an email service (SendGrid, SES, etc.).
 */

export class ContactController {
  /**
   * POST /contact
   */
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const payload = ContactPayloadSchema.parse(req.body);

      // Validate email format (already done by Zod, but double-check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.email)) {
        throw AppError.invalidEmail();
      }

      // TODO: In production, send email via service
      // For now, just log the contact submission
      console.log('[CONTACT] New submission:', {
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        messageLength: payload.message.length,
        timestamp: new Date().toISOString(),
      });

      const response = {
        success: true,
        message: 'Message envoyé avec succès',
      };

      // Validate response
      const validated = ContactResponseSchema.parse(response);

      setNoCache(res);
      res.json(validated);
    } catch (err) {
      next(err);
    }
  }
}

export const contactController = new ContactController();
