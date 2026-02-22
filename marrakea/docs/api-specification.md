# API Specification — MARRAKEA BFF

## Introduction

Ce document spécifie toutes les API calls requises par le frontend Next.js MARRAKEA. Le BFF (Backend-For-Frontend) doit implémenter ces endpoints pour servir le frontend.

**URL de base:** `api.marrakea.com` (ou `NEXT_PUBLIC_BFF_URL` en développement)

**Principes:**
- Toutes les réponses doivent retourner des DTOs (Data Transfer Objects) tel que définis dans `types/dtos.ts`
- Le BFF est responsable de toute la logique métier (prix, stock, taxes)
- Le frontend ne fait que consommer et afficher les données
- Pas de champs Dolibarr bruts exposés au frontend

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
| `sort` | string | Non | Tri: `price_asc`, `price_desc`, `newest`, `name_asc` |

**Response:** `PaginatedResponse<ProductDTO>`

```typescript
{
  "data": [
    {
      "id": "prod_001",
      "slug": "vase-terre-rouge",
      "title": "Vase en terre rouge",
      "intro": "Vase artisanal façonné à la main...",
      "coverImage": {
        "url": "https://cdn.marrakea.com/products/vase-001.jpg",
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
        "id": "gest_001",
        "name": "Poterie",
        "slug": "poterie"
      },
      "territory": {
        "id": "terr_003",
        "name": "Safi",
        "slug": "safi"
      }
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

**Revalidation:** 60 secondes (ISR)

**Cache Tags:** `['products']`

**Notes:**
- Le tri `newest` retourne les produits du plus récent au plus ancien
- Le BFF doit gérer la pagination côté serveur
- Les filtres s'appliquent avec logique AND (search + gesture + territory)
- Le `formattedPrice` doit être formaté selon la locale française (ex: "120,00 €")

---

### 1.2 Get Product Detail

**Endpoint:** `GET /catalog/products/{slug}`

**Description:** Récupère les détails complets d'un produit par son slug.

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `slug` | string | Oui | Slug unique du produit |

**Response:** `ProductDetailDTO`

```typescript
{
  "id": "prod_001",
  "slug": "vase-terre-rouge",
  "title": "Vase en terre rouge",
  "intro": "Vase artisanal façonné à la main...",
  "coverImage": {
    "url": "https://cdn.marrakea.com/products/vase-001.jpg",
    "alt": "Vase en terre rouge",
    "width": 800,
    "height": 1000,
    "blurDataUrl": "data:image/jpeg;base64,..."
  },
  "images": [
    {
      "url": "https://cdn.marrakea.com/products/vase-001-2.jpg",
      "alt": "Vase en terre rouge - vue de côté",
      "width": 800,
      "height": 1000
    },
    {
      "url": "https://cdn.marrakea.com/products/vase-001-3.jpg",
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
    "id": "gest_001",
    "name": "Poterie",
    "slug": "poterie"
  },
  "territory": {
    "id": "terr_003",
    "name": "Safi",
    "slug": "safi"
  },
  "artisan": {
    "id": "art_001",
    "name": "Hassan El Fassi",
    "bio": "Maître potier depuis 30 ans...",
    "portrait": {
      "url": "https://cdn.marrakea.com/artisans/hassan.jpg",
      "alt": "Hassan El Fassi",
      "width": 200,
      "height": 200
    },
    "territory": {
      "id": "terr_003",
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
  }
}
```

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
- Retourner 404 si le produit n'existe pas (le frontend gère le not-found)
- `description` peut contenir du HTML (sanitisé côté BFF)
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
    "id": "prod_001",
    "slug": "vase-terre-rouge",
    "title": "Vase en terre rouge",
    // ... tous les champs ProductDTO
  },
  {
    "id": "prod_002",
    "slug": "tapis-beni-ouarain",
    "title": "Tapis Beni Ouarain",
    // ...
  }
  // Maximum 6 produits recommandé
]
```

**Revalidation:** 300 secondes (5 minutes, ISR)

**Cache Tags:** `['products', 'featured']`

**Notes:**
- Logique de sélection des produits featured côté BFF
- Recommandé: retourner 4-6 produits maximum
- Privilégier les produits en stock

---

### 1.4 Check Product Stock

**Endpoint:** `GET /catalog/products/{productId}/stock`

**Description:** Vérifie la disponibilité en stock d'un produit (appel client-side).

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `productId` | string | Oui | ID unique du produit |

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
- Doit retourner l'état en temps réel depuis Dolibarr

---

### 1.5 Get Gestures (Categories)

**Endpoint:** `GET /catalog/gestures`

**Description:** Récupère la liste de tous les gestes artisanaux (catégories).

**Query Parameters:** Aucun

**Response:** `GestureDTO[]`

```typescript
[
  {
    "id": "gest_001",
    "name": "Poterie",
    "slug": "poterie"
  },
  {
    "id": "gest_002",
    "name": "Tissage",
    "slug": "tissage"
  },
  {
    "id": "gest_003",
    "name": "Dinanderie",
    "slug": "dinanderie"
  },
  {
    "id": "gest_004",
    "name": "Tournage",
    "slug": "tournage"
  },
  {
    "id": "gest_005",
    "name": "Tannage",
    "slug": "tannage"
  },
  {
    "id": "gest_006",
    "name": "Menuiserie",
    "slug": "menuiserie"
  },
  {
    "id": "gest_007",
    "name": "Vannerie",
    "slug": "vannerie"
  }
]
```

**Revalidation:** 3600 secondes (1 heure, ISR)

**Cache Tags:** `['gestures']`

**Notes:**
- Liste stable, change rarement
- Utilisé pour les filtres sur `/objets`
- Ordre alphabétique recommandé

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
      "id": "art_001",
      "slug": "poterie-safi-heritage",
      "title": "La poterie de Safi : un héritage ancestral",
      "excerpt": "Découvrez l'histoire fascinante de la poterie de Safi...",
      "coverImage": {
        "url": "https://cdn.marrakea.com/blog/poterie-safi.jpg",
        "alt": "Atelier de poterie à Safi",
        "width": 1200,
        "height": 800
      },
      "publishedAt": "2024-01-15T10:00:00Z",
      "category": "Savoir-faire",
      "author": {
        "name": "Sarah Bennani",
        "avatar": {
          "url": "https://cdn.marrakea.com/authors/sarah.jpg",
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

**Revalidation:** 120 secondes (2 minutes, ISR)

**Cache Tags:** `['articles']`

**Notes:**
- Articles triés par date de publication (plus récent en premier)
- `publishedAt` au format ISO 8601

---

### 2.2 Get Article Detail

**Endpoint:** `GET /blog/articles/{slug}`

**Description:** Récupère les détails complets d'un article par son slug.

**Path Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `slug` | string | Oui | Slug unique de l'article |

**Response:** `ArticleDetailDTO`

```typescript
{
  "id": "art_001",
  "slug": "poterie-safi-heritage",
  "title": "La poterie de Safi : un héritage ancestral",
  "excerpt": "Découvrez l'histoire fascinante de la poterie de Safi...",
  "coverImage": {
    "url": "https://cdn.marrakea.com/blog/poterie-safi.jpg",
    "alt": "Atelier de poterie à Safi",
    "width": 1200,
    "height": 800
  },
  "publishedAt": "2024-01-15T10:00:00Z",
  "category": "Savoir-faire",
  "author": {
    "name": "Sarah Bennani",
    "avatar": {
      "url": "https://cdn.marrakea.com/authors/sarah.jpg",
      "alt": "Sarah Bennani",
      "width": 100,
      "height": 100
    }
  },
  "content": "<article><p>La poterie de Safi est un art...</p><h2>Histoire</h2><p>...</p></article>",
  "images": [
    {
      "url": "https://cdn.marrakea.com/blog/poterie-detail-1.jpg",
      "alt": "Détail technique de tournage",
      "width": 800,
      "height": 600
    }
  ],
  "relatedProducts": [
    {
      "id": "prod_001",
      "slug": "vase-terre-rouge",
      "title": "Vase en terre rouge",
      // ... ProductDTO complet
    }
  ]
}
```

**Revalidation:** 120 secondes (2 minutes, ISR)

**Cache Tags:** `['articles', 'article-{slug}']`

**Notes:**
- `content` peut contenir du HTML riche (sanitisé côté BFF)
- `relatedProducts` optionnel, max 3-4 produits recommandé

---

## 3. Checkout — Payment

### 3.1 Create Checkout Session

**Endpoint:** `POST /checkout/session`

**Description:** Crée une session de paiement Stripe et retourne l'URL de checkout.

**Request Body:** `CheckoutPayloadItem[]`

```typescript
[
  {
    "productId": "prod_001",
    "quantity": 1
  },
  {
    "productId": "prod_004",
    "quantity": 2
  }
]
```

**Response:** `CheckoutSessionDTO`

```typescript
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Responses:**

```typescript
// 400 - Invalid request
{
  "error": "Invalid product quantity",
  "code": "INVALID_QUANTITY"
}

// 404 - Product not found
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND",
  "productId": "prod_999"
}

// 409 - Out of stock
{
  "error": "Product out of stock",
  "code": "OUT_OF_STOCK",
  "productId": "prod_001"
}
```

**Cache:** `no-store` (jamais caché)

**Credentials:** `include` (pour les cookies de session)

**Notes:**
- Le BFF crée une session Stripe avec tous les détails (prix, taxes, shipping)
- Le frontend redirige l'utilisateur vers `checkoutUrl`
- Le BFF doit valider la disponibilité et les quantités
- Le BFF calcule le prix final (jamais le frontend)
- Stripe webhooks gèrent la confirmation de paiement

---

### 3.2 Get Checkout Status

**Endpoint:** `GET /checkout/status`

**Description:** Récupère le statut d'une session de checkout après retour de Stripe.

**Query Parameters:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `session_id` | string | Oui | ID de session Stripe |

**Response:** `CheckoutStatusDTO`

```typescript
{
  "status": "PAID",
  "orderId": "order_abc123"
}
```

**Statuts possibles:**
- `DRAFT`: Session créée, paiement non initié
- `LOCKED`: Paiement en cours
- `PAID`: Paiement confirmé (webhook reçu)
- `CANCELLED`: Session annulée par l'utilisateur
- `EXPIRED`: Session expirée (24h)
- `FAILED`: Échec du paiement

**Cache:** `no-store` (jamais caché)

**Notes:**
- Utilisé pour polling sur la page `/panier/success`
- Le statut `PAID` est mis à jour via Stripe webhook
- Le frontend poll toutes les 2 secondes jusqu'à `PAID` ou timeout

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
- Envoi du message (email, CRM, etc.) géré côté BFF

---

## 5. Routes API Frontend (Next.js API Routes)

Le frontend expose également une route API Next.js pour le client-side fetching.

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
  const params = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '12',
    search: searchParams.get('search') || undefined,
    gesture: searchParams.get('gesture') || undefined,
    sort: searchParams.get('sort') || undefined,
  };

  // Appel au BFF via clientFetch
  const products = await fetch(`${BFF_URL}/catalog/products?${searchParams}`);
  return Response.json(await products.json());
}
```

**Notes:**
- Cette route est un simple proxy vers le BFF
- Utilisée pour le client-side fetching (filtres dynamiques, pagination)
- Cache géré par TanStack Query côté client

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
| `201` | Created (checkout session) |
| `400` | Bad Request (validation error) |
| `404` | Not Found (product, article) |
| `409` | Conflict (out of stock) |
| `429` | Too Many Requests (rate limiting) |
| `500` | Internal Server Error |

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
  body: JSON.stringify({ tag: 'products' })
});
```

### CDN & Images

**Images:**
- Toutes les URLs d'images doivent pointer vers un CDN
- Format recommandé: WebP + fallback JPEG
- Tailles multiples pour responsive (srcset)
- BlurDataUrl optionnel pour placeholder (améliore UX)

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
Access-Control-Allow-Headers: Content-Type
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
- Logs anonymisés (IP tronquée)
- Durée de rétention des sessions: 24h max
- Contact form: ne pas stocker les emails sans opt-in

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
- Zod pour la validation runtime
- JSON Schema pour la documentation OpenAPI
- Tests automatisés contre les types TypeScript

### Health Check

**Endpoint:** `GET /health`

**Response:**
```typescript
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-24T12:00:00Z",
  "services": {
    "dolibarr": "up",
    "stripe": "up",
    "database": "up"
  }
}
```

---

## 10. Versioning & Migration

### API Versioning

Pour les breaking changes futurs, utiliser le versioning d'URL:
```
/v1/catalog/products
/v2/catalog/products
```

Le frontend supporte actuellement la version implicite `v1`.

### Backward Compatibility

**Non-Breaking Changes (OK):**
- Ajouter de nouveaux champs optionnels aux DTOs
- Ajouter de nouveaux endpoints
- Ajouter de nouveaux query parameters optionnels

**Breaking Changes (Nécessitent migration):**
- Retirer des champs des DTOs
- Renommer des champs
- Changer le type d'un champ
- Rendre un champ optionnel requis

---

## Annexes

### A. DTO Reference

Tous les DTOs sont définis dans `/docs/dtos.md` et `src/types/dtos.ts`.

### B. OpenAPI Specification

Une spec OpenAPI 3.0 complète sera générée à partir de ce document (TODO Phase 7).

### C. Postman Collection

Une collection Postman avec tous les endpoints sera fournie (TODO Phase 7).

---

**Version:** 1.0.0
**Date:** 2024-01-24
**Auteur:** Équipe MARRAKEA Frontend
**Status:** Draft → À valider par équipe BFF
