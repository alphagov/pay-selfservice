FROM node:12.18.4-alpine3.12@sha256:59fa78a2149e3470ba7346fb17938e2c48e17096006083003ee1673cc172d676

### Needed to run appmetrics and pact-mock-service
COPY sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
RUN ["apk", "--no-cache", "add", "ca-certificates", "python2", "build-base", "bash", "ruby"]
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && apk add --no-cache glibc-2.28-r0.apk && rm -f glibc-2.28-r0.apk
###

# add package.json before source for node_module cache layer
ADD package.json /tmp/package.json
ADD package-lock.json /tmp/package-lock.json
RUN cd /tmp && npm install
WORKDIR /app
ENV LD_LIBRARY_PATH /app/node_modules/appmetrics
CMD ./docker/build_and_test.sh
