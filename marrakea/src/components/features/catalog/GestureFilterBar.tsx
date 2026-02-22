'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { GestureDTO } from '@/types/dtos';
import styles from './GestureFilterBar.module.css';

interface GestureFilterBarProps {
  gestures: GestureDTO[];
  totalCount: number;
}

export function GestureFilterBar({ gestures, totalCount }: GestureFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGesture = searchParams.get('geste') || '';

  const handleGestureClick = (gestureSlug: string) => {
    const params = new URLSearchParams(searchParams);

    if (gestureSlug === '') {
      // "Tous les objets" - remove gesture filter
      params.delete('geste');
    } else {
      params.set('geste', gestureSlug);
    }

    // Reset to page 1 when changing gesture
    params.delete('page');

    router.push(`/objets?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.sticky}>
      <div className={styles.container}>
        <div className={styles.bar}>
          <span className={styles.label}>Par geste</span>

          <div className={styles.buttons}>
            <button
              onClick={() => handleGestureClick('')}
              className={`${styles.button} ${currentGesture === '' ? styles.active : ''}`}
            >
              Tous les objets
            </button>

            {gestures.map((gesture) => (
              <button
                key={gesture.id}
                onClick={() => handleGestureClick(gesture.slug)}
                className={`${styles.button} ${currentGesture === gesture.slug ? styles.active : ''}`}
              >
                {gesture.name}
              </button>
            ))}
          </div>
        </div>

        <p className={styles.count}>
          {totalCount} {totalCount > 1 ? 'objets' : 'objet'}
        </p>
      </div>
    </div>
  );
}
