'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from '../../journal/error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Produit introuvable</h1>
        <p className={styles.description}>
          Désolé, ce produit n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        {error.digest && (
          <p className={styles.digest}>
            Code : <code>{error.digest}</code>
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={reset} variant="secondary">
            Réessayer
          </Button>
          <Button as={Link} href="/objets" variant="primary">
            Retour au catalogue
          </Button>
        </div>
      </div>
    </div>
  );
}
