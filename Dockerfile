FROM node:18.20.6-alpine3.20@sha256:12c7561101f6afced8d79febd44f2a135f1096c35e5e1b942bd8c8efa662ab48 AS base

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
