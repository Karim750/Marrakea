import { z } from 'zod';

/**
 * Contact DTOs matching /spec/00-contract.md exactly.
 */

// ContactPayload (request body)
export const ContactPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});
export type ContactPayload = z.infer<typeof ContactPayloadSchema>;

// ContactResponse (response)
export const ContactResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
