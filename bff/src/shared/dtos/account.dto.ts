import { z } from 'zod';

/**
 * Account DTOs matching /spec/00-contract.md exactly.
 */

// RegisterPayload (request body)
export const RegisterPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

// LoginPayload (request body)
export const LoginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

// CustomerDTO (response)
export const CustomerDTOSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
export type CustomerDTO = z.infer<typeof CustomerDTOSchema>;
