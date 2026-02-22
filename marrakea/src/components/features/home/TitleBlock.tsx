import styles from './TitleBlock.module.css';

export function TitleBlock() {
  return (
    <section className={styles.titleBlock}>
      <h1 className={styles.title}>MARRAKEA</h1>
      <p className={styles.subtitle}>
        Artisanat marocain. Sélectionné, documenté, transmis.
      </p>
    </section>
  );
}
