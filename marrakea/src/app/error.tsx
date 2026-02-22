'use client';

import { useEffect } from 'react';
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
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Une erreur est survenue</h1>
        <p className={styles.description}>
          Désolé, une erreur inattendue s&apos;est produite. Veuillez réessayer.
        </p>
        {error.digest && (
          <p className={styles.digest}>
            Code d&apos;erreur : <code>{error.digest}</code>
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={reset} variant="primary" size="lg">
            Réessayer
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="secondary" size="lg">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
