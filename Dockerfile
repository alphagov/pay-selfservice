FROM node:18.20.5-alpine3.20@sha256:7e43a2d633d91e8655a6c0f45d2ed987aa4930f0792f6d9dd3bffc7496e44882 AS builder

RUN apk add --no-cache bash build-base ca-certificates
WORKDIR /app
COPY . .
RUN npm ci --quiet \
    && npm run compile

FROM node:18.20.5-alpine3.20@sha256:7e43a2d633d91e8655a6c0f45d2ed987aa4930f0792f6d9dd3bffc7496e44882 AS final

RUN apk upgrade --no-cache \
    && apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/dist .
ENV PORT=9000
EXPOSE 9000
ENTRYPOINT ["tini", "--"]
CMD ["node", "application.js"]
