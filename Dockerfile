FROM mhart/alpine-node:6.7

ADD docker/upgrade-base.sh /upgrade-base.sh

ENV PORT 9000

EXPOSE 9000
RUN apk add --update \
  libc6-compat \
  bash \
  python \
  make \
  gcc \
  g++

# add package.json before source for node_module cache
ADD package.json /tmp/package.json

RUN cd /tmp && npm install  --production --silent && \
    mkdir -p /app && mv /tmp/node_modules /app/

WORKDIR /app

COPY Gruntfile.js .
COPY app ./app
COPY docker-startup.sh .
COPY docker-startup.sh .
COPY package.json .
COPY server.js .
COPY start.js .
COPY lib/ lib/
RUN npm run compile

CMD bash ./docker-startup.sh
