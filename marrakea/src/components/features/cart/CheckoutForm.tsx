'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import styles from './CheckoutForm.module.css';

interface CheckoutFormProps {
  cartId: string;
}

export function CheckoutForm({ cartId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/panier/success?cart_id=${cartId}`,
      },
    });

    if (error) {
      // Payment failed - show error message
      setErrorMessage(error.message || 'Une erreur est survenue lors du paiement');
      setIsProcessing(false);
    }
    // If successful, Stripe automatically redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement className={styles.paymentElement} />

      {errorMessage && (
        <div className={styles.error} role="alert">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={styles.submitButton}
      >
        {isProcessing ? 'Traitement...' : 'Payer maintenant'}
      </button>

      <p className={styles.secureNote}>
        🔒 Paiement sécurisé par Stripe
      </p>
    </form>
  );
}
