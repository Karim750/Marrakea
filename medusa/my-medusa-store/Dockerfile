# Stage 1 : builder
FROM node:20-alpine AS builder
WORKDIR /server

# Activer Yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copier package.json et yarn.lock
COPY package.json yarn.lock ./

# Installer toutes les dépendances (y compris dev)
RUN yarn install

# Copier le reste du code
COPY . .

# Installer ts-node globalement pour pouvoir lancer TS directement
RUN yarn add ts-node -D

# Optionnel : builder admin si nécessaire
WORKDIR /server/admin
RUN yarn install
RUN NODE_OPTIONS="--max_old_space_size=4096" yarn build

# Stage 2 : image finale prod avec TS
FROM node:20-alpine
WORKDIR /server

# Copier tout depuis le builder
COPY --from=builder /server .

# Installer ts-node et toutes les dépendances nécessaires pour le runtime TS
RUN yarn install --frozen-lockfile

# Exposer le port
EXPOSE 9000

# Lancer Medusa en TS
CMD ["ts-node", "-r", "tsconfig-paths/register", "medusa-config.ts"]
