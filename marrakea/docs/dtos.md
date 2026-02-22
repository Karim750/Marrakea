
---

## `docs/dtos.md`

```md
# DTOs — Contrat BFF ↔ Front (source de vérité)

## 1) Règles de contrat
- Le Front consomme **uniquement** des DTOs.
- Aucun champ Dolibarr brut exposé (`rowid`, `fk_*`, `entity`, etc. interdits).
- Les champs d’affichage (ex `formattedPrice`) sont préparés par le BFF.

## 2) Fichier canonique
- `types/dtos.ts`

## 3) DTOs (référence)
> Copier/coller ici le bloc complet des DTOs validés :
- `ProductDTO`
- `ProductDetailDTO`
- `ImageDTO`
- `ArtisanDTO`
- `ArticleDTO`
- `ArticleDetailDTO`
- `GestureDTO`, `TerritoryDTO`, `FilterParams`
- `ApiResponse<T>`, `PaginatedResponse<T>`
- `CartItemDTO`, `CartDTO`

### Champs critiques (à respecter)
- `ProductDTO.price.formattedPrice` : affichage officiel
- `ProductDTO.availability` :
  - `purchaseMode`: `unique | quantity | preorder`
  - `maxQuantity` : seulement si `quantity`
  - `label` : texte UI source de vérité
- `ProductDTO.gesture?: GestureDTO` (Phase 6.1)
  - Used for category filtering on `/objets`
  - Property: `gesture.slug` (string) matches URL param `?geste={slug}`
  - Products without gesture shown only in "Tous les objets" view
- `ProductDetailDTO.acquisition` : contenu "acquisition" prêt à afficher
- `CartDTO.totals.formattedTotal` : total officiel (si/ quand BFF renvoie un cart recalculé)

### GestureDTO Structure (Phase 6.1)
```typescript
interface GestureDTO {
  id: string;        // Unique identifier
  name: string;      // Display name (e.g., "Tissage", "Poterie")
  slug: string;      // URL-safe slug (e.g., "tissage", "poterie")
}
```

**Allowed gesture values** (from mock data, BFF may differ):
- `poterie` - Poterie
- `tissage` - Tissage
- `zellige` - Zellige
- `dinanderie` - Dinanderie

**URL Parameter**: `?geste={slug}` (e.g., `/objets?geste=tissage`)

## 4) Fonctions API (mapping DTOs)
### `lib/api/products.ts`
- `getProducts(params?: FilterParams): PaginatedResponse<ProductDTO>`
  - Supports filtering by `gesture` param (slug string, e.g., "tissage")
- `getProduct(slug: string): ProductDetailDTO | null`
  - Returns null for 404s to trigger not-found page
- `getFeaturedProducts(): ProductDTO[]`
- `checkStock(productId: string): { inStock: boolean }`
- `getGestures(): GestureDTO[]` (Phase 6.1)
  - Returns list of available gestures for catalog filtering

### `lib/api/articles.ts`
- `getArticles(...)`: `PaginatedResponse<ArticleDTO>`
- `getArticle(slug)`: `ArticleDetailDTO`

## 5) Validation runtime (recommandée)
- Zod schemas pour DTOs critiques (checkout status, forms, etc.)
- Échec validation => UI d’erreur gracieuse + logs

