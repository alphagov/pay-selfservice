FROM node:6.11.1-alpine

RUN apk update && apk upgrade

# Install packages needed for production
RUN apk add --update bash python make g++

# Install packages needed for testing
RUN apk add --update ruby openssl

# Install glibc (https://github.com/sgerrand/alpine-pkg-glibc), needed to run pact-mock_service
# (https://github.com/bethesque/pact-mock_service) which ships with a binary dependency (@pact-foundation/pact-mock-service-linux-x64)
# linked against glibc.
ADD docker/sgerrand.rsa.pub /etc/apk/keys/sgerrand.rsa.pub
RUN apk --no-cache add ca-certificates
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.25-r0/glibc-2.25-r0.apk
RUN apk add glibc-2.25-r0.apk

ENV PORT 9000

EXPOSE 9000

# add package.json before source for node_module cache
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

ADD . /app
WORKDIR /app

# copy cached node_modules to /app/node_modules
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

RUN npm install && npm run compile && npm test && npm prune --production

# Uninstall packages that were only needed for test
RUN apk del ruby openssl

# Swap glibc for libc6-compat which is a safer package to use for production as it is officially supported by
# alpine base image distribution.
# Note: glibc is only required to run pact-mock_service.
RUN apk del glibc python make g++ && apk add libc6-compat

CMD bash ./docker-startup.sh
