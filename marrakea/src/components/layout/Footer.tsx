import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <h3 className={styles.brandName}>MARRAKEA</h3>
            <p className={styles.brandTagline}>
              Artisanat marocain d&apos;exception
            </p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Navigation</h4>
              <ul className={styles.linkList}>
                <li>
                  <Link href="/objets" className={styles.link}>
                    Objets
                  </Link>
                </li>
                <li>
                  <Link href="/journal" className={styles.link}>
                    Journal
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={styles.link}>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Légal</h4>
              <ul className={styles.linkList}>
                <li>
                  <Link href="/mentions-legales" className={styles.link}>
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/cgv" className={styles.link}>
                    CGV
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className={styles.link}>
                    Confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} MARRAKEA. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
