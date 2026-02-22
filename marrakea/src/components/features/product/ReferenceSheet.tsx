import styles from './ReferenceSheet.module.css';

interface ReferenceSheetProps {
  data?: Record<string, string>;
}

export function ReferenceSheet({ data }: ReferenceSheetProps) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>Identification</p>
      <h2 className={styles.title}>Fiche de référence</h2>

      <dl className={styles.sheet}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={styles.row}>
            <dt className={styles.key}>{key}</dt>
            <dd className={styles.value}>{value || 'Non communiqué'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
