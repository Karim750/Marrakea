import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page introuvable</h2>
        <p className={styles.description}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Button as={Link} href="/" variant="primary" size="lg">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
