# API Specification — MARRAKEA BFF (Revised v1)

## Introduction

Ce document spécifie toutes les API calls requises par le frontend Next.js MARRAKEA. Le BFF (Backend-For-Frontend) doit implémenter ces endpoints pour servir le frontend en agrégeant les données de **Strapi** (éditorial/discovery) et **Medusa** (commerce/transactions).

**URL de base:** `api.marrakea.com` (ou `NEXT_PUBLIC_BFF_URL` en développement)

**Architecture:**
- **Strapi** = Source de vérité éditorial (produits, catégories, articles, artisans, territoires)
- **Medusa** = Source de vérité commerce (variants, prix, stock, checkout, orders)
- **BFF** = Couche d'agrégation DTO (fusionne Strapi + Medusa, expose un contrat unique au frontend)

**Principes:**
- Toutes les réponses doivent retourner des DTOs (Data Transfer Objects) tel que définis dans `types/dtos.ts`
- Le BFF est responsable de toute la logique métier (prix, stock, taxes)
- Le frontend ne fait que consommer et afficher les données
- Pas de champs Strapi/Medusa bruts exposés au frontend

---

## 1. Catalog — Products

### 1.1 List Products (Paginated)

**Endpoint:** `GET /catalog/products`

**Description:** Récupère une liste paginée de produits avec filtres optionnels.

**Query Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `page` | integer | Non | Numéro de page (défaut: 1) |
| `limit` | integer | Non | Nombre d'items par page (défaut: 12) |
| `search` | string | Non | Recherche textuelle (title, intro) |
| `gesture` | string | Non | Filtrer par geste (slug) |
| `territory` | string | Non | Filtrer par territoire (slug) |
| `sort` | string | Non | Tri: `newest`, `name_asc` |

**Pourquoi (alignement archi):**
- `price_asc/price_desc` **supprimés** en v1 : Strapi pilote la pagination, pas de colonne `price` indexée. Retourner `400 UNSUPPORTED_SORT` si demandé. Pour v2 : implémenter cached_price dans Strapi ou search index dédié.
- Tri client-side (frontend) pour prix dans phase actuelle (Phase 6.3).

**Response:** `PaginatedResponse<ProductDTO>`

```typescript
{
  "data": [
    {
      "id": "1",  // Strapi numeric ID (stringified)
      "slug": "vase-terre-rouge",
      "title": "Vase en terre rouge",
      "intro": "Vase artisanal façonné à la main...",
      "coverImage": {
        "url": "https://cdn.marrakea.com/uploads/vase_001_abc123.jpg",
        "alt": "Vase en terre rouge",
        "width": 800,
        "height": 1000,
        "blurDataUrl": "data:image/jpeg;base64,..." // optionnel
      },
      "price": {
        "amount": 120.00,
        "currency": "EUR",
        "formattedPrice": "120,00 €"
      },
      "availability": {
        "inStock": true,
        "purchaseMode": "unique",
        "label": "Pièce unique"
      },
      "gesture": {
        "id": "2",
        "name": "Poterie",
        "slug": "poterie"
      },
      "territory": {
        "id": "5",
        "name": "Safi",
        "slug": "safi"
      },
      "defaultVariantId": "variant_01JCQK..." // Medusa variant ID (requis pour checkout)
    }
    // ... autres produits
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

**Pourquoi (alignement archi):**
- IDs: Strapi retourne des entiers. Le BFF DOIT les stringifier (`String(id)`) pour cohérence DTO.
- `defaultVariantId`: ajouté (optionnel v1, recommandé) pour éviter N+1 en checkout. Le BFF map `product.strapi_id` → `variant.medusa_product_id` pour récupérer le variant par défaut.
- `price.*`: Le BFF DOIT interroger Medusa `calculated_price` (avec region/customer context si applicable). Si `calculated_price` est null, fallback sur `variant.prices[0].amount` ou retourner erreur 500 (config Medusa manquante). Le frontend attend toujours `price.amount` non-null.

**Revalidation:** 60 secondes (ISR)

**Cache Tags:** `['products']`

**Notes:**
- Le tri `newest` retourne les produits du plus récent au plus ancien (Strapi `createdAt DESC`)
- Le BFF doit gérer la pagination côté serveur (Strapi pagination)
- Les filtres s'appliquent avec logique AND (search + gesture + territory)
- Le `formattedPrice` doit être formaté selon la locale française (ex: "120,00 €")
- Si `sort=price_asc` ou `sort=price_desc` reçu, retourner `400 Bad Request` avec code `UNSUPPORTED_SORT` et message explicite

**Error Response (400 - Unsupported Sort):**

```typescript
{
  "error": "Price sorting not supported in v1. Use client-side sorting.",
  "code": "UNSUPPORTED_SORT",
  "supportedValues": ["newest", "name_asc"]
}
```

---

### 1.2 Get Product Detail

**Endpoint:** `GET /catalog/products/{slug}`

**Description:** Récupère les détails complets d'un produit par son slug.

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `slug` | string | Oui | Slug unique du produit (Strapi) |

**Response:** `ProductDetailDTO`

```typescript
{
  "id": "1",
  "slug": "vase-terre-rouge",
  "title": "Vase en terre rouge",
  "intro": "Vase artisanal façonné à la main...",
  "coverImage": {
    "url": "https://cdn.marrakea.com/uploads/vase_001_abc123.jpg",
    "alt": "Vase en terre rouge",
    "width": 800,
    "height": 1000,
    "blurDataUrl": "data:image/jpeg;base64,..."
  },
  "images": [
    {
      "url": "https://cdn.marrakea.com/uploads/vase_001_2_def456.jpg",
      "alt": "Vase en terre rouge - vue de côté",
      "width": 800,
      "height": 1000
    },
    {
      "url": "https://cdn.marrakea.com/uploads/vase_001_3_ghi789.jpg",
      "alt": "Vase en terre rouge - détail",
      "width": 800,
      "height": 1000
    }
  ],
  "price": {
    "amount": 120.00,
    "currency": "EUR",
    "formattedPrice": "120,00 €"
  },
  "availability": {
    "inStock": true,
    "purchaseMode": "unique",
    "label": "Pièce unique"
  },
  "description": "<p>Ce vase en terre rouge est façonné à la main...</p>",
  "dimensions": "H 35cm × Ø 18cm",
  "materials": ["Terre rouge de Safi", "Engobe naturel"],
  "gesture": {
    "id": "2",
    "name": "Poterie",
    "slug": "poterie"
  },
  "territory": {
    "id": "5",
    "name": "Safi",
    "slug": "safi"
  },
  "artisan": {
    "id": "3",
    "name": "Hassan El Fassi",
    "bio": "Maître potier depuis 30 ans...",
    "portrait": {
      "url": "https://cdn.marrakea.com/uploads/hassan_portrait_jkl012.jpg",
      "alt": "Hassan El Fassi",
      "width": 200,
      "height": 200
    },
    "territory": {
      "id": "5",
      "name": "Safi",
      "slug": "safi"
    },
    "workshopLocation": "Quartier des potiers, Safi",
    "specialty": "Poterie traditionnelle",
    "yearsExperience": "30 ans",
    "transmissionMode": "Transmission familiale",
    "equipment": "Tour de potier traditionnel"
  },
  "acquisition": "Pièce unique. Expédition sous 3-5 jours ouvrés.",
  "referenceSheet": {
    "Hauteur": "35 cm",
    "Diamètre": "18 cm",
    "Poids": "1,2 kg",
    "Matière": "Terre rouge",
    "Origine": "Safi, Maroc"
  },
  "defaultVariantId": "variant_01JCQK..."
}
```

**Pourquoi (alignement archi):**
- Même logique IDs stringifiés que 1.1
- `defaultVariantId` présent pour checkout direct
- Prix/stock via Medusa (même logique qu'en 1.1)

**Error Response (404):**

```typescript
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Revalidation:** 60 secondes (ISR)

**Cache Tags:** `['products', 'product-{slug}']`

**Notes:**
- Retourner 404 si le produit n'existe pas dans Strapi (le frontend gère le not-found)
- `description` peut contenir du HTML (sanitisé côté BFF ou Strapi)
- `images` ne contient QUE les images secondaires (la coverImage n'est PAS dans ce tableau)
- Tous les champs optionnels peuvent être `null` ou absents

---

### 1.3 Get Featured Products

**Endpoint:** `GET /catalog/products/featured`

**Description:** Récupère une liste de produits mis en avant pour la homepage.

**Query Parameters:** Aucun

**Response:** `ProductDTO[]`

```typescript
[
  {
    "id": "1",
    "slug": "vase-terre-rouge",
    "title": "Vase en terre rouge",
    "defaultVariantId": "variant_01JCQK...",
    // ... tous les champs ProductDTO
  },
  {
    "id": "7",
    "slug": "tapis-beni-ouarain",
    "title": "Tapis Beni Ouarain",
    "defaultVariantId": "variant_01JCQL...",
    // ...
  }
  // Maximum 6 produits recommandé
]
```

**Pourquoi (alignement archi):**
- Logique de sélection : champ `featured: true` dans Strapi (boolean) + tri par date ou score éditorial.
- Privilégier les produits en stock (via Medusa `inventory_quantity > 0`).

**Revalidation:** 300 secondes (5 minutes, ISR)

**Cache Tags:** `['products', 'featured']`

**Notes:**
- Logique de sélection des produits featured côté BFF (agrégation Strapi + Medusa stock)
- Recommandé: retourner 4-6 produits maximum
- Privilégier les produits en stock

---

### 1.4 Check Product Stock

**Endpoint:** `GET /catalog/products/{productId}/stock`

**Description:** Vérifie la disponibilité en stock d'un produit (appel client-side).

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `productId` | string | Oui | ID Strapi du produit (stringified) |

**Pourquoi (alignement archi):**
- Le BFF map `productId (Strapi)` → `variant.medusa_product_id` → interroge Medusa `GET /store/variants/{variant_id}` pour `inventory_quantity`.
- Si `manage_inventory = false` dans Medusa, toujours retourner `inStock: true`.

**Response:**

```typescript
{
  "inStock": true
}
```

**Cache:** `no-store` (jamais caché, toujours fresh)

**Notes:**
- Utilisé avant d'ajouter au panier pour vérifier la disponibilité
- Appel client-side (via `clientFetch`)
- Doit retourner l'état en temps réel depuis Medusa (inventory)

---

### 1.5 Get Gestures (Categories)

**Endpoint:** `GET /catalog/gestures`

**Description:** Récupère la liste de tous les gestes artisanaux (catégories).

**Query Parameters:** Aucun

**Response:** `GestureDTO[]`

```typescript
[
  {
    "id": "2",
    "name": "Poterie",
    "slug": "poterie"
  },
  {
    "id": "4",
    "name": "Tissage",
    "slug": "tissage"
  },
  {
    "id": "6",
    "name": "Dinanderie",
    "slug": "dinanderie"
  },
  {
    "id": "8",
    "name": "Tournage",
    "slug": "tournage"
  },
  {
    "id": "10",
    "name": "Tannage",
    "slug": "tannage"
  },
  {
    "id": "12",
    "name": "Menuiserie",
    "slug": "menuiserie"
  },
  {
    "id": "14",
    "name": "Vannerie",
    "slug": "vannerie"
  }
]
```

**Pourquoi (alignement archi):**
- IDs numériques Strapi stringifiés (ex: `"2"` au lieu de `"gest_001"`).
- Source: Strapi collection `gestures` ou équivalent.

**Revalidation:** 3600 secondes (1 heure, ISR)

**Cache Tags:** `['gestures']`

**Notes:**
- Liste stable, change rarement
- Utilisé pour les filtres sur `/objets`
- Ordre alphabétique recommandé (tri côté BFF ou Strapi)

---

## 2. Blog — Articles

### 2.1 List Articles (Paginated)

**Endpoint:** `GET /blog/articles`

**Description:** Récupère une liste paginée d'articles de blog.

**Query Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `page` | integer | Non | Numéro de page (défaut: 1) |
| `limit` | integer | Non | Nombre d'items par page (défaut: 10) |
| `category` | string | Non | Filtrer par catégorie |

**Response:** `PaginatedResponse<ArticleDTO>`

```typescript
{
  "data": [
    {
      "id": "15",
      "slug": "poterie-safi-heritage",
      "title": "La poterie de Safi : un héritage ancestral",
      "excerpt": "Découvrez l'histoire fascinante de la poterie de Safi...",
      "coverImage": {
        "url": "https://cdn.marrakea.com/uploads/blog_poterie_mno345.jpg",
        "alt": "Atelier de poterie à Safi",
        "width": 1200,
        "height": 800
      },
      "publishedAt": "2024-01-15T10:00:00Z",
      "category": "Savoir-faire",
      "author": {
        "name": "Sarah Bennani",
        "avatar": {
          "url": "https://cdn.marrakea.com/uploads/sarah_avatar_pqr678.jpg",
          "alt": "Sarah Bennani",
          "width": 100,
          "height": 100
        }
      }
    }
    // ... autres articles
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3
  }
}
```

**Pourquoi (alignement archi):**
- Source: Strapi collection `articles` (ou `blog-posts`).
- IDs numériques stringifiés.

**Revalidation:** 120 secondes (2 minutes, ISR)

**Cache Tags:** `['articles']`

**Notes:**
- Articles triés par date de publication (plus récent en premier) : Strapi `publishedAt DESC`
- `publishedAt` au format ISO 8601

---

### 2.2 Get Article Detail

**Endpoint:** `GET /blog/articles/{slug}`

**Description:** Récupère les détails complets d'un article par son slug.

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `slug` | string | Oui | Slug unique de l'article (Strapi) |

**Response:** `ArticleDetailDTO`

```typescript
{
  "id": "15",
  "slug": "poterie-safi-heritage",
  "title": "La poterie de Safi : un héritage ancestral",
  "excerpt": "Découvrez l'histoire fascinante de la poterie de Safi...",
  "coverImage": {
    "url": "https://cdn.marrakea.com/uploads/blog_poterie_mno345.jpg",
    "alt": "Atelier de poterie à Safi",
    "width": 1200,
    "height": 800
  },
  "publishedAt": "2024-01-15T10:00:00Z",
  "category": "Savoir-faire",
  "author": {
    "name": "Sarah Bennani",
    "avatar": {
      "url": "https://cdn.marrakea.com/uploads/sarah_avatar_pqr678.jpg",
      "alt": "Sarah Bennani",
      "width": 100,
      "height": 100
    }
  },
  "content": "<article><p>La poterie de Safi est un art...</p><h2>Histoire</h2><p>...</p></article>",
  "images": [
    {
      "url": "https://cdn.marrakea.com/uploads/blog_detail_1_stu901.jpg",
      "alt": "Détail technique de tournage",
      "width": 800,
      "height": 600
    }
  ],
  "relatedProducts": [
    {
      "id": "1",
      "slug": "vase-terre-rouge",
      "title": "Vase en terre rouge",
      "defaultVariantId": "variant_01JCQK...",
      // ... ProductDTO complet
    }
  ]
}
```

**Pourquoi (alignement archi):**
- `relatedProducts` : relation Strapi `article → products` (array). Le BFF enrichit avec prix/stock Medusa.

**Revalidation:** 120 secondes (2 minutes, ISR)

**Cache Tags:** `['articles', 'article-{slug}']`

**Notes:**
- `content` peut contenir du HTML riche (sanitisé côté BFF ou Strapi)
- `relatedProducts` optionnel, max 3-4 produits recommandé

---

## 3. Checkout — Payment

### 3.1 Create Checkout Session

**Endpoint:** `POST /checkout/session`

**Description:** Crée un panier Medusa, initialise une session de paiement Stripe (via Medusa Payment Provider), et retourne l'URL de checkout.

**Request Body:** `CheckoutPayloadItem[]`

```typescript
[
  {
    "productId": "1",  // Strapi product ID
    "quantity": 1
  },
  {
    "productId": "7",
    "quantity": 2
  }
]
```

**Pourquoi (alignement archi):**
- `productId` = Strapi ID (string). Le BFF map vers Medusa `variant_id` via `defaultVariantId` ou lookup table.
- Le BFF doit :
  1. Créer un cart Medusa (`POST /store/carts`)
  2. Ajouter les line items (`POST /store/carts/{cart_id}/line-items`) avec les `variant_id`
  3. Initialiser le payment session (`POST /store/carts/{cart_id}/payment-sessions`)
  4. Retourner l'URL Stripe Checkout (via Medusa `cart.payment_session.data.client_secret` ou Hosted Checkout URL selon config)
- Le BFF stocke un mapping `cart_id ↔ session_id` (Stripe) dans une table temporaire (24h TTL) pour le polling status.

**Response:** `CheckoutSessionDTO`

```typescript
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "cartId": "cart_01JCQM..."  // Medusa cart ID (ajouté pour référence)
}
```

**Pourquoi (alignement archi):**
- Ajout de `cartId` (optionnel mais recommandé) : permet au frontend de tracker le panier si besoin. Non utilisé en v1 (le frontend suit `session_id` seulement), mais utile pour migration v2 (voir section Compatibilité).

**Error Responses:**

```typescript
// 400 - Invalid request
{
  "error": "Invalid product quantity",
  "code": "INVALID_QUANTITY"
}

// 404 - Product not found
{
  "error": "Product not found in catalog",
  "code": "PRODUCT_NOT_FOUND",
  "productId": "999"
}

// 404 - Variant not found
{
  "error": "No variant found for product",
  "code": "VARIANT_NOT_FOUND",
  "productId": "1"
}

// 409 - Out of stock
{
  "error": "Product out of stock",
  "code": "OUT_OF_STOCK",
  "productId": "1",
  "availableQuantity": 0
}
```

**Cache:** `no-store` (jamais caché)

**Credentials:** `include` (pour les cookies de session Medusa si applicable)

**Notes:**
- Le BFF crée un cart Medusa avec tous les détails (variants, région, customer optionnel)
- Le BFF initialise la session de paiement Stripe via Medusa Payment Provider
- Le frontend redirige l'utilisateur vers `checkoutUrl`
- Le BFF doit valider la disponibilité et les quantités (via Medusa inventory)
- Le BFF calcule le prix final via Medusa (jamais le frontend)
- Stripe webhooks gèrent la confirmation de paiement → Medusa complete cart → order créé

---

### 3.2 Get Checkout Status

**Endpoint:** `GET /checkout/status`

**Description:** Récupère le statut d'une session de checkout après retour de Stripe (polling).

**Query Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `session_id` | string | Oui | ID de session Stripe (Hosted Checkout) |

**Pourquoi (alignement archi):**
- Le contract frontend actuel utilise `session_id` (Stripe Checkout Session ID).
- Le BFF DOIT maintenir une table de mapping : `session_id → cart_id (Medusa)`.
- Workflow :
  1. Frontend envoie `session_id`
  2. BFF lookup `cart_id` depuis la table mapping
  3. BFF interroge Medusa `GET /store/carts/{cart_id}` pour vérifier `cart.payment_status` et `cart.completed_at`
  4. Si `completed_at` existe → cart converti en order → statut `PAID`, récupérer `order_id`
- Alternative recommandée v2 : migrer vers `cart_id` directement (voir section Compatibilité).

**Response:** `CheckoutStatusDTO`

```typescript
{
  "status": "PAID",
  "orderId": "order_01JCQN..."  // Medusa order ID
}
```

**Statuts possibles:**
- `DRAFT`: Cart créé, paiement non initié (Medusa `payment_status = null`)
- `LOCKED`: Paiement en cours (Stripe session active, Medusa `payment_status = awaiting`)
- `PAID`: Paiement confirmé via webhook, cart complété (Medusa `completed_at` set, order créé)
- `CANCELLED`: Session annulée par l'utilisateur (Stripe session expired/cancelled)
- `EXPIRED`: Session expirée (24h, Stripe + Medusa cart TTL)
- `FAILED`: Échec du paiement (Stripe payment_intent failed)

**Pourquoi (alignement archi):**
- Statuts mappés depuis Medusa `cart.payment_status` + `completed_at` + Stripe session status.
- Le BFF doit gérer la correspondance Stripe status → statuts frontend.

**Cache:** `no-store` (jamais caché)

**Notes:**
- Utilisé pour polling sur la page `/panier/success`
- Le statut `PAID` est mis à jour via Stripe webhook → Medusa webhook handler → cart completion
- Le frontend poll toutes les 2 secondes jusqu'à `PAID` ou timeout (60s recommandé)
- Le BFF doit nettoyer la table de mapping après 24h ou après statut final (`PAID`, `CANCELLED`, `EXPIRED`, `FAILED`)

---

## 4. Contact — Form Submission

### 4.1 Submit Contact Form

**Endpoint:** `POST /contact`

**Description:** Envoie un message via le formulaire de contact.

**Request Body:** `ContactFormDTO`

```typescript
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "subject": "Question sur un produit",
  "message": "Bonjour, j'aimerais en savoir plus sur le vase en terre rouge..."
}
```

**Response:** `200 OK`

```typescript
{
  "success": true,
  "message": "Message envoyé avec succès"
}
```

**Error Responses:**

```typescript
// 400 - Invalid data
{
  "error": "Invalid email format",
  "code": "INVALID_EMAIL"
}

// 429 - Rate limit
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

**Cache:** `no-store`

**Notes:**
- Le BFF doit valider les données (email, longueur, etc.)
- Implémenter rate limiting (ex: 3 messages max par IP par heure)
- Protection anti-spam (honeypot, captcha optionnel)
- Envoi du message (email SMTP, Strapi notification, CRM) géré côté BFF

---

## 5. Routes API Frontend (Next.js API Routes)

Le frontend expose une route API Next.js pour le client-side fetching.

### 5.1 Products Proxy

**Endpoint:** `GET /api/products`

**Description:** Route proxy Next.js pour le client-side fetching (utilisé par TanStack Query).

**Query Parameters:** Identiques à `/catalog/products` (voir section 1.1)

**Response:** Identique à `/catalog/products`

**Implementation:**
```typescript
// src/app/api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Validation: rejeter price_asc/price_desc
  const sort = searchParams.get('sort');
  if (sort && ['price_asc', 'price_desc'].includes(sort)) {
    return Response.json(
      { error: 'Price sorting not supported', code: 'UNSUPPORTED_SORT' },
      { status: 400 }
    );
  }

  // Appel au BFF via clientFetch
  const products = await fetch(`${BFF_URL}/catalog/products?${searchParams}`);
  return Response.json(await products.json());
}
```

**Notes:**
- Cette route est un simple proxy vers le BFF
- Utilisée pour le client-side fetching (filtres dynamiques, pagination)
- Cache géré par TanStack Query côté client
- Validation additionnelle côté frontend pour rejeter sorts non supportés

---

## 6. Error Handling

Tous les endpoints doivent suivre le format d'erreur standard:

### Error Response Format

```typescript
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // optionnel, informations supplémentaires
}
```

### HTTP Status Codes

| Code | Utilisation |
|------|-------------|
| `200` | Success |
| `201` | Created (cart/checkout session) |
| `400` | Bad Request (validation error, unsupported sort) |
| `404` | Not Found (product, article, variant) |
| `409` | Conflict (out of stock) |
| `429` | Too Many Requests (rate limiting) |
| `500` | Internal Server Error |
| `502` | Bad Gateway (Strapi/Medusa unavailable) |
| `503` | Service Unavailable (maintenance) |

---

## 7. Performance & Caching

### ISR (Incremental Static Regeneration)

Le frontend utilise ISR pour la plupart des pages. Le BFF doit supporter:

**Revalidation Times:**
- Products list: 60 secondes
- Product detail: 60 secondes
- Featured products: 300 secondes
- Gestures: 3600 secondes
- Articles list: 120 secondes
- Article detail: 120 secondes

**Cache Tags:**
Le frontend utilise Next.js cache tags pour la revalidation on-demand. Le BFF peut déclencher la revalidation via:

```typescript
// Exemple: invalider tous les produits
fetch('https://marrakea.com/api/revalidate', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer REVALIDATE_TOKEN' },
  body: JSON.stringify({ tag: 'products' })
});
```

**Pourquoi (alignement archi):**
- Le BFF peut écouter les webhooks Strapi (content update) et Medusa (inventory change, price update) pour déclencher la revalidation Next.js on-demand.

### CDN & Images

**Images:**
- Toutes les URLs d'images doivent pointer vers Strapi CDN (uploads folder) ou CDN externe
- Format recommandé: WebP + fallback JPEG (transformation via Strapi image service ou CDN)
- Tailles multiples pour responsive (srcset) générées par Strapi ou CDN
- BlurDataUrl optionnel pour placeholder (généré par Strapi plugin ou BFF)

**Headers:**
```
Cache-Control: public, max-age=31536000, immutable (images)
Cache-Control: public, s-maxage=60, stale-while-revalidate=300 (API)
```

---

## 8. Security & Privacy

### CORS

Le BFF doit autoriser les requêtes depuis:
- `https://marrakea.com`
- `https://www.marrakea.com`
- `http://localhost:3000` (développement)

**Headers:**
```
Access-Control-Allow-Origin: https://marrakea.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Rate Limiting

**Recommandations:**
- Contact form: 3 requêtes/heure par IP
- Checkout session: 10 requêtes/heure par IP
- Stock check: 100 requêtes/heure par IP
- Catalog: 1000 requêtes/heure par IP

### Data Privacy

**RGPD:**
- Pas de tracking côté BFF sans consentement
- Logs anonymisés (IP tronquée après hash)
- Durée de rétention des carts: 24h max (Medusa default)
- Durée de rétention mapping `session_id → cart_id`: 24h max
- Contact form: ne pas stocker les emails sans opt-in (ou avec consentement explicite)

---

## 9. Testing & Validation

### Mock Mode

Le frontend peut fonctionner en mode mock (sans BFF) via:
```
NEXT_PUBLIC_USE_MOCK=true
```

Le BFF doit implémenter un mode similaire pour les tests:
```
BFF_MOCK_MODE=true
```

### Validation des DTOs

Le BFF DOIT valider que toutes les réponses correspondent exactement aux DTOs TypeScript définis dans `types/dtos.ts`.

**Outils recommandés:**
- Zod pour la validation runtime (côté BFF Node.js)
- JSON Schema pour la documentation OpenAPI
- Tests automatisés contre les types TypeScript (via `tsd` ou similaire)

### Health Check

**Endpoint:** `GET /health`

**Response:**
```typescript
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-24T12:00:00Z",
  "services": {
    "strapi": "up",
    "medusa": "up",
    "stripe": "up",
    "database": "up"
  }
}
```

**Pourquoi (alignement archi):**
- Remplacé `dolibarr` par `strapi` et `medusa`.
- Le BFF doit vérifier la connectivité vers Strapi API, Medusa API, Stripe API, et sa propre DB (si applicable).

---

## 10. Versioning & Migration

### API Versioning

Pour les breaking changes futurs, utiliser le versioning d'URL:
```
/v1/catalog/products
/v2/catalog/products
```

**Pourquoi (alignement archi):**
- En v1, pas de préfixe `/v1` (simplicité). Les endpoints sont à la racine : `/catalog/products`, `/blog/articles`, etc.
- En v2+ (si breaking changes), ajouter le préfixe explicite. Le frontend sera mis à jour en conséquence.
- Alternativement, utiliser un header `API-Version: 1` si préféré (mais moins RESTful).

Le frontend supporte actuellement la version implicite `v1` (pas de préfixe).

### Backward Compatibility

**Non-Breaking Changes (OK):**
- Ajouter de nouveaux champs optionnels aux DTOs
- Ajouter de nouveaux endpoints
- Ajouter de nouveaux query parameters optionnels

**Breaking Changes (Nécessitent migration v2):**
- Retirer des champs des DTOs
- Renommer des champs
- Changer le type d'un champ
- Rendre un champ optionnel requis
- Changer le format d'un ID (ex: numeric → UUID)

---

## 11. Compatibilité & Plan de Migration

### Checkout Status: `session_id` vs `cart_id`

**État actuel (v1):**
- Le frontend envoie `session_id` (Stripe Checkout Session ID).
- Le BFF maintient une table de mapping `session_id ↔ cart_id`.

**Problème:**
- Complexité additionnelle (table de mapping, TTL, nettoyage).
- En mode Medusa-native, `cart_id` est la source de vérité primaire.

**Plan de migration v2 (recommandé):**

1. **Phase 1 (v1.1 — Non-breaking):**
   - Le BFF retourne `cartId` en plus de `checkoutUrl` dans `POST /checkout/session`.
   - Le frontend stocke `cartId` en localStorage/sessionStorage mais continue d'utiliser `session_id` pour le polling.
   - Endpoint `/checkout/status` accepte `session_id` OU `cart_id` (via query param `?cart_id=...` en alternative).

2. **Phase 2 (v2 — Breaking):**
   - Le frontend migre pour utiliser `cart_id` au lieu de `session_id`.
   - Endpoint `/checkout/status` n'accepte plus que `cart_id` : `GET /checkout/status?cart_id={cart_id}`.
   - Le BFF supprime la table de mapping (simplification).
   - Le frontend est mis à jour en conséquence (code frontend + DTO).

**Timeline recommandée:**
- v1.0 (actuel) : `session_id` seulement
- v1.1 (Q2 2024) : support dual `session_id` + `cart_id` (opt-in)
- v2.0 (Q3 2024) : `cart_id` seulement (breaking)

**Note:** Cette migration n'est PAS requise pour v1.0. Le contract actuel (`session_id`) fonctionne. Cette section documente la roadmap future.

---

## Annexes

### A. DTO Reference

Tous les DTOs sont définis dans `/docs/dtos.md` et `src/types/dtos.ts`.

**Ajout requis pour v1:**
- `ProductDTO.defaultVariantId?: string` (Medusa variant ID, optionnel mais recommandé)
- `CheckoutSessionDTO.cartId?: string` (Medusa cart ID, optionnel v1, requis v2)

### B. ID Format Normalization

**Convention v1:**
- Strapi retourne des IDs numériques : `1`, `2`, `15`, etc.
- Le BFF DOIT les stringifier pour cohérence DTO : `String(id)` → `"1"`, `"2"`, `"15"`.
- Medusa retourne des IDs avec préfixes : `variant_01JCQK...`, `cart_01JCQM...`, `order_01JCQN...`.
- Le frontend reçoit et stocke tous les IDs en tant que `string`.

**Pourquoi:**
- Évite les erreurs de parsing JSON (integers vs strings).
- Cohérence avec les IDs Medusa qui sont toujours strings.
- Facilite le debugging (logs, network, etc.).

### C. Pricing Strategy (Medusa)

**Règle v1:**
Le BFF DOIT toujours fournir `price.amount` non-null dans `ProductDTO` et `ProductDetailDTO`.

**Stratégie:**
1. Interroger Medusa `GET /store/variants/{variant_id}` avec contexte région (`?region_id=...` si applicable).
2. Récupérer `variant.calculated_price.calculated_amount` (si disponible).
3. Si `calculated_price` est null (config Medusa manquante ou variant sans prix) :
   - Fallback sur `variant.prices[0].amount` (prix de base).
   - Si aucun prix disponible → retourner erreur 500 `PRICE_NOT_CONFIGURED` avec message explicite : "Product pricing not configured in Medusa. Please contact support."

**Prérequis Medusa:**
- Chaque variant DOIT avoir au moins un prix configuré (table `money_amounts`).
- Une région par défaut DOIT être configurée (ex: `reg_france` avec currency EUR).

**Note:** Le frontend n'a PAS de logique de fallback pricing. Le BFF est responsable de garantir un prix valide.

### D. OpenAPI Specification

Une spec OpenAPI 3.0 complète sera générée à partir de ce document (TODO Phase 7).

**Outils recommandés:**
- Swagger / OpenAPI Generator
- Redoc pour la documentation interactive

### E. Postman Collection

Une collection Postman avec tous les endpoints sera fournie (TODO Phase 7).

---

**Version:** 1.0.0-revised
**Date:** 2024-01-25
**Auteur:** Équipe MARRAKEA Frontend + BFF
**Status:** Revised Draft → À valider par équipes Frontend + BFF + Backend

---

# CHANGELOG (v1 Original → v1 Revised)

## Breaking Changes

1. **Tri par prix supprimé (Catalog 1.1)**
   - **Avant:** `sort=price_asc` et `sort=price_desc` acceptés.
   - **Après:** Ces valeurs retournent `400 UNSUPPORTED_SORT`. Seuls `newest` et `name_asc` supportés.
   - **Raison:** Strapi pilote la pagination, pas de colonne `price` indexée. Tri client-side implémenté dans frontend (Phase 6.3).
   - **Impact:** Le frontend actuel gère déjà le tri prix client-side. Aucun impact si le BFF rejette explicitement.

2. **Format IDs normalisé**
   - **Avant:** Exemples utilisaient `prod_001`, `gest_001`, etc. (préfixes fictifs).
   - **Après:** IDs numériques Strapi stringifiés (`"1"`, `"2"`, `"15"`). IDs Medusa avec préfixes (`variant_01JCQK...`).
   - **Raison:** Alignement avec la réalité Strapi (IDs numériques) et Medusa (IDs ULID).
   - **Impact:** Le frontend doit traiter les IDs comme strings opaques (déjà le cas). Tests à mettre à jour.

## Non-Breaking Changes (Additions)

3. **`ProductDTO.defaultVariantId` ajouté**
   - **Champ:** `defaultVariantId?: string` (optionnel).
   - **Raison:** Évite N+1 query en checkout. Le BFF map `product.id (Strapi)` → `variant.id (Medusa)`.
   - **Impact:** Amélioration perf checkout. Frontend peut l'ignorer en v1 (fallback côté BFF).

4. **`CheckoutSessionDTO.cartId` ajouté**
   - **Champ:** `cartId?: string` (optionnel).
   - **Raison:** Prépare migration v2 vers `cart_id` au lieu de `session_id`.
   - **Impact:** Aucun en v1. Frontend peut stocker mais n'utilise pas encore.

5. **Mentions Dolibarr remplacées par Strapi + Medusa**
   - **Avant:** "Dolibarr" mentionné dans notes (stock, health check).
   - **Après:** "Medusa" pour stock/commerce, "Strapi" pour éditorial.
   - **Raison:** Alignement architecture réelle.
   - **Impact:** Documentation seulement, pas de changement d'API.

6. **Erreur `VARIANT_NOT_FOUND` ajoutée (Checkout 3.1)**
   - **Code:** `VARIANT_NOT_FOUND` si aucun variant Medusa trouvé pour un `productId` Strapi.
   - **Raison:** Gestion d'erreur plus précise (distinguer product absent vs variant absent).
   - **Impact:** Frontend peut gérer ce cas (rare en prod si data sync OK).

## Clarifications (Non-Breaking)

7. **Checkout status : mode `session_id` documenté**
   - **Ajout:** Section "Compatibilité & Plan de Migration" (section 11).
   - **Détail:** Explique le mapping `session_id → cart_id`, table temporaire, et roadmap v2 vers `cart_id`.
   - **Impact:** Aucun changement d'API v1. Roadmap future documentée.

8. **Pricing strategy Medusa clarifiée**
   - **Ajout:** Annexe C "Pricing Strategy".
   - **Détail:** Le BFF DOIT garantir `price.amount` non-null. Fallback vers `variant.prices[0]` si `calculated_price` null.
   - **Impact:** Prérequis config Medusa documentés. Frontend peut assumer prix toujours présent.

9. **Health check services mis à jour**
   - **Avant:** `{ dolibarr, stripe, database }`.
   - **Après:** `{ strapi, medusa, stripe, database }`.
   - **Impact:** Monitoring BFF à mettre à jour.

---

# TODO v2 (Améliorations Futures)

## Tri par prix global

**Problème:** Tri `price_asc/price_desc` non supporté en v1 (pagination Strapi sans colonne `price` indexée).

**Solutions possibles v2:**

1. **Cached price dans Strapi**
   - Ajouter un champ `cached_price: number` dans Strapi collection `products`.
   - BFF sync ce champ via webhook Medusa (price update) ou cron job.
   - Strapi peut trier par `cached_price` dans la query pagination.
   - **Avantage:** Simple, pas d'infrastructure additionnelle.
   - **Inconvénient:** Stale data possible (délai sync), complexité sync.

2. **Search index dédié (Algolia, Meilisearch, Elasticsearch)**
   - Indexer les produits avec prix dans un search engine.
   - Le BFF interroge le search engine pour les listings avec tri par prix.
   - **Avantage:** Performance, search avancé (facets, typo-tolerance), tri/filter rapides.
   - **Inconvénient:** Infrastructure additionnelle, coût, complexité sync Strapi + Medusa → Search index.

3. **Tri client-side (actuel, acceptable pour v1)**
   - Le frontend récupère tous les produits d'une page, trie en mémoire.
   - **Avantage:** Aucune modification BFF/Strapi.
   - **Inconvénient:** Ne fonctionne que pour les produits de la page actuelle (pas global). Acceptable si catalogue < 100 produits ou si pagination limitée.

**Recommandation:** Solution 2 (search index) pour v2 si le catalogue dépasse 200+ produits. Sinon, solution 1 (cached price) est suffisante.

## Migration `session_id` → `cart_id`

**Plan:** Voir section 11 "Compatibilité & Plan de Migration".

**Timeline:**
- v1.1 (Q2 2024) : Support dual `session_id` + `cart_id`.
- v2.0 (Q3 2024) : Migration complète vers `cart_id`.

**Bénéfices:**
- Suppression table de mapping (simplification BFF).
- Alignement avec Medusa-native flow.
- Meilleure traçabilité (cart ID unique, pas de conversion Stripe session → Medusa cart).

## Sync Strapi ↔ Medusa

**Besoin:** Garantir cohérence entre Strapi (produits éditoriaux) et Medusa (variants commerce).

**Solutions possibles:**

1. **Webhooks bidirectionnels**
   - Strapi webhook → BFF → créer/update Medusa product/variant.
   - Medusa webhook → BFF → update Strapi cached data (prix, stock).

2. **Cron job de réconciliation**
   - Job quotidien : compare Strapi products vs Medusa products, signale divergences.

3. **Admin UI dédiée**
   - Interface admin (Strapi plugin ou BFF admin panel) pour sync manuel si nécessaire.

**Recommandation:** Solution 1 (webhooks) pour v2, avec monitoring/alerting sur échecs de sync.

## Optimisation images

**Objectif:** Réduire poids/améliorer perf images.

**Actions v2:**

1. **Strapi image service**
   - Configurer Strapi responsive images plugin (sharp).
   - Générer WebP + fallback JPEG automatiquement.
   - Générer `blurDataUrl` via plaiceholder ou similaire.

2. **CDN externe (Cloudinary, Imgix)**
   - Migrer uploads Strapi vers CDN avec transformations on-the-fly.
   - URLs avec query params pour resize/format (`?w=800&f=webp`).

**Bénéfice:** Amélioration Core Web Vitals (LCP, CLS).

## Rate limiting avancé

**Objectif:** Protéger le BFF contre abus.

**Actions v2:**

1. **Rate limiting par endpoint**
   - Limites différenciées : catalog (1000/h), checkout (10/h), contact (3/h).

2. **Rate limiting par user**
   - Si authentification future : limites par user ID au lieu de IP.

3. **DDoS protection**
   - Cloudflare ou similaire en frontal BFF.

**Outil recommandé:** `express-rate-limit` ou Redis-based rate limiter.

## Analytics & Monitoring

**Objectif:** Tracer performance et erreurs BFF.

**Métriques v2:**

1. **APM (Application Performance Monitoring)**
   - New Relic, Datadog, ou Sentry pour tracer les appels BFF → Strapi/Medusa.
   - Alertes sur latence > 500ms, taux erreur > 1%.

2. **Business metrics**
   - Nombre de checkouts créés/jour.
   - Taux de conversion checkout (session créée → order paid).
   - Produits les plus consultés (top 10).

**Outil recommandé:** Sentry (errors) + Datadog (APM) + Google Analytics 4 (business).

---

**Fin du document. Prêt pour revue par équipes Frontend + BFF + Backend.**
