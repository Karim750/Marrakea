# Seeding Assumptions (v1)

This defines the **minimal data** required in Strapi and Medusa so the BFF can function.

---

## 1) Strapi Content Types (Required Fields)

## 1.1 Territory (`territories`)
Required:
- `name` (string)
- `slug` (uid)

## 1.2 Gesture (`gestures`)
Required:
- `name` (string)
- `slug` (uid)

## 1.3 Artisan (`artisans`)
Required:
- `name` (string)
Recommended:
- `bio` (text)
- `portrait` (media single)
- `territory` (relation to territories)
Optional:
- `workshopLocation`, `specialty`, `yearsExperience`, `transmissionMode`, `equipment`

## 1.4 ProductPage (`product-pages`)
Required:
- `title` (string)
- `slug` (uid)
- `cover_image` (media single)
- `gesture` (relation)
- `territory` (relation)
- `medusa_product_id` (string)  ✅ critical
Recommended:
- `medusa_variant_id` (string) ✅ avoid N+1 checkout
Optional:
- `intro`
- `images` (media multiple)
- `description_html` (rich text/html)
- `dimensions` (string)
- `materials` (repeatable string)
- `acquisition` (text)
- `reference_sheet` (json object)
- `artisan` (relation)
- `is_featured` (boolean)
- `featured_rank` (number)

## 1.5 Article (`articles`)
Required:
- `title`, `slug`, `content` (html/rich), `cover_image`, `publishedAt`
Optional:
- `excerpt`, `images`
- `author` (component: name + avatar)
- `related_products` (relation to product-pages)

---

## 2) Medusa Required Setup

- A valid region exists:
  - `MEDUSA_REGION_ID` configured and active
- At least one product exists with:
  - `product.id = prod_*`
  - at least one variant `variant_*`
  - store-visible pricing resolvable in the store API context
- Inventory is configured for unique items:
  - quantity ≥ 1 for in-stock
  - quantity = 0 for out-of-stock

---

## 3) Linking Rule (Strapi ↔ Medusa)

- Strapi is authoritative for slug/storytelling
- Medusa is authoritative for commerce ids

The ProductPage stores:
- `medusa_product_id`
- `medusa_variant_id`

BFF uses them to fetch commerce data and merge into DTOs.
