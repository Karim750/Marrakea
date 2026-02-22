import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Badge } from '@/components/ui/Badge';
import type { ProductDTO } from '@/types/dtos';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ProductDTO;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <Link href={`/objets/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <OptimizedImage
          image={product.coverImage}
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
        {product.availability.purchaseMode === 'unique' && (
          <Badge variant="accent" className={styles.badge}>
            Pièce unique
          </Badge>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.intro}>{product.intro}</p>

        <div className={styles.footer}>
          <span className={styles.price}>{product.price.formattedPrice}</span>
          {product.gesture && (
            <span className={styles.gesture}>{product.gesture.name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
