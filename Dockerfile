FROM node:18.20.5-alpine3.20@sha256:2827b0ceb8d855cf7d2cdf2b0a8e9f5c3c91362b49f9c8d35f7db0d34167fd89 AS base

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
