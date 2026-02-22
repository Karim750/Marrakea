'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Journal listing error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Erreur de chargement</h1>
        <p className={styles.description}>
          Impossible de charger les articles pour le moment.
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
          <Button as={Link} href="/" variant="primary">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
