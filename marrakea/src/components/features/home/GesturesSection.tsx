import Image from 'next/image';
import Link from 'next/link';
import type { GestureDTO } from '@/types/dtos';
import styles from './GesturesSection.module.css';

interface GesturesSectionProps {
  gestures: GestureDTO[];
}

export function GesturesSection({ gestures }: GesturesSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Navigation</p>
        <h2 className={styles.title}>Par gestes</h2>

        <div className={styles.grid}>
          {gestures.map((gesture) => (
            <Link
              key={gesture.id}
              href={`/objets?geste=${gesture.slug}`}
              className={styles.card}
            >
              <div className={styles.imageWrapper}>
                {gesture.image && (
                  <Image
                    src={gesture.image}
                    alt={gesture.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                    className={styles.image}
                  />
                )}
                <div className={styles.overlay}>
                  <h3 className={styles.gestureTitle}>{gesture.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
