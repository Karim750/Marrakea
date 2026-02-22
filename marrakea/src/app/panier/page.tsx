import type { Metadata } from 'next';
import { CartPageClient } from '@/components/features/cart/CartPageClient';

export const metadata: Metadata = {
  title: 'Panier',
  description: 'Votre panier MARRAKEA',
};

export default function CartPage() {
  return <CartPageClient />;
}
