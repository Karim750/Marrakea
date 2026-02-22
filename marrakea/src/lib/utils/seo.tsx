import type { ProductDetailDTO, ArticleDetailDTO, ArticleDTO } from '@/types/dtos';
import { SITE_NAME, SITE_URL } from './constants';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function generateProductJsonLd(product: ProductDetailDTO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.intro,
    image: product.coverImage.url,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price.amount,
      priceCurrency: product.price.currency,
      availability: product.availability.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };
}

export function generateArticleJsonLd(article: ArticleDetailDTO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage.url,
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: article.author?.name || SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: ['https://instagram.com/marrakea', 'https://facebook.com/marrakea'],
  };
}

export function generateArticleListJsonLd(articles: ArticleDTO[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        '@id': `${SITE_URL}/journal/${article.slug}`,
        headline: article.title,
        description: article.excerpt,
        image: article.coverImage.url,
        datePublished: article.publishedAt,
        author: { '@type': 'Person', name: article.author?.name || SITE_NAME },
      },
    })),
  };
}
