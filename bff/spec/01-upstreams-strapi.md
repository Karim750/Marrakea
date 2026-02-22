# Upstreams — Strapi (v1)

This file defines the **exact Strapi Content API queries** used by the BFF.
The BFF is a server-to-server consumer; it uses an API token.

---

## 1) Authentication

All requests include:

- `Authorization: Bearer {{STRAPI_API_TOKEN}}`

Base URL:

- `{{STRAPI_BASE_URL}}` (e.g. `http://localhost:1337`)

---

## 2) Strapi Data Model Assumptions

Content types (API IDs):
- `territories`
- `gestures`
- `artisans`
- `product-pages`
- `articles`

Draft/Publish:
- If enabled, the BFF will only receive **published** entries.
- Unpublished entries must behave as **not found** in BFF detail endpoints.

Media:
- Strapi media URLs may be relative; BFF should normalize to absolute URLs.

---

## 3) Product Catalog — Queries

### 3.1 List ProductPages
Used by: `GET /catalog/products`

> Notes:
> - `populate=*` is NOT allowed in production queries. Use explicit populate.
> - Fields limited to what the list needs.

Query template:

```
GET /api/product-pages
?pagination[page]={page}
&pagination[pageSize]={limit}
&sort[0]={SORT}
&populate[cover_image]=true
&populate[gesture]=true
&populate[territory]=true
&fields[0]=title
&fields[1]=slug
&fields[2]=intro
&fields[3]=medusa_product_id
&fields[4]=medusa_variant_id
```

Optional filters:

Search:
```
&filters[$or][0][title][$containsi]={search}
&filters[$or][1][intro][$containsi]={search}
```

Gesture slug:
```
&filters[gesture][slug][$eq]={gesture}
```

Territory slug:
```
&filters[territory][slug][$eq]={territory}
```

Sort mapping:
- `newest` → `publishedAt:desc`
- `name_asc` → `title:asc`

### 3.2 ProductPage Detail by slug
Used by: `GET /catalog/products/{slug}`

```
GET /api/product-pages
?filters[slug][$eq]={slug}
&populate[cover_image]=true
&populate[images]=true
&populate[gesture]=true
&populate[territory]=true
&populate[artisan][populate][portrait]=true
&populate[artisan][populate][territory]=true
```

### 3.3 Featured ProductPages
Used by: `GET /catalog/products/featured`

```
GET /api/product-pages
?filters[is_featured][$eq]=true
&pagination[page]=1
&pagination[pageSize]=6
&sort[0]=featured_rank:asc
&sort[1]=publishedAt:desc
&populate[cover_image]=true
&populate[gesture]=true
&populate[territory]=true
&fields[0]=title
&fields[1]=slug
&fields[2]=intro
&fields[3]=medusa_product_id
&fields[4]=medusa_variant_id
```

---

## 4) Taxonomies — Queries

### 4.1 Gestures
Used by: `GET /catalog/gestures`

```
GET /api/gestures
?pagination[page]=1
&pagination[pageSize]=100
&sort[0]=name:asc
```

### 4.2 Territories
Used by: `GET /catalog/territories`

```
GET /api/territories
?pagination[page]=1
&pagination[pageSize]=100
&sort[0]=name:asc
```

---

## 5) Blog — Queries

### 5.1 Articles list
Used by: `GET /blog/articles`

```
GET /api/articles
?pagination[page]={page}
&pagination[pageSize]={limit}
&sort[0]=publishedAt:desc
&populate[cover_image]=true
&populate[author][populate][avatar]=true
```

Optional category filter:
```
&filters[category][$eq]={category}
```

### 5.2 Article detail (with related products)
Used by: `GET /blog/articles/{slug}`

```
GET /api/articles
?filters[slug][$eq]={slug}
&populate[cover_image]=true
&populate[images]=true
&populate[author][populate][avatar]=true
&populate[related_products][populate][cover_image]=true
&populate[related_products][populate][gesture]=true
&populate[related_products][populate][territory]=true
&populate[related_products][fields][0]=title
&populate[related_products][fields][1]=slug
&populate[related_products][fields][2]=intro
&populate[related_products][fields][3]=medusa_product_id
&populate[related_products][fields][4]=medusa_variant_id
```

---

## 6) Response Shape Reminder (Strapi v4)

List endpoints return:

```json
{
  "data": [{ "id": 1, "attributes": { ... } }],
  "meta": { "pagination": { ... } }
}
```

BFF must:

* stringify `id`
* map `attributes.*` into DTO fields
* map media into `ImageDTO`
