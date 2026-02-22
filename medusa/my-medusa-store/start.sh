#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is up."

echo "Waiting for Redis..."
until nc -z redis 6379; do
  sleep 1
done
echo "Redis is up."

# Run migrations (idempotent)
echo "Running migrations..."
if [ -f yarn.lock ]; then
  yarn medusa db:migrate || npx medusa db:migrate
elif [ -f pnpm-lock.yaml ]; then
  pnpm medusa db:migrate || npx medusa db:migrate
else
  npx medusa db:migrate
fi

echo "Starting Medusa in dev mode..."
# Prefer package.json script if available
if node -e "const p=require('./package.json'); if(p.scripts && (p.scripts.dev||p.scripts.develop)){process.exit(0)}else{process.exit(1)}"; then
  if node -e "const p=require('./package.json'); if(p.scripts && p.scripts.dev){process.exit(0)}else{process.exit(1)}"; then
    if [ -f yarn.lock ]; then yarn dev; elif [ -f pnpm-lock.yaml ]; then pnpm dev; else npm run dev; fi
  else
    if [ -f yarn.lock ]; then yarn develop; elif [ -f pnpm-lock.yaml ]; then pnpm develop; else npm run develop; fi
  fi
else
  npx medusa develop
fi
