# Marrakea Global

A modern e-commerce platform for Moroccan artisanal products, built with a headless architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STOREFRONT                                   │
│                    (Next.js - marrakea/)                            │
│                      localhost:3000                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            BFF                                       │
│                  (Node.js/Express - bff/)                           │
│                      localhost:4000                                  │
│         Aggregates CMS content + Commerce data                       │
└─────────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│           CMS             │   │            COMMERCE                  │
│    (Strapi - cms/)        │   │    (Medusa v2 - medusa/)            │
│     localhost:1337        │   │         localhost:9000               │
│                           │   │                                      │
│  • Product content        │   │  • Products & variants               │
│  • Articles/Blog          │   │  • Inventory                         │
│  • Artisans               │   │  • Carts & Checkout                  │
│  • Territories            │   │  • Payments (Stripe)                 │
│  • Gestures               │   │  • Orders                            │
└───────────────────────────┘   └─────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│     PostgreSQL            │   │  PostgreSQL  │  Redis               │
│     (Docker)              │   │  (Docker)    │  (Docker)            │
│     localhost:5433        │   │  :5432       │  :6379               │
└───────────────────────────┘   └─────────────────────────────────────┘
```

## Prerequisites

- **Node.js** >= 20
- **Docker** & **Docker Compose**
- **Yarn** (for Medusa) / **npm** (for others)
- **Git**

## Quick Start

### 1. Clone the repository

```bash
git clone git@github.com:hotmane100/marrakea-global.git
cd marrakea-global
```

### 2. Start services in order

The recommended startup order is:

1. **Medusa** (commerce backend) - needs PostgreSQL & Redis
2. **Strapi** (CMS) - needs PostgreSQL
3. **BFF** (API gateway)
4. **Storefront** (Next.js)

---

## Service Setup

### Medusa (Commerce Backend)

Location: `medusa/my-medusa-store/`

#### Setup

```bash
cd medusa/my-medusa-store

# Install dependencies
yarn install

# Copy environment template
cp .env.template .env

# Edit .env with your Stripe keys (optional for testing)
# STRIPE_API_KEY=sk_test_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Start with Docker

```bash
# Start PostgreSQL, Redis, and Medusa
yarn docker:up

# View logs
docker compose logs -f medusa

# Stop
yarn docker:down
```

#### Create admin user

```bash
docker exec medusa_backend yarn medusa user -e admin@example.com -p supersecret
```

#### Seed test data (optional)

```bash
# Set environment variables
export MEDUSA_BASE_URL=http://localhost:9000
export MEDUSA_ADMIN_EMAIL=admin@example.com
export MEDUSA_ADMIN_PASSWORD=supersecret
export MEDUSA_PUBLISHABLE_KEY=pk_xxx  # Get from Admin > Settings > API Keys
export MEDUSA_REGION_ID=reg_xxx       # Get from Admin > Settings > Regions

# Run seed script
npx tsx scripts/seed-medusa.ts
```

#### URLs

| Service | URL |
|---------|-----|
| Admin Dashboard | http://localhost:9000/app |
| Store API | http://localhost:9000/store |
| Health Check | http://localhost:9000/health |

#### Ports

| Service | Port |
|---------|------|
| Medusa API | 5432 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Vite HMR | 5173 |

---

### Strapi (CMS)

Location: `cms/`

#### Setup

```bash
cd cms

# Install dependencies
yarn install

# Copy environment file
cp .env.seed .env

# Edit .env - set database credentials and API tokens
```

#### Environment Variables

```bash
# .env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-key-1,your-app-key-2
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
```

#### Start with Docker

```bash
# Start PostgreSQL and Strapi
docker compose up -d

# View logs
docker compose logs -f strapi
```

#### Start locally (development)

```bash
# Start only the database
docker compose up -d postgres

# Run Strapi in dev mode
yarn develop
```

#### Seed content (optional)

```bash
# After Strapi is running, create an API token in Admin
# Then run the seed script
STRAPI_BASE_URL=http://localhost:1337 \
STRAPI_API_TOKEN=your-token \
npx tsx scripts/seed-strapi.ts
```

#### URLs

| Service | URL |
|---------|-----|
| Admin Panel | http://localhost:1337/admin |
| API | http://localhost:1337/api |

---

### BFF (Backend for Frontend)

Location: `bff/`

#### Setup

```bash
cd bff

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

#### Environment Variables

```bash
# .env
BFF_PORT=4000
NODE_ENV=development

# Strapi
STRAPI_BASE_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token

# Medusa
MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_KEY=pk_xxx
MEDUSA_REGION_ID=reg_xxx

# CORS
CORS_ORIGINS=http://localhost:3000
```

#### Start

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

#### URLs

| Endpoint | URL |
|----------|-----|
| Health | http://localhost:4000/health |
| Catalog | http://localhost:4000/catalog |
| Checkout | http://localhost:4000/checkout |
| Account | http://localhost:4000/account |

#### API Documentation

See `bff/openapi/bff.yaml` for the full OpenAPI specification.

---

### Storefront (Next.js)

Location: `marrakea/`

#### Setup

```bash
cd marrakea

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

#### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_BFF_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

#### Start

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

#### URLs

| Page | URL |
|------|-----|
| Home | http://localhost:3000 |
| Catalog | http://localhost:3000/objets |
| Product | http://localhost:3000/objets/[slug] |
| Cart | http://localhost:3000/panier |
| Journal | http://localhost:3000/journal |
| Contact | http://localhost:3000/contact |

---

## Full Stack Startup Script

Create a script to start everything:

```bash
#!/bin/bash
# start-all.sh

echo "Starting Medusa..."
cd medusa/my-medusa-store && yarn docker:up
sleep 30

echo "Starting Strapi..."
cd ../../cms && docker compose up -d
sleep 20

echo "Starting BFF..."
cd ../bff && npm run dev &
sleep 5

echo "Starting Storefront..."
cd ../marrakea && npm run dev &

echo "All services started!"
echo ""
echo "URLs:"
echo "  Storefront:  http://localhost:3000"
echo "  BFF:         http://localhost:4000"
echo "  Medusa:      http://localhost:9000/app"
echo "  Strapi:      http://localhost:1337/admin"
```

---

## Stripe Configuration

### Test Mode Setup

1. Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add to `medusa/my-medusa-store/.env`:
   ```
   STRIPE_API_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
3. Add to `marrakea/.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

### Webhook Setup (Local Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to Medusa
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Declined |

---

## Troubleshooting

### Medusa won't start

```bash
# Check logs
docker compose logs medusa

# Restart containers
yarn docker:down && yarn docker:up

# Reset database (warning: deletes all data)
docker compose down -v
yarn docker:up
```

### Strapi database connection error

```bash
# Check if PostgreSQL is running
docker compose ps

# Check port conflict (Strapi uses 5433, Medusa uses 5432)
lsof -i :5433
```

### BFF can't connect to Medusa

1. Verify Medusa is running: `curl http://localhost:9000/health`
2. Check `MEDUSA_PUBLISHABLE_KEY` is set correctly
3. Verify the publishable key is linked to a sales channel in Medusa Admin

### Payment errors

1. Check Stripe API key is valid (starts with `sk_test_`)
2. Verify region has Stripe payment provider enabled
3. Check Medusa logs: `docker compose logs medusa | grep -i stripe`

### CORS errors in browser

1. Verify `CORS_ORIGINS` in BFF includes your frontend URL
2. Check `ADMIN_CORS` and `STORE_CORS` in Medusa `.env`

---

## Development Workflow

### Adding a new product

1. **Medusa Admin** (http://localhost:9000/app)
   - Create product with variants and prices
   - Set inventory levels
   - Assign to sales channel

2. **Strapi Admin** (http://localhost:1337/admin)
   - Create Product Page with rich content
   - Link to Medusa product via `medusaProductId`
   - Add artisan, territory, gestures

3. **Test in storefront**
   - Product should appear in catalog
   - Add to cart and test checkout

### API Testing

Import the Postman collection from `bff/tests/postman/` for testing all BFF endpoints.

---

## Project Structure

```
marrakea-global/
├── bff/                    # Backend for Frontend (Node.js)
│   ├── src/
│   │   ├── modules/        # Feature modules (catalog, checkout, etc.)
│   │   ├── shared/         # Shared utilities and clients
│   │   └── config/         # Configuration
│   └── openapi/            # API specification
│
├── cms/                    # Strapi CMS
│   ├── src/
│   │   ├── api/            # Content types (article, product-page, etc.)
│   │   └── components/     # Shared components
│   └── scripts/            # Seed scripts
│
├── marrakea/               # Next.js Storefront
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API clients and utilities
│   │   └── stores/         # Zustand stores
│   └── docs/               # Documentation
│
└── medusa/my-medusa-store/ # Medusa v2 Commerce
    ├── src/
    │   ├── api/            # Custom API routes
    │   ├── subscribers/    # Event handlers
    │   └── workflows/      # Custom workflows
    ├── scripts/            # Seed scripts
    └── docs/               # Stripe setup guide
```

---

## License

MIT
