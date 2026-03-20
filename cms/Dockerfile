FROM node:20-alpine

# Installer dépendances pour build Strapi (Sharp, SQLite, etc.)
RUN apk add --no-cache python3 make g++ bash

WORKDIR /opt/app

# Copier package.json et yarn.lock
COPY package*.json ./

# Installer les dépendances
RUN yarn install

# Copier tout le code
COPY . .

# Build Strapi en root avec limite mémoire
RUN node --max-old-space-size=1024 $(yarn bin)/strapi build

# Changer les permissions pour l’utilisateur node
RUN chown -R node:node /opt/app

# Passer à node pour l’exécution
USER node

EXPOSE 1337
CMD ["yarn", "develop"]
