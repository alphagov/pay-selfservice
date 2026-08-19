FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS base

RUN apk upgrade --no-cache \
    && apk add --no-cache tini

FROM base AS builder

WORKDIR /build-stage
COPY . ./
RUN npm ci --quiet
RUN npm run compile

FROM base AS final

RUN rm -rf /usr/local/lib/node_modules/npm \
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
USER 1000
ENTRYPOINT ["tini", "--"]
CMD ["node", "application.js"]