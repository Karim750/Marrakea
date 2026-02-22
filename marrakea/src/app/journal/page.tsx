import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getArticles } from '@/lib/api/articles';
import { SITE_NAME } from '@/lib/utils/constants';
import { JsonLd, generateArticleListJsonLd } from '@/lib/utils/seo';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Histoires, techniques et savoir-faire de l\'artisanat marocain. Documentation factuelle et approche éditoriale.',
  openGraph: {
    title: `Journal — ${SITE_NAME}`,
    description:
      'Histoires, techniques et savoir-faire de l\'artisanat marocain. Documentation factuelle et approche éditoriale.',
  },
};

export default async function JournalPage() {
  const { data: articles } = await getArticles();

  const [featured, ...remaining] = articles;

  return (
    <div className={styles.page}>
      <JsonLd data={generateArticleListJsonLd(articles)} />

      {/* Hero */}
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Documentation</p>
        <h1 className={styles.title}>Journal</h1>
        <p className={styles.intro}>
          Histoires, techniques et savoir-faire de l&apos;artisanat marocain. Documentation
          factuelle et approche éditoriale.
        </p>
      </header>

      <div className={styles.container}>
        {/* Featured Article */}
        {featured && (
          <Link href={`/journal/${featured.slug}`} className={styles.featured}>
            <div className={styles.featuredImage}>
              <Image
                src={featured.coverImage.url}
                alt={featured.coverImage.alt}
                fill
                sizes="(max-width: 900px) 100vw, 1120px"
                className={styles.image}
                priority
              />
            </div>
            <div className={styles.featuredContent}>
              <div className={styles.featuredMeta}>
                {featured.category && (
                  <span className={styles.category}>{featured.category}</span>
                )}
                <time className={styles.date} dateTime={featured.publishedAt}>
                  {new Date(featured.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className={styles.grid}>
          {remaining.map((article) => (
            <Link key={article.id} href={`/journal/${article.slug}`} className={styles.card}>
              <div className={styles.cardImage}>
                <Image
                  src={article.coverImage.url}
                  alt={article.coverImage.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 550px"
                  className={styles.image}
                />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardMeta}>
                  {article.category && (
                    <span className={styles.category}>{article.category}</span>
                  )}
                  <time className={styles.date} dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardExcerpt}>{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
