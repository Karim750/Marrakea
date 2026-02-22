'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '@/stores/cart-store';
import { createCheckoutSession } from '@/lib/api/checkout';
import { CheckoutForm } from './CheckoutForm';
import styles from './CartPageClient.module.css';

// Load Stripe publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export function CartPageClient() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<{
    cartId: string;
    clientSecret: string;
  } | null>(null);

  const handleInitiateCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const payload = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await createCheckoutSession(payload);

      // Store session data to render Stripe Payment Element
      setCheckoutSession({
        cartId: response.cartId,
        clientSecret: response.clientSecret,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Checkout error:', error);
      }
      setCheckoutError('Erreur lors de la création de la session. Veuillez réessayer.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Panier</h1>
          </header>

          <div className={styles.empty}>
            <p className={styles.emptyText}>Votre panier est vide</p>
            <Link href="/objets" className={styles.emptyLink}>
              Découvrir les objets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If checkout session is created, show Stripe payment form
  if (checkoutSession) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Paiement</h1>
            <button
              onClick={() => setCheckoutSession(null)}
              className={styles.backButton}
            >
              ← Retour au panier
            </button>
          </header>

          <div className={styles.checkoutLayout}>
            {/* Order summary (left side) */}
            <div className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Récapitulatif de commande</h2>

              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.productId} className={styles.summaryItem}>
                    <div className={styles.summaryItemImage}>
                      <Image
                        src={item.coverImage.url}
                        alt={item.coverImage.alt}
                        fill
                        sizes="60px"
                        className={styles.image}
                      />
                    </div>
                    <div className={styles.summaryItemInfo}>
                      <p className={styles.summaryItemTitle}>{item.title}</p>
                      <p className={styles.summaryItemQty}>
                        {item.purchaseMode === 'quantity'
                          ? `Quantité: ${item.quantity}`
                          : 'Pièce unique'}
                      </p>
                    </div>
                    <p className={styles.summaryItemPrice}>{item.price.formattedPrice}</p>
                  </div>
                ))}
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalAmount}>{getTotal()}</span>
              </div>
            </div>

            {/* Stripe payment form (right side) */}
            <div className={styles.paymentSection}>
              <h2 className={styles.paymentTitle}>Informations de paiement</h2>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: checkoutSession.clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#000000',
                    },
                  },
                }}
              >
                <CheckoutForm cartId={checkoutSession.cartId} />
              </Elements>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cart view (before checkout)
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Panier</h1>
          <p className={styles.itemCount}>
            {items.length} {items.length > 1 ? 'articles' : 'article'}
          </p>
        </header>

        <div className={styles.layout}>
          {/* Items list */}
          <div className={styles.items}>
            {items.map((item, index) => (
              <div key={item.productId} className={styles.item}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.coverImage.url}
                    alt={item.coverImage.alt}
                    fill
                    sizes="120px"
                    className={styles.image}
                    priority={index === 0}
                  />
                </div>

                <div className={styles.itemInfo}>
                  <Link href={`/objets/${item.slug}`} className={styles.itemTitle}>
                    {item.title}
                  </Link>
                  <p className={styles.itemPrice}>{item.price.formattedPrice}</p>
                </div>

                <div className={styles.itemActions}>
                  {item.purchaseMode === 'quantity' ? (
                    <div className={styles.quantity}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={styles.quantityBtn}
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={styles.quantityBtn}
                        disabled={
                          item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                        }
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <p className={styles.uniqueLabel}>Pièce unique</p>
                  )}

                  <button
                    onClick={() => removeItem(item.productId)}
                    className={styles.removeBtn}
                    aria-label="Retirer du panier"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Récapitulatif</h2>

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total (indicatif)</span>
                <span className={styles.summaryValue}>{getTotal()}</span>
              </div>

              <p className={styles.summaryNote}>
                Le montant final sera calculé lors du paiement et peut inclure des frais de
                livraison.
              </p>

              {checkoutError && <p className={styles.error}>{checkoutError}</p>}

              <button
                onClick={handleInitiateCheckout}
                disabled={isCheckoutLoading}
                className={styles.checkoutBtn}
              >
                {isCheckoutLoading ? 'Chargement...' : 'Passer au paiement'}
              </button>

              <Link href="/objets" className={styles.continueLink}>
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
