import type { Metadata } from 'next';
import { SuccessPageClient } from '@/components/features/cart/SuccessPageClient';

export const metadata: Metadata = {
  title: 'Confirmation de commande',
  description: 'Merci pour votre commande MARRAKEA',
};

export default function SuccessPage() {
  return <SuccessPageClient />;
}
