
---

## `docs/phases.md`

```md
# Phases de migration — J1 → J18

## Phase 1 (J1–J3) — Fondations & Design System
- Setup Next.js + ESLint/Prettier + TS strict
- Migration CSS variables + fonts (Next/Font)
- Création DTOs (`types/dtos.ts`) + mock data (produits/articles)
- UI primitives (button/input/badge/skeleton/image)
- API layer (mockable)
Livrable : projet configuré + primitives + mock

## Phase 2 (J4–J6) — Layout & pages statiques
- Root layout (fonts, metadata base, providers, header/footer)
- Header hybride (server structure + client widget)
- Home + Contact (SEO + perf)
- Lighthouse target 100 (ou proche)
Livrable : vitrine navigable, SEO-ready

## Phase 3 (J7–J8) — Journal
- Listing + Article detail (Server)
- OG images + JSON-LD + sitemap/robots
Livrable : journal complet

## Phase 4 (J9–J12) — Catalogue & panier
- Zustand store + hydration gate + drawer
- /objets : SSR initial + filtres TanStack Query + URL sync
- /objets/[slug] : gallery client + infos server + add-to-cart client
- metadata + JSON-LD + OG image
Livrable : core e-commerce fonctionnel

## Phase 5 (J13–J14) — Checkout & polish
- /panier : CRUD items + summary
- checkout redirect
- success/cancel + loading/error states + animations
Livrable : tunnel complet (mock)

## Phase 6 (J15–J16) — Connexion BFF réel
- env staging + CORS
- mock → fetch réel
- E2E (catalogue, images, filtres, stock, checkout)
- erreurs gracieuses (BFF down, images missing, timeouts)
Livrable : connecté staging

## Phase 7 (J17–J18) — Optimisation & production
- Bundle analysis + perf fixes + CWV
- SEO final (GSC, OG tests)
- Analytics (Plausible/GA4) + events funnel
- Vercel deploy + monitoring (Vercel Analytics, Sentry optionnel)
Livrable : production

## Prérequis pour Phase 6
- Endpoints BFF : `/catalog/products`, `/catalog/products/:slug`, `/blog/articles`, checkout endpoints prêts

