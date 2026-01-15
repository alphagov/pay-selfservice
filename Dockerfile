FROM node:22.22.0-alpine3.22@sha256:0c49915657c1c77c64c8af4d91d2f13fe96853bbd957993ed00dd592cbecc284 AS base

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
