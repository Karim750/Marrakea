# Stage 1 : builder
FROM node:20-alpine AS builder
WORKDIR /server

# 1. Copier uniquement package.json et yarn.lock
COPY package.json yarn.lock ./

# Installer les dépendances avec node_modules classique
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install

# 3. Copier tout le code
COPY . .

#Installer et builder le front séparément
WORKDIR /server/admin
RUN yarn install
RUN NODE_OPTIONS="--max_old_space_size=4096" yarn build

# Stage 2 : image finale prod
FROM node:20-alpine
WORKDIR /server

# Copier depuis le builder
COPY --from=builder /server .

# Installer uniquement les dépendances de prod
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install

# Exposer le port prod
EXPOSE 9000

# Lancer Medusa en prod
CMD ["yarn", "start"]
