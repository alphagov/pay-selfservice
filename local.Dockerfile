# This is for local development with the Pay CLI
# Use the main Dockerfile for deployments
FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS base

WORKDIR /app
RUN apk upgrade --no-cache \
    && apk add --no-cache tini

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.18.0

FROM base AS builder

COPY . .
RUN npm ci --quiet
RUN npm run compile

FROM base AS final

COPY --from=builder /app/dist .

ENTRYPOINT ["tini", "--"]
CMD ["npm", "run", "dev"]