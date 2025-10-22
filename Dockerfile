FROM node:22.21.0-alpine3.22@sha256:b410676781397cabae22f81547ddb3e6b975dc04b43626098ce17ea53a447ef1 AS base

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
