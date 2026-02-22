# Marrakea CMS — Strapi v5 Seed Script

## Prerequisites

- Node.js 20+
- A running Strapi v5 instance (this project uses v5.33.4)
- A Strapi API token with **full access** (automatically created on first Strapi start)

## Quick Start

```bash
# Load environment variables
source .env.seed

# Run the seed
npx tsx scripts/seed-strapi.ts
# or
yarn seed
```

## Environment Setup

The API token is automatically created when Strapi starts. Check the logs:

```bash
docker compose logs strapi | grep "SEED API TOKEN"
```

Save it to `.env.seed`:

```bash
# .env.seed
STRAPI_BASE_URL=http://localhost:1337
STRAPI_API_TOKEN=<your-token-here>
```

### Manual Token Creation

If you need to create a token manually:

1. Go to **Settings → API Tokens** in the Strapi admin panel
2. Click **Create new API Token**
3. Name: `seed-script`
4. Token type: **Full access**
5. Copy the generated token

## Assets

Place your media files in `scripts/assets/`:

| File | Purpose |
|------|---------|
| `artisan_portrait.jpg` | Portrait of the artisan |
| `product_cover.jpg` | Product page cover image |
| `product_1.jpg` | Product secondary image 1 |
| `product_2.jpg` | Product secondary image 2 |
| `article_cover.jpg` | Article cover image |
| `author_avatar.jpg` | Author avatar |

If any file is missing, the script generates a colored PNG placeholder automatically.

## What Gets Created

The script creates/updates:

1. **Territory**: Safi (slug: `safi`)
2. **Gesture**: Poterie (slug: `poterie`)
3. **Artisan**: Hassan El Fassi (slug: `hassan-el-fassi`)
   - Linked to Territory
   - Portrait media uploaded
4. **Product Page**: Vase en terre rouge (slug: `vase-terre-rouge`)
   - Linked to Territory, Gesture, Artisan
   - `medusa_product_id` set to `null`
   - Cover image + 2 secondary images
5. **Article**: La poterie de Safi (slug: `poterie-safi-heritage`)
   - Cover image
   - Author component with name + avatar
   - Related products includes the product page

## Output

The script produces:

1. Console output with all created IDs and documentIds
2. `seed/strapi-seed-result.json` — machine-readable result
3. Verification URLs to test the seeded data

## Idempotency

The script is idempotent:
- Uses `findBySlug()` to check for existing entries
- Updates if exists, creates if not
- Media files are uploaded fresh each run (no deduplication)

## Troubleshooting

### 403 Forbidden

Your API token lacks permissions. Use a **Full access** token.

### 400 Bad Request — Invalid key

Check that all content types are created with the exact field names in the schema adapter.

### Draft / Publish

All entries are created with `publishedAt` set, so they're published immediately.

### Media upload fails with 413

Increase upload size limit in Nginx or Strapi config.

### ECONNREFUSED

Strapi is not running. Start it with:

```bash
docker compose up -d
```

### Content type not found (404)

The content types must exist before running the seed. This project creates them via schema files in `src/api/*/content-types/*/schema.json`.

## Verification URLs

After seeding, test with:

```bash
# Product pages with relations
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  'http://localhost:1337/api/product-pages?populate=*'

# Articles with author and related products
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  'http://localhost:1337/api/articles?populate=*'
```
