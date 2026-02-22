import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <div className={styles.skeleton} style={{ width: '300px', height: '36px' }} />
          <div className={styles.skeleton} style={{ width: '400px', height: '24px' }} />
        </div>
      </div>
    </div>
  );
}
