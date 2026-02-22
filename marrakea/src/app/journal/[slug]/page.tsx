import type { Metadata } from 'next';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getArticle } from '@/lib/api/articles';
import { JsonLd, generateArticleJsonLd } from '@/lib/utils/seo';
import { SITE_NAME } from '@/lib/utils/constants';
import styles from './page.module.css';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — ${SITE_NAME}`,
      description: article.excerpt,
      images: [
        {
          url: article.coverImage.url,
          width: article.coverImage.width,
          height: article.coverImage.height,
          alt: article.coverImage.alt,
        },
      ],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage.url],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug);

  return (
    <>
      <JsonLd data={generateArticleJsonLd(article)} />

      <article className={styles.article}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/journal" className={styles.backLink}>
              ← Retour au journal
            </Link>

            {article.category && <span className={styles.category}>{article.category}</span>}

            <h1 className={styles.title}>{article.title}</h1>

            <div className={styles.meta}>
              {article.author && (
                <div className={styles.author}>
                  {article.author.avatar && (
                    <OptimizedImage
                      image={article.author.avatar}
                      className={styles.avatar}
                      sizes="48px"
                    />
                  )}
                  <span className={styles.authorName}>{article.author.name}</span>
                </div>
              )}
              <time className={styles.date} dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>

          <div className={styles.coverWrapper}>
            <OptimizedImage
              image={article.coverImage}
              className={styles.coverImage}
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        </header>

        <div className={styles.content}>
          <div
            className={styles.prose}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.images && article.images.length > 0 && (
            <div className={styles.gallery}>
              {article.images.map((image, index) => (
                <div key={index} className={styles.galleryItem}>
                  <OptimizedImage
                    image={image}
                    className={styles.galleryImage}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {article.relatedProducts && article.relatedProducts.length > 0 && (
          <footer className={styles.footer}>
            <h2 className={styles.relatedTitle}>Objets associés</h2>
            <div className={styles.relatedGrid}>
              {article.relatedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/objets/${product.slug}`}
                  className={styles.relatedCard}
                >
                  <OptimizedImage
                    image={product.coverImage}
                    className={styles.relatedImage}
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                  <span className={styles.relatedName}>{product.title}</span>
                </Link>
              ))}
            </div>
          </footer>
        )}
      </article>
    </>
  );
}
