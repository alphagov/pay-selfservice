FROM node:6.6.0

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

RUN npm install && npm test && npm prune --production

CMD NODE_ENV=production npm start
