'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ImageDTO } from '@/types/dtos';
import styles from './ProductGallery.module.css';

interface ProductGalleryProps {
  images: ImageDTO[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className={styles.gallery}>
      {/* Main Image */}
      <div className={styles.main}>
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          className={styles.mainImage}
          priority={currentIndex === 0}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ''}`}
              aria-label={`Voir image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="100px"
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
