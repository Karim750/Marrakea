import { Skeleton } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.product}>
      <Skeleton width="150px" height="20px" />

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <Skeleton width="100%" height="500px" />
          <div className={styles.thumbnails}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="80px" height="80px" />
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <Skeleton width="80px" height="16px" />
          <Skeleton width="90%" height="40px" />
          <Skeleton width="120px" height="32px" />
          <Skeleton width="100%" height="60px" />
          <Skeleton width="100%" height="48px" />
        </div>
      </div>
    </div>
  );
}
