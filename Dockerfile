FROM node:22.22.2-alpine3.22@sha256:b77017c37f430e4466ff497058948a2f16e8b59779600d53711eeb7b999b0f4e AS base

WORKDIR /app
RUN apk upgrade --no-cache \
    && apk add --no-cache tini

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.10.1

FROM base AS builder

COPY . .
RUN npm ci --quiet
RUN npm run compile

FROM base AS final

COPY --from=builder /app/dist .
ENV PORT=9000
EXPOSE 9000
ENTRYPOINT ["tini", "--"]
CMD ["node", "application.js"]
