import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Produit non trouvé</h1>
          <p className={styles.message}>
            Ce produit n&apos;existe pas ou n&apos;est plus disponible dans notre catalogue.
          </p>
          <div className={styles.actions}>
            <Link href="/objets" className={styles.button}>
              Découvrir nos objets
            </Link>
            <Link href="/" className={styles.link}>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
