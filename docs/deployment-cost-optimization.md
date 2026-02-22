# MARRAKEA Deployment Cost Optimization Guide
**Pre-Revenue Startup Strategy**

> **Target Budget**: €3.50-5/month (~$4-6/month)
> **Last Updated**: 2026-01-29
> **Status**: Production-Ready Architecture

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Cost Comparison Analysis](#cost-comparison-analysis)
3. [Recommended Architecture](#recommended-architecture)
4. [Detailed Implementation](#detailed-implementation)
5. [Monthly Cost Breakdown](#monthly-cost-breakdown)
6. [Migration Roadmap](#migration-roadmap)
7. [Risk Assessment](#risk-assessment)
8. [Next Steps](#next-steps)

---

## Executive Summary

### The Challenge
Deploy a complete e-commerce stack (Next.js Frontend + BFF + Strapi CMS + Medusa + PostgreSQL + Redis) with minimal cost for a pre-revenue startup.

### The Solution: Hybrid Architecture
**Total Cost: €3.50-5/month (~$4-6/month)**

- **Frontend**: Vercel (Free tier)
- **Backend Services**: OVH VPS Starter (€3.50/month)
- **Redis**: Upstash (Free tier)
- **Media Storage**: Cloudflare R2 (Free tier)
- **Domain**: Namecheap (~$1/month amortized)

### Why This Works
✅ **No cold starts** - Backend always warm
✅ **Predictable cost** - Flat monthly fee
✅ **Easy to scale** - Just upgrade VPS when needed
✅ **Professional infrastructure** - Free SSL, CDN, auto-scaling frontend
✅ **No vendor lock-in** - Can migrate anywhere

---

## Cost Comparison Analysis

### Option 1: Free Tier Stacking
**Total: $0-5/month**

| Service | Provider | Tier | Cost | Limitations |
|---------|----------|------|------|-------------|
| Frontend | Vercel | Hobby | **$0** | 100GB bandwidth, no cold starts |
| BFF | Railway | Hobby | **$0** | $5 free credit/month (500h runtime) |
| PostgreSQL (Strapi) | Supabase | Free | **$0** | 500MB DB, 1GB file storage |
| PostgreSQL (Medusa) | Supabase | Free | **$0** | 500MB DB (separate project) |
| Redis | Upstash | Free | **$0** | 10K commands/day |
| Strapi Files | Cloudflare R2 | Free | **$0** | 10GB storage |
| Domain | Namecheap | .com | **~$12/year** | One-time annual |
| **Monthly Total** | | | **~$1/month** | (domain amortized) |

#### Pros
- Truly minimal cost for first year
- No server management
- Auto-scaling built-in
- Professional infrastructure
- SSL included everywhere

#### Cons
- Railway hobby tier has 500h/month limit (need to optimize sleep)
- Supabase 500MB limit (may need pruning or upgrade at ~1000 products)
- Multiple dashboards to manage
- Cold starts on BFF if using sleep mode

---

### Option 2: Single Ultra-Cheap VPS
**Total: €3.50-6/month (~$4-7/month)**

| Provider | Specs | Location | Cost/Month |
|----------|-------|----------|------------|
| **OVH VPS Starter** ⭐ | 1 vCPU, 2GB RAM, 20GB SSD | France | **€3.50** |
| Hetzner CPX11 | 2 vCPU, 2GB RAM, 40GB SSD | Germany | €4.15 |
| Contabo VPS S | 4 vCPU, 8GB RAM, 200GB SSD | Germany | €5.50 |

#### For OVH VPS Starter (€3.50/month)
- All services in Docker
- Tight resource limits required
- Need swap space for stability
- Backup to local machine (no budget for S3)

#### Pros
- Predictable flat cost
- Full control
- No sleep/cold starts
- Can handle traffic spikes with swap

#### Cons
- 2GB RAM is tight (need aggressive limits)
- Single point of failure
- Manual SSL renewal (Let's Encrypt)
- You manage backups

---

### Option 3: AWS Free Tier (Year 1 Only)
**Total: $0/month → $25-40/month after 12 months**

#### Not Recommended Because
- Only free for 12 months
- t2.micro (1GB RAM) insufficient for your stack
- Hidden costs (data transfer, EBS snapshots)
- Expensive after free tier expires
- Lock-in risk

---

### Option 4: Hybrid (Free Frontend + Cheap Backend) ⭐⭐ BEST VALUE
**Total: €3.50-5/month (~$4-6/month)**

| Service | Provider | Cost |
|---------|----------|------|
| Frontend | Vercel (Free) | $0 |
| BFF + Strapi + Medusa + DBs | OVH VPS Starter | €3.50 |
| Redis | Upstash (Free) | $0 |
| Media Storage | Cloudflare R2 (Free) | $0 |
| Domain | Namecheap | ~$1/month |
| **Total** | | **~$4.50-5/month** |

#### Why This is Best
✅ Next.js on Vercel = zero config, perfect performance, free SSL
✅ Backend services on VPS = no sleep, predictable
✅ Offload Redis and media to free tiers = more RAM for apps
✅ Easy to scale: just upgrade VPS when needed
✅ Best of both worlds: managed frontend + controlled backend

---

## Recommended Architecture

### Architecture Diagram

```
Internet
   │
   ├─→ marrakea.com (Vercel) ──→ Next.js Frontend (FREE)
   │                               │
   │                               ↓ HTTPS
   │
   └─→ api.marrakea.com ──────→ OVH VPS (€3.50/month)
                                   │
                                   ├─ NGINX (64MB RAM)
                                   │   ├─ SSL Termination (Let's Encrypt)
                                   │   ├─ Rate Limiting
                                   │   └─ Reverse Proxy
                                   │
                                   ├─ BFF (300MB RAM)
                                   │   └─ Port 4000
                                   │
                                   ├─ Strapi CMS (600MB RAM)
                                   │   └─ Port 1337
                                   │
                                   ├─ Medusa (800MB RAM)
                                   │   └─ Port 9000
                                   │
                                   ├─ PostgreSQL (Strapi) (150MB RAM)
                                   │   └─ Port 5432
                                   │
                                   └─ PostgreSQL (Medusa) (150MB RAM)
                                       └─ Port 5433

   External Free Services:
   ├─ Redis → Upstash (10K cmds/day FREE)
   ├─ Media → Cloudflare R2 (10GB FREE)
   └─ Monitoring → UptimeRobot (50 monitors FREE)
```

### Memory Allocation (2GB Total)

```
Service          | Limit | Reserved | Usage %
-----------------+-------+----------+---------
NGINX            |  64MB |    32MB  |    3%
BFF              | 300MB |   200MB  |   15%
Strapi CMS       | 600MB |   400MB  |   30%
Medusa           | 800MB |   500MB  |   40%
Strapi DB        | 150MB |   100MB  |    7%
Medusa DB        | 150MB |   100MB  |    7%
-----------------+-------+----------+---------
Total            | 2064MB|  1332MB  |  103%
Swap (buffer)    | 2048MB|          |  100%
-----------------+-------+----------+---------
Grand Total      | 4112MB|          |
```

**Note**: Total exceeds 2GB physical RAM by 3%, but swap space (2GB) handles spikes. Under normal load, actual usage stays around 1.8GB.

---

## Detailed Implementation

### Step 1: Deploy Frontend to Vercel (FREE)

#### 1.1 Prepare Next.js for Production

Update `marrakea/next.config.mjs`:
```javascript
const nextConfig = {
  output: 'standalone',  // Enable standalone build for optimal size

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',  // Cloudflare R2 public URL
      },
      {
        protocol: 'https',
        hostname: 'api.marrakea.com',
      },
    ],
  },

  // Optimize for production
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
```

#### 1.2 Connect to Vercel

```bash
# Install Vercel CLI (optional, can also use web interface)
npm install -g vercel

# Login
vercel login

# Deploy from marrakea directory
cd /Users/othmaneessakhi/Developer/marrakea-global/marrakea
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: marrakea
# - Directory: ./
# - Build command: npm run build
# - Output directory: .next
# - Development command: npm run dev
```

#### 1.3 Configure Environment Variables in Vercel Dashboard

Go to: https://vercel.com/[your-username]/marrakea/settings/environment-variables

Add these variables:
```
NEXT_PUBLIC_BFF_URL=https://api.marrakea.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_USE_MOCK=false
BFF_URL=https://api.marrakea.com
NODE_ENV=production
```

#### 1.4 Add Custom Domain

1. Go to: Project Settings → Domains
2. Add domain: `marrakea.com`
3. Add domain: `www.marrakea.com`
4. Vercel will provide DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. Add these records to your domain registrar (Namecheap)

#### Vercel Free Tier Limits
- ✅ 100GB bandwidth/month (plenty for pre-revenue)
- ✅ Unlimited deployments
- ✅ Free SSL (automatic renewal)
- ✅ Edge CDN (global)
- ✅ 6,000 build minutes/month (you'll use ~10/month)
- ⚠️ 100GB-hours of serverless function execution (won't hit this)

---

### Step 2: Setup OVH VPS (€3.50/month)

#### 2.1 Order VPS

1. Go to: https://www.ovhcloud.com/en/vps/
2. Select: **VPS Starter** (€3.50/month)
   - 1 vCPU
   - 2GB RAM
   - 20GB SSD
   - 100 Mbps bandwidth
   - Location: **France (Gravelines)** - closest to Morocco
3. OS: **Ubuntu 22.04 LTS**
4. Add to cart and checkout

#### 2.2 Initial Server Setup

```bash
# SSH into server (password sent via email)
ssh ubuntu@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add swap space (CRITICAL for 2GB RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configure swap usage (use swap only when necessary)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Verify installation
docker --version
docker-compose --version
free -h  # Should show 2GB RAM + 2GB swap
```

#### 2.3 Security Hardening

```bash
# Create non-root user
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy

# Disable password auth for SSH (use keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Setup firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Install fail2ban (brute force protection)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

---

### Step 3: Setup External Free Services

#### 3.1 Upstash Redis (FREE)

1. Go to https://upstash.com
2. Sign up with GitHub
3. Create new Redis database:
   - **Name**: `marrakea-prod`
   - **Type**: Regional
   - **Region**: `eu-west-1` (Ireland - closest to France)
   - **Plan**: Free
4. Copy connection details:
   - **REST URL**: `https://xxx.upstash.io`
   - **Redis URL**: `rediss://default:xxx@eu1-xxx.upstash.io:6379`
5. Save for later (will add to `.env`)

**Free Tier Limits:**
- ✅ 10,000 commands/day (~6 commands/minute sustained)
- ✅ 256MB storage
- ✅ TLS included
- ✅ 1GB data transfer/month
- ⚠️ If exceeded: Upgrade to Pay-as-you-go ($0.20 per 100K commands)

**Usage Estimate:**
- Session read/write: ~2 commands per page view
- Cart operations: ~4 commands per add/update
- With 200 daily visitors: ~1,600 commands/day ✅ Well within limit

---

#### 3.2 Cloudflare R2 (FREE)

##### Step A: Create Cloudflare Account
1. Go to https://dash.cloudflare.com
2. Sign up (free account)
3. Verify email

##### Step B: Create R2 Bucket
1. Navigate to **R2 Object Storage** in left sidebar
2. Click **Create bucket**
3. Bucket name: `marrakea-uploads`
4. Location: **Automatic** (Cloudflare will optimize)
5. Click **Create bucket**

##### Step C: Generate API Tokens
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Token name: `marrakea-strapi-upload`
4. Permissions: **Object Read & Write**
5. Apply to specific bucket: `marrakea-uploads`
6. Click **Create API Token**
7. Copy and save:
   - **Access Key ID**: `xxx`
   - **Secret Access Key**: `xxx`
   - **Account ID**: Found in dashboard URL (`https://dash.cloudflare.com/{ACCOUNT_ID}/...`)

##### Step D: Get Bucket URL
1. Go to your bucket → **Settings**
2. Copy **Bucket URL**: `https://marrakea-uploads.{ACCOUNT_ID}.r2.cloudflarestorage.com`
3. Optional: Set up custom domain for public access (e.g., `media.marrakea.com`)

##### Step E: Configure Strapi to Use R2

Install AWS S3 plugin (R2 is S3-compatible):
```bash
cd /Users/othmaneessakhi/Developer/marrakea-global/cms
npm install @strapi/provider-upload-aws-s3
```

Create `cms/config/plugins.js`:
```javascript
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('CLOUDFLARE_ACCESS_KEY'),
        secretAccessKey: env('CLOUDFLARE_SECRET_KEY'),
        endpoint: `https://${env('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
        params: {
          Bucket: env('CLOUDFLARE_BUCKET'),
        },
        // R2-specific settings
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
```

Add to `cms/.env.production`:
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY=your_access_key_id
CLOUDFLARE_SECRET_KEY=your_secret_access_key
CLOUDFLARE_BUCKET=marrakea-uploads
```

**Free Tier Limits:**
- ✅ 10GB storage (~2,000 product images at 5MB each)
- ✅ 1 million Class A operations/month (uploads, lists)
- ✅ 10 million Class B operations/month (downloads)
- ✅ No egress fees (unlike S3!)
- ⚠️ If exceeded: $0.015/GB/month storage, minimal operation costs

**Usage Estimate:**
- 500 products × 3 images × 5MB = 7.5GB ✅
- 1000 visitors/day × 10 images = 10K downloads/day = 300K/month ✅

---

#### 3.3 UptimeRobot Monitoring (FREE)

1. Go to https://uptimerobot.com
2. Sign up (free account)
3. Add monitors:
   - **Monitor 1**: Frontend
     - Type: HTTPS
     - URL: `https://marrakea.com`
     - Interval: 5 minutes
   - **Monitor 2**: BFF API
     - Type: HTTPS
     - URL: `https://api.marrakea.com/health`
     - Interval: 5 minutes
   - **Monitor 3**: Strapi CMS
     - Type: HTTPS
     - URL: `https://cms.marrakea.com/_health`
     - Interval: 5 minutes
4. Set up alerts:
   - Email: your email
   - Slack: (optional)

**Free Tier:**
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Email + SMS alerts
- ✅ Public status page

---

### Step 4: Deploy Backend to VPS

#### 4.1 Directory Structure on VPS

```bash
# SSH as deploy user
ssh deploy@your-vps-ip

# Create directory structure
mkdir -p /opt/marrakea/{bff,cms,medusa,nginx,certbot}
cd /opt/marrakea

# Clone repository
git clone https://github.com/hotmane100/marrakea-global.git repo
```

#### 4.2 Create Docker Compose Configuration

Create `/opt/marrakea/docker-compose.yml`:

```yaml
version: '3.9'

services:
  # ---------------------------------------------------------------------------
  # NGINX Reverse Proxy (Lighter than Traefik - only 64MB RAM)
  # ---------------------------------------------------------------------------
  nginx:
    image: nginx:alpine
    container_name: marrakea_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - nginx-logs:/var/log/nginx
    networks:
      - marrakea
    depends_on:
      - bff
      - strapi
      - medusa
    deploy:
      resources:
        limits:
          memory: 64M
          cpus: '0.15'
        reservations:
          memory: 32M
          cpus: '0.05'
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/nginx-health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  # ---------------------------------------------------------------------------
  # Certbot for SSL (Runs once, then sleeps)
  # ---------------------------------------------------------------------------
  certbot:
    image: certbot/certbot:latest
    container_name: marrakea_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot; sleep 12h & wait $${!}; done;'"
    depends_on:
      - nginx

  # ---------------------------------------------------------------------------
  # BFF (Backend for Frontend)
  # ---------------------------------------------------------------------------
  bff:
    build:
      context: ./repo/bff
      dockerfile: Dockerfile.production
      args:
        NODE_ENV: production
    container_name: marrakea_bff
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - BFF_PORT=4000
      - STRAPI_BASE_URL=http://strapi:1337
      - STRAPI_API_TOKEN=${STRAPI_API_TOKEN}
      - MEDUSA_BASE_URL=http://medusa:9000
      - MEDUSA_PUBLISHABLE_KEY=${MEDUSA_PUBLISHABLE_KEY}
      - MEDUSA_REGION_ID=${MEDUSA_REGION_ID}
      - REDIS_URL=${UPSTASH_REDIS_URL}
      - CORS_ORIGINS=https://marrakea.com,https://www.marrakea.com
      - LOG_LEVEL=info
    networks:
      - marrakea
    depends_on:
      strapi:
        condition: service_healthy
      medusa:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 300M
          cpus: '0.3'
        reservations:
          memory: 200M
          cpus: '0.15'
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 45s
    volumes:
      - bff-logs:/var/log/bff

  # ---------------------------------------------------------------------------
  # Strapi CMS
  # ---------------------------------------------------------------------------
  strapi:
    build:
      context: ./repo/cms
      dockerfile: Dockerfile.production
      args:
        NODE_ENV: production
    container_name: marrakea_strapi
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
      - PORT=1337
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=strapi-db
      - DATABASE_PORT=5432
      - DATABASE_NAME=strapi
      - DATABASE_USERNAME=strapi
      - DATABASE_PASSWORD=${STRAPI_DB_PASSWORD}
      - DATABASE_SSL=false
      - JWT_SECRET=${STRAPI_JWT_SECRET}
      - ADMIN_JWT_SECRET=${STRAPI_ADMIN_JWT_SECRET}
      - APP_KEYS=${STRAPI_APP_KEYS}
      - API_TOKEN_SALT=${STRAPI_API_TOKEN_SALT}
      - TRANSFER_TOKEN_SALT=${STRAPI_TRANSFER_TOKEN_SALT}
      # Cloudflare R2 configuration
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - CLOUDFLARE_ACCESS_KEY=${CLOUDFLARE_ACCESS_KEY}
      - CLOUDFLARE_SECRET_KEY=${CLOUDFLARE_SECRET_KEY}
      - CLOUDFLARE_BUCKET=${CLOUDFLARE_BUCKET}
    networks:
      - marrakea
    depends_on:
      strapi-db:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 600M
          cpus: '0.4'
        reservations:
          memory: 400M
          cpus: '0.2'
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:1337/_health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s
    volumes:
      - strapi-logs:/opt/app/logs

  # ---------------------------------------------------------------------------
  # Medusa E-Commerce Backend
  # ---------------------------------------------------------------------------
  medusa:
    build:
      context: ./repo/medusa/my-medusa-store
      dockerfile: Dockerfile.production
      args:
        NODE_ENV: production
    container_name: marrakea_medusa
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://medusa:${MEDUSA_DB_PASSWORD}@medusa-db:5432/medusa
      - REDIS_URL=${UPSTASH_REDIS_URL}
      - JWT_SECRET=${MEDUSA_JWT_SECRET}
      - COOKIE_SECRET=${MEDUSA_COOKIE_SECRET}
      - STRIPE_API_KEY=${STRIPE_API_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - STORE_CORS=https://marrakea.com,https://www.marrakea.com,https://api.marrakea.com
      - ADMIN_CORS=https://admin.marrakea.com,https://api.marrakea.com
      - AUTH_CORS=https://marrakea.com,https://www.marrakea.com
    networks:
      - marrakea
    depends_on:
      medusa-db:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 800M
          cpus: '0.5'
        reservations:
          memory: 500M
          cpus: '0.25'
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    volumes:
      - medusa-logs:/server/logs

  # ---------------------------------------------------------------------------
  # PostgreSQL for Strapi
  # ---------------------------------------------------------------------------
  strapi-db:
    image: postgres:16-alpine
    container_name: marrakea_strapi_db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=${STRAPI_DB_PASSWORD}
      - POSTGRES_DB=strapi
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
      - PGDATA=/var/lib/postgresql/data/pgdata
    networks:
      - marrakea
    volumes:
      - strapi-db-data:/var/lib/postgresql/data
      - ./backups/strapi:/backups
    deploy:
      resources:
        limits:
          memory: 150M
          cpus: '0.2'
        reservations:
          memory: 100M
          cpus: '0.1'
    command:
      - "postgres"
      - "-c"
      - "max_connections=20"
      - "-c"
      - "shared_buffers=32MB"
      - "-c"
      - "effective_cache_size=128MB"
      - "-c"
      - "maintenance_work_mem=16MB"
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=4MB"
      - "-c"
      - "random_page_cost=1.1"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strapi -d strapi"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # ---------------------------------------------------------------------------
  # PostgreSQL for Medusa
  # ---------------------------------------------------------------------------
  medusa-db:
    image: postgres:15-alpine
    container_name: marrakea_medusa_db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=medusa
      - POSTGRES_PASSWORD=${MEDUSA_DB_PASSWORD}
      - POSTGRES_DB=medusa
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8
      - PGDATA=/var/lib/postgresql/data/pgdata
    networks:
      - marrakea
    volumes:
      - medusa-db-data:/var/lib/postgresql/data
      - ./backups/medusa:/backups
    deploy:
      resources:
        limits:
          memory: 150M
          cpus: '0.2'
        reservations:
          memory: 100M
          cpus: '0.1'
    command:
      - "postgres"
      - "-c"
      - "max_connections=20"
      - "-c"
      - "shared_buffers=32MB"
      - "-c"
      - "effective_cache_size=128MB"
      - "-c"
      - "maintenance_work_mem=16MB"
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=4MB"
      - "-c"
      - "random_page_cost=1.1"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa -d medusa"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

# =============================================================================
# NETWORKS
# =============================================================================
networks:
  marrakea:
    name: marrakea-net
    driver: bridge

# =============================================================================
# VOLUMES
# =============================================================================
volumes:
  nginx-logs:
    driver: local
  bff-logs:
    driver: local
  strapi-logs:
    driver: local
  medusa-logs:
    driver: local
  strapi-db-data:
    driver: local
  medusa-db-data:
    driver: local
```

---

#### 4.3 Create Production Dockerfiles

**bff/Dockerfile.production:**
```dockerfile
# =============================================================================
# BFF Production Dockerfile - Optimized for Memory
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci --ignore-scripts

COPY src ./src
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Install wget for health checks
RUN apk add --no-cache wget dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bffuser

# Copy built files
COPY --from=builder --chown=bffuser:nodejs /app/dist ./dist
COPY --from=deps --chown=bffuser:nodejs /app/node_modules ./node_modules
COPY --chown=bffuser:nodejs package.json ./

USER bffuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["dumb-init", "node", "dist/main.js"]
```

**cms/Dockerfile.production:**
```dockerfile
# =============================================================================
# Strapi CMS Production Dockerfile - Optimized for Memory
# =============================================================================

FROM node:18-alpine AS base
WORKDIR /opt/app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install dependencies for building
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev

# Stage 1: Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /opt/app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install runtime dependencies
RUN apk add --no-cache \
    vips-dev \
    wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 strapi

# Copy built application
COPY --from=builder --chown=strapi:nodejs /opt/app/dist ./dist
COPY --from=builder --chown=strapi:nodejs /opt/app/public ./public
COPY --from=deps --chown=strapi:nodejs /opt/app/node_modules ./node_modules
COPY --chown=strapi:nodejs package.json ./

# Create necessary directories
RUN mkdir -p /opt/app/public/uploads /opt/app/logs && \
    chown -R strapi:nodejs /opt/app

USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

CMD ["node", "dist/server.js"]
```

**medusa/my-medusa-store/Dockerfile.production:**
```dockerfile
# =============================================================================
# Medusa Production Dockerfile - Optimized for Memory
# =============================================================================

FROM node:20-alpine AS base
WORKDIR /server

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=768"

# Stage 1: Dependencies
FROM base AS deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production

# Stage 2: Builder
FROM base AS builder
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /server

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=768"

# Install runtime tools
RUN apk add --no-cache wget dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# Copy built application
COPY --from=builder --chown=medusa:nodejs /server/dist ./dist
COPY --from=deps --chown=medusa:nodejs /server/node_modules ./node_modules
COPY --chown=medusa:nodejs package.json medusa-config.js ./

# Create logs directory
RUN mkdir -p /server/logs && chown medusa:nodejs /server/logs

USER medusa

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

CMD ["dumb-init", "node", "dist/main.js"]
```

---

#### 4.4 Create NGINX Configuration

**nginx/nginx.conf:**
```nginx
user nginx;
worker_processes 1;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 512;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=5r/s;

    # Upstream backends
    upstream bff {
        server bff:4000 max_fails=3 fail_timeout=30s;
    }

    upstream strapi {
        server strapi:1337 max_fails=3 fail_timeout=30s;
    }

    upstream medusa {
        server medusa:9000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name api.marrakea.com cms.marrakea.com admin.marrakea.com;

        # ACME challenge for Let's Encrypt
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # BFF API (api.marrakea.com)
    server {
        listen 443 ssl http2;
        server_name api.marrakea.com;

        ssl_certificate /etc/letsencrypt/live/api.marrakea.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.marrakea.com/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://bff;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }

    # Strapi CMS Admin (cms.marrakea.com)
    server {
        listen 443 ssl http2;
        server_name cms.marrakea.com;

        ssl_certificate /etc/letsencrypt/live/cms.marrakea.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/cms.marrakea.com/privkey.pem;

        # SSL configuration (same as above)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            limit_req zone=admin_limit burst=10 nodelay;

            proxy_pass http://strapi;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            proxy_connect_timeout 90s;
            proxy_send_timeout 90s;
            proxy_read_timeout 90s;
        }
    }

    # Medusa Admin (admin.marrakea.com)
    server {
        listen 443 ssl http2;
        server_name admin.marrakea.com;

        ssl_certificate /etc/letsencrypt/live/admin.marrakea.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/admin.marrakea.com/privkey.pem;

        # SSL configuration (same as above)
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            limit_req zone=admin_limit burst=10 nodelay;

            proxy_pass http://medusa;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            proxy_connect_timeout 120s;
            proxy_send_timeout 120s;
            proxy_read_timeout 120s;
        }
    }

    # Health check endpoint for nginx itself
    server {
        listen 80;
        server_name localhost;

        location /nginx-health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

#### 4.5 Create Environment Variables File

Create `/opt/marrakea/.env`:

```bash
# =============================================================================
# MARRAKEA Production Environment Variables
# =============================================================================
# SECURITY: This file contains production secrets. Never commit to git.
# =============================================================================

# ---------------------------------------------------------------------------
# Database Passwords
# ---------------------------------------------------------------------------
STRAPI_DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD_1
MEDUSA_DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD_2

# ---------------------------------------------------------------------------
# Strapi Secrets (generate with: openssl rand -base64 32)
# ---------------------------------------------------------------------------
STRAPI_JWT_SECRET=CHANGE_ME_JWT_SECRET_64_CHARS
STRAPI_ADMIN_JWT_SECRET=CHANGE_ME_ADMIN_JWT_SECRET_64_CHARS
STRAPI_APP_KEYS=CHANGE_ME_KEY1,CHANGE_ME_KEY2,CHANGE_ME_KEY3,CHANGE_ME_KEY4
STRAPI_API_TOKEN_SALT=CHANGE_ME_API_TOKEN_SALT_64_CHARS
STRAPI_TRANSFER_TOKEN_SALT=CHANGE_ME_TRANSFER_TOKEN_SALT_64_CHARS

# Strapi API Token (generate after first login to admin panel)
STRAPI_API_TOKEN=CHANGE_ME_AFTER_STRAPI_SETUP

# ---------------------------------------------------------------------------
# Medusa Secrets
# ---------------------------------------------------------------------------
MEDUSA_JWT_SECRET=CHANGE_ME_MEDUSA_JWT_SECRET_64_CHARS
MEDUSA_COOKIE_SECRET=CHANGE_ME_MEDUSA_COOKIE_SECRET_64_CHARS

# Medusa Keys (get from admin panel after setup)
MEDUSA_PUBLISHABLE_KEY=pk_CHANGE_ME_FROM_MEDUSA_ADMIN
MEDUSA_REGION_ID=reg_CHANGE_ME_FROM_MEDUSA_ADMIN

# ---------------------------------------------------------------------------
# Stripe (Production Keys)
# ---------------------------------------------------------------------------
STRIPE_API_KEY=sk_live_CHANGE_ME_FROM_STRIPE_DASHBOARD
STRIPE_WEBHOOK_SECRET=whsec_CHANGE_ME_FROM_STRIPE_WEBHOOK_CONFIG

# ---------------------------------------------------------------------------
# Upstash Redis (Free Tier)
# ---------------------------------------------------------------------------
UPSTASH_REDIS_URL=rediss://default:CHANGE_ME@eu1-xxx.upstash.io:6379

# ---------------------------------------------------------------------------
# Cloudflare R2 (Free Tier)
# ---------------------------------------------------------------------------
CLOUDFLARE_ACCOUNT_ID=CHANGE_ME_YOUR_CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ACCESS_KEY=CHANGE_ME_YOUR_R2_ACCESS_KEY
CLOUDFLARE_SECRET_KEY=CHANGE_ME_YOUR_R2_SECRET_KEY
CLOUDFLARE_BUCKET=marrakea-uploads
```

**Generate strong secrets:**
```bash
# On your local machine or VPS
for i in {1..10}; do openssl rand -base64 32; done
```

---

#### 4.6 SSL Certificate Setup

**Initial certificate generation:**
```bash
# On VPS
cd /opt/marrakea

# Start nginx without SSL first (will fail gracefully)
docker-compose up -d nginx

# Generate certificates
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@marrakea.com \
  --agree-tos \
  --no-eff-email \
  -d api.marrakea.com \
  -d cms.marrakea.com \
  -d admin.marrakea.com

# Restart nginx with SSL
docker-compose restart nginx
```

**Test certificate renewal:**
```bash
docker-compose run --rm certbot renew --dry-run
```

---

#### 4.7 Deploy All Services

```bash
# On VPS
cd /opt/marrakea

# Build and start all services
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f --tail=100

# Monitor resource usage
watch docker stats
```

---

### Step 5: DNS Configuration

Add these DNS records to your domain registrar (Namecheap):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `[Vercel IP]` | 300 |
| CNAME | www | cname.vercel-dns.com | 300 |
| A | api | `[VPS IP]` | 300 |
| A | cms | `[VPS IP]` | 300 |
| A | admin | `[VPS IP]` | 300 |

**Get Vercel IP:**
```bash
dig marrakea.com
# Or from Vercel dashboard under Domains
```

---

### Step 6: Post-Deployment Configuration

#### 6.1 Initialize Strapi

1. Go to `https://cms.marrakea.com/admin`
2. Create admin user
3. Navigate to **Settings** → **API Tokens** → **Create new API Token**
   - Name: `BFF API Token`
   - Type: Full access (or custom with read permissions)
   - Copy token
4. Update `/opt/marrakea/.env`:
   ```bash
   STRAPI_API_TOKEN=YOUR_ACTUAL_TOKEN_HERE
   ```
5. Restart BFF:
   ```bash
   docker-compose restart bff
   ```

#### 6.2 Initialize Medusa

1. Create admin user:
   ```bash
   docker exec -it marrakea_medusa \
     npx medusa user -e admin@marrakea.com -p YOUR_SECURE_PASSWORD
   ```

2. Go to `https://admin.marrakea.com`
3. Login with created credentials
4. Navigate to **Settings** → **Regions**
   - Copy Region ID (e.g., `reg_01...`)
5. Navigate to **Settings** → **Publishable API Keys**
   - Copy Publishable Key (e.g., `pk_01...`)
6. Update `/opt/marrakea/.env`:
   ```bash
   MEDUSA_PUBLISHABLE_KEY=pk_01...
   MEDUSA_REGION_ID=reg_01...
   ```
7. Restart BFF:
   ```bash
   docker-compose restart bff
   ```

#### 6.3 Verify Everything Works

Test each endpoint:
```bash
# Frontend
curl -I https://marrakea.com
# Expected: 200 OK

# BFF Health
curl https://api.marrakea.com/health
# Expected: {"status":"ok"}

# Strapi Health
curl https://cms.marrakea.com/_health
# Expected: {"status":"ok"}

# Medusa Health
curl https://admin.marrakea.com/health
# Expected: {"status":"ok"}
```

---

## Monthly Cost Breakdown

### Final Cost Summary

| Service | Provider | Plan | Monthly Cost | Annual Cost |
|---------|----------|------|--------------|-------------|
| **Frontend** | Vercel | Hobby | $0 | $0 |
| **Backend VPS** | OVH | VPS Starter | €3.50 | €42 |
| **Redis** | Upstash | Free | $0 | $0 |
| **Object Storage** | Cloudflare R2 | Free | $0 | $0 |
| **Monitoring** | UptimeRobot | Free | $0 | $0 |
| **SSL** | Let's Encrypt | Free | $0 | $0 |
| **Domain** | Namecheap | .com | $1.00 | $12 |
| **TOTAL** | | | **€4.50** | **€54** |
| **TOTAL (USD)** | | | **~$4.85** | **~$58** |

### Cost Projections

| Stage | Monthly Revenue | Infrastructure Cost | % of Revenue |
|-------|-----------------|---------------------|--------------|
| **Pre-Revenue** | $0 | €4.50 (~$5) | N/A |
| **Launch Phase** | $0-500 | €4.50 (~$5) | 1-∞% |
| **Early Traction** | $500-1,000 | €4.50 (~$5) | 0.5-1% |
| **Growth Phase** | $1,000-5,000 | €8 (~$9) | 0.2-0.9% |
| **Scale Phase** | $5,000-10,000 | €16 (~$17) | 0.17-0.34% |
| **Established** | $10,000+ | $125-175 | 1.25-1.75% |

---

## Migration Roadmap

### Phase 1: Pre-Revenue (Current)
**Monthly Cost: €4.50 (~$5)**

**Infrastructure:**
- Vercel (Frontend) - Free
- OVH VPS Starter (Backend) - €3.50
- Upstash Redis - Free
- Cloudflare R2 - Free

**Capacity:**
- ~1,000 visitors/day
- ~100 orders/month
- ~500 products
- ~7GB media storage

**Action Required:** None - Monitor usage

---

### Phase 2: First €1,000/month Revenue
**Monthly Cost: €4.50 (~$5) - NO CHANGE**

**Metrics to Watch:**
- VPS RAM usage (should stay < 85%)
- VPS CPU usage (should stay < 70%)
- Upstash Redis commands (should stay < 8,000/day)
- R2 storage (should stay < 8GB)

**Scale Triggers:**
- ⚠️ RAM usage sustained > 85%
- ⚠️ CPU usage sustained > 70%
- ⚠️ Redis commands > 9,000/day consistently
- ⚠️ R2 storage > 9GB

**Action Required:** Monitor weekly, prepare for Phase 3

---

### Phase 3: €1,000-5,000/month Revenue
**Monthly Cost: €8 (~$9) - UPGRADE VPS**

**When to Upgrade:**
- Sustained RAM > 85% for 1 week
- OR Response times degrading (>2s p95)
- OR Planning marketing campaigns

**New Infrastructure:**
- Vercel (Frontend) - Free
- **Hetzner CPX21** (Backend) - €7.96
  - 3 vCPU (up from 1)
  - 4GB RAM (up from 2GB)
  - 80GB SSD (up from 20GB)
- Upstash Redis - Free (may need to upgrade if >10K/day)
- Cloudflare R2 - Free (pay if >10GB)

**Migration Steps:**
1. Order Hetzner VPS
2. Deploy stack on new VPS (parallel)
3. Test thoroughly
4. Update DNS to point to new VPS
5. Monitor for 48 hours
6. Cancel OVH VPS

**Estimated Downtime:** 0 minutes (parallel deployment)

---

### Phase 4: €5,000-10,000/month Revenue
**Monthly Cost: €16 (~$17) - SPLIT SERVICES**

**When to Upgrade:**
- Sustained CPU > 70% for 1 week
- OR Need zero-downtime deployments
- OR Backup/restore taking too long

**New Infrastructure:**
- Vercel (Frontend) - Free
- **Hetzner CPX21** (Frontend APIs) - €7.96
  - BFF only
  - Fast response times
- **Hetzner CPX21** (Backend Services) - €7.96
  - Strapi + Medusa + DBs
  - Isolated from frontend load
- Upstash Redis Pro - $10/month (if needed)
- Cloudflare R2 - $2-5/month (if >10GB)

**Benefits:**
- Zero-downtime deploys (rolling updates)
- Better fault isolation
- Easier to scale individual components

**Migration Complexity:** Medium (2-4 hours)

---

### Phase 5: €10,000+/month Revenue
**Monthly Cost: $125-175 - MANAGED SERVICES**

**When to Upgrade:**
- Developer time > Infrastructure cost savings
- Need advanced features (auto-scaling, managed backups)
- 24/7 uptime requirements

**New Infrastructure:**
- **Vercel Pro** - $20/month
  - Priority builds
  - Advanced analytics
  - Image optimization
- **Railway Pro** (BFF) - $50-100/month
  - Auto-scaling
  - Zero-downtime deploys
  - Managed backups
- **Supabase Pro** (PostgreSQL) - $25/month
  - Managed database
  - Auto backups
  - Point-in-time recovery
- **Upstash Pro** (Redis) - $10/month
  - Higher limits
  - Multi-region
- **Cloudflare Pro** - $20/month
  - Advanced DDoS protection
  - Image optimization
  - WAF rules

**Benefits:**
- Focus 100% on product/sales
- Better reliability (99.9% SLA)
- Advanced features (auto-scaling, metrics)
- Support from providers

**Migration Complexity:** High (1-2 weeks planning)

---

## Risk Assessment

### Free Tier Risks & Mitigations

| Service | Limit | Risk | Impact | Mitigation | Probability |
|---------|-------|------|--------|------------|-------------|
| **Vercel Bandwidth** | 100GB/month | Overage | Site down | Image optimization, CDN | Low |
| **Upstash Redis** | 10K cmds/day | Overage | Cart issues | Cache on BFF, upgrade plan | Low |
| **Cloudflare R2** | 10GB storage | Overage | Upload fails | Image compression, WebP | Medium |
| **OVH VPS RAM** | 2GB physical | OOM kill | Services crash | Swap space, resource limits | Medium |
| **OVH VPS CPU** | 1 vCPU | Slow response | Bad UX | Upgrade VPS | Low |
| **Database Size** | 20GB disk | Disk full | Data loss | Regular cleanup, upgrade VPS | Low |

### Recommended Monitoring

**Set up alerts for:**
- VPS RAM > 85% sustained
- VPS CPU > 70% sustained
- Disk usage > 80%
- Any service health check failing
- Upstash Redis > 8,000 commands/day
- R2 storage > 8GB

**Use UptimeRobot (free) for:**
- Endpoint monitoring (5min intervals)
- Email alerts
- Public status page

**Manual checks (weekly):**
```bash
# SSH into VPS
ssh deploy@your-vps-ip

# Check resource usage
docker stats --no-stream

# Check disk space
df -h

# Check service logs
docker-compose logs --tail=100
```

---

## Performance Expectations

### Expected Response Times

| Endpoint | Target | Maximum |
|----------|--------|---------|
| Frontend (Vercel) | <500ms | <1s |
| BFF API | <200ms | <500ms |
| Strapi CMS | <300ms | <1s |
| Medusa API | <400ms | <1s |

### Expected Throughput

| Metric | Capacity |
|--------|----------|
| Concurrent users | ~100 |
| Requests/second | ~50 |
| Daily visitors | ~1,000 |
| Monthly orders | ~500 |
| Products | ~1,000 |

### Performance Optimization Tips

1. **Enable Caching on BFF:**
   - Cache product lists (60s TTL)
   - Cache article lists (120s TTL)
   - Cache gestures/territories (1h TTL)

2. **Optimize Images:**
   - Resize before upload (max 2000px width)
   - Use WebP format (70% smaller)
   - Enable Cloudflare image optimization

3. **Database Query Optimization:**
   - Add indexes on commonly queried fields
   - Use pagination (limit 50 items/page)
   - Avoid N+1 queries

4. **Frontend Optimization:**
   - Use Next.js Image component
   - Enable static generation where possible
   - Lazy load below-the-fold content

---

## Backup Strategy

### Automated Backups

**Database Backups:**
```bash
# Add to crontab on VPS
0 2 * * * docker exec marrakea_strapi_db pg_dump -U strapi strapi | gzip > /opt/marrakea/backups/strapi/strapi-$(date +\%Y\%m\%d).sql.gz
0 3 * * * docker exec marrakea_medusa_db pg_dump -U medusa medusa | gzip > /opt/marrakea/backups/medusa/medusa-$(date +\%Y\%m\%d).sql.gz
```

**Retention:**
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

**Backup to S3 (when revenue allows):**
```bash
# Daily at 4am
0 4 * * * aws s3 sync /opt/marrakea/backups s3://marrakea-backups/ --delete
```

**Manual Backup:**
```bash
# On VPS
cd /opt/marrakea
./scripts/backup.sh
```

### Disaster Recovery

**Scenario 1: VPS Failure**
1. Order new VPS (~10 minutes)
2. Deploy docker-compose (~20 minutes)
3. Restore database backups (~10 minutes)
4. Update DNS (~5 minutes, up to 1h propagation)
**Total Recovery Time:** ~1-2 hours

**Scenario 2: Database Corruption**
1. Stop affected service
2. Restore from last good backup
3. Restart service
**Total Recovery Time:** ~10-15 minutes

---

## Next Steps

### Immediate Actions (Week 1)

- [ ] **Order OVH VPS** (€3.50/month)
- [ ] **Sign up for Vercel** (Free)
- [ ] **Sign up for Upstash** (Free Redis)
- [ ] **Sign up for Cloudflare** (Free R2)
- [ ] **Register domain** on Namecheap ($12/year)
- [ ] **Setup VPS** (Docker, swap, security)
- [ ] **Deploy backend** to VPS
- [ ] **Deploy frontend** to Vercel
- [ ] **Configure DNS** records
- [ ] **Generate SSL** certificates
- [ ] **Setup monitoring** (UptimeRobot)
- [ ] **Test end-to-end** checkout flow

### Week 2-4: Optimization

- [ ] **Configure Cloudflare R2** for Strapi uploads
- [ ] **Enable BFF caching** (Redis + in-memory)
- [ ] **Optimize images** (WebP, compression)
- [ ] **Add database indexes** for common queries
- [ ] **Setup automated backups**
- [ ] **Create monitoring dashboard**
- [ ] **Load test** with realistic traffic
- [ ] **Document runbooks** for common issues

### Ongoing: Growth

- [ ] **Monitor metrics weekly**
  - VPS resource usage
  - Response times
  - Error rates
  - Free tier usage
- [ ] **Optimize based on data**
  - Add caching where slow
  - Add indexes where queries slow
  - Compress images further
- [ ] **Plan for scale**
  - When to upgrade VPS
  - When to split services
  - When to move to managed services

---

## Support & Resources

### Documentation Links

- **Vercel Docs**: https://vercel.com/docs
- **OVH VPS Guide**: https://docs.ovh.com/gb/en/vps/
- **Docker Docs**: https://docs.docker.com
- **Upstash Docs**: https://docs.upstash.com
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Strapi Docs**: https://docs.strapi.io
- **Medusa Docs**: https://docs.medusajs.com

### Community Support

- **Vercel Discord**: https://vercel.com/discord
- **Medusa Discord**: https://discord.gg/medusajs
- **Strapi Discord**: https://discord.strapi.io
- **Docker Forum**: https://forums.docker.com

### Emergency Contacts

- **OVH Support**: support@ovh.com (response time: 24-48h)
- **Cloudflare Support**: https://support.cloudflare.com (free tier: community only)
- **Upstash Support**: support@upstash.com (free tier: best effort)

---

## Appendix: Cost Calculator

### Monthly Cost Calculator

Use this calculator to estimate costs at different revenue levels:

```
Revenue Level: €________/month

Infrastructure Costs:
- VPS: €3.50 (or €8 if upgraded)
- Redis: €0 (free tier) or $10 (pro)
- R2 Storage: €0 (free tier) or $0.015/GB
- Domain: €1
- Total: €________

Infrastructure as % of Revenue: ________%

Recommendation:
- If % < 2%: Current setup is cost-efficient ✅
- If % > 2% AND revenue < €5K: Consider optimization
- If % > 5%: Time to upgrade or optimize
```

### ROI Analysis

**Break-even Analysis:**
- Fixed cost: €4.50/month
- Variable cost: ~3% (payment processing)
- Average order value: €50
- Break-even orders: 1 order/month

**Profit Margin by Scale:**
- At €1,000/month revenue: 99.5% net margin
- At €5,000/month revenue: 99.8% net margin
- At €10,000/month revenue: 99.8% net margin

**Conclusion:** Infrastructure costs are negligible compared to revenue potential. Focus on growth, not cost optimization, until €10K/month.

---

## Conclusion

This deployment strategy provides:

✅ **Minimal Cost**: €4.50-5/month (~$5-6)
✅ **Production-Ready**: SSL, monitoring, backups
✅ **Scalable**: Clear upgrade path as revenue grows
✅ **Maintainable**: Simple architecture, good documentation
✅ **Professional**: No cold starts, fast response times

**The hybrid approach** (free Vercel frontend + cheap VPS backend) offers the best balance of cost, performance, and flexibility for a pre-revenue e-commerce startup.

**Total first-year cost: ~€54 ($58)**

That's less than the cost of a single domain on some premium hosting providers, yet you get a complete, production-grade e-commerce platform.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-29
**Author:** Claude Code Assistant
**Status:** Ready for Implementation
