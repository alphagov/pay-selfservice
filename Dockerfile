FROM node:6.10.0-alpine

RUN apk update && apk upgrade

# Install packages needed for production
RUN apk add --update python make g++

# Install packages needed for testing
RUN apk add --update bash ruby openssl

# Install glibc (https://github.com/sgerrand/alpine-pkg-glibc), needed to run pact-mock_service
# (https://github.com/bethesque/pact-mock_service) which ships with a binary dependency (@pact-foundation/pact-mock-service-linux-x64)
# linked against glibc.
RUN apk --no-cache add ca-certificates
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.25-r0/glibc-2.25-r0.apk
RUN apk add glibc-2.25-r0.apk

ENV PORT 9000
ENV ENABLE_NEWRELIC no
ENV NEW_RELIC_HOME /app/newrelic

EXPOSE 9000

# add package.json before source for node_module cache
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

ADD . /app
WORKDIR /app

# copy cached node_modules to /app/node_modules
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

RUN npm install && npm run compile && npm test && npm prune --production

CMD sh
