/**
 * Medusa v2 Seed Script
 * Creates a product "Vase en terre rouge" with 1 variant, EUR price, and inventory.
 * Idempotent: reuses existing product if found by handle.
 *
 * Usage:
 *   npx tsx scripts/seed-medusa.ts
 *
 * Required env vars:
 *   MEDUSA_BASE_URL          (default: http://localhost:9000)
 *   MEDUSA_ADMIN_TOKEN       OR  MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD
 *   MEDUSA_PUBLISHABLE_KEY   (for store read verification)
 *   MEDUSA_REGION_ID         (e.g. reg_...)
 *
 * Optional:
 *   MEDUSA_SALES_CHANNEL_ID  (attach product to a sales channel)
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// ─── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.MEDUSA_BASE_URL || "http://localhost:9000";
const REGION_ID = required("MEDUSA_REGION_ID");
const PUBLISHABLE_KEY = required("MEDUSA_PUBLISHABLE_KEY");
const SALES_CHANNEL_ID = process.env.MEDUSA_SALES_CHANNEL_ID || "";

const PRODUCT_TITLE = "Vase en terre rouge";
const PRODUCT_HANDLE = "vase-terre-rouge";
const VARIANT_TITLE = "Unique";
const CURRENCY = "EUR";
const AMOUNT = 12000; // 120.00 EUR
const INVENTORY_QTY = 1;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`❌ Missing required env var: ${name}`);
    process.exit(1);
  }
  return val;
}

interface ApiError {
  status: number;
  statusText: string;
  body: unknown;
}

async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  let body: unknown;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    const err: ApiError = { status: res.status, statusText: res.statusText, body };
    throw err;
  }

  return { data: body as T, status: res.status };
}

/**
 * Try multiple endpoint paths in order. Returns first successful response.
 * Throws the last error if all fail.
 */
async function tryEndpoints<T = unknown>(
  paths: string[],
  options: RequestInit = {}
): Promise<{ data: T; status: number; usedPath: string }> {
  let lastErr: unknown;
  for (const path of paths) {
    try {
      const result = await adminFetch<T>(path, options);
      return { ...result, usedPath: path };
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

let token = process.env.MEDUSA_ADMIN_TOKEN || "";

async function authenticate(): Promise<void> {
  if (token) {
    console.log("🔑 Using MEDUSA_ADMIN_TOKEN");
    return;
  }

  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("❌ Provide MEDUSA_ADMIN_TOKEN or MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD");
    process.exit(1);
  }

  console.log(`🔑 Authenticating as ${email}...`);

  // Medusa v2 auth: POST /auth/user/emailpass
  const res = await fetch(`${BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Auth failed (${res.status}): ${body}`);
    process.exit(1);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    console.error("❌ Auth response missing token:", data);
    process.exit(1);
  }

  token = data.token;
  console.log("✅ Authenticated");
}

// ─── Product Operations ────────────────────────────────────────────────────────

interface MedusaVariant {
  id: string;
  title: string;
  prices?: Array<{ amount: number; currency_code: string }>;
  inventory_quantity?: number;
}

interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  variants?: MedusaVariant[];
}

interface ProductListResponse {
  products: MedusaProduct[];
}

interface ProductResponse {
  product: MedusaProduct;
}

async function findProductByHandle(): Promise<MedusaProduct | null> {
  console.log(`🔍 Searching for product with handle "${PRODUCT_HANDLE}"...`);

  try {
    const { data } = await adminFetch<ProductListResponse>(
      `/admin/products?handle=${PRODUCT_HANDLE}&fields=id,title,handle,status,*variants,*variants.prices`
    );
    if (data.products && data.products.length > 0) {
      console.log(`✅ Found existing product: ${data.products[0].id}`);
      return data.products[0];
    }
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    console.warn(`⚠️  Product search failed (${apiErr.status}), will try create.`);
  }

  return null;
}

async function createProduct(): Promise<MedusaProduct> {
  console.log("📦 Creating product...");

  const payload: Record<string, unknown> = {
    title: PRODUCT_TITLE,
    handle: PRODUCT_HANDLE,
    status: "published",
    options: [
      { title: "Default", values: [VARIANT_TITLE] },
    ],
    variants: [
      {
        title: VARIANT_TITLE,
        options: { Default: VARIANT_TITLE },
        prices: [
          { amount: AMOUNT, currency_code: CURRENCY },
        ],
        manage_inventory: true,
      },
    ],
  };

  if (SALES_CHANNEL_ID) {
    payload.sales_channels = [{ id: SALES_CHANNEL_ID }];
  }

  const { data } = await adminFetch<ProductResponse>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(`✅ Created product: ${data.product.id}`);
  return data.product;
}

async function ensurePublished(productId: string): Promise<void> {
  console.log("📢 Ensuring product is published...");
  await adminFetch(`/admin/products/${productId}`, {
    method: "POST",
    body: JSON.stringify({ status: "published" }),
  });
  console.log("✅ Product status: published");
}

async function ensureSalesChannel(productId: string): Promise<void> {
  if (!SALES_CHANNEL_ID) return;

  console.log(`🏪 Attaching product to sales channel ${SALES_CHANNEL_ID}...`);
  try {
    await tryEndpoints(
      [
        `/admin/products/${productId}/sales-channels`,
        `/admin/products/${productId}`,
      ],
      {
        method: "POST",
        body: JSON.stringify(
          // First path expects batch format, second expects inline
          { add: [SALES_CHANNEL_ID] }
        ),
      }
    );
    console.log("✅ Sales channel attached");
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    console.warn(`⚠️  Sales channel attach returned ${apiErr.status}, may already be linked.`);
  }
}

async function ensureVariantPrice(product: MedusaProduct): Promise<string> {
  const variant = product.variants?.[0];
  if (!variant) {
    throw new Error("Product has no variants");
  }

  const hasCorrectPrice = variant.prices?.some(
    (p) => p.currency_code === CURRENCY.toLowerCase() && p.amount === AMOUNT
  );

  if (!hasCorrectPrice) {
    console.log(`💰 Updating variant ${variant.id} price to ${AMOUNT} ${CURRENCY}...`);
    await adminFetch(`/admin/products/${product.id}/variants/${variant.id}`, {
      method: "POST",
      body: JSON.stringify({
        prices: [{ amount: AMOUNT, currency_code: CURRENCY }],
      }),
    });
    console.log("✅ Price updated");
  } else {
    console.log("✅ Price already correct");
  }

  return variant.id;
}

async function ensureInventory(variantId: string): Promise<void> {
  console.log(`📊 Checking inventory for variant ${variantId}...`);

  try {
    // Get inventory items linked to this variant
    // Medusa v2 uses different query params depending on version
    let inventoryData: { inventory_items: Array<{ id: string }> } | null = null;

    for (const param of ["variant_id", "variants"]) {
      try {
        const { data: d } = await adminFetch<{ inventory_items: Array<{ id: string }> }>(
          `/admin/inventory-items?${param}=${variantId}`
        );
        if (d.inventory_items && d.inventory_items.length > 0) {
          inventoryData = d;
          break;
        }
      } catch {
        continue;
      }
    }

    // Fallback: list all inventory items if variant filter didn't work
    if (!inventoryData || inventoryData.inventory_items.length === 0) {
      const { data: allItems } = await adminFetch<{ inventory_items: Array<{ id: string }> }>(
        `/admin/inventory-items`
      );
      inventoryData = allItems;
    }

    const data = inventoryData;

    if (data.inventory_items && data.inventory_items.length > 0) {
      const item = data.inventory_items[0];
      console.log(`  Found inventory item: ${item.id}`);

      // Get location levels
      const { data: levelData } = await adminFetch<{
        inventory_levels: Array<{ id: string; stocked_quantity: number; location_id: string }>;
      }>(`/admin/inventory-items/${item.id}/location-levels`);

      if (levelData.inventory_levels && levelData.inventory_levels.length > 0) {
        const level = levelData.inventory_levels[0];
        if (level.stocked_quantity < INVENTORY_QTY) {
          console.log(`  Updating stocked_quantity to ${INVENTORY_QTY}...`);
          await adminFetch(
            `/admin/inventory-items/${item.id}/location-levels/${level.location_id}`,
            {
              method: "POST",
              body: JSON.stringify({ stocked_quantity: INVENTORY_QTY }),
            }
          );
          console.log("✅ Inventory updated");
        } else {
          console.log(`✅ Inventory already >= ${INVENTORY_QTY}`);
        }
      } else {
        // Try to create a location level using the first stock location
        console.log("  No location levels found. Attempting to create one...");
        try {
          const { data: locData } = await adminFetch<{
            stock_locations: Array<{ id: string; name: string }>;
          }>("/admin/stock-locations");

          if (locData.stock_locations && locData.stock_locations.length > 0) {
            const locationId = locData.stock_locations[0].id;
            console.log(`  Using stock location: ${locationId}`);
            await adminFetch(`/admin/inventory-items/${item.id}/location-levels`, {
              method: "POST",
              body: JSON.stringify({
                location_id: locationId,
                stocked_quantity: INVENTORY_QTY,
              }),
            });
            console.log(`✅ Inventory level created (qty: ${INVENTORY_QTY})`);
          } else {
            console.log("⚠️  No stock locations exist. Create one in admin to manage inventory.");
          }
        } catch (locErr: unknown) {
          const locApiErr = locErr as ApiError;
          console.warn(`⚠️  Could not create location level (${locApiErr.status}). Skipping.`);
        }
      }
    } else {
      console.log("⚠️  No inventory item found for variant. manage_inventory may be disabled.");
    }
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    console.warn(`⚠️  Inventory check failed (${apiErr.status}). Skipping.`);
  }
}

// ─── Store Verification ────────────────────────────────────────────────────────

async function verifyStoreRead(productId: string, variantId: string): Promise<void> {
  console.log("\n🔎 Verifying product via Store API...");

  const url = `${BASE_URL}/store/products/${productId}?region_id=${REGION_ID}`;
  const res = await fetch(url, {
    headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Store read failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { product: MedusaProduct };
  if (!data.product) {
    throw new Error("Store API returned no product");
  }

  const variant = data.product.variants?.find((v) => v.id === variantId);
  if (!variant) {
    throw new Error(`Variant ${variantId} not found in store response`);
  }

  console.log("✅ Store API verification passed");
  console.log(`   Product: ${data.product.title} (${data.product.id})`);
  console.log(`   Variant: ${variant.title} (${variant.id})`);
}

// ─── Output ────────────────────────────────────────────────────────────────────

function writeResult(productId: string, variantId: string): void {
  const result = {
    medusaProductId: productId,
    defaultVariantId: variantId,
    title: PRODUCT_TITLE,
    handle: PRODUCT_HANDLE,
    regionId: REGION_ID,
    currency: CURRENCY,
    amount: AMOUNT,
  };

  const outDir = resolve(process.cwd(), "seed");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "medusa-seed-result.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");

  console.log(`\n📄 Result written to: ${outPath}`);
  console.log(JSON.stringify(result, null, 2));
}

function printPostmanCalls(productId: string, variantId: string): void {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 Sample Postman / cURL Calls
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) GET Store Product
   GET ${BASE_URL}/store/products/${productId}?region_id=${REGION_ID}
   Headers:
     x-publishable-api-key: ${PUBLISHABLE_KEY}

2) POST Create Cart
   POST ${BASE_URL}/store/carts
   Headers:
     x-publishable-api-key: ${PUBLISHABLE_KEY}
     Content-Type: application/json
   Body:
     { "region_id": "${REGION_ID}" }

3) POST Add Line Item (replace {cart_id})
   POST ${BASE_URL}/store/carts/{cart_id}/line-items
   Headers:
     x-publishable-api-key: ${PUBLISHABLE_KEY}
     Content-Type: application/json
   Body:
     { "variant_id": "${variantId}", "quantity": 1 }

4) POST Create Payment Sessions (replace {cart_id})
   POST ${BASE_URL}/store/carts/{cart_id}/payment-sessions
   Headers:
     x-publishable-api-key: ${PUBLISHABLE_KEY}

5) POST Select Stripe Provider (replace {cart_id})
   POST ${BASE_URL}/store/carts/{cart_id}/payment-sessions
   Headers:
     x-publishable-api-key: ${PUBLISHABLE_KEY}
     Content-Type: application/json
   Body:
     { "provider_id": "pp_stripe_stripe" }

6) Auth: Register / Login / Me
   POST ${BASE_URL}/auth/customer/emailpass
   Body: { "email": "customer@example.com", "password": "password123" }

   POST ${BASE_URL}/store/customers
   Headers:
     Authorization: Bearer {token_from_above}
     x-publishable-api-key: ${PUBLISHABLE_KEY}
   Body: { "first_name": "John", "last_name": "Doe" }

   GET ${BASE_URL}/store/customers/me
   Headers:
     Authorization: Bearer {token}
     x-publishable-api-key: ${PUBLISHABLE_KEY}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌱 Medusa Seed Script");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Region:   ${REGION_ID}`);
  console.log("");

  await authenticate();

  // Find or create product
  let product = await findProductByHandle();

  if (!product) {
    product = await createProduct();
  }

  // Ensure published
  if (product.status !== "published") {
    await ensurePublished(product.id);
  }

  // Ensure sales channel
  await ensureSalesChannel(product.id);

  // Re-fetch product with full variant data
  const { data: freshData } = await adminFetch<ProductResponse>(
    `/admin/products/${product.id}?fields=id,title,handle,status,*variants,*variants.prices`
  );
  product = freshData.product;

  // Ensure variant price
  const variantId = await ensureVariantPrice(product);

  // Ensure inventory
  await ensureInventory(variantId);

  // Verify via Store API
  try {
    await verifyStoreRead(product.id, variantId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  Store verification failed: ${msg}`);
    console.warn("   This may be due to missing publishable key scope or sales channel.");
    console.warn("   The product was still created successfully in admin.");
  }

  // Write result
  writeResult(product.id, variantId);

  // Print Postman calls
  printPostmanCalls(product.id, variantId);
}

main().catch((err) => {
  console.error("\n❌ Seed script failed:");
  if ((err as ApiError).status) {
    const apiErr = err as ApiError;
    console.error(`   HTTP ${apiErr.status} ${apiErr.statusText}`);
    console.error(`   Body:`, JSON.stringify(apiErr.body, null, 2));
  } else {
    console.error(err);
  }
  process.exit(1);
});
