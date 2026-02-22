import Image from 'next/image';
import type { ImageDTO } from '@/types/dtos';
import styles from './OptimizedImage.module.css';
import { cn } from '@/lib/utils/formatters';

interface OptimizedImageProps {
  image: ImageDTO;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  className?: string;
}

export function OptimizedImage({
  image,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  fill = false,
  className,
}: OptimizedImageProps) {
  if (fill) {
    return (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={image.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={image.blurDataUrl}
        className={cn(styles.image, className)}
      />
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      placeholder={image.blurDataUrl ? 'blur' : 'empty'}
      blurDataURL={image.blurDataUrl}
      className={cn(styles.image, className)}
    />
  );
}
