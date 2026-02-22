FROM node:22-alpine
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN chown -R node:node /opt/app
USER node
RUN ["yarn", "build"]
# Copy schema.json and component JSON files into dist (TS compiler doesn't emit them)
RUN find src -name "schema.json" -exec sh -c 'mkdir -p "dist/$(dirname "$1")" && cp "$1" "dist/$1"' _ {} \; \
    && if [ -d src/components ]; then cp -r src/components dist/src/components; fi
# Create favicon to prevent 500 errors
RUN touch favicon.png
EXPOSE 1337
CMD ["yarn", "develop"]
