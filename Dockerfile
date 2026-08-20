FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS base

RUN apk upgrade --no-cache

FROM base AS builder

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.18.0

WORKDIR /build-stage
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