FROM node:6.12.0-alpine

# This section is to fix some sec vuls
RUN set -x \
        && apk add --no-cache \
                musl="1.1.18-r2" \
                musl-dev="1.1.18-r2" \
                libc6-compat="1.1.18-r2" \
                openssl="1.0.2m-r0" \
                c-ares="1.13.0-r0" \
                busybox="1.27.2-r6" \
                bash="4.4.12-r2" \
           --repository http://dl-cdn.alpinelinux.org/alpine/edge/main

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash libc6-compat

ENV PORT 9000
EXPOSE 9000

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production

WORKDIR /app
ADD . /app

RUN ln -s /tmp/node_modules /app/node_modules

CMD npm start
