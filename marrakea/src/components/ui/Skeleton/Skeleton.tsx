import { cn } from '@/lib/utils/formatters';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}
