FROM node:12.22.7-alpine3.12@sha256:99eaf1312b1926bc6db27d7230c8b3118d4ad2db64cc6a8a8304adeb8bad283b as base

RUN apk --no-cache upgrade && apk add --no-cache tini

#############################
# Dependency build stage
#############################
FROM base as builder

RUN apk add --no-cache --update \
  build-base \
  python2 \
  libc6-compat

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
