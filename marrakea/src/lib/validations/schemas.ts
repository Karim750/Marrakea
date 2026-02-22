import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  subject: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const checkoutStatusSchema = z.object({
  status: z.enum(['DRAFT', 'LOCKED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED']),
  orderId: z.string().optional(),
});

export const checkoutSessionSchema = z.object({
  cartId: z.string(),
  paymentCollectionId: z.string(),
  clientSecret: z.string(),
});
