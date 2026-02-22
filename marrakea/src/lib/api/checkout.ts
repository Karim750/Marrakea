import type { CheckoutPayloadItem, CheckoutSessionDTO, CheckoutStatusDTO } from '@/types/dtos';

export async function createCheckoutSession(
  items: CheckoutPayloadItem[]
): Promise<CheckoutSessionDTO> {
  const PUBLIC_BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3002';

  const res = await fetch(`${PUBLIC_BFF_URL}/checkout/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Checkout session error: ${res.status}`);
  }

  return res.json() as Promise<CheckoutSessionDTO>;
}

export async function getCheckoutStatus(cartId: string): Promise<CheckoutStatusDTO> {
  const { clientFetch } = await import('./client.client');
  return clientFetch<CheckoutStatusDTO>(`/checkout/status?cart_id=${cartId}`, {
    cache: 'no-store',
  });
}

export async function completeCheckout(cartId: string): Promise<{ orderId: string }> {
  const PUBLIC_BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3002';

  const res = await fetch(`${PUBLIC_BFF_URL}/checkout/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart_id: cartId }),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Checkout complete error: ${res.status}`);
  }

  return res.json() as Promise<{ orderId: string }>;
}
