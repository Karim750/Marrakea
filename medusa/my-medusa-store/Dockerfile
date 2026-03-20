# Stage 1 : builder
FROM node:20-alpine AS builder
WORKDIR /server

# Copier tout le code dès le début
COPY . .

# Installer les dépendances avec node_modules classique
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install

# Builder le front Medusa
RUN NODE_OPTIONS="--max_old_space_size=1536" yarn build

# Stage 2 : image finale prod
FROM node:20-alpine
WORKDIR /server

# Copier depuis le builder
COPY --from=builder /server .

# Installer uniquement les dépendances de prod
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install --production

# Exposer le port prod
EXPOSE 9000

# Lancer Medusa en prod
CMD ["yarn", "start"]
