FROM node:20-alpine

WORKDIR /server

# Install dependencies first (better layer caching)
COPY package.json ./
# Copy lockfile if present
COPY yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Copy Yarn 4 config and releases (needed for modern Yarn)
COPY .yarnrc.yml* ./
COPY .yarn/ ./.yarn/

# Install using the lockfile that exists (prefer yarn.lock, then pnpm-lock.yaml, then package-lock.json)
RUN if [ -f yarn.lock ]; then corepack enable && yarn install --immutable; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Copy source
COPY . .

# Ensure start script is executable
RUN chmod +x ./start.sh

EXPOSE 9000 5173

CMD ["./start.sh"]
