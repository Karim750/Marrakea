# Architecture Frontend — Next.js (App Router) + BFF

## 1) Principe global
Dolibarr → BFF (`api.marrakea.com`) → Front Next.js (DTOs stricts).  
Le Front est un **dumb client** : rendu UI + interactions, **pas de logique métier** (prix/stock/taxes).

## 2) Structure des dossiers (spec finale)
```txt
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── objets/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       ├── opengraph-image.tsx
│   │       └── loading.tsx
│   ├── journal/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── opengraph-image.tsx
│   ├── contact/
│   │   └── page.tsx
│   └── panier/
│       ├── page.tsx
│       ├── success/page.tsx
│       └── cancel/page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
│       ├── home/
│       ├── catalog/
│       │   ├── CatalogClient.tsx (Client)
│       │   ├── CatalogControlsBar.tsx (Client - Phase 6.2)
│       │   └── *.module.css
│       ├── product/
│       ├── journal/
│       └── cart/
├── lib/
│   ├── api/
│   │   ├── client.server.ts
│   │   ├── client.client.ts
│   │   ├── products.ts
│   │   ├── articles.ts
│   │   └── checkout.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── seo.tsx
│   └── validations/
│       └── schemas.ts
├── types/
│   └── dtos.ts
├── stores/
│   └── cart-store.ts
└── styles/
    ├── globals.css
    └── fonts.ts
3) Justifications structurantes
Séparation Server/Client : Server Components = 0KB JS client.

Deux clients API : policies de cache distinctes (ISR vs no-store).

Feature folders : composants + UI logic colocalisés par domaine.

Cart & Checkout : flow isolé (session + polling status).

DTOs stricts : contrat unique Front ↔ BFF (types/dtos.ts).

**Catalog filtering & sorting (Phase 6.3):**
- `CatalogControlsBar` (Client Component): Unified sticky controls bar - gesture filters + search input + sort widget
  - Sort widget uses ArrowUpDown icon from lucide-react
  - Native select for accessibility and simplicity
- `CatalogClient` (Client Component): Orchestrates TanStack Query filters, client-side sorting (useMemo), syncs URL params to state
  - Client-side sorting applied AFTER filters using `sortProducts()` helper
  - Supports price (numeric) and name (localeCompare) sorting
  - Results count moved below controls bar, above grid
- `/objets/page.tsx` (Server): No hero section, fetches gestures via `getGestures()` and directly renders CatalogClient
- URL params: `?geste={slug}` and `?sort={value}` enable shareable filtered/sorted views
- Single sticky bar below header integrates all catalog controls (gesture filtering, search, and sorting)

4) Homepage composition rule (Phase 2.2 parity)
Objectif Phase 2.2 : parité visuelle déterministe (comparaison 1:1), donc architecture stricte.

src/app/page.tsx doit rester un fichier de composition (aucun gros markup inline).

La homepage est rendue via 6 Server Components dans src/components/features/home/*, dans cet ordre strict :

TitleBlock (Hero)

ObjectsSection (grid 6 cartes)

ImageBand

MethodSection

GesturesSection

TrustSection

Chaque section a son CSS Module co-localisé (ex: title-block.module.css).

Phase 2.2 = presentational only :

pas de 'use client', pas de hooks, pas de state

pas de TanStack Query, pas de Zustand

pas de refactor global (uniquement home + CSS home si nécessaire)

5) Data fetching : 2 clients API obligatoires
lib/api/client.server.ts (Server Components)
Utilise BFF_URL (non public).

Supporte next.revalidate et tags (ISR, revalidation on-demand).

lib/api/client.client.ts (Client Components)
Utilise NEXT_PUBLIC_BFF_URL (public).

cache: 'no-store' par défaut sur données critiques.

credentials: 'include' si cookies/session.

6) Features clés (responsabilités)
Layout
app/layout.tsx (Server) : fonts, providers, header/footer.

Header hybride : structure Server + widgets Client (panier, recherche si besoin).

Catalogue /objets
page Server : fetch initial + SSR/ISR.

CatalogView Client : filtres, query, sync URL.

Produit /objets/[slug]
page Server : fetch + metadata + sections Server.

Gallery Client : carousel.

Add-to-cart Client : Zustand + (option) stock check.

Journal
listing + détail : Server-only (SEO first).

Contact
form Client : RHF + Zod, POST direct BFF.

7) Images
Next/Image obligatoire.

blurDataUrl généré côté BFF recommandé.

images.domains configuré dans next.config.js.

8) Documents de référence
DTOs : docs/dtos.md (contrat BFF ↔ Front)

SEO : docs/seo.md

Checkout : docs/checkout.md

Phases : docs/phases.md

