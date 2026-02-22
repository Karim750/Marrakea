# Subagent: ContentIntegrator

## Role

Implement blog and contact modules, with product hydration for related products in blog articles.

---

## Inputs

Read before starting:

- `/spec/00-contract.md` — API contract (DTOs, endpoints, errors)
- `/spec/01-upstreams-strapi.md` — Strapi API details
- `/spec/02-upstreams-medusa.md` — Medusa API details
- `/spec/04-edge-cases.md` — Edge case handling

---

## Task

### 1. Blog Module

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/blog/articles` | List articles with pagination |
| GET | `/v1/blog/articles/{slug}` | Article detail by slug |

**Data Flow:**
1. Strapi provides: article content, metadata, related product references
2. Medusa provides: full product data for related products
3. BFF returns article with hydrated `relatedProducts`

**Related Products Hydration:**
- Strapi returns product IDs/slugs in article
- Fetch full `ProductDTO` from Medusa for each
- Limit to 3-4 related products max
- If a related product is ghost (not in Medusa): silently drop from list
- Use batch fetch to avoid N+1

**Example Response:**
```json
{
  "id": "article_123",
  "slug": "artisan-story-ahmed",
  "title": "Meet Ahmed: Master Potter",
  "content": "...",
  "author": {
    "name": "Sarah",
    "avatar": "..."
  },
  "publishedAt": "2024-01-15T10:00:00Z",
  "relatedProducts": [
    { "id": "prod_abc", "name": "Handmade Tagine", ... },
    { "id": "prod_def", "name": "Ceramic Bowl Set", ... }
  ]
}
```

### 2. Contact Module

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/contact` | Submit contact form |

**Request Validation:**
```typescript
const ContactRequestDTO = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  consent: z.boolean().refine(v => v === true, {
    message: 'Consent is required'
  }),
})
```

**Rate Limiting:**
- Apply rate limit: 5 requests per IP per 15 minutes
- Return 429 `RATE_LIMIT_EXCEEDED` on violation

**Processing:**
- Validate input with Zod
- Store in Strapi (or forward to email service)
- Return success response

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your message. We'll respond within 48 hours."
}
```

### 3. Shared DTOs

Add to `src/shared/dtos/`:

```typescript
// article.dto.ts
export const ArticleDTO = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  coverImage: ImageDTO,
  author: AuthorDTO,
  publishedAt: z.string().datetime(),
  tags: z.array(z.string()),
  relatedProducts: z.array(ProductDTO).max(4),
})

// contact.dto.ts
export const ContactRequestDTO = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  consent: z.literal(true),
})

export const ContactResponseDTO = z.object({
  success: z.boolean(),
  message: z.string(),
})
```

### 4. Mapping Layer

```typescript
// src/modules/blog/mappers/article.mapper.ts
export const mapToArticleDTO = (
  strapiArticle: StrapiArticle,
  hydratedProducts: ProductDTO[]
): ArticleDTO => {
  return {
    id: strapiArticle.id,
    slug: strapiArticle.attributes.slug,
    title: strapiArticle.attributes.title,
    // ...
    relatedProducts: hydratedProducts.slice(0, 4),
  }
}
```

---

## Outputs

| File | Description |
|------|-------------|
| `src/modules/blog/blog.controller.ts` | Route handlers |
| `src/modules/blog/blog.service.ts` | Business logic + hydration |
| `src/modules/blog/blog.routes.ts` | Route definitions |
| `src/modules/blog/mappers/article.mapper.ts` | Article mapper |
| `src/modules/contact/contact.controller.ts` | Route handlers |
| `src/modules/contact/contact.service.ts` | Business logic |
| `src/modules/contact/contact.routes.ts` | Route definitions |
| `src/shared/dtos/article.dto.ts` | Article Zod schema |
| `src/shared/dtos/contact.dto.ts` | Contact Zod schemas |
| `src/modules/blog/__tests__/*.test.ts` | Unit tests |
| `src/modules/contact/__tests__/*.test.ts` | Unit tests |

---

## Validation Checklist

Before marking complete:

- [ ] Blog list returns paginated articles
- [ ] Blog detail returns full article with hydrated products
- [ ] Related products limited to 4 max
- [ ] Ghost related products silently dropped
- [ ] No N+1 on related product hydration
- [ ] Contact validates all fields with Zod
- [ ] Contact rate limited (5/15min per IP)
- [ ] Rate limit returns 429 in standard format
- [ ] Mappers have unit tests
- [ ] All responses validated with Zod
