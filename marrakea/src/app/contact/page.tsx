import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez MARRAKEA pour toute question sur nos objets artisanaux ou pour en savoir plus sur notre démarche.',
  openGraph: {
    title: 'Contact — MARRAKEA',
    description: 'Contactez-nous pour toute question sur nos objets artisanaux.',
  },
};

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Contactez-nous</h1>
          <p className={styles.description}>
            Une question sur un objet, un artisan ou notre démarche ?
            Nous sommes à votre écoute.
          </p>
        </div>

        <ContactForm />
      </div>

      <div className={styles.info}>
        <div className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Informations</h2>
          <div className={styles.infoItem}>
            <h3 className={styles.infoLabel}>Email</h3>
            <a href="mailto:contact@marrakea.com" className={styles.infoLink}>
              contact@marrakea.com
            </a>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoLabel}>Délai de réponse</h3>
            <p className={styles.infoText}>Sous 48 heures ouvrées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
