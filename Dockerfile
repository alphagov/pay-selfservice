FROM node:22.17.0-alpine3.21@sha256:6efabc870564b9c026355f314c4398c3899e1a34ac57f910b4d5f99fd2fb39c0 AS base

WORKDIR /app
RUN apk upgrade --no-cache \
    && apk add --no-cache tini

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
