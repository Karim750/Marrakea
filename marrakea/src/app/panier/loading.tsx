import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeleton} style={{ width: '120px', height: '40px' }} />
          <div className={styles.skeleton} style={{ width: '80px', height: '20px' }} />
        </div>

        <div className={styles.layout}>
          <div className={styles.items}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.item}>
                <div className={styles.skeleton} style={{ width: '120px', height: '120px' }} />
                <div className={styles.itemInfo}>
                  <div className={styles.skeleton} style={{ width: '200px', height: '24px' }} />
                  <div className={styles.skeleton} style={{ width: '80px', height: '20px' }} />
                </div>
                <div className={styles.itemActions}>
                  <div className={styles.skeleton} style={{ width: '120px', height: '40px' }} />
                  <div className={styles.skeleton} style={{ width: '60px', height: '20px' }} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.skeleton} style={{ width: '150px', height: '28px' }} />
              <div className={styles.skeleton} style={{ width: '100%', height: '60px' }} />
              <div className={styles.skeleton} style={{ width: '100%', height: '48px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
