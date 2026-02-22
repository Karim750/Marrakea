/**
 * Strapi v5 Seed Script — Marrakea CMS
 *
 * Prefills: Territory, Gesture, Artisan, Product Page, Article
 * with media uploads and relation linking.
 *
 * Requirements: Node 20+, TypeScript (tsx or ts-node)
 * Usage:
 *   source .env.seed && npx tsx scripts/seed-strapi.ts
 *   # or
 *   STRAPI_BASE_URL=http://localhost:1337 STRAPI_API_TOKEN=xxx npx tsx scripts/seed-strapi.ts
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error("❌ STRAPI_API_TOKEN environment variable is required.");
  process.exit(1);
}

const ASSETS_DIR = resolve(__dirname, "assets");
const SEED_OUTPUT = resolve(__dirname, "..", "seed", "strapi-seed-result.json");

// ---------------------------------------------------------------------------
// Schema Adapter — centralizes field names so they can be adjusted easily
// ---------------------------------------------------------------------------

const SCHEMA = {
  territory: {
    collection: "territories",
    fields: { name: "name", slug: "slug" },
  },
  gesture: {
    collection: "gestures",
    fields: { name: "name", slug: "slug" },
  },
  artisan: {
    collection: "artisans",
    fields: {
      name: "name",
      slug: "slug",
      bio: "bio",
      workshopLocation: "workshopLocation",
      specialty: "specialty",
      yearsExperience: "yearsExperience",
      transmissionMode: "transmissionMode",
      equipment: "equipment",
      territory: "territory",
      portrait: "portrait",
    },
  },
  productPage: {
    collection: "product-pages",
    fields: {
      title: "title",
      slug: "slug",
      medusa_product_id: "medusa_product_id",
      intro: "intro",
      description_html: "description_html",
      dimensions: "dimensions",
      materials: "materials",
      acquisition: "acquisition",
      reference_sheet: "reference_sheet",
      is_featured: "is_featured",
      featured_rank: "featured_rank",
      gesture: "gesture",
      territory: "territory",
      artisan: "artisan",
      cover_image: "cover_image",
      images: "images",
    },
  },
  article: {
    collection: "articles",
    fields: {
      title: "title",
      slug: "slug",
      excerpt: "excerpt",
      content_html: "content_html",
      category: "category",
      publishedAt: "publishedAt",
      cover_image: "cover_image",
      author: "author",
      related_products: "related_products",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function headers(contentType?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
  };
  if (contentType) h["Content-Type"] = contentType;
  return h;
}

async function strapiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${STRAPI_BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: headers("application/json"),
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `Strapi ${method} ${path} failed [${res.status}]: ${text}`
    );
  }

  return text ? JSON.parse(text) : ({} as T);
}

// ---------------------------------------------------------------------------
// Strapi v5 response types
// ---------------------------------------------------------------------------

interface StrapiEntry {
  id: number;
  documentId: string;
  [key: string]: unknown;
}

interface StrapiListResponse {
  data: StrapiEntry[];
  meta: { pagination: { total: number } };
}

interface StrapiSingleResponse {
  data: StrapiEntry;
}

// ---------------------------------------------------------------------------
// Find by slug (idempotency) — Strapi v5 style
// ---------------------------------------------------------------------------

async function findBySlug(
  collection: string,
  slug: string
): Promise<StrapiEntry | null> {
  const path = `/api/${collection}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`;
  const res = await strapiRequest<StrapiListResponse>("GET", path);
  return res.data?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Upsert entity — Strapi v5 uses documentId for updates
// ---------------------------------------------------------------------------

async function upsertEntity(
  collection: string,
  slug: string,
  data: Record<string, unknown>
): Promise<StrapiEntry> {
  const existing = await findBySlug(collection, slug);

  if (existing) {
    console.log(`  ↩ ${collection}/${slug} exists (documentId=${existing.documentId}), updating…`);
    const res = await strapiRequest<StrapiSingleResponse>(
      "PUT",
      `/api/${collection}/${existing.documentId}`,
      { data }
    );
    return res.data;
  }

  console.log(`  ➕ Creating ${collection}/${slug}…`);
  const res = await strapiRequest<StrapiSingleResponse>(
    "POST",
    `/api/${collection}`,
    { data }
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Media upload — Strapi v5
// ---------------------------------------------------------------------------

interface StrapiMediaEntry {
  id: number;
  documentId: string;
  url: string;
  name: string;
}

async function uploadMedia(filePath: string): Promise<StrapiMediaEntry> {
  const fileName = filePath.split("/").pop()!;
  const fileBuffer = await readFile(filePath);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeForFile(fileName) });
  formData.append("files", blob, fileName);

  const res = await fetch(`${STRAPI_BASE_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Upload ${fileName} failed [${res.status}]: ${text}`);
  }

  const parsed: StrapiMediaEntry[] = JSON.parse(text);
  console.log(`  📎 Uploaded ${fileName} → id=${parsed[0].id}`);
  return parsed[0];
}

function mimeForFile(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Placeholder image generator (minimal valid PNG)
// ---------------------------------------------------------------------------

function generatePlaceholderPNG(
  width: number,
  height: number,
  label: string
): Buffer {
  const channels = 3;
  const bitDepth = 8;
  const colorType = 2;

  const rawRows: number[] = [];
  const hash = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (hash * 47) % 200 + 55;
  const g = (hash * 73) % 200 + 55;
  const b = (hash * 97) % 200 + 55;

  for (let y = 0; y < height; y++) {
    rawRows.push(0);
    for (let x = 0; x < width; x++) {
      rawRows.push(r, g, b);
    }
  }

  const rawData = Buffer.from(rawRows);
  const zlib = require("node:zlib") as typeof import("node:zlib");
  const compressed = zlib.deflateSync(rawData);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = createChunk("IHDR", (() => {
    const buf = Buffer.alloc(13);
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    buf[8] = bitDepth;
    buf[9] = colorType;
    buf[10] = 0;
    buf[11] = 0;
    buf[12] = 0;
    return buf;
  })());

  const idat = createChunk("IDAT", compressed);
  const iend = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuf]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// Ensure asset files exist (create placeholders if missing)
// ---------------------------------------------------------------------------

const REQUIRED_ASSETS = [
  "artisan_portrait.jpg",
  "product_cover.jpg",
  "product_1.jpg",
  "product_2.jpg",
  "article_cover.jpg",
  "author_avatar.jpg",
] as const;

function ensureAssets(): void {
  if (!existsSync(ASSETS_DIR)) {
    mkdirSync(ASSETS_DIR, { recursive: true });
  }

  for (const asset of REQUIRED_ASSETS) {
    const filePath = join(ASSETS_DIR, asset);
    if (!existsSync(filePath)) {
      console.log(`  ⚠ Asset ${asset} missing — generating placeholder…`);
      const png = generatePlaceholderPNG(200, 200, asset);
      writeFileSync(filePath, png);
    }
  }
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const TERRITORY_DATA = {
  name: "Safi",
  slug: "safi",
};

const GESTURE_DATA = {
  name: "Poterie",
  slug: "poterie",
};

const ARTISAN_DATA = {
  name: "Hassan El Fassi",
  slug: "hassan-el-fassi",
  bio: "Maître potier de Safi, Hassan El Fassi perpétue un savoir-faire transmis depuis cinq générations. Ses créations allient techniques ancestrales et sensibilité contemporaine.",
  workshopLocation: "Quartier des potiers, Safi, Maroc",
  specialty: "Poterie traditionnelle en terre rouge",
  yearsExperience: 35,
  transmissionMode: "Familiale — père en fils depuis 5 générations",
  equipment: "Tour de potier traditionnel, four à bois, outils de façonnage artisanaux",
};

const PRODUCT_PAGE_DATA = {
  title: "Vase en terre rouge",
  slug: "vase-terre-rouge",
  medusa_product_id: null,
  intro: "Un vase façonné à la main dans l'argile rouge de Safi, symbole d'un savoir-faire ancestral.",
  description_html: `<p>Ce vase en terre rouge est le fruit du travail minutieux de Hassan El Fassi, maître potier de Safi. Chaque pièce est unique, tournée à la main sur un tour traditionnel puis cuite dans un four à bois.</p>
<p>La terre rouge caractéristique de la région de Safi confère à ce vase une teinte chaleureuse et une texture authentique. Les motifs géométriques sont gravés à la main selon des techniques transmises de génération en génération.</p>
<p>Ce vase peut accueillir des fleurs séchées ou servir d'objet décoratif à part entière.</p>`,
  dimensions: "H 30cm × Ø 15cm",
  materials: ["Terre rouge de Safi", "Émaux naturels"],
  acquisition: "Pièce disponible sur commande. Délai de fabrication : 2 à 3 semaines.",
  reference_sheet: {
    weight: "1.2 kg",
    origin: "Safi, Maroc",
    technique: "Tournage, gravure, cuisson au four à bois",
    care: "Nettoyage à l'eau claire, ne pas passer au lave-vaisselle",
  },
  is_featured: true,
  featured_rank: 1,
};

const ARTICLE_DATA = {
  title: "La poterie de Safi : un héritage ancestral",
  slug: "poterie-safi-heritage",
  excerpt: "Découvrez l'histoire millénaire de la poterie de Safi et les artisans qui perpétuent ce savoir-faire unique au Maroc.",
  content_html: `<p>Safi, ville côtière du Maroc, est reconnue depuis des siècles comme la capitale de la poterie marocaine. Son quartier des potiers, perché sur la colline surplombant l'océan Atlantique, abrite des dizaines d'ateliers où le savoir-faire se transmet de père en fils.</p>
<h2>Une tradition millénaire</h2>
<p>Les premières traces de poterie à Safi remontent au XIIe siècle. Les Almohades, puis les Mérinides, ont encouragé le développement de cet artisanat qui a fait la renommée de la ville à travers tout le Maghreb.</p>
<h2>La terre rouge, signature de Safi</h2>
<p>C'est l'argile rouge extraite des carrières environnantes qui donne aux poteries de Safi leur couleur caractéristique. Cette terre, riche en oxyde de fer, offre une plasticité idéale pour le tournage et une résistance remarquable à la cuisson.</p>
<h2>Les maîtres potiers d'aujourd'hui</h2>
<p>Parmi eux, Hassan El Fassi représente la cinquième génération d'une lignée de potiers. Dans son atelier du quartier historique, il perpétue les gestes ancestraux tout en apportant sa touche personnelle à chaque création.</p>`,
  category: "Savoir-faire",
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

interface SeedResult {
  territoryId: number;
  territoryDocumentId: string;
  gestureId: number;
  gestureDocumentId: string;
  artisanId: number;
  artisanDocumentId: string;
  productPageId: number;
  productPageDocumentId: string;
  articleId: number;
  articleDocumentId: string;
  mediaIds: {
    artisanPortrait: number;
    productCover: number;
    productImage1: number;
    productImage2: number;
    articleCover: number;
    authorAvatar: number;
  };
  slugs: {
    territory: string;
    gesture: string;
    artisan: string;
    productPage: string;
    article: string;
  };
}

async function seed(): Promise<SeedResult> {
  console.log("\n🌱 Marrakea CMS — Strapi v5 Seed Script\n");
  console.log(`  Strapi URL: ${STRAPI_BASE_URL}`);
  console.log("");

  // 1. Ensure assets
  console.log("📁 Checking assets…");
  ensureAssets();
  console.log("");

  // 2. Upload media
  console.log("🖼  Uploading media…");
  const artisanPortrait = await uploadMedia(join(ASSETS_DIR, "artisan_portrait.jpg"));
  const productCover = await uploadMedia(join(ASSETS_DIR, "product_cover.jpg"));
  const productImage1 = await uploadMedia(join(ASSETS_DIR, "product_1.jpg"));
  const productImage2 = await uploadMedia(join(ASSETS_DIR, "product_2.jpg"));
  const articleCover = await uploadMedia(join(ASSETS_DIR, "article_cover.jpg"));
  const authorAvatar = await uploadMedia(join(ASSETS_DIR, "author_avatar.jpg"));
  console.log("");

  // 3. Territory
  console.log("🗺  Territory…");
  const territory = await upsertEntity(
    SCHEMA.territory.collection,
    TERRITORY_DATA.slug,
    { ...TERRITORY_DATA, publishedAt: new Date().toISOString() }
  );
  console.log("");

  // 4. Gesture
  console.log("🤲 Gesture…");
  const gesture = await upsertEntity(
    SCHEMA.gesture.collection,
    GESTURE_DATA.slug,
    { ...GESTURE_DATA, publishedAt: new Date().toISOString() }
  );
  console.log("");

  // 5. Artisan — relations are set via numeric ID in Strapi v5 REST API
  console.log("👤 Artisan…");
  const artisan = await upsertEntity(
    SCHEMA.artisan.collection,
    ARTISAN_DATA.slug,
    {
      ...ARTISAN_DATA,
      territory: territory.id,
      portrait: artisanPortrait.id,
      publishedAt: new Date().toISOString(),
    }
  );
  console.log("");

  // 6. Product Page
  console.log("📦 Product Page…");
  const productPage = await upsertEntity(
    SCHEMA.productPage.collection,
    PRODUCT_PAGE_DATA.slug,
    {
      ...PRODUCT_PAGE_DATA,
      territory: territory.id,
      gesture: gesture.id,
      artisan: artisan.id,
      cover_image: productCover.id,
      images: [productImage1.id, productImage2.id],
      publishedAt: new Date().toISOString(),
    }
  );
  console.log("");

  // 7. Article
  console.log("📰 Article…");
  const article = await upsertEntity(
    SCHEMA.article.collection,
    ARTICLE_DATA.slug,
    {
      ...ARTICLE_DATA,
      cover_image: articleCover.id,
      author: {
        name: "Sarah Bennani",
        avatar: authorAvatar.id,
      },
      related_products: [productPage.id],
      publishedAt: new Date().toISOString(),
    }
  );
  console.log("");

  // 8. Build result
  const result: SeedResult = {
    territoryId: territory.id,
    territoryDocumentId: territory.documentId,
    gestureId: gesture.id,
    gestureDocumentId: gesture.documentId,
    artisanId: artisan.id,
    artisanDocumentId: artisan.documentId,
    productPageId: productPage.id,
    productPageDocumentId: productPage.documentId,
    articleId: article.id,
    articleDocumentId: article.documentId,
    mediaIds: {
      artisanPortrait: artisanPortrait.id,
      productCover: productCover.id,
      productImage1: productImage1.id,
      productImage2: productImage2.id,
      articleCover: articleCover.id,
      authorAvatar: authorAvatar.id,
    },
    slugs: {
      territory: TERRITORY_DATA.slug,
      gesture: GESTURE_DATA.slug,
      artisan: ARTISAN_DATA.slug,
      productPage: PRODUCT_PAGE_DATA.slug,
      article: ARTICLE_DATA.slug,
    },
  };

  return result;
}

// ---------------------------------------------------------------------------
// Verification URLs
// ---------------------------------------------------------------------------

function printVerificationURLs(result: SeedResult): void {
  const base = STRAPI_BASE_URL;
  console.log("🔗 Verification URLs:\n");

  console.log("  1) Product Pages list (with cover_image, gesture, territory):");
  console.log(
    `     ${base}/api/product-pages?populate[cover_image]=true&populate[gesture]=true&populate[territory]=true\n`
  );

  console.log("  2) Product Page detail by slug (deep populate):");
  console.log(
    `     ${base}/api/product-pages?filters[slug][$eq]=${result.slugs.productPage}&populate[artisan][populate][portrait]=true&populate[artisan][populate][territory]=true&populate[territory]=true&populate[images]=true&populate[cover_image]=true&populate[gesture]=true\n`
  );

  console.log("  3) Articles list:");
  console.log(`     ${base}/api/articles?populate=*\n`);

  console.log("  4) Article detail by slug (with related_products):");
  console.log(
    `     ${base}/api/articles?filters[slug][$eq]=${result.slugs.article}&populate[cover_image]=true&populate[author][populate][avatar]=true&populate[related_products][populate][cover_image]=true\n`
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    const result = await seed();

    // Save result to file
    const outputDir = resolve(__dirname, "..", "seed");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(SEED_OUTPUT, JSON.stringify(result, null, 2));
    console.log(`💾 Result saved to: ${SEED_OUTPUT}\n`);

    // Print result
    console.log("📋 Seed Result:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    printVerificationURLs(result);

    console.log("\n✅ Seed complete!\n");
  } catch (error) {
    console.error("\n❌ Seed failed:\n");
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error(`\n  Stack:\n  ${error.stack.split("\n").slice(1).join("\n  ")}`);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
