import { Skeleton } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Skeleton width="150px" height="48px" />
        <Skeleton width="400px" height="24px" />
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton width="100%" height="240px" />
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100%" height="28px" />
            <Skeleton width="100%" height="40px" />
            <Skeleton width="60%" height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}
