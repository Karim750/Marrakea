import { Skeleton } from '@/components/ui/Skeleton';
import styles from './loading.module.css';

export default function Loading() {
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Skeleton width="120px" height="16px" />
          <Skeleton width="80px" height="14px" />
          <Skeleton width="80%" height="48px" />
          <div className={styles.meta}>
            <Skeleton width="120px" height="20px" />
            <Skeleton width="150px" height="16px" />
          </div>
        </div>
        <Skeleton width="100%" height="400px" />
      </header>

      <div className={styles.content}>
        <Skeleton width="100%" height="20px" />
        <Skeleton width="100%" height="20px" />
        <Skeleton width="90%" height="20px" />
        <Skeleton width="100%" height="20px" />
        <Skeleton width="95%" height="20px" />
      </div>
    </article>
  );
}
