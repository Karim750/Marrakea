import Image from 'next/image';
import type { ArtisanDTO } from '@/types/dtos';
import styles from './ArtisanBlock.module.css';

interface ArtisanBlockProps {
  artisan?: ArtisanDTO;
}

export function ArtisanBlock({ artisan }: ArtisanBlockProps) {
  if (!artisan) {
    return null;
  }

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>Provenance</p>
      <h2 className={styles.title}>Atelier & artisan</h2>

      <div className={styles.block}>
        {/* Header with portrait and identity */}
        <div className={styles.header}>
          {artisan.portrait ? (
            <div className={styles.portrait}>
              <Image
                src={artisan.portrait.url}
                alt={artisan.portrait.alt || artisan.name}
                fill
                sizes="80px"
                className={styles.portraitImage}
              />
            </div>
          ) : (
            <div className={styles.portraitPlaceholder}>
              <span className={styles.initials}>
                {artisan.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          )}

          <div className={styles.identity}>
            <h3 className={styles.name}>{artisan.name}</h3>
            {artisan.territory && (
              <p className={styles.location}>{artisan.territory.name}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {artisan.bio && (
          <div className={styles.bio}>
            <p>{artisan.bio}</p>
          </div>
        )}

        {/* Details table */}
        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Localisation atelier</dt>
            <dd className={styles.detailValue}>
              {artisan.workshopLocation || 'Non communiqué'}
            </dd>
          </div>

          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Spécialité</dt>
            <dd className={styles.detailValue}>
              {artisan.specialty || 'Non communiqué'}
            </dd>
          </div>

          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Années d&apos;expérience</dt>
            <dd className={styles.detailValue}>
              {artisan.yearsExperience || 'Non communiqué'}
            </dd>
          </div>

          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Mode de transmission</dt>
            <dd className={styles.detailValue}>
              {artisan.transmissionMode || 'Non communiqué'}
            </dd>
          </div>

          <div className={styles.detailRow}>
            <dt className={styles.detailKey}>Équipement</dt>
            <dd className={styles.detailValue}>
              {artisan.equipment || 'Non communiqué'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
