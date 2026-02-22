import { Skeleton } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Skeleton width="100px" height="14px" />
        <Skeleton width="150px" height="48px" />
        <Skeleton width="80%" height="24px" />
      </header>

      <div className={styles.container}>
        <div className={styles.filters}>
          <Skeleton width="100%" height="40px" />
          <Skeleton width="180px" height="40px" />
        </div>

        <Skeleton width="120px" height="20px" />

        <div className={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton width="100%" height="280px" />
              <Skeleton width="60%" height="16px" />
              <Skeleton width="90%" height="24px" />
              <Skeleton width="40%" height="20px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
