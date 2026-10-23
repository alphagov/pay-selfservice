FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS base

RUN apk upgrade --no-cache

FROM base AS builder

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.19.1

WORKDIR /build-stage
COPY package.json package-lock.json .npmrc ./
RUN npm ci --quiet
COPY . ./
RUN npm run compile

FROM base AS final

RUN apk add --no-cache tini \
    && rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm \
        /usr/local/bin/npx \
        /usr/local/bin/corepack \
        /opt/yarn-* \
        /usr/local/bin/yarn \
        /usr/local/bin/yarnpkg

WORKDIR /app
COPY --from=builder /build-stage/dist ./
ENV PORT=9000
EXPOSE 9000
ENTRYPOINT ["tini", "--"]
CMD ["node", "application.js"]