FROM node:18.20.6-alpine3.20@sha256:cee65f51bda64bcb9ba38a7cc35b4d8bfef8ada2d3a97653064906ee400465e6 AS base

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
