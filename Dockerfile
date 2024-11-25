FROM node:18.20.5-alpine3.20@sha256:7e43a2d633d91e8655a6c0f45d2ed987aa4930f0792f6d9dd3bffc7496e44882 AS builder

RUN ["apk", "--no-cache", "add", "ca-certificates", "python3", "build-base", "bash", "ruby"]

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci --quiet

COPY . .
RUN npm run compile

FROM node:18.20.5-alpine3.20@sha256:7e43a2d633d91e8655a6c0f45d2ed987aa4930f0792f6d9dd3bffc7496e44882 AS final

RUN ["apk", "--no-cache", "upgrade"]

RUN ["apk", "add", "--no-cache", "tini"]

WORKDIR /app
COPY . .
RUN rm -rf ./test

# Copy in compile assets and deps from build container
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/govuk_modules ./govuk_modules
COPY --from=builder /app/public ./public
RUN npm prune --production

ENV PORT 9000
EXPOSE 9000

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
