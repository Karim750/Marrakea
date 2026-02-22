'use client';

import Link from 'next/link';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1 className={styles.title}>Une erreur est survenue</h1>
          <p className={styles.message}>
            Impossible de charger votre panier. Veuillez réessayer ou contacter notre service
            client si le problème persiste.
          </p>
          {error.digest && (
            <p className={styles.digest}>
              Code d&apos;erreur : <code>{error.digest}</code>
            </p>
          )}
          <div className={styles.actions}>
            <button onClick={reset} className={styles.button}>
              Réessayer
            </button>
            <Link href="/" className={styles.link}>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
