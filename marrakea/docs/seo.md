# SEO — SSR first + Metadata + JSON-LD

## 1) Invariants
- Chaque page publique a `generateMetadata()` (ou `metadata` statique si stable).
- OpenGraph + Twitter cards.
- JSON-LD injecté via JSX (plus fiable que `metadata.other` selon versions Next).

## 2) Pages concernées
- `/` (Home)
- `/objets`
- `/objets/[slug]` (Product)
- `/journal`
- `/journal/[slug]` (Article)
- `/contact`

## 3) Template `generateMetadata()` (produit)
```ts
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  return {
    title: `${product.title} - ${product.price.formattedPrice} | MARRAKEA`,
    description: product.intro,
    openGraph: {
      title: product.title,
      description: product.intro,
      images: [{ url: product.coverImage.url, width: 1200, height: 630, alt: product.coverImage.alt }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.intro,
      images: [product.coverImage.url],
    },
  };
}
4) JSON-LD helper (recommandé)
lib/utils/seo.tsx

ts
Copier le code
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function generateProductJsonLd(product) {
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
      seller: { '@type': 'Organization', name: 'MARRAKEA' },
    },
  };
}

export function generateArticleJsonLd(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage.url,
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: article.author?.name || 'MARRAKEA' },
    publisher: {
      '@type': 'Organization',
      name: 'MARRAKEA',
      logo: { '@type': 'ImageObject', url: 'https://marrakea.com/logo.png' },
    },
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MARRAKEA',
    url: 'https://marrakea.com',
    logo: 'https://marrakea.com/logo.png',
    sameAs: ['https://instagram.com/marrakea', 'https://facebook.com/marrakea'],
  };
}
5) OG images
opengraph-image.tsx sur routes produit et article (génération auto).

6) Sitemap & Robots
app/sitemap.ts (dynamique)

app/robots.ts (contrôle indexation)

7) Checklist SEO (agent)
 Metadata présents sur toutes pages publiques

 OG image présente sur produit/article

 JSON-LD injecté via JSX

 sitemap/robots générés
