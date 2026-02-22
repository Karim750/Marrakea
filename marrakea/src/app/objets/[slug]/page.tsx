import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api/products';
import { SITE_NAME } from '@/lib/utils/constants';
import { JsonLd, generateProductJsonLd } from '@/lib/utils/seo';
import { ProductGallery } from '@/components/features/product/ProductGallery';
import { AddToCartButton } from '@/components/features/product/AddToCartButton';
import { ReferenceSheet } from '@/components/features/product/ReferenceSheet';
import { ArtisanBlock } from '@/components/features/product/ArtisanBlock';
import styles from './page.module.css';

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Produit non trouvé',
      description: 'Ce produit n\'existe pas ou n\'est plus disponible.',
    };
  }

  return {
    title: product.title,
    description: product.intro,
    openGraph: {
      title: `${product.title} — ${SITE_NAME}`,
      description: product.intro,
      images: [
        {
          url: product.coverImage.url,
          width: product.coverImage.width,
          height: product.coverImage.height,
          alt: product.coverImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} — ${SITE_NAME}`,
      description: product.intro,
      images: [product.coverImage.url],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd data={generateProductJsonLd(product)} />

      <article className={styles.product}>
        <Link href="/objets" className={styles.backLink}>
          ← Retour au catalogue
        </Link>

        <div className={styles.layout}>
          {/* Gallery (Client Component) */}
          <div className={styles.gallery}>
            <ProductGallery images={[product.coverImage, ...product.images]} />
          </div>

          {/* Product Info (Server Component) */}
          <div className={styles.info}>
            {product.gesture && (
              <p className={styles.gesture}>{product.gesture.name}</p>
            )}

            <h1 className={styles.title}>{product.title}</h1>

            <p className={styles.price}>
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: product.price.currency,
              }).format(product.price.amount)}
            </p>

            <div className={styles.intro}>
              <p>{product.intro}</p>
            </div>

            {/* Add to Cart (Client Component) */}
            <div className={styles.actions}>
              <AddToCartButton product={product} />
            </div>

            {/* Provenance & Identification Sections */}
            <ReferenceSheet data={product.referenceSheet} />
            <ArtisanBlock artisan={product.artisan} />

            {/* Additional Quick Info */}
            {product.territory && (
              <div className={styles.meta}>
                <h2 className={styles.metaTitle}>Région</h2>
                <p className={styles.metaContent}>{product.territory.name}</p>
              </div>
            )}

            {product.materials && product.materials.length > 0 && (
              <div className={styles.meta}>
                <h2 className={styles.metaTitle}>Matières</h2>
                <ul className={styles.materialsList}>
                  {product.materials.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.dimensions && (
              <div className={styles.meta}>
                <h2 className={styles.metaTitle}>Dimensions</h2>
                <p className={styles.metaContent}>{product.dimensions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className={styles.description}>
            <div
              className={styles.descriptionContent}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </article>
    </>
  );
}
