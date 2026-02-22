import Link from 'next/link';
import { HeaderClient } from './HeaderClient';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          MARRAKEA
        </Link>

        <nav className={styles.nav} aria-label="Navigation principale">
          <Link href="/objets" className={styles.navLink}>
            Objets
          </Link>
          <Link href="/journal" className={styles.navLink}>
            Journal
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact
          </Link>
        </nav>

        <HeaderClient />
      </div>
    </header>
  );
}
