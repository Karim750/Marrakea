import { Skeleton } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <Skeleton width="100%" height="400px" className={styles.hero} />

      <div className={styles.content}>
        <Skeleton width="200px" height="32px" />
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton width="100%" height="240px" />
              <Skeleton width="80%" height="24px" />
              <Skeleton width="60%" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
