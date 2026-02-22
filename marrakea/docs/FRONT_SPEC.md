# Plan d'Implémentation Frontend : MARRAKEA (Architecture Next.js + BFF)

## 0. Objectifs Non Négociables

1. **Client léger**: Aucune logique métier (prix/stock/taxes) côté Front
2. **SSR/SEO d'abord**: Pages publiques en Server Components + metadata propres
3. **Interactivité ciblée**: Client Components uniquement quand nécessaire
4. **Contrat unique**: Le Front consomme des **DTOs BFF** (types `types/dtos.ts`)
5. **Performance**: Images optimisées, CLS contrôlé, JS budget maîtrisé
6. **Checkout fiable**: Le Front n'"invente" jamais le paiement (webhook BFF fait foi)

## 1. Vue d'Ensemble

**Rôle du Frontend**:
- **Affichage (UI)**: Rendu visuel fidèle à l'identité minimaliste
- **Expérience (UX)**: Navigation fluide, filtrage instantané, tunnel d'achat Stripe
- **Consommateur de DTOs**: Ne contient aucune logique métier complexe. Reçoit des données "prêtes à afficher" depuis le BFF (`api.marrakea.com`)
- **SEO**: Rendu côté serveur (SSR) pour une indexation parfaite par Google
- **Panier local brouillon**: Cart store Zustand persisté, synchronisé au checkout

**Objectif**: Migrer le site MARRAKEA d'un site statique HTML/CSS/JS vers une application Next.js moderne, performante et prête pour la production.

**Philosophie**: Préserver l'identité éditoriale et minimaliste du site tout en ajoutant la dynamique nécessaire à un site e-commerce moderne. Architecture "Client Léger" (Dumb Client) qui consomme un BFF.

---

## 2. Stack Technologique (Verrouillée)

### Core & Build
- **Next.js 14+ (App Router)** - SSR, RSC, streaming, ISR
  - **Justification**: SEO critique pour e-commerce, Core Web Vitals optimaux, routing moderne
- **TypeScript** - Strict mode activé
  - **Justification**: Type safety end-to-end avec DTOs du BFF
- **Sharp** - Optimisation d'images native via Next.js `<Image />`
  - **Justification**: Performance, formats modernes (WebP, AVIF), lazy loading automatique

### Styling (Préservation de l'existant)
- **CSS Modules + variables CSS** - Préservation design existant, zéro runtime
  - **Justification**: Préserver le système CSS existant excellemment structuré
  - Variables CSS natives déjà en place (--bg, --ink, --accent, etc.)
  - Zero runtime, performance optimale
- **Next/Font** - Inter + Cormorant Garamond (self-host)
  - **Justification**: Prévention CLS (Cumulative Layout Shift), auto-hébergement

### State & Data Fetching
- **Server-Side (Fetch natif Next.js)** - Pages initiales (Home, Détail produit)
  - **Justification**: SEO, performance, cache ISR automatique avec `revalidate`
- **Client-Side (TanStack Query)** - Interactions dynamiques (Filtres, Recherche, Status checkout)
  - **Justification**: Cache intelligent client, optimistic updates, devtools
- **Zustand** - État global UI (Panier, Drawer, Modales)
  - **Justification**: Plus simple et performant que Context, bundle 1KB, persistence localStorage
  - **Hydration**: CartHydrationGate pour éviter mismatch badges/cart

### Forms & Validation
- **React Hook Form + Zod** - Formulaire contact, adresse si besoin futur
  - **Justification**: Validation performante, moins de re-renders, schémas réutilisables

### Animations (Optionnel)
- **Framer Motion** - Micro-animations (drawer, transitions)
  - **Justification**: UX polish, animations fluides 60fps

### Architecture Backend
- **BFF (Backend for Frontend)** - `api.marrakea.com`
  - Dolibarr → BFF → Frontend (via DTOs)
  - **Justification**: Découplage total, sécurité (pas d'exposition Dolibarr/Stripe keys), transformation données
- **DTOs stricts** - Contrats d'interface Frontend ↔ BFF
  - **Justification**: Pas de logique métier frontend, typage fort, validation runtime (Zod)
- **Stripe Checkout** - Piloté par le BFF
  - **Justification**: Webhook BFF fait foi, frontend ne calcule jamais le prix final

### Déploiement
- **Vercel** - Frontend Next.js (ISR, Edge Functions)
  - **Justification**: Intégration native Next.js, CDN global, analytics intégré
- **CDN Images** - Vercel Image Optimization ou BFF proxy avec cache
  - **Justification**: Images Dolibarr peuvent être lentes, besoin de proxy/cache agressif

---

## 3. Architecture des Dossiers (Spec Finale)

Structure optimisée pour séparer les composants Serveur (Rendu HTML) des composants Client (Interactivité).

```
src/
├── app/                          # Routing Next.js (App Router)
│   ├── layout.tsx                # Root Layout (Fonts, Providers, Header, Footer)
│   ├── page.tsx                  # Homepage (Server Component)
│   ├── not-found.tsx             # 404 design minimal
│   ├── error.tsx                 # Error boundary sobre
│   ├── loading.tsx               # Skeleton global minimal
│   ├── robots.ts                 # Robots.txt généré
│   ├── sitemap.ts                # Sitemap.xml généré dynamiquement
│   │
│   ├── objets/
│   │   ├── page.tsx              # Catalogue (Server + Client hybrid)
│   │   ├── loading.tsx           # Skeleton grid
│   │   └── [slug]/
│   │       ├── page.tsx          # Détail Produit + generateMetadata()
│   │       ├── opengraph-image.tsx # OG image auto-générée
│   │       └── loading.tsx       # Skeleton galerie + infos
│   │
│   ├── journal/
│   │   ├── page.tsx              # Blog listing (Server Component)
│   │   └── [slug]/
│   │       ├── page.tsx          # Article detail + SEO
│   │       └── opengraph-image.tsx
│   │
│   ├── contact/
│   │   └── page.tsx              # Contact form page
│   │
│   └── panier/                   # Cart & Checkout Stripe
│       ├── page.tsx              # Cart page (Client)
│       ├── success/
│       │   └── page.tsx          # Checkout success (Client: poll status)
│       └── cancel/
│           └── page.tsx          # Checkout cancelled
│
├── components/
│   ├── ui/                       # Primitives (Server-safe)
│   │   ├── button.tsx            # Neutre, utilisable server/client
│   │   ├── input.tsx             # Neutre
│   │   ├── badge.tsx             # Server Component
│   │   ├── skeleton.tsx          # Server Component
│   │   └── image.tsx             # Wrapper Next/Image (blurDataUrl)
│   │
│   ├── layout/                   # Layout components
│   │   ├── header.tsx            # Server Component (logo, nav statique)
│   │   ├── header-client.tsx    # Client Component (cart badge, search)
│   │   ├── footer.tsx            # Server Component
│   │   └── cart-drawer.tsx       # Client Component (overlay slide)
│   │
│   └── features/
│       ├── home/                 # Homepage sections
│       │   ├── hero-section.tsx       # Server Component
│       │   ├── image-band.tsx         # Server Component
│       │   ├── principle-card.tsx     # Server Component
│       │   ├── gesture-card.tsx       # Server Component
│       │   └── proof-card.tsx         # Server Component
│       │
│       ├── catalog/              # Catalog feature
│       │   ├── product-grid.tsx       # Server Component (initial)
│       │   ├── product-card.tsx       # Server Component (2 variants)
│       │   ├── catalog-view.tsx       # Client Component (filters + query)
│       │   ├── filters-bar.tsx        # Client Component
│       │   └── search-input.tsx       # Client Component (debounce)
│       │
│       ├── product/              # Product detail feature
│       │   ├── product-gallery.tsx    # Client Component (carousel)
│       │   ├── product-info.tsx       # Server Component
│       │   ├── add-to-cart.tsx        # Client Component (button + store)
│       │   ├── reference-sheet.tsx    # Server Component
│       │   └── artisan-block.tsx      # Server Component
│       │
│       ├── journal/              # Journal/Blog feature
│       │   ├── article-card.tsx       # Server Component
│       │   ├── article-hero.tsx       # Server Component
│       │   ├── article-content.tsx    # Server Component (MDX/HTML)
│       │   └── related-articles.tsx   # Server Component
│       │
│       └── cart/                 # Cart & Checkout feature
│           ├── cart-page.tsx          # Client Component (main page)
│           ├── cart-item.tsx          # Client Component
│           ├── cart-summary.tsx       # Client Component (totaux)
│           ├── checkout-button.tsx    # Client Component (POST session)
│           └── checkout-status-panel.tsx # Client Component (poll status)
│
├── lib/
│   ├── api/
│   │   ├── client.server.ts      # Fetch wrapper Server Components
│   │   ├── client.client.ts      # Fetch wrapper Client Components
│   │   ├── products.ts           # Product API calls
│   │   ├── articles.ts           # Articles API calls
│   │   └── checkout.ts           # Checkout API calls (session, status)
│   │
│   ├── utils/
│   │   ├── formatters.ts         # Prix, dates formatting
│   │   ├── constants.ts          # Config, URLs, BFF_URL
│   │   └── seo.ts                # SEO helpers (metadata, JSON-LD)
│   │
│   └── validations/
│       └── schemas.ts            # Zod schemas (forms, DTOs critiques)
│
├── types/
│   ├── dtos.ts                   # DTOs du BFF (contrat strict)
│   └── index.ts
│
├── stores/
│   └── cart-store.ts             # Zustand store (panier + hydration gate)
│
└── styles/
    ├── globals.css               # Variables CSS, reset
    └── fonts.ts                  # Next/Font config (Inter + Cormorant)

```

**Justifications de la structure**:
- **Séparation Server/Client**: Optimisation automatique du bundle (Server Components = 0KB JS client)
- **Deux clients API** (`client.server.ts` / `client.client.ts`): Policies de cache différentes
- **Feature folders**: Colocation composants + logique métier
- **Cart & Checkout**: Section dédiée avec polling status, session Stripe
- **DTOs stricts**: Contrat unique source de vérité entre Frontend et BFF
- **Scalabilité**: Ajout facile de features (account, wishlist, etc.)

---

## 4. Conventions Server / Client (Règles Strictes)

### 4.1 Règle d'Or

**Tout est Server Component par défaut.**

Passage en **Client Component uniquement** si :
- Utilise `useState`, `useEffect`, hooks React
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Accès à `window`, `localStorage`, `navigator`
- Bibliothèques client (TanStack Query, React Hook Form, Framer Motion)
- Accès au store Zustand

### 4.2 Convention Design System

Les primitives UI **peuvent être "server-safe"** si elles ne reçoivent pas d'event directement.

**Exemple**:
```typescript
// ✅ BON - Button neutre (peut être utilisé server/client)
export function Button({ children, variant, disabled, ...props }) {
  return (
    <button
      className={styles[variant]}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Utilisation Client Component
'use client';
export function AddToCart() {
  const [loading, setLoading] = useState(false);

  return (
    <Button onClick={() => setLoading(true)}>
      Ajouter au panier
    </Button>
  );
}
```

### 4.3 Erreur Commune à Éviter

```typescript
// ❌ MAUVAIS - Tout devient Client Component
'use client';

export default function ProductPage({ product }) {
  return (
    <>
      <ProductGallery images={product.gallery} /> {/* Client OK */}
      <ProductInfo product={product} /> {/* Pas besoin Client! */}
      <ReferenceSheet data={product.referenceSheet} /> {/* Pas besoin Client! */}
    </>
  );
}
```

```typescript
// ✅ BON - Séparation Server/Client
export default function ProductPage({ product }) {
  return (
    <>
      <ProductGallery images={product.gallery} /> {/* Client Component */}
      <ProductInfo product={product} /> {/* Server Component */}
      <ReferenceSheet data={product.referenceSheet} /> {/* Server Component */}
    </>
  );
}
```

---

## 5. Data Fetching et Caching (La Spec qui Évite les Pièges)

### 5.1 Deux Clients API (Obligatoire)

**Principe**: Séparer strictement les appels server et client pour des policies de cache différentes.

#### `lib/api/client.server.ts` (Server Components)

```typescript
// ✅ Server utilise variable non-publique
const BFF_URL = process.env.BFF_URL || 'http://localhost:4000';

export async function fetchServer<T>(
  endpoint: string,
  options?: {
    revalidate?: number;
    tags?: string[];
  }
): Promise<T> {
  const res = await fetch(`${BFF_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    // ISR: cache avec revalidation
    next: {
      revalidate: options?.revalidate ?? 3600, // 1h par défaut
      tags: options?.tags,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`BFF Error ${res.status}: ${errorText}`);
  }

  return res.json();
}
```

**Usage**: Server Components uniquement (pages, layout)
**Variable d'env**: `BFF_URL` (non-publique, peut être URL interne Docker/K8s)
**Supporte**: `revalidate` pour ISR, `tags` pour revalidation on-demand

#### `lib/api/client.client.ts` (Client Components)

```typescript
// ✅ Client utilise variable publique
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'https://api.marrakea.com';

export async function fetchClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BFF_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    // Pas de revalidate ici (géré par TanStack Query)
    cache: options?.cache ?? 'no-store', // no-store par défaut pour checkout/status
    credentials: 'include', // ⚠️ Important si le BFF utilise des cookies
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`BFF Error ${res.status}: ${errorText}`);
  }

  return res.json();
}
```

**Usage**: Client Components, TanStack Query
**Variable d'env**: `NEXT_PUBLIC_BFF_URL` (publique, URL accessible browser)
**Supporte**: `cache: 'no-store'` pour données critiques (checkout, stock check)
**Credentials**: `include` pour cookies httpOnly (sessions si nécessaire)

### 5.2 Politique de Cache (Par Route)

| Route | Type | Cache | Revalidate | Justification |
|-------|------|-------|------------|---------------|
| Homepage | Server | ISR | 3600s (1h) | Contenu stable |
| Catalogue | Server initial | ISR | 600s (10min) | Stock change fréquent |
| Produit | Server | ISR | 600s | Stock/prix peuvent changer |
| Article | Server | ISR | 3600s | Contenu éditorial stable |
| Filtres (client) | Client Query | TanStack | 5min staleTime | Recherche instantanée |
| Stock check | Client | no-store | - | Temps réel critique |
| Checkout session | Client | no-store | - | Une seule fois |
| Checkout status | Client | no-store | - | Poll temps réel |

### 5.3 TanStack Query Configuration

```typescript
// app/layout.tsx (Provider)
'use client';

export function QueryProvider({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5min
        cacheTime: 1000 * 60 * 10, // 10min
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 6. Composants Clés & Responsabilités (Server vs Client)

### 6.1 Layout & Navigation

#### Root Layout (`app/layout.tsx` - Server)

**Responsabilités**:
- Fonts via `styles/fonts.ts` (Next/Font)
- Metadata de base (title template, description)
- Structure HTML (`<html>`, `<body>`)
- Providers: QueryClientProvider, CartHydrationGate
- CSS globals
- Header + Footer

```typescript
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { CartHydrationGate } from '@/components/providers/cart-hydration';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
});

export const metadata = {
  title: {
    template: '%s | MARRAKEA',
    default: 'MARRAKEA — Artisanat marocain authentique',
  },
  description: '...',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <QueryProvider>
          <CartHydrationGate>
            <Header />
            <main>{children}</main>
            <Footer />
          </CartHydrationGate>
        </QueryProvider>
      </body>
    </html>
  );
}
```

#### Header (Hybride)

**header.tsx (Server Component)**:
- Logo MARRAKEA (lien vers home)
- Navigation principale (Objets, Journal, Contact)
- Structure HTML statique

**header-client.tsx (Client Component)**:
```typescript
'use client';

export function HeaderClient() {
  const { totalItems, isOpen, toggleCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Badge>0</Badge>; // SSR fallback

  return (
    <>
      <SearchInput /> {/* Si route /objets */}
      <CartWidget items={totalItems} onClick={toggleCart} />
      <MobileMenuToggle />
    </>
  );
}
```
- **Justification**: Interactivité requise, accès au store Zustand

#### Footer (Server Component)
- Liens légaux, réseaux sociaux
- Entièrement statique
- **Justification**: Pas d'interactivité = Server Component

#### CartDrawer (Client Component)
- Overlay panier glissant (Framer Motion)
- État géré par `useCartStore` (Zustand)
- Mutations: `removeItem`, `updateQuantity`
- Bouton "Voir mon panier" → navigation `/panier`
- **Justification**: État global, animations, interactions

### 6.2 Catalogue (Page `/objets`)

Architecture hybride pour performance SEO + interactivité.

#### page.tsx (Server Component)
```typescript
import { fetchServer } from '@/lib/api/client.server';
import { getProducts, getGestures, getTerritories } from '@/lib/api/products';
import CatalogView from '@/components/features/catalog/catalog-view';

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  // Fetch initial depuis BFF (SSR avec cache)
  const [initialProducts, gestures, territories] = await Promise.all([
    getProducts({
      page: Number(searchParams.page) || 1,
      limit: Number(searchParams.limit) || 12,
    }),
    getGestures(),
    getTerritories(),
  ]);

  return (
    <>
      <PageHero title="Objets référencés" subtitle="Par geste et territoire" />
      <CatalogView
        initialProducts={initialProducts}
        gestures={gestures}
        territories={territories}
      />
    </>
  );
}

// SEO Metadata
export const metadata = {
  title: 'Objets artisanaux marocains',
  description: 'Découvrez notre sélection d\'objets artisanaux...',
};
```

#### CatalogView (Client Component)
```typescript
'use client';

export default function CatalogView({ initialProducts, gestures, territories }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    gesture: searchParams.get('gesture') || '',
    territory: searchParams.get('territory') || '',
    search: searchParams.get('search') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
  });

  // TanStack Query pour filtrage dynamique
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    initialData: initialProducts,
    enabled: Object.values(filters).some(v => v !== ''),
  });

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.replace(`/objets?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  return (
    <>
      <FiltersBar
        gestures={gestures}
        territories={territories}
        activeFilters={filters}
        onFilterChange={setFilters}
      />
      <SearchInput
        value={filters.search}
        onChange={(value) => setFilters({ ...filters, search: value })}
      />
      {isLoading ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGrid products={products.items} variant="default" />
      )}
    </>
  );
}
```
- **Justification**: Interactivité filtres, TanStack Query, sync URL params

#### FiltersBar (Client Component)
- Buttons horizontaux avec underline active
- Sticky positioning
- État synchronisé avec URL params (deep linking)
- **Justification**: État local, interactions, URL sync

#### ProductCard (Client-Safe Presentational Component)

**Décision**: ProductCard est un composant **"client-safe presentational"** - pas de directive `'use client'`, pas de hooks, uniquement présentation pure. Compatible avec Server ET Client Components.

**Implémentation**:
```typescript
// components/features/catalog/product-card.tsx
// ⚠️ Pas de 'use client' - composant neutre
import Link from 'next/link';
import Image from 'next/image';
import styles from './product-card.module.css';
import type { ProductDTO } from '@/types/dtos';

interface ProductCardProps {
  product: ProductDTO;
  variant?: 'default' | 'overlay';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  return (
    <Link href={`/objets/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.coverImage.url}
          alt={product.coverImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder={product.coverImage.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={product.coverImage.blurDataUrl}
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.meta}>
          Geste : {product.metadata.gesture.name} • {product.metadata.territory.name}
        </p>
        <p className={styles.price}>{product.price.formattedPrice}</p>
      </div>
    </Link>
  );
}
```

**Utilisable dans**:
- ✅ Server Component (Homepage grid SSR)
- ✅ Client Component (CatalogView filtered results)

**Justification**:
- Pas d'état local (`useState`)
- Pas d'événements (`onClick`)
- Pas d'accès à `window` ou `localStorage`
- Navigation via `Link` (compatible server/client)
- Image via `Image` (compatible server/client)
- Résultat: 0KB JS supplémentaire, réutilisable partout

### 6.3 Détail Produit (Page `/objets/[slug]`)

#### page.tsx (Server Component)
```typescript
import { fetchServer } from '@/lib/api/client.server';
import { getProduct } from '@/lib/api/products';
import ProductGallery from '@/components/features/product/product-gallery';
import ProductInfo from '@/components/features/product/product-info';
import AddToCartButton from '@/components/features/product/add-to-cart';
import ReferenceSheet from '@/components/features/product/reference-sheet';
import ArtisanBlock from '@/components/features/product/artisan-block';

// ISR: 10 min
export const revalidate = 600;

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  return (
    <div className={styles.layout}>
      <aside className={styles.gallery}>
        <ProductGallery images={product.gallery} />
      </aside>

      <article className={styles.content}>
        <ProductInfo product={product} />
        <AddToCartButton product={product} />

        <ReferenceSheet data={product.referenceSheet} />
        <div className={styles.details}>
          <h3>Détails</h3>
          <dl>
            <dt>Structure</dt><dd>{product.details.structure}</dd>
            <dt>Densité</dt><dd>{product.details.density}</dd>
            {/* ... */}
          </dl>
        </div>

        {product.artisan && <ArtisanBlock artisan={product.artisan} />}

        {product.relatedProducts.length > 0 && (
          <section>
            <h3>Objets similaires</h3>
            <ProductGrid products={product.relatedProducts} variant="default" />
          </section>
        )}
      </article>
    </div>
  );
}

// SEO Critique + JSON-LD
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  return {
    title: `${product.title} - ${product.price.formattedPrice}`,
    description: product.intro,
    openGraph: {
      title: product.title,
      description: product.intro,
      images: [
        {
          url: product.coverImage.url,
          width: 1200,
          height: 630,
          alt: product.coverImage.alt,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      images: [product.coverImage.url],
    },
  };
}

// JSON-LD injecté dans le JSX (plus fiable que metadata.other)
// Ajouter dans le composant:
// <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
```

#### ProductGallery (Client Component)
```typescript
'use client';

export default function ProductGallery({ images }) {
  const [activeImage, setActiveImage] = useState(images.main);

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          placeholder="blur"
          blurDataURL={activeImage.blurDataUrl}
        />
      </div>
      <div className={styles.thumbnails}>
        {images.thumbnails.map((img) => (
          <button
            key={img.url}
            onClick={() => setActiveImage(img)}
            className={activeImage.url === img.url ? styles.active : ''}
          >
            <Image src={img.url} alt={img.alt} width={80} height={80} />
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **Justification**: Interactivité, state local image active, carousel

#### AddToCartButton (Client Component)
```typescript
'use client';

export function AddToCartButton({ product }) {
  const { addItem, toggleCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);

    // Optionnel: vérifier stock temps réel via BFF
    try {
      const { inStock } = await checkStock(product.id);
      if (!inStock) {
        toast.error('Produit indisponible');
        setIsAdding(false);
        return;
      }
    } catch (error) {
      // Fallback: ajouter quand même
      console.warn('Stock check failed', error);
    }

    addItem({
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        coverImage: product.coverImage,
      },
      quantity,
      addedAt: new Date().toISOString(),
    });

    toggleCart(); // Ouvre le drawer
    setIsAdding(false);
  };

  // UX différente selon purchaseMode
  const { availability } = product;
  const showQuantityStepper =
    availability.purchaseMode === 'quantity' &&
    availability.maxQuantity &&
    availability.maxQuantity > 1;

  return (
    <div className={styles.addToCart}>
      {showQuantityStepper && (
        <div className={styles.quantitySelector}>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label="Diminuer la quantité"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(availability.maxQuantity!, quantity + 1))}
            disabled={quantity >= availability.maxQuantity!}
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>
      )}

      <Button
        onClick={handleAdd}
        loading={isAdding}
        disabled={!availability.inStock}
        fullWidth
      >
        {availability.purchaseMode === 'preorder' && 'Précommander'}
        {availability.purchaseMode === 'unique' && availability.inStock && 'Ajouter au panier'}
        {availability.purchaseMode === 'quantity' && availability.inStock && 'Ajouter au panier'}
        {!availability.inStock && availability.label}
      </Button>

      {availability.purchaseMode === 'preorder' && (
        <p className={styles.preorderNote}>
          Délai de fabrication estimé : 4 à 6 semaines
        </p>
      )}
    </div>
  );
}
```
- **Justification**:
  - Mutation store Zustand avec quantité configurable
  - Vérification stock optionnelle temps réel
  - UX adaptée au `purchaseMode` (unique/quantity/preorder)
  - Stepper quantité si `maxQuantity > 1`
  - Labels différents selon contexte

#### ReferenceSheet, ArtisanBlock (Server Components)
- Affichage pur de données structurées
- Tables 2 colonnes clé-valeur
- Pas d'interactivité
- **Justification**: Server Component par défaut

### 6.4 Panier & Checkout Stripe

#### app/panier/page.tsx (Client Component)

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import CartItem from '@/components/features/cart/cart-item';
import CartSummary from '@/components/features/cart/cart-summary';
import CheckoutButton from '@/components/features/cart/checkout-button';

export default function CartPage() {
  const { items, totalItems, totalPrice } = useCartStore();

  if (totalItems === 0) {
    return (
      <div className={styles.empty}>
        <h1>Votre panier est vide</h1>
        <Link href="/objets">Découvrir nos objets</Link>
      </div>
    );
  }

  return (
    <div className={styles.cart}>
      <h1>Mon panier ({totalItems} article{totalItems > 1 ? 's' : ''})</h1>

      <div className={styles.items}>
        {items.map((item) => (
          <CartItem key={item.product.id} item={item} />
        ))}
      </div>

      <CartSummary subtotal={totalPrice} />

      <CheckoutButton items={items} />
    </div>
  );
}
```

#### CheckoutButton (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/api/checkout';

export function CheckoutButton({ items }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Payload minimal: juste les IDs et quantités
      const payload = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // POST /checkout/session (no-store)
      const { checkoutUrl } = await createCheckoutSession(payload);

      // Redirect vers Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error('Erreur lors de la création de la session');
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} loading={isLoading} size="large">
      Procéder au paiement
    </Button>
  );
}
```

**Justification**:
- Frontend ne calcule jamais le prix final (BFF le fait)
- Payload minimal (productId + quantity)
- Redirection immédiate vers Stripe

#### app/panier/success/page.tsx (Client Component)

```typescript
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCheckoutStatus } from '@/lib/api/checkout';
import { useCartStore, selectTotalItems } from '@/stores/cart-store';
import CheckoutStatusPanel from '@/components/features/cart/checkout-status-panel';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const clearCart = useCartStore(state => state.clearCart);
  const cartItems = useCartStore(selectTotalItems);

  // ✅ Polling avec TanStack Query (propre, cancel automatique, timeout)
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['checkout-status', sessionId],
    queryFn: () => getCheckoutStatus(sessionId!),
    enabled: !!sessionId,
    // Polling tant que status = LOCKED (paiement en cours)
    refetchInterval: (data) => {
      if (!data) return false;
      // Si LOCKED → poll toutes les 2s
      if (data.status === 'LOCKED') return 2000;
      // Sinon arrêter le polling
      return false;
    },
    // Timeout max 60s
    staleTime: 60000,
    retry: 3,
    retryDelay: 1000,
  });

  // Clear cart si PAID confirmé
  useEffect(() => {
    if (data?.status === 'PAID' && cartItems > 0) {
      clearCart();
    }
  }, [data?.status, cartItems, clearCart]);

  if (!sessionId) {
    return (
      <CheckoutStatusPanel status="error">
        <h1>Session invalide</h1>
        <Link href="/objets">Retour au catalogue</Link>
      </CheckoutStatusPanel>
    );
  }

  if (isLoading || data?.status === 'DRAFT' || data?.status === 'LOCKED') {
    return (
      <CheckoutStatusPanel status="loading">
        <h1>Vérification du paiement...</h1>
        <p>Veuillez patienter pendant que nous confirmons votre commande.</p>
        {data?.status === 'LOCKED' && (
          <p className={styles.note}>Paiement en cours de confirmation...</p>
        )}
      </CheckoutStatusPanel>
    );
  }

  if (isError) {
    return (
      <CheckoutStatusPanel status="error">
        <h1>Erreur de vérification</h1>
        <p>{error?.message || 'Impossible de vérifier le statut du paiement'}</p>
        <p className={styles.help}>
          Si vous avez effectué un paiement, contactez-nous avec votre numéro de commande.
        </p>
        <Link href="/contact">Nous contacter</Link>
      </CheckoutStatusPanel>
    );
  }

  if (data?.status === 'PAID') {
    return (
      <CheckoutStatusPanel status="success" order={data.order}>
        <h1>Paiement confirmé</h1>
        <p className={styles.orderNumber}>Commande #{data.order.orderNumber}</p>
        <p>Un email de confirmation vous a été envoyé à {data.order.email}</p>
        <div className={styles.summary}>
          <h3>Résumé</h3>
          <p>Montant: {data.order.formattedTotal}</p>
          <p>Articles: {data.order.totalItems}</p>
        </div>
        <Link href="/objets">Continuer mes achats</Link>
      </CheckoutStatusPanel>
    );
  }

  if (data?.status === 'CANCELLED') {
    return (
      <CheckoutStatusPanel status="error">
        <h1>Paiement annulé</h1>
        <p>Cette commande a été annulée.</p>
        <Link href="/panier">Retour au panier</Link>
      </CheckoutStatusPanel>
    );
  }

  if (data?.status === 'EXPIRED') {
    return (
      <CheckoutStatusPanel status="error">
        <h1>Session expirée</h1>
        <p>La session de paiement a expiré. Veuillez recommencer.</p>
        <Link href="/panier">Retour au panier</Link>
      </CheckoutStatusPanel>
    );
  }

  // FAILED ou autre
  return (
    <CheckoutStatusPanel status="error">
      <h1>Échec du paiement</h1>
      <p>Le paiement n'a pas pu être confirmé.</p>
      <Link href="/panier">Retour au panier</Link>
    </CheckoutStatusPanel>
  );
}
```

**Justification**:
- ✅ **TanStack Query** avec `refetchInterval`: propre, cancel automatique, pas de fuite mémoire
- ✅ **Timeout max 60s** via `staleTime`
- ✅ **Mapping tous les statuts**: DRAFT, LOCKED, PAID, CANCELLED, EXPIRED, FAILED
- ✅ **Clear cart uniquement si PAID** (webhook BFF fait foi)
- ✅ **Affiche numéro commande Dolibarr** + email confirmation
- ✅ **Retry strategy**: 3 tentatives avec delay 1s

#### app/panier/cancel/page.tsx (Client Component)

```typescript
export default function CheckoutCancelPage() {
  return (
    <div className={styles.cancel}>
      <h1>Paiement annulé</h1>
      <p>Vous avez annulé le paiement.</p>
      <Link href="/panier">Retour au panier</Link>
    </div>
  );
}
```

### 6.5 Journal

#### ArticleCard, ArticleHero, ArticleContent (Server Components)
- Rendu pur de contenu éditorial
- Markdown/MDX processing côté serveur (ou HTML depuis BFF)
- **Justification**: SEO critique, pas d'interactivité

#### app/journal/[slug]/page.tsx (Server Component)

```typescript
export const revalidate = 3600; // 1h

export default async function ArticlePage({ params }) {
  const article = await getArticle(params.slug);

  return (
    <>
      <ArticleHero article={article} />
      <ArticleContent content={article.content} />
      {article.relatedArticles.length > 0 && (
        <RelatedArticles articles={article.relatedArticles} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            image: article.coverImage.url,
            datePublished: article.publishedAt,
            author: { '@type': 'Person', name: article.author?.name || 'MARRAKEA' },
          }),
        }}
      />
    </>
  );
}

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage.url],
      type: 'article',
    },
  };
}
```

### 6.6 Contact

#### ContactForm (Client Component)
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/lib/validations/schemas';
import { fetchClient } from '@/lib/api/client.client';
import { toast } from 'sonner'; // ou react-hot-toast

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    try {
      // ✅ Appel direct au BFF (pas de /api/contact Next.js)
      await fetchClient('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast.success('Message envoyé avec succès');
      reset();
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <Input
        label="Nom complet"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Select
        label="Sujet"
        {...register('subject')}
        options={[
          { value: 'objet', label: 'Question sur un objet' },
          { value: 'commande', label: 'Commande / Acquisition' },
          { value: 'methode', label: 'Notre méthode' },
          { value: 'partenariat', label: 'Partenariat' },
          { value: 'autre', label: 'Autre' },
        ]}
        error={errors.subject?.message}
      />
      <Textarea
        label="Message"
        {...register('message')}
        rows={5}
        error={errors.message?.message}
      />

      {/* Honeypot anti-spam */}
      <input
        type="text"
        name="website"
        style={{ position: 'absolute', left: '-9999px' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
        Envoyer le message
      </Button>
    </form>
  );
}
```
- **Justification**: Form state RHF, validation Zod client-side, appel BFF direct (pas d'API route Next.js)

---

## 5. Composants UI Primitives

#### A. Navigation & Layout
**1. Header** (`components/common/Header`)
- Props: `searchEnabled: boolean`
- Features:
  - Logo cliquable (navigation vers home)
  - Navigation principale (Objets, Journal, Contact)
  - Barre de recherche conditionnelle (uniquement sur /objets)
  - Sticky positioning
  - Scroll behavior (hide on scroll for /objets)
- **Justification**: Utilisé sur toutes les pages, comportement différent selon context

**2. Footer** (`components/common/Footer`)
- Props: aucun
- Features: Liens légaux, réseaux sociaux
- **Justification**: Absent actuellement mais nécessaire pour site production

**3. Layout** (`components/common/Layout`)
- Props: `children: ReactNode`
- Features: Wrapper Header + children + Footer
- **Justification**: DRY principle, évite répétition header/footer

**1. Button** (Server Component compatible)
- Props: `variant: 'primary' | 'secondary' | 'ghost'`, `size`, `loading`, `disabled`
- Peut être Server ou Client selon usage
- **Justification**: Composant le plus réutilisé

**2. Input** (Server Component compatible)
- Props: `type`, `placeholder`, `value`, `onChange`, `error`
- **Justification**: Forms, search

**3. Badge** (Server Component)
- Props: `variant`, `children`
- **Justification**: Tags catégories, prix

**4. Skeleton** (Server Component)
- Props: `variant: 'text' | 'image' | 'card'`
- **Justification**: Loading states (loading.tsx)

**5. Image** (Wrapper Next/Image)
```typescript
import NextImage from 'next/image';

export function Image({ src, alt, aspectRatio, priority = false }) {
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      priority={priority}
      placeholder="blur"
      blurDataURL={generateBlurData(src)}
    />
  );
}
```
- **Justification**: Performance automatique, formats modernes, lazy loading

---

## 6. Intégration BFF & Modèles de Données (DTOs)

Le Frontend ne "devine" pas les données. Il implémente strictement les DTOs fournis par le BFF.

### 6.1 Le Client API (`lib/api/client.ts`)

Ce fichier centralise tous les appels. Pas de `fetch` dispersés dans les composants.

```typescript
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'https://api.marrakea.com';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BFF_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
    // ISR: cache 1h côté Next.js
    next: { revalidate: 3600, ...options?.next },
  });

  if (!res.ok) {
    throw new Error(`BFF Error: ${res.status}`);
  }

  return res.json();
}
```

### 6.2 DTOs Stricts (Contrat d'Interface)

**Principe**: Aucun champ Dolibarr exposé (pas de `rowid`, `fk_*`, `entity`). Le BFF transforme tout.

```typescript
// types/dtos.ts

// ============================================
// PRODUCT DTOs
// ============================================

export interface ProductDTO {
  id: string;
  slug: string;
  title: string;
  intro: string;

  price: {
    amount: number;
    currency: string;
    formattedPrice: string; // "1 450 €" (formaté par BFF)
  };

  coverImage: {
    url: string;
    alt: string;
    blurDataUrl?: string; // Base64 pour placeholder
  };

  availability: {
    inStock: boolean;
    label: string; // "En stock" | "Sur commande" | "Indisponible"
    purchaseMode: 'unique' | 'quantity' | 'preorder'; // Type d'achat
    maxQuantity?: number; // null si purchaseMode = 'unique', sinon stock réel
  };

  metadata: {
    gesture: {
      id: string;
      name: string; // "Tissage"
      slug: string;
    };
    territory: {
      id: string;
      name: string; // "Haut Atlas"
      slug: string;
    };
    featured: boolean;
    createdAt: string; // ISO 8601
  };
}

export interface ProductDetailDTO extends ProductDTO {
  gallery: {
    main: ImageDTO;
    thumbnails: ImageDTO[];
  };

  referenceSheet: {
    typology: string;
    localName: string;
    originRegion: string;
    mainTechnique: string;
    rawMaterial: string;
    dimensions: string;
    fabricationTime: string;
    pieceStatus: string;
    dateReferenced: string;
  };

  details: {
    structure: string;
    density: string;
    patterns: string;
    condition: string;
    approximateWeight: string;
  };

  artisan?: ArtisanDTO;

  acquisition: {
    priceNote: string;
    deliveryInfo: {
      finalControl: string;
      packaging: string;
      shipping: string;
      insurance: string;
      returns: string;
    };
    guarantees: string[];
    returnPolicy: string;
  };

  relatedProducts: ProductDTO[];
}

export interface ImageDTO {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
}

export interface ArtisanDTO {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  workshopLocation: string;
  specialty: string;
  yearsExperience?: string;
  transmissionMode: string;
  equipment: string;
}

// ============================================
// ARTICLE DTOs
// ============================================

export interface ArticleDTO {
  id: string;
  slug: string;
  title: string;
  excerpt: string;

  category: {
    id: string;
    name: 'Technique' | 'Matière' | 'Atelier' | 'Geste' | 'Histoire';
    slug: string;
  };

  coverImage: ImageDTO;

  publishedAt: string; // ISO 8601
  readingTime: number; // minutes
  featured: boolean;
}

export interface ArticleDetailDTO extends ArticleDTO {
  content: string; // HTML ou Markdown
  author?: {
    name: string;
    role: string;
  };
  tags: string[];
  relatedArticles: ArticleDTO[];
}

// ============================================
// CATALOG FILTERS
// ============================================

export interface GestureDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface TerritoryDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface FilterParams {
  gesture?: string;
  territory?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// CART
// ============================================

export interface CartItemDTO {
  product: ProductDTO;
  quantity: number;
  addedAt: string;
}

export interface CartDTO {
  items: CartItemDTO[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    formattedTotal: string;
  };
}
```

### 6.3 API Functions (`lib/api/products.ts`)

```typescript
import { apiClient } from './client';
import type { ProductDTO, ProductDetailDTO, FilterParams, PaginatedResponse } from '@/types/dtos';

export async function getProducts(
  params?: FilterParams
): Promise<PaginatedResponse<ProductDTO>> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient(`/catalog/products?${query}`);
}

export async function getProduct(slug: string): Promise<ProductDetailDTO> {
  return apiClient(`/catalog/products/${slug}`);
}

export async function getFeaturedProducts(): Promise<ProductDTO[]> {
  const response = await apiClient<PaginatedResponse<ProductDTO>>(
    '/catalog/products?featured=true&limit=6'
  );
  return response.items;
}

export async function checkStock(productId: string): Promise<{ inStock: boolean }> {
  return apiClient(`/catalog/products/${productId}/stock`);
}
```

---

## 7. Gestion de l'État (Zustand)

### 7.1 Cart Store (`stores/cart-store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductDTO, CartItemDTO } from '@/types/dtos';

interface CartState {
  items: CartItemDTO[];
  isOpen: boolean;

  // Actions
  addItem: (product: ProductDTO, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(item => item.product.id === product.id);

          if (existing) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [
              ...state.items,
              {
                product: {
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  price: product.price,
                  coverImage: product.coverImage,
                },
                quantity,
                addedAt: new Date().toISOString(),
              }
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          // Si quantité 0, retirer l'item
          set((state) => ({
            items: state.items.filter(item => item.product.id !== productId)
          }));
        } else {
          set((state) => ({
            items: state.items.map(item =>
              item.product.id === productId ? { ...item, quantity } : item
            )
          }));
        }
      },

      clearCart: () => set({ items: [], isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'marrakea-cart',
      // ⚠️ skipHydration pour éviter mismatch
      skipHydration: true,
    }
  )
);

// ✅ Selectors (à utiliser dans les composants au lieu de getters)
export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce(
    (sum, item) => sum + item.product.price.amount * item.quantity,
    0
  );

export const selectFormattedSubtotal = (state: CartState) => {
  const subtotal = selectSubtotal(state);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(subtotal);
};
```

**Usage dans composants**:
```typescript
// ✅ BON - Selectors
const totalItems = useCartStore(selectTotalItems);
const subtotal = useCartStore(selectSubtotal);
const formattedSubtotal = useCartStore(selectFormattedSubtotal);

// ❌ MAUVAIS - Getters (stale reads, re-render incomplet)
const { totalItems, totalPrice } = useCartStore();
```

### 7.2 Cart Hydration Gate (`components/providers/cart-hydration.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart-store';

export function CartHydrationGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Réhydrater une seule fois au montage
    useCartStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  return <>{children}</>;
}
```

**Justification Zustand**:
- Bundle 1KB vs Context (~0KB) mais DX infiniment meilleure
- Middleware `persist` pour localStorage automatique
- Pas de Provider boilerplate
- DevTools intégré
- Performance (selectors = pas de re-renders inutiles)
- **Selectors au lieu de getters**: évite stale reads avec persist

---

## 8. Images, Loading States & Sécurité

### 8.1 Images (Spec Performance)

#### components/ui/image.tsx (Wrapper Next/Image)

```typescript
import NextImage from 'next/image';

interface ImageProps {
  src: string;
  alt: string;
  aspectRatio?: '1/1' | '4/5' | '16/10' | '21/9' | '4/3';
  priority?: boolean;
  blurDataUrl?: string;
  sizes?: string;
}

export function Image({
  src,
  alt,
  aspectRatio = '1/1',
  priority = false,
  blurDataUrl,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: ImageProps) {
  return (
    <div className={styles[`ratio-${aspectRatio}`]}>
      <NextImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={blurDataUrl}
        className={styles.image}
      />
    </div>
  );
}
```

**CSS Modules**:
```css
.ratio-1\/1 {
  position: relative;
  aspect-ratio: 1 / 1;
}

.ratio-4\/5 {
  aspect-ratio: 4 / 5;
}

/* ... autres ratios */

.image {
  object-fit: cover;
  object-position: center;
}
```

#### Configuration next.config.js

```javascript
module.exports = {
  images: {
    domains: ['api.marrakea.com', 'images.pexels.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },
};
```

**Stratégie recommandée**:
- BFF proxy d'images avec cache CDN
- OU Cloudinary/Vercel Image Optimization
- `blurDataUrl` généré côté BFF (base64 tiny image)

### 8.2 Loading States (Skeleton Loaders)

#### app/loading.tsx (Global)

```typescript
export default function LoadingPage() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonContent}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}
```

#### app/objets/loading.tsx (Skeleton Grid)

```typescript
export default function ObjectsLoading() {
  return (
    <div className={styles.grid}>
      {[...Array(12)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

#### components/ui/skeleton.tsx

```typescript
export function Skeleton({ variant = 'text', className = '' }) {
  return (
    <div className={`${styles.skeleton} ${styles[variant]} ${className}`} />
  );
}
```

**CSS**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--line) 0%,
    var(--bg) 50%,
    var(--line) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 8.3 Error Handling

#### app/error.tsx (Global Error Boundary)

```typescript
'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.error}>
      <h1>Une erreur est survenue</h1>
      <p>Nous travaillons à résoudre le problème.</p>
      <Button onClick={reset}>Réessayer</Button>
      <Link href="/">Retour à l'accueil</Link>
    </div>
  );
}
```

#### app/not-found.tsx (404 Minimal)

```typescript
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className={styles.notFound}>
      <h1>404</h1>
      <p>Page introuvable</p>
      <Link href="/">Retour à l'accueil</Link>
    </div>
  );
}
```

### 8.4 Sécurité Côté Front

**Ce qui DOIT être vrai**:

1. **Aucune clé sensible dans le code**:
   - Pas de clés Dolibarr
   - Pas de clés Stripe secrètes
   - `NEXT_PUBLIC_*` uniquement pour URLs publiques

2. **Checkout/Status en no-store**:
   ```typescript
   const { checkoutUrl } = await fetchClient('/checkout/session', {
     method: 'POST',
     cache: 'no-store', // OBLIGATOIRE
     body: JSON.stringify(payload),
   });
   ```

3. **Pas de calcul prix officiel côté Front**:
   - Le Front affiche `product.price.formattedPrice` (vient du BFF)
   - Le cart store calcule un "subtotal indicatif" mais le BFF recalcule tout

4. **Pas d'informations sensibles en query params**:
   - OK: `?session_id=cs_test_xxx` (Stripe session publique)
   - PAS OK: `?price=1450&email=user@example.com`

5. **CSRF Protection**:
   - Next.js gère automatiquement pour les Server Actions
   - Pour les API routes: utiliser `next-csrf`

6. **Rate Limiting** (recommandé):
   - BFF implémente rate limiting
   - Frontend peut ajouter debounce (search, filtres)

---

## 9. Stratégie de Migration par Phases

### Phase 1: Fondations & Design System (Jours 1-3)

**Objectif**: Projet Next.js fonctionnel avec UI primitives et mock data.

**Le développement Frontend ne doit pas attendre le Backend.**

**Tâches**:

1. **Setup projet Next.js**
   ```bash
   npx create-next-app@latest marrakea-frontend --typescript --tailwind --app --src-dir
   ```
   - Configuration ESLint + Prettier
   - Setup Git + .gitignore
   - Configuration `next.config.js` (images domains, etc.)

2. **Migration CSS & Fonts**
   - Copier variables CSS globales (`styles/globals.css`)
   - Setup Next/Font pour Cormorant Garamond + Inter
   - Créer reset.css et architecture CSS Modules

3. **Création DTOs & Mock Data**
   - Créer `types/dtos.ts` complet (contrat d'interface BFF)
   - Créer `/lib/mock-data/products.json` (6 produits réalistes)
   - Créer `/lib/mock-data/articles.json` (6 articles)
   - **Justification**: Le développement peut commencer immédiatement sans attendre le BFF

4. **UI Primitives (Server Components)**
   - `components/ui/button.tsx`
   - `components/ui/input.tsx`
   - `components/ui/badge.tsx`
   - `components/ui/skeleton.tsx`
   - `components/ui/image.tsx` (wrapper Next/Image avec blurData)

5. **Client API Layer**
   - Créer `lib/api/client.ts` (fetch wrapper)
   - Créer `lib/api/products.ts` (fonctions mocké es initialement)
   - Configuration `.env.local` avec `NEXT_PUBLIC_BFF_URL=http://localhost:4000`

**Livrable Jour 3**: Site vide mais configuré, UI primitives testables, mock data en place.

---

### Phase 2: Layout & Pages Statiques (Jours 4-6)

**Objectif**: Site "vitrine" navigable, SEO-perfect, responsive, Lighthouse 100.

**Tâches**:

1. **Root Layout**
   - `app/layout.tsx` avec Fonts, Metadata, Providers
   - Setup `CartStoreProvider` (hydration)
   - Global styles

2. **Header (Hybride)**
   - `components/layout/header.tsx` (Server: Logo, Nav)
   - `components/layout/header-client.tsx` (Client: CartWidget)
   - Sticky positioning, responsive

3. **Footer (Server Component)**
   - Liens légaux, réseaux sociaux
   - Entièrement statique

4. **Homepage (`app/page.tsx`)**
   - HeroSection (Server Component)
   - ObjectsGrid avec 6 produits mocké s (Server Component)
   - ImageBand (Server Component)
   - PrincipleCard grid (4 principes)
   - GestureCard grid (6 gestes)
   - ProofCard grid (3 preuves de confiance)
   - **generateMetadata()** pour SEO

5. **Contact Page (`app/contact/page.tsx`)**
   - ContactForm (Client Component - React Hook Form + Zod)
   - ContactInfo (Server Component)

6. **Tests Performance**
   - Lighthouse audit (objectif: 100/100)
   - Vérifier CLS (Cumulative Layout Shift < 0.1)
   - Vérifier LCP (Largest Contentful Paint < 2.5s)

**Livrable Jour 6**: Homepage + Contact fonctionnelles, navigables, SEO-ready, performantes.

---

### Phase 3: Journal (Jours 7-8)

**Objectif**: Pages éditoriales avec SEO optimal.

**Tâches**:

1. **Journal Listing (`app/journal/page.tsx`)**
   - FeaturedArticle (Server Component)
   - ArticlesGrid (Server Component)
   - ArticleCard (Server Component)
   - Fetch mock articles

2. **Article Detail (`app/journal/[slug]/page.tsx`)**
   - ArticleHero (Server Component)
   - ArticleContent (Server Component - MDX rendering)
   - RelatedArticles (Server Component)
   - **generateMetadata()** avec OpenGraph
   - **opengraph-image.tsx** (génération auto image réseaux sociaux)

3. **SEO Advanced**
   - JSON-LD Schema.org (Article, Organization)
   - Sitemap.xml génération dynamique
   - robots.txt

**Livrable Jour 8**: Pages Journal complètes, SEO parfait, partage réseaux sociaux fonctionnel.

---

### Phase 4: Catalogue & Zustand Store (Jours 9-12)

**Objectif**: Fonctionnalités e-commerce core (filtres, panier, détail produit).

**Tâches**:

1. **Zustand Cart Store**
   - Créer `stores/cart-store.ts`
   - Actions: addItem, removeItem, updateQuantity, clearCart
   - Persistence localStorage
   - Tests hydration (éviter mismatch)

2. **CartDrawer (Client Component)**
   - Overlay glissant
   - CartItem components
   - CartSummary (totaux)
   - Bouton "Commander" → `/panier`

3. **Catalogue Page (`app/objets/page.tsx`)**
   - Server Component: fetch initial products
   - CatalogView (Client Component: filtres dynamiques)
   - FiltersBar (Client Component: gestes, prix)
   - SearchInput (Client Component: debounce)
   - ProductGrid (Server Component initial)
   - ProductCard (Server Component, 2 variants)

4. **Intégration TanStack Query**
   - Setup QueryClientProvider
   - Hook `useProducts(filterParams)` pour filtrage client
   - Cache et invalidation

5. **Product Detail Page (`app/objets/[slug]/page.tsx`)**
   - ProductGallery (Client Component: carousel)
   - ProductInfo (Server Component)
   - AddToCartButton (Client Component)
   - ReferenceSheet (Server Component)
   - ArtisanBlock (Server Component)
   - RelatedProducts (Server Component)
   - **generateMetadata()** avec JSON-LD Product
   - **opengraph-image.tsx**

**Livrable Jour 12**: Catalogue filtrable, panier fonctionnel, détail produit complet.

---

### Phase 5: Checkout & Animations (Jours 13-14)

**Objectif**: Tunnel d'achat et polish UX.

**Tâches**:

1. **Cart Page (`app/panier/page.tsx`)**
   - Liste items avec quantités modifiables
   - Calcul totaux (subtotal, shipping, tax)
   - Bouton "Procéder au paiement"

2. **Checkout Flow**
   - Redirection vers paiement (Stripe/autre)
   - Page confirmation

3. **Animations & Transitions**
   - Transitions Next.js (App Router)
   - Framer Motion pour CartDrawer
   - Loading states (Skeleton components)
   - Error boundaries

4. **Responsive Final**
   - Tests mobile/tablet/desktop
   - Burger menu mobile
   - Touch interactions

**Livrable Jour 14**: Site complet avec mock data, expérience fluide, animations polish.

---

### Phase 6: Connexion BFF Réel (Jours 15-16)

**Pré-requis**: Le BFF a ses endpoints prêts.

**Tâches**:

1. **Configuration**
   - Changer `NEXT_PUBLIC_BFF_URL` vers BFF staging
   - Vérifier CORS
   - Tester authentification si nécessaire

2. **Remplacement Mock → BFF**
   - `lib/api/products.ts`: remplacer mock par vrais fetch
   - `lib/api/articles.ts`: idem
   - `lib/api/cart.ts`: idem

3. **Tests End-to-End**
   - Catalogue avec vrais produits Dolibarr
   - Images (vérifier loader Next/Image)
   - Filtres avec vraies données
   - Stock checking temps réel
   - Checkout complet

4. **Error Handling**
   - BFF down: afficher message gracieux
   - Images manquantes: fallback UI
   - Produits hors stock: UI grisée
   - Timeouts: Skeleton loaders

**Livrable Jour 16**: Frontend connecté au vrai BFF, données Dolibarr affichées.

---

### Phase 7: Optimisation & Production (Jours 17-18)

**Objectif**: Déploiement production Vercel.

**Tâches**:

1. **Performance Audit**
   - Lighthouse 100/100 (ou proche)
   - Core Web Vitals validation
   - Bundle analyzer (optimiser taille)
   - Image optimization (formats WebP/AVIF)

2. **SEO Final**
   - Vérifier tous les metadata
   - Tester partage Facebook/Twitter (OpenGraph)
   - Vérifier sitemap.xml génération
   - Google Search Console setup

3. **Analytics**
   - Google Analytics 4 ou Plausible
   - Events tracking (ajout panier, conversion)

4. **Déploiement Vercel**
   - Connecter repo GitHub
   - Configuration environnement variables
   - Test preview deploy
   - Production deploy
   - Configuration domaine custom

5. **Monitoring**
   - Vercel Analytics
   - Error tracking (Sentry optionnel)
   - Uptime monitoring

**Livrable Jour 18**: Site en production, performant, monitoré.

---

## 10. Points de Vigilance Spécifiques Next.js + BFF

### 10.1 Gestion des Images (Crucial pour MARRAKEA)

**Problème**: Les URLs d'images venant de Dolibarr peuvent être lentes ou non optimisées.

**Solution**:
- Utiliser le composant Next.js `<Image />` avec `loader` custom
- Si le BFF sert de proxy d'image, configurer le cache CDN agressivement
- Configuration `next.config.js`:
```javascript
module.exports = {
  images: {
    domains: ['api.marrakea.com', 'dolibarr.yourdomain.com'],
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    formats: ['image/webp', 'image/avif'],
  },
};
```

- Générer `blurDataUrl` côté BFF pour placeholder blur
- Lazy loading automatique avec `loading="lazy"`

### 10.2 Hydration Mismatch (Panier/localStorage)

**Problème**: Le contenu du panier est dans localStorage (client only), mais Next.js render côté serveur.

**Solution**:
```typescript
// cart-widget.tsx
'use client';

export function CartWidget() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore(state => state.totalItems);

  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate(); // Zustand hydration
  }, []);

  if (!mounted) {
    return <Badge>0</Badge>; // Server fallback
  }

  return <Badge>{totalItems}</Badge>;
}
```

### 10.3 BFF Lent = Frontend Lent

**Problème**: Si Dolibarr est lent (200-500ms), le BFF sera lent, et le Frontend aussi.

**Solution**:
- **Skeleton loaders**: Afficher immédiatement pour perception de vitesse
- **ISR (Incremental Static Regeneration)**: Pages produits statiques régénérées toutes les heures
```typescript
// app/objets/[slug]/page.tsx
export const revalidate = 3600; // 1h cache

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(p => ({ slug: p.slug }));
}
```

- **React Suspense**: Streaming SSR pour contenu dynamique
- **Prefetching**: Next/Link prefetch automatique les pages

### 10.4 Server Components vs Client Components

**Règle**: Tout est Server Component par défaut. Client Component uniquement si:
- Utilise `useState`, `useEffect`, hooks React
- Event handlers (`onClick`, `onChange`)
- Accès au `window` ou `localStorage`
- Bibliothèques client (Framer Motion, React Hook Form)

**Erreur commune**:
```typescript
// ❌ MAUVAIS - Met tout en Client Component
'use client';

export default function ProductPage({ product }) {
  return (
    <>
      <ProductGallery images={product.gallery} /> {/* Client */}
      <ProductInfo product={product} /> {/* Pas besoin Client! */}
      <ReferenceSheet data={product.referenceSheet} /> {/* Pas besoin Client! */}
    </>
  );
}
```

```typescript
// ✅ BON - Séparation Server/Client
export default function ProductPage({ product }) {
  return (
    <>
      <ProductGallery images={product.gallery} /> {/* Client Component */}
      <ProductInfo product={product} /> {/* Server Component */}
      <ReferenceSheet data={product.referenceSheet} /> {/* Server Component */}
    </>
  );
}
```

### 10.5 SEO & Metadata

**Impératif**: Chaque page publique doit avoir `generateMetadata()`.

**Template**:
```typescript
// app/objets/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  return {
    title: `${product.title} - ${product.price.formattedPrice} | MARRAKEA`,
    description: product.intro,
    openGraph: {
      title: product.title,
      description: product.intro,
      images: [
        {
          url: product.coverImage.url,
          width: 1200,
          height: 630,
          alt: product.coverImage.alt,
        },
      ],
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
```

#### 10.5.1 JSON-LD Helper Component (Recommandé)

**Problème**: `metadata.other['script:ld+json']` n'est pas toujours fiable selon la version Next.js.

**Solution**: Créer un composant helper réutilisable et l'injecter via JSX dans le composant.

**lib/utils/seo.tsx**:
```typescript
interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// Helper pour générer Product Schema.org
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
      seller: {
        '@type': 'Organization',
        name: 'MARRAKEA',
      },
    },
  };
}

// Helper pour Article Schema.org
export function generateArticleJsonLd(article: ArticleDetailDTO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage.url,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'MARRAKEA',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MARRAKEA',
      logo: {
        '@type': 'ImageObject',
        url: 'https://marrakea.com/logo.png',
      },
    },
  };
}

// Organization Schema (pour toutes les pages)
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MARRAKEA',
    url: 'https://marrakea.com',
    logo: 'https://marrakea.com/logo.png',
    sameAs: [
      'https://instagram.com/marrakea',
      'https://facebook.com/marrakea',
    ],
  };
}
```

**Usage dans page**:
```typescript
// app/objets/[slug]/page.tsx
import { JsonLd, generateProductJsonLd } from '@/lib/utils/seo';

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.slug);

  return (
    <>
      {/* JSON-LD injecté via JSX (plus fiable) */}
      <JsonLd data={generateProductJsonLd(product)} />

      <div className={styles.layout}>
        <ProductGallery images={product.gallery} />
        {/* ... */}
      </div>
    </>
  );
}
```

**Avantages**:
- ✅ Plus fiable que `metadata.other`
- ✅ Helpers réutilisables (Product, Article, Organization)
- ✅ Typage TypeScript strict avec DTOs
- ✅ Facilite les tests (validators Schema.org)

### 10.6 Performance Budget

**Objectifs**:
- **Lighthouse Score**: > 95/100 (Mobile & Desktop)
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3s
- **Bundle Size (JS)**: < 150KB (gzipped)

**Outils**:
- `@next/bundle-analyzer` pour analyser le bundle
- Vercel Analytics pour monitoring production
- Lighthouse CI pour tests automatisés

---

## 11. Timeline Estimée

**Total: 18 jours** (1 développeur frontend)

| Phase | Durée | Livrables |
|-------|-------|-----------|
| Phase 1: Fondations & Design System | 3 jours | Setup complet, UI primitives, mock data |
| Phase 2: Layout & Pages Statiques | 3 jours | Homepage + Contact SEO-ready, Lighthouse 100 |
| Phase 3: Journal | 2 jours | Pages éditoriales, SEO parfait |
| Phase 4: Catalogue & Zustand Store | 4 jours | Filtres, panier, détail produit |
| Phase 5: Checkout & Animations | 2 jours | Tunnel achat, polish UX |
| Phase 6: Connexion BFF Réel | 2 jours | Frontend connecté au BFF staging |
| Phase 7: Optimisation & Production | 2 jours | Déploiement Vercel production |

**Avec 2 développeurs**: ~11-13 jours

**Pré-requis pour Phase 6**: BFF avec endpoints `/catalog/products`, `/catalog/products/:slug`, `/blog/articles` prêts.

---

## 12. Prochaines Étapes Concrètes

### Étape 1: Définir les DTOs (Jour 1)

**Action**: Créer le fichier `types/dtos.ts` complet (voir section 6.2).

**Pourquoi d'abord**: C'est le **contrat d'interface** entre Frontend et Backend. Les deux équipes peuvent travailler en parallèle une fois ce contrat validé.

**Livrable**: Document `types/dtos.ts` validé par les deux équipes.

### Étape 2: Setup Mock Data (Jour 1)

**Action**: Créer `/lib/mock-data/products.json` avec 6 produits réalistes qui respectent le DTO `ProductDTO`.

**Exemple**:
```json
[
  {
    "id": "prod_001",
    "slug": "grand-tapis-azilal",
    "title": "Grand tapis Azilal",
    "intro": "Tapis berbère tissé main dans le Haut Atlas...",
    "price": {
      "amount": 1450,
      "currency": "EUR",
      "formattedPrice": "1 450 €"
    },
    "coverImage": {
      "url": "https://images.pexels.com/photos/11275299/pexels-photo-11275299.jpeg",
      "alt": "Grand tapis Azilal",
      "blurDataUrl": "data:image/webp;base64,..."
    },
    "availability": {
      "inStock": true,
      "label": "En stock"
    },
    "metadata": {
      "gesture": {
        "id": "gest_001",
        "name": "Tissage",
        "slug": "tissage"
      },
      "territory": {
        "id": "terr_001",
        "name": "Haut Atlas",
        "slug": "haut-atlas"
      },
      "featured": true,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
]
```

### Étape 3: Initialiser le Projet Next.js (Jour 2)

**Action**:
```bash
npx create-next-app@latest marrakea-frontend --typescript --app --src-dir
cd marrakea-frontend
npm install zustand @tanstack/react-query react-hook-form zod
```

**Configuration initiale**:
- `.env.local`: `NEXT_PUBLIC_BFF_URL=http://localhost:4000`
- `next.config.js`: Images domains
- ESLint + Prettier

### Étape 4: Commencer Phase 1 (Jours 2-3)

Suivre exactement la Phase 1 décrite dans la section 9.

---

## 13. Critères de Succès

### Fonctionnels
- ✅ Toutes les pages migrées et navigables
- ✅ Filtres et recherche fonctionnent (temps réel, sans rechargement)
- ✅ Panier persistant (localStorage)
- ✅ Galerie d'images fonctionne (carousel, thumbnails)
- ✅ Formulaire de contact valide et envoie
- ✅ Responsive parfait (mobile/tablet/desktop)

### Performance (Core Web Vitals)
- ✅ Lighthouse Score > 95/100 (Mobile & Desktop)
- ✅ FCP < 1.5s
- ✅ LCP < 2.5s
- ✅ CLS < 0.1
- ✅ TTI < 3s
- ✅ Bundle size < 150KB (gzipped)

### SEO
- ✅ Toutes les pages ont `generateMetadata()`
- ✅ OpenGraph images pour partage réseaux sociaux
- ✅ JSON-LD Schema.org (Product, Article, Organization)
- ✅ Sitemap.xml généré automatiquement
- ✅ robots.txt configuré

### Qualité Code
- ✅ 0 erreurs TypeScript
- ✅ 0 erreurs ESLint
- ✅ Tous les composants typés via DTOs
- ✅ Séparation stricte Server/Client Components
- ✅ Tests unitaires (optionnel Phase 1, requis Phase 7)

### UX/UI
- ✅ Design identique à l'original
- ✅ Animations fluides (60fps)
- ✅ Accessibilité WCAG AA
- ✅ Loading states partout (Skeleton loaders)
- ✅ Error states gracieux (BFF down, images manquantes)

### Analytics
- ✅ Events tracking configuré (voir spec ci-dessous)
- ✅ Conversion funnel complet (view → add → checkout → purchase)
- ✅ Privacy-first (RGPD compliant)

---

## 14. Analytics Events Specification

**Principe**: Le Frontend émet des events que le BFF peut logger/analyser. Utiliser Google Analytics 4 ou Plausible (privacy-first recommandé).

### Configuration

**lib/analytics.ts** (Client-side):
```typescript
'use client';

// ✅ Utiliser Plausible (privacy-first) ou GA4
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number>
) {
  if (typeof window === 'undefined') return;

  // Plausible
  if (window.plausible) {
    window.plausible(eventName, { props: params });
  }

  // OU Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Fallback: console en dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, params);
  }
}
```

### Events à Implémenter

#### 1. **view_product** (Product Detail Page Load)
**Trigger**: `app/objets/[slug]/page.tsx` mount
```typescript
useEffect(() => {
  trackEvent('view_product', {
    product_id: product.id,
    product_name: product.title,
    price: product.price.amount,
    currency: product.price.currency,
    gesture: product.metadata.gesture.slug,
    territory: product.metadata.territory.slug,
  });
}, [product.id]);
```

#### 2. **add_to_cart** (Add to Cart Button Click)
**Trigger**: `AddToCartButton` onClick success
```typescript
const handleAdd = async () => {
  // ... logique ajout
  addItem({ product, quantity });

  trackEvent('add_to_cart', {
    product_id: product.id,
    product_name: product.title,
    price: product.price.amount,
    quantity,
    value: product.price.amount * quantity,
    currency: product.price.currency,
  });

  toggleCart();
};
```

#### 3. **remove_from_cart** (Remove Item from Cart)
**Trigger**: `CartItem` remove button
```typescript
const handleRemove = () => {
  trackEvent('remove_from_cart', {
    product_id: item.product.id,
    product_name: item.product.title,
    quantity: item.quantity,
  });

  removeItem(item.product.id);
};
```

#### 4. **view_cart** (Cart Page Load)
**Trigger**: `app/panier/page.tsx` mount
```typescript
useEffect(() => {
  if (totalItems > 0) {
    trackEvent('view_cart', {
      items_count: totalItems,
      cart_value: subtotal,
      currency: 'EUR',
    });
  }
}, [totalItems]);
```

#### 5. **begin_checkout** (Checkout Button Click)
**Trigger**: `CheckoutButton` onClick avant redirect Stripe
```typescript
const handleCheckout = async () => {
  trackEvent('begin_checkout', {
    items_count: items.length,
    cart_value: items.reduce((sum, item) => sum + item.product.price.amount * item.quantity, 0),
    currency: 'EUR',
  });

  // Puis redirect Stripe
  const { checkoutUrl } = await createCheckoutSession(payload);
  window.location.href = checkoutUrl;
};
```

#### 6. **purchase** (Checkout Success PAID Confirmed)
**Trigger**: `app/panier/success/page.tsx` quand status = PAID
```typescript
useEffect(() => {
  if (data?.status === 'PAID' && !hasSentPurchaseEvent) {
    trackEvent('purchase', {
      transaction_id: data.order.orderNumber,
      value: data.order.total,
      currency: 'EUR',
      items_count: data.order.totalItems,
      // ⚠️ Ne pas envoyer email/nom (RGPD)
    });

    setHasSentPurchaseEvent(true); // Éviter double fire
  }
}, [data?.status]);
```

#### 7. **search** (Search Input Submit)
**Trigger**: `SearchInput` debounced onChange
```typescript
const debouncedSearch = useDebouncedCallback((value: string) => {
  if (value.length >= 3) {
    trackEvent('search', {
      search_term: value,
    });
  }
  setFilters({ ...filters, search: value });
}, 300);
```

#### 8. **filter_apply** (Filter Button Click)
**Trigger**: `FiltersBar` button onClick
```typescript
const handleFilterClick = (filterType: string, filterValue: string) => {
  trackEvent('filter_apply', {
    filter_type: filterType, // 'gesture' | 'territory' | 'price'
    filter_value: filterValue,
  });

  setFilters({ ...filters, [filterType]: filterValue });
};
```

### Privacy & RGPD Compliance

**Recommandations**:
- ✅ **Utiliser Plausible** (cookieless, privacy-first, hébergé EU)
- ✅ **Ne jamais tracker**: email, nom, adresse, téléphone
- ✅ **Anonymiser IPs** si GA4 utilisé
- ✅ **Cookie banner** si GA4 (obligatoire RGPD)
- ✅ **Opt-out facile** dans footer

**Variables à NE PAS logger**:
```typescript
// ❌ INTERDIT (RGPD)
trackEvent('purchase', {
  user_email: 'user@example.com', // ❌
  user_name: 'Jean Dupont',       // ❌
  user_address: '...',             // ❌
});

// ✅ OK (données agrégées/anonymes)
trackEvent('purchase', {
  transaction_id: 'ORD-12345',
  value: 1450,
  currency: 'EUR',
  items_count: 2,
});
```

---

Ce plan est conçu pour une migration méthodique qui maximise la performance SEO et les Core Web Vitals tout en préservant l'identité visuelle MARRAKEA. L'architecture Next.js + BFF garantit une séparation stricte des responsabilités et une scalabilité optimale.
