'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart-store';
import { getCheckoutStatus, completeCheckout } from '@/lib/api/checkout';
import type { CheckoutStatus } from '@/types/dtos';
import styles from './SuccessPageClient.module.css';

export function SuccessPageClient() {
  const searchParams = useSearchParams();
  const cartId = searchParams.get('cart_id');
  const redirectStatus = searchParams.get('redirect_status');
  const clearCart = useCartStore((state) => state.clearCart);
  const [hasCompletedCheckout, setHasCompletedCheckout] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Complete checkout when Stripe redirects back with success
  useEffect(() => {
    const complete = async () => {
      if (!cartId || redirectStatus !== 'succeeded' || hasCompletedCheckout) {
        return;
      }

      try {
        await completeCheckout(cartId);
        setHasCompletedCheckout(true);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Complete checkout error:', error);
        }
        setCompleteError('Erreur lors de la finalisation de la commande');
      }
    };

    complete();
  }, [cartId, redirectStatus, hasCompletedCheckout]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['checkout-status', cartId],
    queryFn: () => {
      if (!cartId) {
        throw new Error('No cart ID');
      }
      return getCheckoutStatus(cartId);
    },
    enabled: !!cartId && (redirectStatus === 'succeeded' ? hasCompletedCheckout : true),
    refetchInterval: (query) => {
      // Poll every 2s while LOCKED, stop when final status
      const status = query.state.data?.status;
      if (status === 'LOCKED' || status === 'DRAFT') {
        return 2000;
      }
      return false;
    },
    staleTime: 60000, // 60s timeout
    retry: 3,
  });

  // Clear cart only when PAID
  useEffect(() => {
    if (data?.status === 'PAID') {
      clearCart();
    }
  }, [data?.status, clearCart]);

  // Missing cart_id
  if (!cartId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconError}>⚠️</div>
            <h1 className={styles.title}>Session invalide</h1>
            <p className={styles.message}>
              Aucune session de paiement détectée. Veuillez recommencer votre commande.
            </p>
            <Link href="/panier" className={styles.button}>
              Retour au panier
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment cancelled by user
  if (redirectStatus === 'failed') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconError}>✗</div>
            <h1 className={styles.title}>Paiement échoué</h1>
            <p className={styles.message}>
              Le paiement n'a pas pu être complété. Veuillez réessayer.
            </p>
            <Link href="/panier" className={styles.button}>
              Retour au panier
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show error if completing checkout failed
  if (completeError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconError}>⚠️</div>
            <h1 className={styles.title}>Erreur de finalisation</h1>
            <p className={styles.message}>
              {completeError}. Veuillez contacter notre service client avec votre ID de panier.
            </p>
            <p className={styles.orderId}>
              ID Panier: <strong>{cartId}</strong>
            </p>
            <Link href="/contact" className={styles.button}>
              Contacter le service client
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading or polling
  if (isLoading || data?.status === 'DRAFT' || data?.status === 'LOCKED') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.spinner} />
            <h1 className={styles.title}>
              {data?.status === 'LOCKED' ? 'Confirmation en cours...' : 'Vérification...'}
            </h1>
            <p className={styles.message}>
              {data?.status === 'LOCKED'
                ? 'Nous attendons la confirmation de votre paiement.'
                : 'Veuillez patienter pendant que nous vérifions votre commande.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconError}>⚠️</div>
            <h1 className={styles.title}>Erreur de vérification</h1>
            <p className={styles.message}>
              Impossible de vérifier le statut de votre commande. Veuillez contacter notre service
              client si le problème persiste.
            </p>
            <Link href="/contact" className={styles.button}>
              Contacter le service client
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Status-based rendering
  const status = data?.status as CheckoutStatus;

  switch (status) {
    case 'PAID':
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.iconSuccess}>✓</div>
              <h1 className={styles.title}>Commande confirmée !</h1>
              <p className={styles.message}>
                Merci pour votre commande. Un email de confirmation vous a été envoyé.
              </p>
              {data?.orderId && (
                <p className={styles.orderId}>
                  Numéro de commande : <strong>{data.orderId}</strong>
                </p>
              )}
              <div className={styles.actions}>
                <Link href="/objets" className={styles.button}>
                  Continuer mes achats
                </Link>
                <Link href="/journal" className={styles.linkSecondary}>
                  Découvrir le journal
                </Link>
              </div>
            </div>
          </div>
        </div>
      );

    case 'CANCELLED':
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.iconWarning}>⚠️</div>
              <h1 className={styles.title}>Commande annulée</h1>
              <p className={styles.message}>
                Votre commande a été annulée. Vous pouvez réessayer ou contacter notre service
                client.
              </p>
              <div className={styles.actions}>
                <Link href="/panier" className={styles.button}>
                  Retour au panier
                </Link>
              </div>
            </div>
          </div>
        </div>
      );

    case 'EXPIRED':
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.iconWarning}>⏱</div>
              <h1 className={styles.title}>Session expirée</h1>
              <p className={styles.message}>
                Votre session de paiement a expiré. Veuillez recommencer votre commande.
              </p>
              <div className={styles.actions}>
                <Link href="/panier" className={styles.button}>
                  Retour au panier
                </Link>
              </div>
            </div>
          </div>
        </div>
      );

    case 'FAILED':
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.iconError}>✗</div>
              <h1 className={styles.title}>Paiement échoué</h1>
              <p className={styles.message}>
                Une erreur est survenue lors du paiement. Veuillez réessayer ou contacter notre
                service client.
              </p>
              <div className={styles.actions}>
                <Link href="/panier" className={styles.button}>
                  Retour au panier
                </Link>
                <Link href="/contact" className={styles.linkSecondary}>
                  Contacter le service client
                </Link>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.iconWarning}>⚠️</div>
              <h1 className={styles.title}>Statut inconnu</h1>
              <p className={styles.message}>
                Le statut de votre commande est inconnu. Veuillez contacter notre service client.
              </p>
              <Link href="/contact" className={styles.button}>
                Contacter le service client
              </Link>
            </div>
          </div>
        </div>
      );
  }
}
