FROM node:12.22.7-alpine3.12@sha256:99eaf1312b1926bc6db27d7230c8b3118d4ad2db64cc6a8a8304adeb8bad283b AS base

RUN apk --no-cache upgrade && apk add --no-cache tini

#############################
# Dependency build stage
#############################
FROM base as builder

### Needed to build appmetrics and pact-mock-service
COPY sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
RUN ["apk", "--no-cache", "add", "ca-certificates", "python2", "build-base"]
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && apk add --no-cache glibc-2.28-r0.apk && rm -f glibc-2.28-r0.apk
###

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
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
COPY --from=builder /tmp/node_modules /app/node_modules

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
