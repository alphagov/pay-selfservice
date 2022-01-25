FROM node:12.22.7-alpine3.12 as base

RUN apk --no-cache upgrade && apk add --no-cache tini

#############################
# Dependency build stage
#############################
FROM base as builder

RUN apk add --no-cache --update \
  build-base \
  python2 \
  libc6-compat \
  libexecinfo-dev

ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm ci --production

#############################
# Production container stage
#############################
FROM base AS production

ENV PORT 9000
EXPOSE 9000

WORKDIR /app
ADD . /app
COPY --from=builder /tmp/node_modules /app/node_modules

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
