# Spec Frontend — MARRAKEA (Next.js + BFF)

## 0) Objectifs non négociables
1. **Client léger** : aucune logique métier (prix/stock/taxes) côté Front.
2. **SSR/SEO d’abord** : pages publiques en Server Components + metadata propres.
3. **Interactivité ciblée** : Client Components uniquement quand nécessaire.
4. **Contrat unique** : le Front consomme des **DTOs BFF** (`types/dtos.ts`).
5. **Performance** : images optimisées, CLS contrôlé, JS budget maîtrisé.
6. **Checkout fiable** : le Front n’“invente” jamais le paiement (webhook BFF fait foi).

## 1) Rôle du Frontend
- **UI** : rendu fidèle à l’identité minimaliste.
- **UX** : navigation fluide, filtres instantanés, tunnel d’achat Stripe.
- **Consommateur de DTOs** : données “prêtes à afficher” depuis le BFF (`api.marrakea.com`).
- **SEO** : SSR (Server Components), indexation Google.
- **Panier local brouillon** : Zustand persisté, synchronisé au checkout.

## 2) Stack technologique (verrouillée)
### Core & Build
- Next.js 14+ (App Router) : SSR, RSC, streaming, ISR
- TypeScript (strict)
- Sharp via Next/Image

### Styling
- CSS Modules + variables CSS (zéro runtime)
- Next/Font : Inter + Cormorant Garamond (self-host)

### State & Data Fetching
- Server Fetch natif Next.js (pages initiales)
- TanStack Query (interactions dynamiques)
- Zustand (panier + overlays) + Hydration Gate

### Forms & Validation
- React Hook Form + Zod

### Animations (optionnel)
- Framer Motion (drawer/transitions)

### Déploiement
- Vercel (ISR, CDN)
- Images : Vercel Image Optimization ou proxy BFF + cache

## 3) Conventions Server / Client (règles strictes)
### Règle d’or
**Tout est Server Component par défaut.**

### Passe en Client Component uniquement si
- `useState`, `useEffect`, hooks React
- event handlers (`onClick`, `onChange`, `onSubmit`)
- accès `window`, `localStorage`, `navigator`
- libs client : TanStack Query, RHF, Framer Motion
- accès store Zustand

### Erreur commune à éviter
❌ Mettre `'use client'` sur la page entière et rendre tout client par contagion.  
✅ Séparer : Gallery (client) vs Info/ReferenceSheet/ArtisanBlock (server).

## 4) Data: le Front ne “devine” rien
- Le Front affiche `formattedPrice`, `availability`, textes d’acquisition, etc. **tels que fournis** par le BFF.
- Les totaux du panier côté Front sont **indicatifs** ; le BFF recalcule tout pour le checkout.
- Pas de champs Dolibarr bruts exposés côté Front.

## 5) Sécurité Front (doit être vrai)
1. Aucune clé sensible dans le Front.
2. Checkout/session et status en `no-store`.
3. Pas de calcul de prix officiel côté Front (affichage via DTO).
4. Pas d’infos sensibles en query params.
5. Rate limiting côté BFF ; debounce côté Front.

## 6) Phase 2.2 — Homepage Parity (ISO référence)
Phase 2.2 est un **jalon de parité visuelle** : la homepage doit correspondre à une structure de référence **à l’identique** pour permettre une comparaison 1:1.  
Contraintes :
- La homepage est composée de **6 sections Server Components** rendues dans un ordre strict :  
  (1) **Hero (TitleBlock)**, (2) **Objets sélectionnés (6 cards)**, (3) **ImageBand**, (4) **Méthode (Protocole)**, (5) **Par gestes (6 cards)**, (6) **Artisanat fondé sur la confiance (3 cards)**.
- **Copy figée** : aucun rewriting / aucune “optimisation éditoriale” pendant ce jalon.
- **Images figées** : utiliser les **URLs imposées** (Pexels) pour comparer les rendus.
- **Présentational only** : pas de `'use client'`, pas de hooks, pas de state, pas de TanStack Query/Zustand, pas de refactor des autres pages.
- **CSS isolée Home** : modifications limitées aux CSS Modules des sections home ; pas de nouvelle palette globale.

## 7) Catalog Filtering (/objets)

### Unified Controls Bar (Phase 6.1 + 6.2 + 6.3)
The `/objets` page features a **single sticky controls bar** that integrates gesture filtering, search, and sorting. **No separate hero/title section** — the page starts directly with the controls.

**UI Layout (Phase 6.3):**
- **No hero section**: Removed dedicated header/intro block
- **Single sticky bar** below global site header containing:
  1. Gesture filter section: "Par geste" label + filter buttons
  2. Right controls group:
     - Search input (minimal, underline-focused design)
     - Sort widget (compact with icon + native select)
- **Results count**: Positioned **below** the sticky controls bar, above the product grid
- **Background**: `--color-background`
- **Border**: Bottom border with `--color-border`
- **Search input**: Transparent background, bottom border (2px), accent underline on focus
- **Sort widget**: Icon (ArrowUpDown from lucide-react) + "Trier" label + minimal bordered select

**Gesture Filtering (Phase 6.1):**
- **Filter buttons**: "Tous les objets" (all) + one per gesture from `GestureDTO[]`
- **Active state**: Underline with accent color, hover shows border underline

**Search (Phase 6.2):**
- **Input**: Filters products by title and intro text
- **Real-time**: Updates as user types

**Sorting (Phase 6.3):**
- **Client-side sorting**: Applied after filters (gesture + search)
- **Sort options**:
  - "Par défaut" (default order)
  - "Prix : croissant" (price ascending)
  - "Prix : décroissant" (price descending)
  - "Nom : A → Z" (name A-Z)
  - "Nom : Z → A" (name Z-A)
- **Implementation**: Uses `ProductDTO.price.amount` (numeric) for price sorting, `localeCompare('fr')` for name sorting
- **Icon**: ArrowUpDown from lucide-react package

**Results Count (Phase 6.3):**
- **Position**: Below sticky controls bar, above product grid
- **Format**: "X objet" / "X objets" (updates with filters/search)
- **Styling**: Small secondary text, left-aligned with grid

**Data Flow:**
- Gestures loaded from `GET /catalog/gestures` endpoint (or derived from `mockGestures` in mock mode)
- Each product's `gesture` field (type: `GestureDTO | undefined`) determines its category
- Products without a gesture are shown only in "Tous les objets" view

**URL Parameter:**
- Query param: `?geste={slug}` (e.g., `?geste=tissage`)
- Query param: `?sort={value}` (e.g., `?sort=price_asc`, omitted if "default")
- Default (no params): Shows all products in default order
- URL updates on filter/sort change without page reload
- Page state restored from URL on refresh/share

**Filtering & Sorting Logic:**
- Filters compose: search + gesture filters apply together (AND logic)
- Sort applies client-side AFTER filters
- When gesture filter changes, pagination resets to page 1
- Changing sort does not affect count (only order)

**Technical Implementation:**
- Server Component: `/objets/page.tsx` fetches gestures via `getGestures()` (no hero markup)
- Client Component: `CatalogControlsBar` handles unified UI (gesture filters + search + sort widget)
- Client Component: `CatalogClient` orchestrates TanStack Query filters, client-side sorting, and state sync

## 8) Critères de succès
- Fonctionnels : navigation, catalogue filtrable (search + gesture + sort), panier persistant, galerie, contact, responsive.
- Performance : CWV conformes, JS budget maîtrisé.
- SEO : metadata + OG + JSON-LD + sitemap/robots.
- Qualité code : TS strict OK, ESLint OK, DTOs partout, séparation Server/Client.
- Phase 2.2 : homepage **ISO** (ordre sections + copy + images) et modifications **home-only**.

