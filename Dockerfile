FROM node:6.12.0-alpine

ARG CHAMBER_URL=https://github.com/segmentio/chamber/releases/download/v1.9.0/chamber-v1.9.0-linux-amd64

RUN apk --no-cache upgrade

ENV PORT 9000
EXPOSE 9000

WORKDIR /app

ADD chamber.sha256sum .
RUN apk add --no-cache openssl && mkdir -p bin && \
    wget -qO bin/chamber $CHAMBER_URL && \
    sha256sum -c chamber.sha256sum && \
    chmod 755 bin/chamber && apk del --purge openssl

ADD package.json /tmp/package.json
RUN apk add --no-cache bash python make g++ libc6-compat && \
    cd /tmp && \
    npm install --production && \
    apk del --purge make g++ musl-dev libc-dev pkgconfig python make pkgconf binutils

ADD . /app

RUN ln -sf /tmp/node_modules /app/node_modules

CMD docker-startup.sh
