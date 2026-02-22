import Image from 'next/image';
import styles from './ImageBand.module.css';

export function ImageBand() {
  return (
    <section className={styles.section}>
      <div className={styles.imageWrapper}>
        <Image
          src="https://images.pexels.com/photos/3581916/pexels-photo-3581916.jpeg"
          alt="Tissage manuel dans le Haut Atlas"
          fill
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.overlay}>
          <div className={styles.content}>
            <h2 className={styles.title}>Le geste avant l&apos;objet</h2>
            <p className={styles.subtitle}>Tissage manuel, Haut Atlas</p>
          </div>
        </div>
      </div>
    </section>
  );
}
