FROM node:6.12.0-alpine

RUN apk update &&\
    apk upgrade &&\
    apk add --update bash python make g++ libc6-compat

ENV PORT 9000
EXPOSE 9000

# This section fixes sec vuls introduced by the installation of libc6-compat
RUN set -x \
        && apk add --no-cache \
                # fixes CVE-2017-14930, CVE-2017-13716 and CVE-2017-8421
                binutils="2.28-r3" \
           --repository http://dl-cdn.alpinelinux.org/alpine/edge/main

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production

WORKDIR /app
ADD . /app

RUN ln -s /tmp/node_modules /app/node_modules

CMD npm start
