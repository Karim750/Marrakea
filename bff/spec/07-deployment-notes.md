# Deployment Notes (v1)

Operational notes for deploying the BFF in staging/production.

---

## 1) Environment Variables

Required:
- `BFF_PORT=4000`
- `NODE_ENV=development|production`
- `STRAPI_BASE_URL=http://localhost:1337`
- `STRAPI_API_TOKEN=...`
- `MEDUSA_BASE_URL=http://localhost:9000`
- `MEDUSA_PUBLISHABLE_KEY=...`
- `MEDUSA_REGION_ID=...`

Recommended:
- `COOKIE_DOMAIN=.marrakea.com`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `LOG_LEVEL=info`

---

## 2) CORS

Allow origins:
- `https://marrakea.com`
- `https://www.marrakea.com`
- `http://localhost:3000`

Must set:
- `Access-Control-Allow-Credentials: true`
- No wildcard origin in production

---

## 3) Cookies / Sessions

The BFF stores Medusa customer token in an httpOnly cookie:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: none` in production (cross-site)
- `domain: .marrakea.com` if needed for subdomains

Frontend must call with:
- `credentials: "include"`

---

## 4) Reverse Proxy / Trust Proxy

If behind a proxy (nginx/vercel), enable trust proxy so rate limiting and IP logging work:
- trust `X-Forwarded-For`

---

## 5) Observability

- Generate `requestId` per incoming request
- Log upstream calls with:
  - url path
  - status
  - duration
- Never log tokens or authorization headers

---

## 6) Caching

Catalog and blog endpoints must set Cache-Control per contract:
- list/detail products: `s-maxage=60`
- featured: `s-maxage=300`
- gestures/territories: `s-maxage=3600`
- articles: `s-maxage=120`
All transactional endpoints: `no-store`

---

## 7) Release checklist

- ✅ Strapi content types created
- ✅ product-pages populated with medusa ids
- ✅ Medusa region + pricing working in Store API
- ✅ Postman upstream tests passing
- ✅ BFF Postman collection green
- ✅ CORS + cookies verified in browser
