FROM node:18.20.4-alpine3.20@sha256:17514b20acef0e79691285e7a59f3ae561f7a1702a9adc72a515aef23f326729 AS builder

RUN ["apk", "--no-cache", "add", "ca-certificates", "python3", "build-base", "bash", "ruby"]

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci --quiet

COPY . .
RUN npm run compile

FROM node:18.20.4-alpine3.20@sha256:17514b20acef0e79691285e7a59f3ae561f7a1702a9adc72a515aef23f326729 AS final

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
